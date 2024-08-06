import { ObjectId } from "mongodb";
import { CoinTransactionModel } from "../models";
import { UserModel } from "../../user/models";
import { IUser } from "../../user/interfaces";
import { SuggestionModel } from "../../suggestion/models";
import { ISuggestionDoc } from "../../suggestion/interfaces";
import { Schema } from "mongoose";
import { SettingModel } from "../../setting/models";
import { SettingNameEnum } from "../../setting/interfaces";

export class CoinRepository {
  public static async getTotalSpentLastMonth(): Promise<
    { _id: ObjectId; totalSpent: number }[] | undefined
  > {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    try {
      const transactions = await CoinTransactionModel.aggregate([
        {
          $match: {
            createdAt: { $gte: oneMonthAgo },
          },
        },
        {
          $group: {
            _id: "$user_id",
            totalSpent: { $sum: "$coin_amount" },
          },
        },
      ]);

      return transactions;
    } catch (error) {
      console.error("Error fetching total spent:", error);
      return;
    }
  }

  public static async rankingCoin(): Promise<number> {
    return (await SettingModel.findOne({ name: SettingNameEnum.RackingCoin }))!
      .value;
  }

  public static async fetchUserNotActiveForTheLast3Days(): Promise<IUser[]> {
    // get three day ago date
    const threeDayAgo = new Date();
    threeDayAgo.setDate(threeDayAgo.getDate() - 3);

    return UserModel.find<IUser>(
      { last_seen: { $lt: threeDayAgo } },
      { name: 1, image: 1 }
    );
  }

  public static async fetchUserLastLiker(
    userId: ObjectId | Schema.Types.ObjectId
  ) {
    return SuggestionModel.findOne<ISuggestionDoc>({ userId })
      .sort({ timestamp: -1 })
      .populate({ path: "suggested_user_id", select: "name image" })
      .exec();
  }

  public static async fetchActiveVipUsers(): Promise<IUser[]> {
    return await UserModel.find({
      "subscription.endDate": { $gt: new Date() },
    });
  }

  public static async incrementVipPerMonthCoin(
    userId: ObjectId
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { $inc: { coin: 1000 } });
  }

  public async findByPagination(page: number, per_page: number) {
    return await CoinTransactionModel.find()
      .sort({ createdAt: -1 })
      .populate({ path: "user_id", select: "name image" })
      .skip(page * per_page)
      .limit(per_page);
  }

  public async countByPagination(): Promise<number> {
    return await CoinTransactionModel.countDocuments();
  }
}
