import { Schema, model } from "mongoose";
import { IVip } from "../interfaces";
import { SubscriptionType } from "../../payment/interfaces";

const vipSchema = new Schema<IVip>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    subscription_type: { type: String, required: true, enum: SubscriptionType },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const VipModel = model<IVip>("vips", vipSchema);
