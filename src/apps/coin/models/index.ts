import { Schema, model } from "mongoose";
import { ICoinTransaction } from "../interface";

const coinTransactionSchema = new Schema<ICoinTransaction>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    coin_amount: { type: Number, required: true },
    reason: { type: String, required: true },
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

export const CoinTransactionModel = model<ICoinTransaction>(
  "coinTransactions",
  coinTransactionSchema
);
