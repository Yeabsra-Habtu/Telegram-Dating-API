import { Schema } from "mongoose";
import {
  IPayment,
  IPaymentInput,
  PaymentStatusEnum,
  SubscriptionType,
} from "../interfaces";
import { PaymentModel } from "../models";
import { UserModel } from "../../user/models";
import { ISubscription, IUser } from "../../user/interfaces";
import { SuggestionModel } from "../../suggestion/models";
import { ISuggestion } from "../../suggestion/interfaces";
import { VipModel } from "../../vip/models";
import { BoostModel } from "../../boost/models";
import { ISetting, SettingNameEnum } from "../../setting/interfaces";
import { SettingModel } from "../../setting/models";

export default class PaymentRepository {
  public async findUserByChatId(chatId: number): Promise<IUser | undefined> {
    return (await UserModel.findOne({ chatId }))?.toJSON();
  }

  public async findUserById(id: string): Promise<IUser | undefined> {
    return (await UserModel.findById(id))?.toJSON();
  }

  public async findSetting(): Promise<{
    minimumWithdrawableCoin: ISetting;
    oneCoinInBirr: ISetting;
  }> {
    const data = await SettingModel.find({
      $or: [
        { name: SettingNameEnum.OneCoinInBirr },
        { name: SettingNameEnum.MinimumWithdrawableCoin },
      ],
    });
    let minimumWithdrawableCoin: ISetting;
    let oneCoinInBirr: ISetting;
    for (const item of data) {
      if (item.name === SettingNameEnum.MinimumWithdrawableCoin) {
        minimumWithdrawableCoin = item;
      }
      if (item.name === SettingNameEnum.OneCoinInBirr) {
        oneCoinInBirr = item;
      }
    }
    return {
      minimumWithdrawableCoin: minimumWithdrawableCoin!,
      oneCoinInBirr: oneCoinInBirr!,
    };
  }

  public async store(data: IPaymentInput): Promise<IPayment> {
    return (await PaymentModel.create(data)).toJSON();
  }

  public async updateStatus(
    tx_ref: string,
    status: PaymentStatusEnum
  ): Promise<IPayment | undefined> {
    await PaymentModel.findOneAndUpdate({ tx_ref }, { status });
    return (await PaymentModel.findOne({ tx_ref }))?.toJSON();
  }

  public async addCoinToUser(
    _id: Schema.Types.ObjectId,
    coin: number
  ): Promise<IUser> {
    await UserModel.updateOne({ _id }, { $inc: { coin } });
    return (await UserModel.findById(_id))!.toJSON();
  }

  private subscriptionMonth(subscription: SubscriptionType): number {
    switch (subscription) {
      case SubscriptionType["1Month"]:
        return 1;
      case SubscriptionType["6Month"]:
        return 6;
      default:
        return 12;
    }
  }

  public subscriptionData(subscription: SubscriptionType): ISubscription {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + this.subscriptionMonth(subscription));
    return {
      startDate,
      endDate,
      subscription_type: subscription,
    };
  }

  public async addSubscriptionToUser(
    _id: Schema.Types.ObjectId,
    subscription: SubscriptionType
  ): Promise<IUser> {
    await UserModel.updateOne(
      { _id },
      {
        $set: { subscription: this.subscriptionData(subscription) },
      }
    );
    return (await UserModel.findById(_id))!.toJSON();
  }

  public async addBoostToUser(_id: Schema.Types.ObjectId, boost_type: number) {
    const endDate = new Date();
    endDate.setHours(boost_type);
    await UserModel.updateOne(
      { _id },
      { boost: { startDate: new Date(), endDate, boost_type } }
    );
    return (await UserModel.findById(_id))!.toJSON();
  }

  public async deductCoin(
    userId: Schema.Types.ObjectId,
    coin: number
  ): Promise<IUser> {
    await UserModel.findByIdAndUpdate(userId, { $inc: { coin: -coin } });
    return (await UserModel.findById(userId))!.toJSON();
  }

  public async fetchFirstSuggestion(
    id: Schema.Types.ObjectId
  ): Promise<ISuggestion | undefined> {
    return (
      await SuggestionModel.findOne({ suggested_user_id: id, liked: true })
    )?.toJSON();
  }

  public async storeBoost(user_id: Schema.Types.ObjectId, boost_type: number) {
    const endDate = new Date();
    endDate.setHours(boost_type);
    await BoostModel.create({
      user_id,
      startDate: new Date(),
      endDate,
      boost_type,
    });
  }

  public async storeVip(
    user_id: Schema.Types.ObjectId,
    subscription: SubscriptionType
  ): Promise<void> {
    await VipModel.create({ user_id, ...this.subscriptionData(subscription) });
  }
}
