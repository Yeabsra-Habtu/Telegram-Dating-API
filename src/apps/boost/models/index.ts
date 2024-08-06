import { Schema, model } from "mongoose";
import { IBoost } from "../interfaces";

const boostSchema = new Schema<IBoost>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    boost_type: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const BoostModel = model("boosts", boostSchema);
