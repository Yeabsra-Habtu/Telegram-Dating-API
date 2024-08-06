import { Schema } from "mongoose";
import { IBaseInterface } from "../../../base.interface";

export enum PaymentStatusEnum {
  pending = "pending",
  success = "success",
  failed = "failed",
}

export enum PaymentMethodEnum {
  chapa = "chapa",
}

export enum PaymentType {
  vip = "vip",
  coin = "coin",
  boost = "boost",
  withdraw = "withdraw",
}

export interface IPaymentInput {
  amount: number;
  currency: "ETB";
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;
  user_id: Schema.Types.ObjectId;
  payment_method: PaymentMethodEnum;
  coin: number;
  type: PaymentType;
  subscriptionType?: SubscriptionType;
  boost?: number;
}

export interface IPayment extends IBaseInterface, IPaymentInput {
  status: PaymentStatusEnum;
}

export interface IChapaPayment {
  first_name: string;
  last_name: string;
  email: string;
  amount: number;
  currency: "ETB";
  tx_ref: string;
  callback_url: string;
  return_url: string;
  "customization[title]": string;
  "customization[description]": string;
  "customization[logo]": string;
  "meta[phone_number]": string;
}

export interface IChapaApiResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

export interface IChapaResponse {
  message: string;
  status: string;
  checkout_url: string;
}

export interface IChapPaymentInput {
  chatId: number;
  amount: number;
  coin: number;
}

export interface IVipChapPaymentInput {
  userId: string;
  subscriptionType: SubscriptionType;
}

export interface IBoostChapPaymentInput {
  userId: string;
  boost: number;
}

export interface IWithdrawChapPaymentInput {
  userId: string;
  coin: number;
}

export enum SubscriptionType {
  "12Month" = "12Month",
  "6Month" = "6Month",
  "1Month" = "1Month",
}
