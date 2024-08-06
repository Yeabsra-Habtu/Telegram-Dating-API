import { ObjectId } from "mongodb";
import { redisClient } from "../../../connection/redis";
import { GiftModel } from "../../gift/models";
import {
  IUser,
  IUserInput,
  IRegister,
  RankEnum,
  IUserLikeCount,
  IUserLikeCountData,
  IUserGiftCount,
  IUserGiftCountData,
} from "../interfaces";
import { UserModel } from "../models";
import mongoose, { Schema } from "mongoose";
import { SuggestionModel } from "../../suggestion/models";
import { GiftEnum } from "../../bot/interfaces";
import { BoostModel } from "../../boost/models";
import { VipModel } from "../../vip/models";
import { SettingNameEnum } from "../../setting/interfaces";
import { SettingModel } from "../../setting/models";

export class UserRepository {
  public static async fetchCache(chatId: number): Promise<IUser> {
    const data = await redisClient.get(`user_${chatId}`);
    return data ? JSON.parse(data) : null;
  }

  public static async findByChatId(chatId: number) {
    return (await UserModel.findOne({ chatId }))?.toJSON();
  }

  public static async store(data: IUserInput) {
    const response = await UserModel.create(data);
    return response.toJSON();
  }

  public static async cache(user: IUser) {
    await redisClient.set(
      `user_${user.chatId}`,
      JSON.stringify({ name: user.name, gender: user.gender }),
      "EX",
      172800
    );
  }

  public static async cacheRegister(chatId: number, data: IRegister) {
    await redisClient.set(
      `register_${chatId}`,
      JSON.stringify(data),
      "EX",
      172800
    );
  }

  public static async getRegister(chatId: number) {
    const data = await redisClient.get(`register_${chatId}`);
    return data ? JSON.parse(data) : null;
  }

  public static async deleteRegister(chatId: number) {
    await redisClient.del(`register_${chatId}`);
  }

  public async findByPagination(
    page: number,
    limit: number,
    search: string
  ): Promise<IUser[]> {
    return (
      await UserModel.find({
        $or: [
          { name: { $regex: `.*${search}.*`, $options: "i" } },
          { gender: { $regex: `.*${search}.*`, $options: "i" } },
          { country: { $regex: `.*${search}.*`, $options: "i" } },
          { city: { $regex: `.*${search}.*`, $options: "i" } },
        ],
      })
        .skip(page * limit)
        .limit(limit)
    )?.map((user) => user.toJSON());
  }

  public async countByPagination(search: string): Promise<number> {
    return await UserModel.countDocuments({
      $or: [
        { name: { $regex: `.*${search}.*`, $options: "i" } },
        { gender: { $regex: `.*${search}.*`, $options: "i" } },
        { country: { $regex: `.*${search}.*`, $options: "i" } },
        { city: { $regex: `.*${search}.*`, $options: "i" } },
      ],
    });
  }

  public async findById(id: string): Promise<IUser | undefined> {
    return (await UserModel.findById(id))?.toJSON();
  }

  public async activate(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { is_active: true });
  }

  public async findSetting(): Promise<{
    minimumWithdrawableCoin: number;
    oneCoinInBirr: number;
  }> {
    const data = await SettingModel.find(
      {
        $or: [
          { name: SettingNameEnum.OneCoinInBirr },
          { name: SettingNameEnum.MinimumWithdrawableCoin },
        ],
      },
      { value: 1, name: 1 }
    );
    let minimumWithdrawableCoin: number;
    let oneCoinInBirr: number;
    for (const item of data) {
      if (item.name === SettingNameEnum.MinimumWithdrawableCoin) {
        minimumWithdrawableCoin = item.value;
      }
      if (item.name === SettingNameEnum.OneCoinInBirr) {
        oneCoinInBirr = item.value;
      }
    }
    return {
      minimumWithdrawableCoin: minimumWithdrawableCoin!,
      oneCoinInBirr: oneCoinInBirr!,
    };
  }

  public async deactivate(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { is_active: false });
  }

  public async countUserGift(id: string): Promise<number> {
    return await GiftModel.findOne({
      receiver_id: new ObjectId(id),
    }).countDocuments();
  }

  public static async updateUserRank(ids: ObjectId[]) {
    const date = new Date();
    await UserModel.aggregate([
      { $match: { _id: { $nin: ids } } },
      {
        $set: {
          ranking_class: {
            $cond: {
              if: {
                $or: [
                  { $gt: ["$boost.endDate", date] },
                  { $gt: ["$subscription.endDate", date] },
                ],
              },
              then: RankEnum.high,
              else: RankEnum.standard,
            },
          },
        },
      },
      {
        $merge: {
          into: "users",
          whenMatched: "merge",
          whenNotMatched: "discard",
        },
      },
    ]);
  }
  public static async updateUserRankClass(
    userId: mongoose.Types.ObjectId,
    rank: RankEnum
  ) {
    try {
      if (rank === RankEnum.standard) {
        // check if user is boost
        const date = new Date();
        await UserModel.aggregate([
          { $match: { _id: userId } },
          {
            $set: {
              ranking_class: {
                $cond: {
                  if: {
                    $or: [
                      { $gt: ["$boost.endDate", date] },
                      { $gt: ["$subscription.endDate", date] },
                    ],
                  },
                  then: RankEnum.high,
                  else: RankEnum.standard,
                },
              },
            },
          },
          {
            $merge: {
              into: "users",
              whenMatched: "merge",
              whenNotMatched: "discard",
            },
          },
        ]);
      } else
        await UserModel.updateOne(
          { _id: userId },
          {
            $set: {
              ranking_class: rank,
            },
          }
        );
    } catch (error) {
      console.error("Error updating user rank");
      throw error;
    }
  }

  public async userLikeCount(
    userId: ObjectId | Schema.Types.ObjectId
  ): Promise<IUserLikeCount> {
    const data = (
      await SuggestionModel.aggregate<IUserLikeCountData>([
        {
          $facet: {
            likeChart: [
              { $match: { user_id: userId, liked: true } },
              {
                $group: {
                  _id: {
                    date: {
                      $dateToString: { format: "%d/%m/%Y", date: "$createdAt" },
                    },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            dislikeChart: [
              { $match: { user_id: userId, liked: false } },
              {
                $group: {
                  _id: {
                    date: {
                      $dateToString: { format: "%d/%m/%Y", date: "$createdAt" },
                    },
                  },
                  count: { $sum: 1 },
                },
              },
            ],
            likes: [
              { $match: { user_id: userId, liked: true } },
              { $count: "count" },
            ],
            dislikes: [
              { $match: { user_id: userId, liked: false } },
              { $count: "count" },
            ],
            likers: [
              { $match: { suggested_user_id: userId, liked: true } },
              { $count: "count" },
            ],
            dislikers: [
              { $match: { suggested_user_id: userId, liked: false } },
              { $count: "count" },
            ],
          },
        },
      ])
    )[0];

    return {
      dislikers: data.dislikers[0] ?? { count: 0 },
      likes: data.likes[0] ?? { count: 0 },
      likers: data.likers[0] ?? { count: 0 },
      dislikes: data.dislikes[0] ?? { count: 0 },
      likeChart: data.likeChart.map((value) => ({
        date: value._id.date,
        count: value.count,
      })),
      dislikeChart: data.dislikeChart.map((value) => ({
        date: value._id.date,
        count: value.count,
      })),
    };
  }

  public async userGiftCount(
    userId: ObjectId | Schema.Types.ObjectId
  ): Promise<IUserGiftCount> {
    const data = (
      await GiftModel.aggregate<IUserGiftCountData>([
        {
          $facet: {
            [GiftEnum.flower]: [
              { $match: { receiver_id: userId, gift_type: GiftEnum.flower } },
              { $count: "count" },
            ],
            [GiftEnum.dessert]: [
              { $match: { receiver_id: userId, gift_type: GiftEnum.dessert } },
              { $count: "count" },
            ],
            [GiftEnum.softToy]: [
              { $match: { receiver_id: userId, gift_type: GiftEnum.softToy } },
              { $count: "count" },
            ],
          },
        },
      ])
    )[0];

    return {
      [GiftEnum.flower]: data[GiftEnum.flower][0] ?? { count: 0 },
      [GiftEnum.dessert]: data[GiftEnum.dessert][0] ?? { count: 0 },
      [GiftEnum.softToy]: data[GiftEnum.softToy][0] ?? { count: 0 },
    };
  }

  public async topBooster(): Promise<IUser | undefined> {
    const boosts = await BoostModel.aggregate([
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (boosts.length > 0) {
      return (await UserModel.findById(boosts[0]._id, {
        name: 1,
        image: 1,
        coin: 1,
      }))!.toJSON();
    }
  }

  public async topVip(): Promise<IUser | undefined> {
    const vips = await VipModel.aggregate([
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (vips.length > 0) {
      return (await UserModel.findById(vips[0]._id, {
        name: 1,
        image: 1,
        coin: 1,
      }))!.toJSON();
    }
  }

  public async topGift(): Promise<IUser | undefined> {
    const gifts = await GiftModel.aggregate([
      { $group: { _id: "$sender_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (gifts.length > 0) {
      return (await UserModel.findById(gifts[0]._id, {
        name: 1,
        image: 1,
        coin: 1,
      }))!.toJSON();
    }
  }
}
