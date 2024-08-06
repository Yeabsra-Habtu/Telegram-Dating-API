import {
  CallbackQueryContext,
  CommandContext,
  HearsContext,
  InlineKeyboard,
} from "grammy";
import { bot } from "..";
import { BotRepository } from "../repositories";
import { BotContext } from "../contexts";
import {
  boostText,
  boostUrl,
  chatOptionText,
  coinLacking,
  dessertUrl,
  flowerUrl,
  getCoin,
  getCoinText,
  getVipText,
  likedYou,
  loading,
  matchSuccuss,
  profileText,
  replyText,
  searchSettingsText,
  selectCountry,
  sendDessert,
  sendFlower,
  sendGft,
  sendSoftToy,
  settingText,
  shareText,
  softToyUrl,
  startChatText,
  userLikedYouVip,
  userProfile,
  vip,
} from "../helpers/text";
import {
  boostKeyboard,
  chatModeKeyboard,
  coinKeyboard,
  countryKeyboard,
  langKeyboard,
  likePagination,
  matchKeyboard,
  menuKeyboard,
  myProfileKeyboard,
  profileKeyboard,
  searchSettingsKeyboard,
  seeWhoLikeYouKeyboard,
  sendGiftContinueKeyboard,
  sendGiftKeyboard,
  settingKeyboard,
  shareKeyboard,
  startChatKeyboard,
  successMatchKeyboard,
  viewProfileKeyboard,
  viewVipProfileKeyboard,
  vipKeyboard,
} from "../helpers/keyboard";
import { ObjectId } from "mongodb";
import { CurrentActionEnum, GiftEnum, IUserCash } from "../interfaces";
import { GiftTypeEnum } from "../../gift/interfaces";
import { GenderEnum, IUser } from "../../user/interfaces";
import { Schema } from "mongoose";
import { parse, differenceInYears } from "date-fns";
import {
  fetchCountriesByCityApi,
  tempDownloadImage,
} from "../../../helpers/api";
import { faceDetector } from "../../../helpers/faceDetector";
import { uploadToCloudinary } from "../../../helpers/fileUpload";
import { convertNumToEmoji } from "../../../helpers";
import { redisClient } from "../../../connection/redis";
import { ISuggestion } from "../../suggestion/interfaces";
import { UserModel } from "../../user/models";

export class BotService {
  private readonly repo = new BotRepository();
  private readonly redis = redisClient;

  public static async setDescription() {
    await bot.api.setMyDescription(
      `👉 Meet New People, Make Friends, Chat, Tindu 💝`
    );
  }

  public async findCurrentUser(chatId: number) {
    return await this.repo.findUserByChatId(chatId);
  }

  public async handleStartMatch(ctx: HearsContext<BotContext>) {
    const user = ctx.user()!;
    const date = new Date().getTime();
    // check if user free match count is not zero
    if (
      user.free_match_count > 0 ||
      user.coin >= 10 ||
      (user.subscription &&
        new Date(user.subscription.endDate).getTime() > date)
    ) {
      // send loading message
      await ctx.reply(loading, { reply_markup: matchKeyboard });
      // get all users around user
      const data = await this.repo.findAllUsersAroundAUser(
        user.search_settings.country,
        user.search_settings.city,
        user.gender === GenderEnum.male ? GenderEnum.female : GenderEnum.male
      );
      // filter boosted users
      const boostUsers = data.filter(
        (user) => user.boost && user.boost.endDate.getTime() > date
      );
      // get all suggested users id
      const suggestedUsers = await this.repo.findUserSuggestions(user.id);
      const suggestedUsersIds = suggestedUsers.map((value) =>
        String(value.suggested_user_id)
      );

      // if boosted user exist
      if (boostUsers.length > 0) {
        //  sort by boost users
        boostUsers.sort((a, b) => b.boost.boost_type - a.boost.boost_type);
        // get first un suggested user
        const unSuggestedUser = boostUsers.find(
          (user) => !suggestedUsersIds.includes(String(user._id))
        );

        // check if user found
        if (unSuggestedUser?.name) {
          // send this user as suggestion
          await this.sendRandomUserAndCache(unSuggestedUser, ctx);
          return;
        }
      }
      // filter all un suggested users
      const unSuggestedUsers = data.filter(
        (user) => !suggestedUsersIds.includes(String(user._id))
      );
      // check if un suggested users exist
      if (unSuggestedUsers.length > 0) {
        // select random user
        const randomUser =
          unSuggestedUsers[Math.floor(Math.random() * unSuggestedUsers.length)];
        // send this user as suggestion
        await this.sendRandomUserAndCache(randomUser, ctx);
        return;
      }
      // get all users that are disliked
      const dislikeUsersIds = suggestedUsers
        .filter((user) => user.liked !== true)
        .map((value) => String(value.suggested_user_id));
      // check if disliked users exist
      if (dislikeUsersIds.length > 0) {
        // filter disliked users
        const dislikedUsers = data.filter((user) =>
          dislikeUsersIds.includes(String(user._id))
        );
        // select random user
        const randomUser =
          dislikedUsers[Math.floor(Math.random() * dislikedUsers.length)];
        // send this user as suggestion
        await this.sendRandomUserAndCache(randomUser, ctx);
        return;
      }
      // send no user found on your area error
      ctx.reply("No matches found on your location", {
        reply_markup: menuKeyboard(ctx.user()!.id),
      });
    }
    // user is out of coin
    else {
      const data = (await this.repo.findUserById(
        new ObjectId(user.id) as any
      ))!;
      await ctx.reply(shareText, {
        reply_markup: shareKeyboard(data.name, user.id),
      });
      await ctx.reply(getCoin, {
        reply_markup: coinKeyboard(ctx.chatId!, [99, 15, 8]),
        parse_mode: "HTML",
      });
    }
  }

  private async sendRandomUserAndCache(
    randomUser: IUser,
    ctx: HearsContext<BotContext>
  ) {
    const gift = await this.repo.countGift(randomUser._id);
    // send message to user
    ctx.replyWithPhoto(randomUser.image, {
      caption: userProfile(randomUser, gift),
      reply_markup: viewProfileKeyboard(String(randomUser._id)),
    });

    // deduct match coin from user
    const user = await this.repo.deductMatchCoin(ctx.chatId!);
    if (user) {
      // store the suggestion
      const suggestion = await this.repo.storeSuggestion({
        suggested_user_id: randomUser._id,
        user_id: user._id,
      });
      // notify user is liked
      await this.notifyUserLicked(ctx, suggestion._id, user._id);
      // cache suggestion
      await this.repo.suggestionCache(user, String(randomUser._id));
    }
  }

  public async handleLikeMatch(ctx: HearsContext<BotContext>) {
    const user = ctx.user()!;
    if (user.suggestionId) {
      const suggestedUser = await this.repo.updateLikeSuggestion(
        user.id,
        user.suggestionId!,
        true
      );
      // if previously user is liked notify user is liked
      if (suggestedUser)
        this.notifyUserLicked(
          ctx,
          suggestedUser.suggested_user_id,
          suggestedUser.user_id
        );
    }
    await this.matchUsers(ctx);
    this.repo.likeCache(ctx.chatId, { ...ctx.user()!, dislike: 0 });
  }

  private async handleQuestions(ctx: HearsContext<BotContext>) {
    const user = await UserModel.findById(ctx.user()?.id);
    const unanswerdQuestions = user?.questions.find((q) => !q.answer);
    if (unanswerdQuestions) {
      await ctx.reply(`Question for you: ${unanswerdQuestions.question}`);
      await this.setUserState(ctx.user()!.id, {
        action: CurrentActionEnum.answeringQuestion,
        question: unanswerdQuestions.question,
        questionIndex: unanswerdQuestions.question.indexOf(
          unanswerdQuestions.question
        ),
      });
    }
  }

  public async handleDisLikeMatch(ctx: HearsContext<BotContext>) {
    if (ctx.user()!.dislike! > 2) {
      this.handleQuestions(ctx);
    } else {
      if (ctx.user()!.suggestionId)
        await this.repo.updateLikeSuggestion(
          ctx.user()!.id,
          ctx.user()!.suggestionId!,
          false
        );
      await this.matchUsers(ctx);
      let dislike = ctx.user()!.dislike ?? 0;
      this.repo.likeCache(ctx.chatId, { ...ctx.user()!, dislike: ++dislike });
    }
  }

  // public async handleSendRandomUser(
  //   ctx: CommandContext<BotContext>,
  //   dislike?: boolean
  // ) {
  //   const user = ctx.user()!;
  //   // check if user free match count is not zero
  //   if (
  //     user.free_match_count > 0 ||
  //     user.coin >= 10 ||
  //     (user.subscription &&
  //       new Date(user.subscription.endDate).getTime() > new Date().getTime())
  //   ) {
  //     // if suggested user is disliked update suggestion
  //     if (dislike !== undefined) {
  //       const suggestedUser = await this.repo.updateLikeSuggestion(
  //         ctx.user()!.id,
  //         !dislike
  //       );
  //       // if previously user is liked notify user is liked
  //       if (dislike === false && suggestedUser)
  //         this.notifyUserLicked(
  //           ctx,
  //           suggestedUser.suggested_user_id,
  //           suggestedUser.user_id
  //         ).then(() => {});
  //     }
  //     await ctx.reply(loading, { reply_markup: matchKeyboard });
  //     const randomUser =
  //       user.gender === GenderEnum.male
  //         ? await this.repo.getRandomFemale(user.country, user.city)
  //         : await this.repo.getRandomMale(user.country, user.city);
  //     if (randomUser) {
  //       ctx.replyWithPhoto(randomUser.image, {
  //         caption: userProfile(randomUser),
  //         reply_markup: viewProfileKeyboard(String(randomUser._id)),
  //       });
  //       const user = await this.repo.deductMatchCoin(ctx.chatId!);
  //       if (user) {
  //         // store the suggestion
  //         const suggestion = await this.repo.storeSuggestion({
  //           suggested_user_id: randomUser._id,
  //           user_id: user._id,
  //         });
  //         await this.notifyUserLicked(ctx, suggestion._id, user._id);
  //         // cache suggestion
  //         await this.repo.cache(user);
  //       }
  //     } else
  //       ctx.reply("No matches found on your location", {
  //         reply_markup: menuKeyboard,
  //       });
  //   } else
  //     ctx.reply(getCoin, {
  //       reply_markup: coinKeyboard(ctx.chatId!, [99, 15, 8]),
  //       parse_mode: "HTML",
  //     });
  // }

  private async notifyUserLicked(
    ctx: CommandContext<BotContext> | HearsContext<BotContext>,
    userId: Schema.Types.ObjectId,
    likerId: Schema.Types.ObjectId
  ) {
    const user = await this.repo.findUserById(userId);
    const liker = await this.repo.findUserById(likerId);
    if (user && liker) {
      ctx.api.sendPhoto(user.chatId, liker.image, {
        caption: likedYou(liker.name),
        reply_markup: seeWhoLikeYouKeyboard(String(liker._id)),
      });
    }
  }

  public async handleLike(ctx: CommandContext<BotContext>) {
    ctx.reply(matchSuccuss, { reply_markup: successMatchKeyboard });
    await this.repo.likeSuggestion(ctx.user()!.id);
  }

  public async handleSendGift(ctx: CommandContext<BotContext>) {
    ctx.reply(sendGft(ctx.user()!.coin), { reply_markup: sendGiftKeyboard });
    await this.repo.reCache(ctx.chatId!, {
      ...ctx.user()!,
      action: CurrentActionEnum.sendGift,
    });
  }

  public async handleSendFlower(ctx: CommandContext<BotContext>) {
    if (ctx.user()!.coin >= 400) {
      const suggested = await this.repo.lastSuggestionUse(ctx.user()!.id);
      ctx.replyWithPhoto(flowerUrl, {
        caption: sendFlower(suggested!.name),
        reply_markup: sendGiftContinueKeyboard,
      });
      // deduct coin from user
      const user = await this.repo.deductCoin(ctx.user()!.id, 400);
      await this.repo.reCache(ctx.chatId!, {
        ...ctx.user()!,
        coin: user!.coin,
        action: CurrentActionEnum.sendGift,
        gift: GiftEnum.flower,
      });
      // save gift
      await this.repo.storeGift({
        gift_type: GiftTypeEnum.flower,
        sender_id: new ObjectId(ctx.user()!.id) as any,
        receiver_id: suggested!._id,
      });
    } else await this.sendColinLackingMessage(ctx, 400);
  }

  private async sendColinLackingMessage(
    ctx: CommandContext<BotContext>,
    coin: number
  ) {
    await ctx.reply(coinLacking(coin), {
      reply_markup: coinKeyboard(ctx.chatId!, [99, 15, 8]),
      parse_mode: "HTML",
    });
    await ctx.reply(vip, {
      reply_markup: vipKeyboard(ctx.user()!.id),
      parse_mode: "HTML",
    });
  }

  public async handleSendDessert(ctx: CommandContext<BotContext>) {
    if (ctx.user()!.coin >= 500) {
      const suggested = await this.repo.lastSuggestionUse(ctx.user()!.id);
      ctx.replyWithPhoto(dessertUrl, {
        caption: sendDessert(suggested!.name),
        reply_markup: sendGiftContinueKeyboard,
      });
      // deduct coin from user
      const user = await this.repo.deductCoin(ctx.user()!.id, 500);
      await this.repo.reCache(ctx.chatId!, {
        ...ctx.user()!,
        coin: user!.coin,
        action: CurrentActionEnum.sendGift,
        gift: GiftEnum.dessert,
      });
      // save gift
      await this.repo.storeGift({
        gift_type: GiftTypeEnum.dessert,
        sender_id: new ObjectId(ctx.user()!.id) as any,
        receiver_id: suggested!._id,
      });
    } else await this.sendColinLackingMessage(ctx, 500);
  }

  public async handleSendSoftToy(ctx: CommandContext<BotContext>) {
    if (ctx.user()!.coin >= 600) {
      const suggested = await this.repo.findUserById(
        new ObjectId(ctx.user()!.suggestionId!)
      );
      ctx.replyWithPhoto(softToyUrl, {
        caption: sendSoftToy(suggested!.name),
        reply_markup: sendGiftContinueKeyboard,
      });
      // deduct coin from user
      const user = await this.repo.deductCoin(ctx.user()!.id, 600);
      await this.repo.reCache(ctx.chatId!, {
        ...ctx.user()!,
        coin: user!.coin,
        action: CurrentActionEnum.sendGift,
        gift: GiftEnum.flower,
      });
      // save gift
      await this.repo.storeGift({
        gift_type: GiftTypeEnum.softToy,
        sender_id: new ObjectId(ctx.user()!.id) as any,
        receiver_id: suggested!._id,
      });
    } else await this.sendColinLackingMessage(ctx, 600);
  }

  public async handleWhoLikesYou(ctx: CallbackQueryContext<BotContext>) {
    await ctx.answerCallbackQuery();
    await ctx.reply(loading, { reply_markup: likePagination(true, false) });
    const currentUser = ctx.user()!;
    const user = await this.repo.findUserById(
      new ObjectId(ctx.callbackQuery.data) as any
    );
    if (user) {
      let keyboard: InlineKeyboard;
      try {
        if (
          currentUser.subscription &&
          new Date(currentUser.subscription.endDate).getTime() >
            new Date().getTime()
        )
          keyboard = viewVipProfileKeyboard(String(user._id));
        else keyboard = vipKeyboard(ctx.user()!.id, String(user._id));
        ctx.replyWithPhoto(user.image, {
          caption: userLikedYouVip(user),
          reply_markup: keyboard,
        });
        const likedCount = await this.repo.likedCount(ctx.user()!.id);
        await this.repo.reCache(ctx.chatId!, {
          ...ctx.user()!,
          action: CurrentActionEnum.likeList,
          likePage: 0,
          likeTotalPage: likedCount,
        });
      } catch (error) {}
    }
  }

  public async handleWhoLikesYouNextPage(ctx: HearsContext<BotContext>) {
    const likePage = ctx.user()!.likePage ?? 0;
    const likeTotalPage = await this.repo.likedCount(ctx.user()!.id);
    if (likePage < likeTotalPage) {
      await ctx.reply(loading, {
        reply_markup: likePagination(
          likePage === 0,
          likePage + 1 === likeTotalPage
        ),
      });
      const user = await this.repo.fineUserLiked(ctx.user()!.id, likePage);
      if (user) {
        const currentUser = ctx.user()!;
        let keyboard: InlineKeyboard;
        if (
          currentUser.subscription &&
          new Date(currentUser.subscription.endDate).getTime() >
            new Date().getTime()
        )
          keyboard = viewVipProfileKeyboard(String(user._id));
        else keyboard = vipKeyboard(ctx.user()!.id, String(user._id));
        ctx.replyWithPhoto(user.image, {
          caption: userLikedYouVip(user),
          reply_markup: keyboard,
        });
        await this.repo.reCache(ctx.chatId!, {
          ...ctx.user()!,
          action: CurrentActionEnum.likeList,
          likePage: likePage + 1,
          likeTotalPage,
        });
      } else this.sendNoUserLiked(ctx);
    } else this.sendNoUserLiked(ctx);
  }

  public async handleLikeUser(ctx: CallbackQueryContext<BotContext>) {
    try {
      await ctx.answerCallbackQuery();
    } catch (error) {}

    const user = await this.repo.findUserById(
      new ObjectId(ctx.callbackQuery.data!.replace("like-", "")) as any
    );
    if (user) {
      const suggested = await this.repo.findSuggestion(
        String(user._id),
        ctx.user()!.id
      );
      if (suggested) {
        if (suggested.liked_back === null) {
          await ctx.editMessageCaption({
            caption: chatOptionText(user.name),
            reply_markup: chatModeKeyboard(String(user._id)),
          });
          await this.repo.likeBackSuggestion(
            String(user._id),
            ctx.user()!.id,
            true
          );

          const liker = await this.repo.findUserById(
            new ObjectId(ctx.user()!.id) as any
          );
          if (liker) {
            ctx.api.sendPhoto(user.chatId, liker.image, {
              caption: likedYou(liker.name),
              reply_markup: seeWhoLikeYouKeyboard(String(liker._id)),
            });
          }
        } else
          ctx.editMessageCaption({
            caption: chatOptionText(user.name),
            reply_markup: chatModeKeyboard(String(user._id)),
          });
      }
    }
  }

  public async handleDisLikeUser(ctx: CallbackQueryContext<BotContext>) {
    try {
      await ctx.answerCallbackQuery();
    } catch (error) {}
    const user = await this.repo.findUserById(
      new ObjectId(ctx.callbackQuery.data!.replace("dislike-", "")) as any
    );
    if (user) {
      const suggested = await this.repo.findSuggestion(
        String(user._id),
        ctx.user()!.id
      );
      if (suggested) {
        if (suggested.liked_back === null) {
          await ctx.editMessageCaption({
            caption: `You have disliked ${user.name}!`,
            reply_markup: viewProfileKeyboard(String(user._id)),
          });
          await this.repo.likeBackSuggestion(
            String(user._id),
            ctx.user()!.id,
            false
          );
        } else
          await ctx.editMessageCaption({
            caption: `You have disliked ${user.name}!`,
            reply_markup: viewProfileKeyboard(String(user._id)),
          });
      }
    }
  }

  private async sendNoUserLiked(ctx: HearsContext<BotContext>) {
    ctx.reply("No more users found who liked you", {
      reply_markup: menuKeyboard(ctx.user()!.id),
    });
  }

  public async handleWhoLikesYouPage(ctx: HearsContext<BotContext>) {
    await ctx.reply(loading, {
      reply_markup: likePagination(true, false),
    });
    const user = await this.repo.fineUserLiked(ctx.user()!.id, 0);
    if (user) {
      const currentUser = ctx.user()!;
      let keyboard: InlineKeyboard;
      if (
        currentUser.subscription &&
        new Date(currentUser.subscription.endDate).getTime() >
          new Date().getTime()
      )
        keyboard = viewVipProfileKeyboard(String(user._id));
      else keyboard = vipKeyboard(ctx.user()!.id, String(user._id));
      ctx.replyWithPhoto(user.image, {
        caption: userLikedYouVip(user),
        reply_markup: keyboard,
      });
      const likedCount = await this.repo.likedCount(ctx.user()!.id);
      await this.repo.reCache(ctx.chatId!, {
        ...ctx.user()!,
        action: CurrentActionEnum.likeList,
        likePage: 0,
        likeTotalPage: likedCount,
      });
    } else this.sendNoUserLiked(ctx);
  }

  public async handleWhoLikesYouPreviousPage(ctx: HearsContext<BotContext>) {
    if (ctx.user()!.likePage! >= 0) {
      await ctx.reply(loading, {
        reply_markup: likePagination(ctx.user()!.likePage! <= 1, false),
      });
      const user = await this.repo.fineUserLiked(
        ctx.user()!.id,
        ctx.user()!.likePage! - 1
      );
      if (user) {
        const currentUser = ctx.user()!;
        let keyboard: InlineKeyboard;
        if (
          currentUser.subscription &&
          new Date(currentUser.subscription.endDate).getTime() >
            new Date().getTime()
        )
          keyboard = viewVipProfileKeyboard(String(user._id));
        else keyboard = vipKeyboard(ctx.user()!.id, String(user._id));
        ctx.replyWithPhoto(user.image, {
          caption: userLikedYouVip(user),
          reply_markup: keyboard,
        });
        await this.repo.reCache(ctx.chatId!, {
          ...ctx.user()!,
          action: CurrentActionEnum.likeList,
          likePage: ctx.user()!.likePage! - 1,
        });
      }
    } else {
      this.sendNoUserLiked(ctx);
    }
  }

  public async handleStartChat(ctx: CallbackQueryContext<BotContext>) {
    await ctx.answerCallbackQuery();
    const likerId = ctx.callbackQuery.data!.replace("start-chat-", "");
    const liker = await this.repo.findUserById(new ObjectId(likerId) as any);
    if (liker) {
      ctx.editMessageCaption({
        caption: startChatText(liker.name),
        reply_markup: startChatKeyboard(ctx.user()!.id, likerId),
      });
      await this.repo.storeMatch({
        anonymise: false,
        liked_id: new ObjectId(ctx.user()!.id) as any,
        liker_id: liker._id,
      });
      const user = await this.repo.findUserById(
        new ObjectId(ctx.user()!.id) as any
      );
      ctx.api.sendPhoto(liker.chatId, user!.image, {
        reply_markup: startChatKeyboard(likerId, String(user!._id)),
      });
    }
  }

  public async handleStartChatAnonymously(
    ctx: CallbackQueryContext<BotContext>
  ) {
    await ctx.answerCallbackQuery();
    const likerId = ctx.callbackQuery.data!.replace("chat-anonymously-", "");
    const liker = await this.repo.findUserById(new ObjectId(likerId) as any);
    if (liker) {
      ctx.editMessageCaption({
        caption: startChatText(liker.name),
        reply_markup: startChatKeyboard(likerId, ctx.user()!.id),
      });
      await this.repo.storeMatch({
        anonymise: true,
        liked_id: new ObjectId(ctx.user()!.id) as any,
        liker_id: liker._id,
      });
      const user = await this.repo.findUserById(
        new ObjectId(ctx.user()!.id) as any
      );
      ctx.api.sendPhoto(liker.chatId, user!.image, {
        reply_markup: startChatKeyboard(likerId, String(user!._id)),
      });
    }
  }

  public async handleSetting(ctx: HearsContext<BotContext>) {
    ctx.reply(settingText, { reply_markup: settingKeyboard });
  }

  public async handleBoost(ctx: HearsContext<BotContext>) {
    ctx.replyWithPhoto(boostUrl, {
      caption: boostText,
      reply_markup: boostKeyboard(ctx.user()!.id),
      parse_mode: "HTML",
    });
  }

  public async handleGetCoin(ctx: HearsContext<BotContext>) {
    ctx.reply(getCoinText(ctx.user()!.coin), {
      reply_markup: coinKeyboard(ctx.chatId!, [99, 15, 8]),
    });
  }

  public async handleGetVip(ctx: HearsContext<BotContext>) {
    ctx.reply(getVipText, {
      reply_markup: vipKeyboard(ctx.user()!.id),
    });
  }

  public async handleProfile(ctx: HearsContext<BotContext>) {
    await ctx.reply(loading, { reply_markup: profileKeyboard });
    console.log("ctx", ctx);
    const user = await this.repo.findUserById(
      new ObjectId(ctx.user()!.id) as any
    );
    if (user)
      ctx.replyWithPhoto(user.image, {
        caption: profileText(user),
        reply_markup: myProfileKeyboard(ctx.user()!.id),
      });
  }

  // Handle change name
  public async handleChangeName(ctx: HearsContext<BotContext>) {
    await ctx.reply("Please enter your new name:", {
      reply_markup: { remove_keyboard: true },
    });
    console.log("ctx", ctx);
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.changingName,
    });
  }

  // Handle change age
  public async handleChangeAge(ctx: HearsContext<BotContext>) {
    await ctx.reply("Please enter your new age:", {
      reply_markup: { remove_keyboard: true },
    });
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.changingAge,
    });
  }

  // Handle change location
  public async handleChangeLocation(ctx: HearsContext<BotContext>) {
    await ctx.reply("Please enter your new location:", {
      reply_markup: { remove_keyboard: true },
    });
    await this.setUserState(ctx.user()!.id, { action: "changing_location" });
  }

  //Handle Language
  public async handleLang(ctx: HearsContext<BotContext>) {
    await ctx.reply("Please Choose Language", { reply_markup: langKeyboard });
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.changingLang,
    });
  }

  // Handle change profile picture
  public async handleChangeProfilePicture(ctx: HearsContext<BotContext>) {
    await ctx.reply("Please send your new profile picture:", {
      reply_markup: { remove_keyboard: true },
    });
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.changingProfilePicture,
    });
  }

  // Handle incoming text messages for profile updates
  public async handleProfileUpdate(
    ctx: HearsContext<BotContext>,
    text: string
  ) {
    const user = ctx.user();
    if (!user) {
      await ctx.reply("User not found.");
      return;
    }

    const userId = new ObjectId(user.id);
    const userState = await this.getUserState(userId.toString());

    if (userState?.action === CurrentActionEnum.changingName) {
      ctx.reply(loading, { reply_markup: profileKeyboard });
      const updatedUser = await this.repo.updateUserName(userId, text);
      await ctx.replyWithPhoto(updatedUser!.image, {
        caption: profileText(updatedUser!),
        reply_markup: myProfileKeyboard(user.id),
      });
      await this.setUserState(userId.toString(), { action: null });
    } else if (userState?.action === CurrentActionEnum.changingAge) {
      ctx.reply(loading, { reply_markup: profileKeyboard });

      let parsedDate: Date | null = null;
      if (isNaN(Date.parse(text))) {
        await ctx.reply(
          "Please enter a valid date in one of the following formats: YYYY-MM-DD, DD.MM.YYYY, MM/DD/YYYY."
        );
      } else {
        if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // YYYY-MM-DD
          parsedDate = parse(text, "yyyy-MM-dd", new Date());
        } else if (text.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
          // DD.MM.YYYY
          parsedDate = parse(text, "dd.MM.yyyy", new Date());
        } else if (text.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // MM/DD/YYYY
          parsedDate = parse(text, "MM/dd/yyyy", new Date());
        }

        if (parsedDate) {
          const age: number = differenceInYears(new Date(), parsedDate);
          if (age > 18 && age < 100) {
            const updatedUser = await this.repo.updateUserAge(userId, age);
            await ctx.replyWithPhoto(updatedUser!.image, {
              caption: profileText(updatedUser!),
              reply_markup: profileKeyboard,
            });
            await this.setUserState(userId.toString(), { action: null });
          } else {
            await ctx.reply("Age only should be between 18 and 100.");
          }
        } else {
          await ctx.reply(
            "Please enter a valid date in one of the following formats: YYYY-MM-DD, DD.MM.YYYY, MM/DD/YYYY."
          );
        }
      }
    } else if (userState?.action === CurrentActionEnum.changingLang) {
      ctx.reply(loading, { reply_markup: profileKeyboard });
      const updatedUser = await this.repo.updateUserLang(userId, text);
      await ctx.replyWithPhoto(updatedUser!.image, {
        caption: profileText(updatedUser!),
        reply_markup: { remove_keyboard: true },
      });
      await this.setUserState(userId.toString(), { action: null });
    }
  }

  public async saveProfilePicture(
    ctx: any,
    userId: ObjectId
  ): Promise<string | null> {
    const userState = await this.getUserState(userId.toString());
    if (userState?.action === CurrentActionEnum.changingProfilePicture) {
      const photos = ctx.message.photo;

      if (photos && photos.length > 0) {
        await ctx.reply("Processing your photo, please wait...");
        const photo = await ctx.getFile();
        const path = await tempDownloadImage(photo);
        if (path) {
          if (await faceDetector(path)) {
            const url = await uploadToCloudinary(photo);
            // const url = await uploadToDigitalOceanSpace(path);
            await this.repo.updateUserProfilePicture(userId, url);
            const updatedUser = await this.repo.findUserById(
              new ObjectId(userId) as any
            );

            await ctx.replyWithPhoto(updatedUser!.image, {
              caption: profileText(updatedUser!),
              reply_markup: myProfileKeyboard(new ObjectId(userId) as any),
            });
          } else {
            await ctx.reply(
              "Invalid image. Please make sure your face is clearly visible."
            );
          }
        } else {
          await ctx.reply("Failed to process the image. Please try again.");
        }
      } else {
        await ctx.reply("Please send a photo.");
      }
    }
    ("");

    return null;
  }

  public async handleSearchSettings(ctx: HearsContext<BotContext>) {
    await ctx.reply(searchSettingsText, {
      reply_markup: searchSettingsKeyboard,
    });
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.updateSearchSetting,
    });
  }

  public async handleSearchLocation(ctx: HearsContext<BotContext>) {
    await ctx.reply("input city please", {
      reply_markup: { remove_keyboard: true },
    });
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.updateLocation,
    });
  }
  public async handleAgeInput(ctx: HearsContext<BotContext>) {
    await ctx.reply("input age range please", {
      reply_markup: { remove_keyboard: true },
    });
    await this.setUserState(ctx.user()!.id, {
      action: CurrentActionEnum.updateAgeRange,
    });
  }

  public async updateSearchLocation(ctx: HearsContext<BotContext>) {
    const text = ctx.message?.text;
    const countries = await fetchCountriesByCityApi(text as any);
    if (countries && countries?.length > 0) {
      const data = countries.map(
        (value, index) =>
          `${convertNumToEmoji(index + 1)}  ${value.city}, ${value.country}`
      );
      ctx.reply(selectCountry(data), {
        reply_markup: countryKeyboard(data),
      });
      await this.setUserState(ctx.user()!.id, {
        action: CurrentActionEnum.updateCountry,
        cities: data,
      });
      // await this.repo.setCity(ctx.chatId, ctx.message!.text, data);
    } else {
      ctx.reply("City Name not found. Please enter valid city name");
    }
  }

  public async changeSearchLocation(
    ctx: HearsContext<BotContext>,
    userState: IUserCash,
    text: string
  ): Promise<void> {
    // Regular expression to match the format 'City, Country'
    const match = text.match(/(\d{1,2}️⃣)\s+(.+),\s+(.+)/);
    const user = ctx.user();
    if (match) {
      const city = match[2].trim();
      const country = match[3].trim();

      if (userState.cities?.includes(text)) {
        try {
          await this.repo.updateSearchCity(new ObjectId(user?.id) as any, city);
          console.log("City and Country found in userState.cities");
          const updatedUser = await this.repo.updateSearchCountry(
            new ObjectId(user?.id) as any,
            country
          );
          ctx.reply(replyText(updatedUser!), {
            reply_markup: searchSettingsKeyboard,
          });
          const newUser = await this.repo.findUserById(
            new ObjectId(ctx.user()!.id) as any
          );

          await this.repo.cache(newUser!);
        } catch (error) {
          console.log(error);
        }
      } else {
        console.log("City and Country not found in userState.cities");
      }
    } else {
      console.log("Invalid input format");
    }
  }

  public async handleAgeRangeInput(ctx: HearsContext<BotContext>) {
    const user = ctx.user();
    const ageRangeText = ctx.message?.text;

    if (!ageRangeText || !/^\d{1,2}-\d{1,2}$/.test(ageRangeText)) {
      await ctx.reply(
        "Invalid input. Please enter a valid age range in the format 'min-max'."
      );
      return;
    }

    const [min, max] = ageRangeText.split("-").map(Number);
    const ageRange = { min, max };

    if (min >= max || min < 0 || max > 120) {
      await ctx.reply(
        "Invalid age range. Please ensure that min is less than max and both are within a reasonable range."
      );
      return;
    }

    const updatedUser = await this.repo.updateSearchAgeRange(
      new ObjectId(user!.id) as any,
      ageRange
    );
    await ctx.reply(replyText(updatedUser!), {
      reply_markup: searchSettingsKeyboard,
    });
    const newUser = await this.repo.findUserById(
      new ObjectId(ctx.user()!.id) as any
    );

    await this.repo.cache(newUser!);
    // await this.setUserState(ctx.user()!.id, { action: CurrentActionEnum.updateLocation });
  }

  public async handleAnsweringQuestions(
    ctx: HearsContext<BotContext>,
    userState: IUserCash,
    text: string
  ) {
    const userId = ctx.user()?.id;
    if (!userId) {
      console.error("User ID not provided.");
      return false;
    }
    const user = await UserModel.findById(userId);

    const currentIndex = user?.questions.findIndex(
      (value) => value.question === userState.question!
    );

    user!.questions[currentIndex!]!.answer = text;

    await UserModel.updateOne(
      { _id: userId },
      { $set: { questions: user?.questions } }
    );
    this.repo.likeCache(ctx.chatId, { ...ctx.user()!, dislike: 0 });
  }

  // Helper methods for managing user state in Redis
  private async setUserState(userId: string, state: object) {
    await this.redis.set(`user_state:${userId}`, JSON.stringify(state));
  }

  public async getUserState(userId: string) {
    const state = await this.redis.get(`user_state:${userId}`);
    return state ? JSON.parse(state) : null;
  }

  //Matching and helper functions

  public getRandomUser(users: IUser[]) {
    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex];
  }
  public getRandomSuggestion(suggestions: ISuggestion[]) {
    const randomIndex = Math.floor(Math.random() * suggestions.length);
    return suggestions[randomIndex];
  }

  public async matchUsers(ctx: HearsContext<BotContext>) {
    const user = ctx.user();
    if (!user) return;

    const date = new Date().getTime();
    const utcDate = new Date();
    const twentyFourHoursAgo = new Date(utcDate);
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const hasSubscription =
      user.subscription && new Date(user.subscription.endDate).getTime() > date;
    const isEligibleForMatch =
      user.free_match_count > 0 ||
      user.coin >= 10 ||
      (user.subscription &&
        new Date(user.subscription.endDate).getTime() > date);

    if (!hasSubscription) {
      await this.repo.deductMatchCoin(ctx.chatId);
    }
    if (!isEligibleForMatch) {
      const data = (await this.repo.findUserById(
        new ObjectId(user.id) as any
      ))!;
      await ctx.reply(shareText, {
        reply_markup: shareKeyboard(data.name, user.id),
      });
      await ctx.reply(getCoin, {
        reply_markup: coinKeyboard(ctx.chatId!, [99, 15, 8]),
        parse_mode: "HTML",
      });
      return;
    }

    const lookingFor =
      user.gender === GenderEnum.male ? GenderEnum.female : GenderEnum.male;

    const highRankUsers = await this.repo.findHighRankUsers(
      user.ranking_class,
      lookingFor,
      user.search_settings.age?.min ?? 18,
      user.search_settings.age?.max ?? 35
    );

    const suggestions = await this.repo.findSuggestions(
      user.id,
      twentyFourHoursAgo
    );

    const suggestedUserIds = new Set(
      suggestions.map((s) => String(s.suggested_user_id))
    );

    const filterAndReplyWithUser = async (users: IUser[]) => {
      while (users.length > 0) {
        const randUser = this.getRandomUser(users);
        const randUserId = String(randUser._id);

        if (!suggestedUserIds.has(randUserId)) {
          await ctx.reply(loading, { reply_markup: matchKeyboard });
          const gift = await this.repo.countGift(randUser._id);
          await ctx.replyWithPhoto(randUser.image, {
            caption: userProfile(randUser, gift),
            reply_markup: viewProfileKeyboard(String(randUser._id)),
          });

          const currentUser = await this.repo.findUserById(
            new ObjectId(user.id) as any
          );
          await this.repo.updateSuggestion(
            user.id,
            new ObjectId(randUserId) as any,
            utcDate
          );

          await this.repo.suggestionCache(currentUser!, randUserId);
          return true;
        }
        users = users.filter((user) => String(user._id) !== randUserId);
      }
      return false;
    };

    const usersWithBoost = highRankUsers!.filter(
      (user) => user.boost && user.boost.endDate > utcDate
    );

    const usersWithoutBoost = highRankUsers!.filter(
      (user) => !user.boost || user.boost.endDate <= utcDate
    );

    if (await filterAndReplyWithUser(usersWithBoost)) return;
    if (await filterAndReplyWithUser(usersWithoutBoost)) return;

    ctx.reply("No More Matches Found");
  }
}
