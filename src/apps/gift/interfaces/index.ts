import { Schema } from "mongoose";
import { IBaseInterface } from "../../../base.interface";

export enum GiftTypeEnum {
  flower = "flower",
  dessert = "dessert",
  softToy = "softToy",
}

export interface IGiftInput {
  sender_id: Schema.Types.ObjectId;
  receiver_id: Schema.Types.ObjectId;
  gift_type: GiftTypeEnum;
}

export interface IGift extends IGiftInput, IBaseInterface {}
