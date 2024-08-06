import { config } from "../../config";
import { info, invalidInput, mainMenu, start } from "./helpers/text";
import { menuKeyboard, removeKeyboard } from "./helpers/keyboard";
import { Bot } from "grammy";
import { BotContext } from "./contexts";
import { CurrentActionEnum, IUserCash } from "./interfaces";
import { ObjectId } from "mongodb";
import { UserModel } from "../user/models";
import { off } from "node:process";

// get token from config and check if token is provided
const token = config.TELEGRAM_API_TOKEN;
if (!token) throw new Error("TELEGRAM_API_TOKEN is unset");

// initialize bot
export const bot = new Bot(config.TELEGRAM_API_TOKEN, {
  ContextConstructor: BotContext,
  // TODO: change to production for production
  // client: { environment: "test", timeoutSeconds: 10 },
});

// add middleware to the bot
bot.use(async (ctx, next) => {
  console.log(ctx.chatId);
  //   get user
  await ctx.getUser();
  if (ctx.user()?.is_active === false)
    ctx.reply("Sorry you need to be activated to proceed");
  else await next();
  await UserModel.findOneAndUpdate(
    { chatId: ctx.chatId },
    {
      $set: { last_seen: new Date() },
    }
  );
});

// handler start command
bot.hears(
  ["/start", /(^\/start [a-z0-9]{24})$/],
  async (ctx) => await ctx.handleStart(ctx)
);
// bot.command("start", async (ctx) => await ctx.handleStart(ctx));

// handle language input
bot.hears(/ENG|AMH|ORM/, async (ctx) => {
  if (ctx.user()) {
    await ctx.service.handleProfileUpdate(ctx as any, ctx.message!.text!);
    // ctx.reply(invalidInput, { reply_markup: menuKeyboard });
  } else await ctx.registerService.handleLanguage(ctx);
});

// handle get random couple suggestion command
bot.hears("✳️ START ✳️", (ctx) => {
  ctx.service.matchUsers(ctx);
});
bot.hears("❌", (ctx) => ctx.service.handleDisLikeMatch(ctx));
bot.hears("💚", (ctx) => ctx.service.handleLikeMatch(ctx));

// handle gender input
bot.hears(
  /🎩 I'm female|🎩 I'm male/,
  async (ctx) => await ctx.registerService.handleGender(ctx)
);

bot.hears("💰", async (ctx) => await ctx.service.handleGetCoin(ctx));

bot.hears(["👑", "👑 VIP"], async (ctx) => await ctx.service.handleGetVip(ctx));

bot.hears("👤 My profile", async (ctx) => await ctx.service.handleProfile(ctx));

bot.hears(
  "🎁 Send gift",
  async (ctx) => await ctx.service.handleSendGift(ctx as any)
);

bot.hears(
  "💐 Flowers",
  async (ctx) => await ctx.service.handleSendFlower(ctx as any)
);

bot.hears(
  "🧁 Dessert",
  async (ctx) => await ctx.service.handleSendDessert(ctx as any)
);

bot.hears(
  "🧸 Soft Toy",
  async (ctx) => await ctx.service.handleSendSoftToy(ctx as any)
);

bot.hears(
  "⏩ Continue ⏩",
  async (ctx) => await ctx.service.handleStartMatch(ctx)
);

bot.hears(
  "💗 Likes You",
  async (ctx) => await ctx.service.handleWhoLikesYouPage(ctx)
);

bot.hears(
  "⏪",
  async (ctx) => await ctx.service.handleWhoLikesYouNextPage(ctx)
);

bot.hears(
  "⏩",
  async (ctx) => await ctx.service.handleWhoLikesYouPreviousPage(ctx)
);

bot.hears("ℹ️", async (ctx) => {
  ctx.reply(info);
});

bot.hears("⚙", async (ctx) => ctx.service.handleSetting(ctx));

//handle profile
bot.hears("Name", async (ctx) => ctx.service.handleChangeName(ctx));

bot.hears("Date of Birth", async (ctx) => ctx.service.handleChangeAge(ctx));

bot.hears("Photo", async (ctx) => ctx.service.handleChangeProfilePicture(ctx));

bot.hears("Interface lang", async (ctx) => ctx.service.handleLang(ctx));

bot.hears("🔍 Search settings", async (ctx) =>
  ctx.service.handleSearchSettings(ctx)
);

bot.hears("Change Location", async (ctx) =>
  ctx.service.handleSearchLocation(ctx)
);

bot.hears("Change Age Range", async (ctx) => ctx.service.handleAgeInput(ctx));

bot.hears("Match", async (ctx) => ctx.service.matchUsers(ctx));

// handle main menu
bot.hears(/(Main menu)|⛔️|⬅️ Back/, async (ctx) => {
  // check if user exits
  if (ctx.user())
    ctx.reply(mainMenu, { reply_markup: menuKeyboard(ctx.user()!.id) });
  else ctx.reply(start, removeKeyboard);
});

bot.hears("🚀 Boost", async (ctx) => ctx.service.handleBoost(ctx));

bot.callbackQuery(
  /(^like-[a-z0-9]{24})$/,
  async (ctx) => await ctx.service.handleLikeUser(ctx)
);

bot.callbackQuery(
  /(^dislike-[a-z0-9]{24})$/,
  async (ctx) => await ctx.service.handleDisLikeUser(ctx)
);

bot.callbackQuery(
  /(^[a-z0-9]{24})$/,
  async (ctx) => await ctx.service.handleWhoLikesYou(ctx)
);

bot.callbackQuery(
  /(^start-chat-[a-z0-9]{24})$/,
  async (ctx) => await ctx.service.handleStartChat(ctx)
);

bot.callbackQuery(
  /(^chat-anonymously-[a-z0-9]{24})$/,
  async (ctx) => await ctx.service.handleStartChatAnonymously(ctx)
);

// handle all incoming text inputs
bot.on("message:text", async (ctx) => {
  // check if user exits
  if (ctx.user()) {
    const user = ctx.user()!;

    const userState: IUserCash = await ctx.service.getUserState(
      user.id.toString()
    );
    const text = ctx.message.text;
    if (user) {
      if (userState?.action === CurrentActionEnum.updateLocation) {
        await ctx.service.updateSearchLocation(ctx as any);
      } else if (userState?.action === CurrentActionEnum.updateCountry) {
        await ctx.service.changeSearchLocation(ctx as any, userState, text);
      } else if (userState?.action === CurrentActionEnum.updateAgeRange) {
        await ctx.service.handleAgeRangeInput(ctx as any);
      } else if (userState?.action === CurrentActionEnum.answeringQuestion) {
        await ctx.service.handleAnsweringQuestions(ctx as any, userState, text);
      } else await ctx.service.handleProfileUpdate(ctx as any, text);
    }
  } else await ctx.registerService.handleMessage(ctx as any);
});

// handle all incoming photo inputs
bot.on("message:photo", async (ctx) => {
  const user = ctx.user();
  // check if user exits
  if (user) {
    ctx.service.saveProfilePicture(ctx as any, new ObjectId(user.id) as any);
    // ctx.reply(invalidInput, { reply_markup: menuKeyboard });
  } else {
    // get registration form
    const data = await ctx.registerService.getRegisterFrom(ctx.chatId);
    if (data?.current === "image")
      ctx.registerService.handleProfile(ctx as any);
    else ctx.handleInvalidInput(ctx as any);
  }
});

// handle all incoming message not handled by the above methods
bot.on("message", async (ctx) => await ctx.handleInvalidInput(ctx as any));
