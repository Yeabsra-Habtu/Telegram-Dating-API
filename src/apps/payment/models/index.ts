import { Schema, model } from "mongoose";
import {
  IPayment,
  PaymentMethodEnum,
  PaymentStatusEnum,
  PaymentType,
  SubscriptionType,
} from "../interfaces";

const paymentSchema = new Schema<IPayment>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    email: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    tx_ref: { type: String, required: true, unique: true },
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    status: {
      type: String,
      required: true,
      enum: PaymentStatusEnum,
      default: PaymentStatusEnum.pending,
    },
    payment_method: { type: String, required: true, enum: PaymentMethodEnum },
    coin: { type: Number, required: true },
    type: { type: String, required: true, enum: PaymentType },
    subscriptionType: { type: String, enum: SubscriptionType },
    boost: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret, __) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PaymentModel = model<IPayment>("payments", paymentSchema);
