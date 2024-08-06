import { IError } from "../../../base.interface";
import { error400 } from "../../../helpers/error";
import {
  IBoostChapPaymentInput,
  IChapPaymentInput,
  IChapaResponse,
  IVipChapPaymentInput,
  IWithdrawChapPaymentInput,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PaymentType,
  SubscriptionType,
} from "../interfaces";
import PaymentRepository from "../repositories";
import { txtRef } from "../../../helpers";
import { payWithChapaApi } from "../../../helpers/api";
import { config } from "../../../config";
import { bot } from "../../bot";
import {
  boostPaymentSuccess,
  paymentSuccess,
  subscriptionPaymentSuccess,
  userProfile,
} from "../../bot/helpers/text";
import { BotRepository } from "../../bot/repositories";
import { viewVipProfileKeyboard } from "../../bot/helpers/keyboard";
import { UserModel } from "../../user/models";
import { GiftModel } from "../../gift/models";

export default class PaymentService {
  private readonly repo = new PaymentRepository();

  public async payWithChapa({
    amount,
    chatId,
    coin,
  }: IChapPaymentInput): Promise<IChapaResponse | IError> {
    //   check if user exist
    const user = await this.repo.findUserByChatId(chatId);
    if (user) {
      //   initiate chapa payment
      const currency = "ETB";
      // TODO: user only has name which may be user name of telegram
      //   so what should we fill for the email, first name and last name
      const email = "tindu@gmail.com";
      const first_name = "tindu";
      const last_name = "tindu";
      const phone_number = "0912345678";
      const tx_ref = `chapa-${txtRef()}`;

      const { data, error } = await payWithChapaApi({
        "customization[description]": "Payment for Tindu",
        "customization[title]": "Pay for Tindu coin",
        amount,
        callback_url: `${config.APP_URL}/api/v1/payments/chapa/webhook`,
        currency,
        email,
        first_name,
        last_name,
        "meta[phone_number]": phone_number,
        "customization[logo]":
          "https://tindu-dating-telegram-api.vercel.app/static/media/logo.39cc0b04e35537f4f5f6.jpg",
        return_url: `${config.WEB_BOT_URL}/payments/chapa/success`,
        tx_ref,
      });

      if (data) {
        await this.repo.store({
          amount,
          currency,
          email,
          first_name,
          coin,
          last_name,
          phone_number,
          tx_ref,
          user_id: user._id,
          payment_method: PaymentMethodEnum.chapa,
          type: PaymentType.coin,
        });
        return {
          checkout_url: data.data.checkout_url,
          message: "Payment initiated",
          status: "success",
        };
      } else return error!;
    } else return error400("User not found");
  }

  public async updateStatus(tx_ref: string, status: PaymentStatusEnum) {
    // update payment status
    const data = await this.repo.updateStatus(tx_ref, status);
    if (data?.status === PaymentStatusEnum.success) {
      // add coin to user
      const user = await this.repo.addCoinToUser(data.user_id, data.coin);
      // update user cash also
      await new BotRepository().cache(user);
      // notify user that payment was successful
      await bot.api.sendMessage(user.chatId, "💰");
      bot.api.sendMessage(user.chatId, paymentSuccess(data.coin));
    }
  }

  private vipPrice(subscriptionType: SubscriptionType): number {
    switch (subscriptionType) {
      case SubscriptionType["12Month"]:
        return 49.99;
      case SubscriptionType["6Month"]:
        return 29.99;
      default:
        return 9.99;
    }
  }

  private boostPrice(boost: number): number {
    switch (boost) {
      case 24:
        return 7.99;
      case 12:
        return 6.99;
      default:
        return 4.99;
    }
  }

  public async payVipWithChapa({
    subscriptionType,
    userId,
  }: IVipChapPaymentInput): Promise<IChapaResponse | IError> {
    //   check if user exist
    const user = await this.repo.findUserById(userId);
    if (user) {
      //   initiate chapa payment
      const currency = "ETB";
      // TODO: user only has name which may be user name of telegram
      //   so what should we fill for the email, first name and last name
      const email = "tindu@gmail.com";
      const first_name = "tindu";
      const last_name = "tindu";
      const phone_number = "0912345678";
      const tx_ref = `chapa-vip-${txtRef()}`;
      const amount = this.vipPrice(subscriptionType);

      const { data, error } = await payWithChapaApi({
        "customization[description]": "Payment for Tindu",
        "customization[title]": "Pay for Tindu coin",
        amount,
        callback_url: `${config.APP_URL}/api/v1/payments/vip/chapa/webhook`,
        currency,
        email,
        first_name,
        last_name,
        "meta[phone_number]": phone_number,
        "customization[logo]":
          "https://tindu-dating-telegram-api.vercel.app/static/media/logo.39cc0b04e35537f4f5f6.jpg",
        return_url: `${config.WEB_BOT_URL}/payments/chapa/success`,
        tx_ref,
      });

      if (data) {
        await this.repo.store({
          amount,
          currency,
          email,
          first_name,
          coin: 0,
          last_name,
          phone_number,
          tx_ref,
          user_id: user._id,
          payment_method: PaymentMethodEnum.chapa,
          type: PaymentType.vip,
          subscriptionType,
        });
        return {
          checkout_url: data.data.checkout_url,
          message: "Payment initiated",
          status: "success",
        };
      } else return error!;
    } else return error400("User not found");
  }

  public async updateVipStatus(tx_ref: string, status: PaymentStatusEnum) {
    // update payment status
    const data = await this.repo.updateStatus(tx_ref, status);
    if (data?.status === PaymentStatusEnum.success) {
      // add coin to user
      const user = await this.repo.addSubscriptionToUser(
        data.user_id,
        data.subscriptionType!
      );
      // update user cash also
      await new BotRepository().cache(user);
      // notify user that payment was successful
      await bot.api.sendMessage(user.chatId, "💰");
      const subscription = this.repo.subscriptionData(data.subscriptionType!);
      bot.api.sendMessage(
        user.chatId,
        subscriptionPaymentSuccess(
          subscription.subscription_type,
          subscription.startDate,
          subscription.endDate
        )
      );
      const suggestion = await this.repo.fetchFirstSuggestion(user._id);
      if (suggestion) {
        const suggetsted_user = await UserModel.findById(
          suggestion?.suggested_user_id
        );
        await this.repo.storeVip(user._id, data.subscriptionType!);
        if (suggetsted_user) {
          const gift = await GiftModel.find({
            receiver_id: suggetsted_user._id,
          }).countDocuments();

          bot.api.sendPhoto(user.chatId, suggetsted_user.image, {
            reply_markup: viewVipProfileKeyboard(String(suggestion.user_id)),
            caption: userProfile(suggetsted_user, gift),
          });
        }
      }
    }
  }

  public async payBoostWithChapa({
    boost,
    userId,
  }: IBoostChapPaymentInput): Promise<IChapaResponse | IError> {
    //   check if user exist
    const user = await this.repo.findUserById(userId);
    if (user) {
      //   initiate chapa payment
      const currency = "ETB";
      // TODO: user only has name which may be user name of telegram
      //   so what should we fill for the email, first name and last name
      const email = "tindu@gmail.com";
      const first_name = "tindu";
      const last_name = "tindu";
      const phone_number = "0912345678";
      const tx_ref = `chapa-vip-${txtRef()}`;
      const amount = this.boostPrice(boost);

      const { data, error } = await payWithChapaApi({
        "customization[description]": "Payment for Tindu",
        "customization[title]": "Pay for Tindu coin",
        amount,
        callback_url: `${config.APP_URL}/api/v1/payments/boost/chapa/webhook`,
        currency,
        email,
        first_name,
        last_name,
        "meta[phone_number]": phone_number,
        "customization[logo]":
          "https://tindu-dating-telegram-api.vercel.app/static/media/logo.39cc0b04e35537f4f5f6.jpg",
        return_url: `${config.WEB_BOT_URL}/payments/chapa/success`,
        tx_ref,
      });

      if (data) {
        await this.repo.store({
          amount,
          currency,
          email,
          first_name,
          coin: 0,
          last_name,
          phone_number,
          tx_ref,
          user_id: user._id,
          payment_method: PaymentMethodEnum.chapa,
          type: PaymentType.boost,
          boost,
        });
        return {
          checkout_url: data.data.checkout_url,
          message: "Payment initiated",
          status: "success",
        };
      } else return error!;
    } else return error400("User not found");
  }

  public async updateBoostStatus(tx_ref: string, status: PaymentStatusEnum) {
    // update payment status
    const data = await this.repo.updateStatus(tx_ref, status);
    if (data?.status === PaymentStatusEnum.success) {
      // add coin to user
      const user = await this.repo.addBoostToUser(data.user_id, data.boost!);
      // update user cash also
      await new BotRepository().cache(user);
      // notify user that payment was successful
      await bot.api.sendMessage(user.chatId, "💰");
      bot.api.sendMessage(user.chatId, boostPaymentSuccess(data.boost!));
      await this.repo.storeBoost(user._id, data.boost!);
    }
  }

  public async withdrawWithChapa({
    coin,
    userId,
  }: IWithdrawChapPaymentInput): Promise<IChapaResponse | IError> {
    //   check if user exist
    const user = await this.repo.findUserById(userId);
    if (user) {
      // get coin setting
      const { minimumWithdrawableCoin, oneCoinInBirr } =
        await this.repo.findSetting();

      // check if user coin is less than withdraw coin
      if (user.coin < coin)
        return error400("Coin you want to withdraw is greater than your coin");
      if (user.coin - coin < minimumWithdrawableCoin.value)
        return error400(
          `Minimum withdraw amount is ${minimumWithdrawableCoin.value}`
        );

      const amount = coin * oneCoinInBirr.value;
      //   initiate chapa payment
      const currency = "ETB";
      // TODO: user only has name which may be user name of telegram
      //   so what should we fill for the email, first name and last name
      const email = "tindu@gmail.com";
      const first_name = "tindu";
      const last_name = "tindu";
      const phone_number = "0912345678";
      const tx_ref = `chapa-vip-${txtRef()}`;

      const { data, error } = await payWithChapaApi({
        "customization[description]": "Payment for Tindu",
        "customization[title]": "Pay for Tindu coin",
        amount,
        callback_url: `${config.APP_URL}/api/v1/payments/boost/chapa/webhook`,
        currency,
        email,
        first_name,
        last_name,
        "meta[phone_number]": phone_number,
        "customization[logo]":
          "https://tindu-dating-telegram-api.vercel.app/static/media/logo.39cc0b04e35537f4f5f6.jpg",
        return_url: `${config.WEB_BOT_URL}/payments/chapa/success`,
        tx_ref,
      });

      if (data) {
        await this.repo.store({
          amount,
          currency,
          email,
          first_name,
          coin,
          last_name,
          phone_number,
          tx_ref,
          user_id: user._id,
          payment_method: PaymentMethodEnum.chapa,
          type: PaymentType.withdraw,
        });
        return {
          checkout_url: data.data.checkout_url,
          message: "Payment initiated",
          status: "success",
        };
      } else return error!;
    } else return error400("User not found");
  }

  public async updateWithdrawStatus(tx_ref: string, status: PaymentStatusEnum) {
    // update payment status
    const data = await this.repo.updateStatus(tx_ref, status);
    if (data?.status === PaymentStatusEnum.success) {
      // add coin to user
      const user = await this.repo.deductCoin(data.user_id, data.coin);
      // update user cash also
      await new BotRepository().cache(user);
      // notify user that payment was successful
      await bot.api.sendMessage(user.chatId, "💰");
      bot.api.sendMessage(
        user.chatId,
        `Withdrawal Successful\n\nYou have withdrawn ${data.coin} coins from your account`
      );
    }
  }
}
