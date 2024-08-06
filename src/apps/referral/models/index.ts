import { Schema, model } from "mongoose";
import { IReferral } from "../interfaces";

const referralSchema = new Schema<IReferral>(
  {
    coin: { type: Number, required: true },
    sender: { type: Schema.Types.ObjectId, ref: "users", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "users", required: true },
  },
  { timestamps: true }
);

export const ReferralModel = model("referrals", referralSchema);
