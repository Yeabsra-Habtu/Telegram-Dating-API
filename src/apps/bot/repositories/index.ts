import { config } from "../../../config";
import { redisClient } from "../../../connection/redis";
import { SuggestionModel } from "../../suggestion/models";
import { ISuggestion, ISuggestionInput } from "../../suggestion/interfaces";
import { CurrentActionEnum, IUserCash } from "../interfaces";
import { ObjectId } from "mongodb";
import { IGiftInput } from "../../gift/interfaces";
import { GiftModel } from "../../gift/models";
import { IUser, GenderEnum } from "../../user/interfaces";
import { UserModel } from "../../user/models";
import { Schema } from "mongoose";
import { IMatchInput } from "../../match/interfaces";
import { MatchModel } from "../../match/models";
import { SettingModel } from "../../setting/models";
import { SettingNameEnum } from "../../setting/interfaces";

export class BotRepository {
  private async fetchUserFromCache(chatId: number): Promise<IUserCash> {
    const data = await redisClient.get(`user_${chatId}`);
    return data ? JSON.parse(data) : null;
  }

  private async fetchUserFromDb(chatId: number): Promise<IUser | undefined> {
    return (await UserModel.findOne({ chatId }))?.toJSON({});
  }

  public async findUserByChatId(
    chatId: number
  ): Promise<IUserCash | undefined> {
    //   fetch user from cache
    let user = await this.fetchUserFromCache(chatId);
    if (user) return user;
    // fetch user from database and cache user if user is found
    const userDb = await this.fetchUserFromDb(chatId);
    if (userDb) {
      user = await this.cache(userDb);
      return user;
    }
  }

  public async cache(user: IUser): Promise<IUserCash> {
    const data: IUserCash = {
      id: String(user._id),
      ranking_class: user.ranking_class,
      search_settings: user.search_settings,
      free_match_count: user.free_match_count,
      is_active: user.is_active,
      gender: user.gender,
      coin: user.coin,
    };
    if (user.subscription !== null) data.subscription = user.subscription;
    await redisClient.set(
      `user_${user.chatId}`,
      JSON.stringify(data),
      "EX",
      config.REDIS_EXPIRE
    );
    return data;
  }

  public async suggestionCache(
    user: IUser,
    suggestionId: string
  ): Promise<IUserCash> {
    const data: IUserCash = {
      id: String(user._id),
      free_match_count: user.free_match_count,
      is_active: user.is_active,
      coin: user.coin,
      action: CurrentActionEnum.suggestion,
      suggestionId,
      gender: user.gender,
      ranking_class: user.ranking_class,
      search_settings: user.search_settings,
    };
    if (user.subscription !== null) data.subscription = user.subscription;
    await redisClient.set(
      `user_${user.chatId}`,
      JSON.stringify(data),
      "EX",
      config.REDIS_EXPIRE
    );
    return data;
  }

  public async likeCache(chatId: number, user: IUserCash): Promise<undefined> {
    await redisClient.set(
      `user_${chatId}`,
      JSON.stringify(user),
      "EX",
      config.REDIS_EXPIRE
    );
  }

  public async reCache(chatId: number, user: IUserCash) {
    await redisClient.set(
      `user_${chatId}`,
      JSON.stringify(user),
      "EX",
      config.REDIS_EXPIRE
    );
  }

  public async getRandomFemale(
    country: string,
    city: string
  ): Promise<IUser | null> {
    const users = await UserModel.aggregate([
      { $match: { gender: GenderEnum.female, country, city } },
      { $sample: { size: 1 } },
    ]);
    return users.length > 0 ? users[0] : null;
  }

  public async getRandomMale(
    country: string,
    city: string
  ): Promise<IUser | null> {
    const users = await UserModel.aggregate([
      { $match: { gender: GenderEnum.male, country, city } },
      { $sample: { size: 1 } },
    ]);
    return users.length > 0 ? users[0] : null;
  }

  public async deductMatchCoin(chatId: number): Promise<IUser | undefined> {
    // fetch form db
    const user = (await UserModel.findOne({ chatId }))?.toJSON();
    if (user) {
      if (user.free_match_count > 0)
        // decrement free match count
        await UserModel.updateOne(
          { _id: user._id },
          { free_match_count: user.free_match_count - 1 }
        );
      // deduct coin
      else {
        const coinSetting = (await SettingModel.findOne(
          { name: SettingNameEnum.CoinPerSuggestion },
          { value: 1 }
        ))!;
        await UserModel.updateOne(
          { _id: user._id },
          { coin: user.coin - coinSetting.value }
        );
      }
      return (await UserModel.findOne({ chatId }))?.toJSON();
    }
  }

  public async storeSuggestion(data: ISuggestionInput): Promise<ISuggestion> {
    await SuggestionModel.updateOne(data, { $set: data }, { upsert: true });
    return (await SuggestionModel.findOne(data))!.toJSON();
  }

  public async findSuggestion(user_id: string, suggested_user_id: string) {
    return await SuggestionModel.findOne({
      user_id: new ObjectId(user_id),
      suggested_user_id: new ObjectId(suggested_user_id),
    });
  }

  public async likeBackSuggestion(
    user_id: string,
    suggested_user_id: string,
    liked_back: boolean
  ) {
    await SuggestionModel.updateOne(
      {
        user_id: new ObjectId(user_id),
        suggested_user_id: new ObjectId(suggested_user_id),
      },
      { liked_back }
    );
  }

  public async updateLikeSuggestion(
    userId: string,
    suggestionId: string,
    liked: boolean
  ) {
    // get last user suggestion
    await SuggestionModel.findOneAndUpdate(
      {
        user_id: new ObjectId(userId),
        suggested_user_id: new ObjectId(suggestionId),
      },
      {
        $set: {
          user_id: new ObjectId(userId),
          suggested_user_id: new ObjectId(suggestionId),
          liked: liked,
        },
      }
    );

    return (
      await SuggestionModel.findOne({
        user_id: new ObjectId(userId),
        suggested_user_id: new ObjectId(suggestionId),
      })
    )?.toJSON();
  }

  public async findUserById(_id: Schema.Types.ObjectId | ObjectId) {
    return (await UserModel.findById(_id))?.toJSON();
  }

  public async likeSuggestion(user_id: string) {
    // get last user suggestion
    const suggestion = await SuggestionModel.find({ user_id })
      .sort({ createdAt: -1 })
      .limit(1);
    if (suggestion.length > 0 && suggestion[0].liked === null)
      // update user suggestion
      await SuggestionModel.updateOne(
        { _id: suggestion[0]._id },
        { liked: true }
      );
    return suggestion[0];
  }

  public async lastSuggestionUse(user_id: string) {
    // get last user suggestion
    const suggestion = await SuggestionModel.find({ user_id })
      .sort({ createdAt: -1 })
      .limit(1);
    if (suggestion.length > 0)
      return await UserModel.findById(suggestion[0].suggested_user_id);
  }

  public async likedCount(userId: string): Promise<number> {
    return await SuggestionModel.find({
      suggested_user_id: new ObjectId(userId),
      liked: true,
    }).countDocuments();
  }

  public async fineUserLiked(
    userId: string,
    offset: number
  ): Promise<IUser | undefined> {
    const suggestion = (
      await SuggestionModel.findOne({
        suggested_user_id: new ObjectId(userId),
        liked: true,
      }).skip(offset)
    )?.toJSON();
    if (suggestion)
      return (await UserModel.findById(suggestion.user_id))?.toJSON();
  }

  public async deductCoin(
    userId: string,
    coin: number
  ): Promise<IUser | undefined> {
    await UserModel.updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { coin: -coin } }
    );
    return (await UserModel.findById(userId))?.toJSON();
  }

  public async storeGift(data: IGiftInput) {
    await GiftModel.create(data);
  }

  public async storeMatch(data: IMatchInput) {
    await MatchModel.updateOne(
      { liked_id: data.liked_id, liker_id: data.liker_id },
      { $set: data },
      { upsert: true }
    );
  }

  public async findAllUsersAroundAUser(
    country: string,
    city: string,
    gender: GenderEnum
  ): Promise<IUser[]> {
    return await UserModel.find(
      { country, city, gender },
      { name: 1, age: 1, last_seen: 1, is_online: 1, image: 1, boost: 1 }
    );
  }

  public async findUserSuggestions(user_id: string): Promise<ISuggestion[]> {
    return await SuggestionModel.find(
      { user_id: new ObjectId(user_id) },
      { suggested_user_id: 1, liked: 1 }
    );
  }

  // Update user state
  public async updateUserState(userId: ObjectId, state: Partial<IUser>) {
    return UserModel.updateOne({ _id: userId }, { $set: { state } });
  }

  // Update user name
  public async updateUserName(
    userId: ObjectId,
    name: string
  ): Promise<IUser | undefined> {
    await UserModel.updateOne({ _id: userId }, { $set: { name } });
    return this.findUserById(userId as any);
  }

  // Update user age
  public async updateUserAge(
    userId: ObjectId,
    age: number
  ): Promise<IUser | undefined> {
    await UserModel.updateOne({ _id: userId }, { $set: { age } });
    return this.findUserById(userId as any);
  }

  // Update user location
  public async updateUserLang(userId: ObjectId, language: string) {
    await UserModel.updateOne({ _id: userId }, { $set: { language } });
    return this.findUserById(userId as any);
  }

  // Update user profile picture
  public async updateUserProfilePicture(userId: ObjectId, url: string) {
    return UserModel.updateOne({ _id: userId }, { $set: { image: url } });
  }

  public async updateSearchCity(
    userId: ObjectId,
    city: string
  ): Promise<IUser | undefined> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { "search_settings.city": city } }
    );
    return this.findUserById(userId as any);
  }

  public async updateSearchCountry(
    userId: ObjectId,
    country: string
  ): Promise<IUser | undefined> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { "search_settings.country": country } }
    );
    return this.findUserById(userId as any);
  }

  public async updateSearchAgeRange(
    userId: ObjectId,
    ageRange: { min: number; max: number }
  ): Promise<IUser | undefined> {
    await UserModel.updateOne(
      { _id: userId },
      { $set: { "search_settings.age": ageRange } }
    );
    return this.findUserById(userId as any);
  }

  public async findHighRankUsers(
    rankingClass: string,
    gender: string,
    ageMin: number,
    ageMax: number
  ): Promise<IUser[] | undefined> {
    const query = {
      ranking_class: rankingClass,
      gender,
      $and: [{ age: { $gte: ageMin } }, { age: { $lte: ageMax } }],
    };
    return await UserModel.find(query);
  }

  public async findSuggestions(
    userId: string,
    twentyFourHoursAgo: Date
  ): Promise<any[]> {
    return await SuggestionModel.find({
      user_id: new ObjectId(userId),
      $or: [{ updatedAt: { $gte: twentyFourHoursAgo } }, { liked: true }],
    });
  }

  public async updateSuggestion(
    userId: string,
    suggestedUserId: ObjectId,
    updatedAt: Date
  ) {
    await SuggestionModel.updateOne(
      { user_id: userId, suggested_user_id: suggestedUserId },
      {
        $set: {
          user_id: userId,
          suggested_user_id: suggestedUserId,
          updatedAt: updatedAt,
        },
      },
      { upsert: true }
    );
  }

  public async countGift(userId: ObjectId | Schema.Types.ObjectId) {
    return GiftModel.find({ receiver_id: userId }).countDocuments();
  }
}
