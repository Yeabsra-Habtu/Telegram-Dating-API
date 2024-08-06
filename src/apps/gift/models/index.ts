import { Schema, model } from "mongoose";
import { GiftEnum } from "../../bot/interfaces";

const giftSchema = new Schema(
  {
    sender_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    receiver_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    gift_type: { type: String, required: true, enum: GiftEnum },
  },
  { timestamps: true }
);

export const GiftModel = model("gifts", giftSchema);
