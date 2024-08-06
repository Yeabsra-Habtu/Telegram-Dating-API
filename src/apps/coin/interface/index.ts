import { Schema } from "mongoose";
import { IBaseInterface } from "../../../base.interface";

export interface ICoinTransactionInput {
  user_id: Schema.Types.ObjectId;
  coin_amount: number;
  reason: string;
}

export interface ICoinTransaction
  extends ICoinTransactionInput,
    IBaseInterface {}
