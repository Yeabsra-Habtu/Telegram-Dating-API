import { ObjectId } from "mongodb";
import { IBaseInterface } from "../../../base.interface";

export interface IBoost extends IBaseInterface {
  user_id: ObjectId;
  boost_type: number;
  startDate: Date;
  endDate: Date;
}
