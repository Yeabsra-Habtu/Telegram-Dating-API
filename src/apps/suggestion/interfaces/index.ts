import { Schema } from "mongoose";
import { IBaseInterface } from "../../../base.interface";
import { IUser } from "../../user/interfaces";

export interface ISuggestionInput {
  user_id: Schema.Types.ObjectId;
  suggested_user_id: Schema.Types.ObjectId;
}

export interface ISuggestion extends ISuggestionInput, IBaseInterface {
  liked: boolean | null;
  liked_back: boolean | null;
}

export interface ISuggestionDoc extends IBaseInterface {
  user_id: Schema.Types.ObjectId;
  suggested_user_id: IUser;
  liked: boolean | null;
  liked_back: boolean | null;
}
