import { ObjectId } from "mongodb";
import { SubscriptionType } from "../../payment/interfaces";
import { IBaseInterface } from "../../../base.interface";

export interface IVip extends IBaseInterface {
  user_id: ObjectId;
  subscription_type: SubscriptionType;
  startDate: Date;
  endDate: Date;
}
