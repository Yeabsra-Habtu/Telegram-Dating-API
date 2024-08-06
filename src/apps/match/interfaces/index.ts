import { Schema } from "mongoose";
import { IBaseInterface } from "../../../base.interface";

export interface IMatchInput {
  liker_id: Schema.Types.ObjectId; // user who first like
  liked_id: Schema.Types.ObjectId; // user who is liked
  anonymise: boolean;
}

export interface IMatch extends IMatchInput, IBaseInterface {}
