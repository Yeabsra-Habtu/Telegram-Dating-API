import { Schema, model } from "mongoose";
import { IMatch } from "../interfaces";

const matchSchema = new Schema<IMatch>(
  {
    liked_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    liker_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    anonymise: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const MatchModel = model("matches", matchSchema);
