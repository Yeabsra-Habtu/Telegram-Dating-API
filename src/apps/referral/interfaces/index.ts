import { ObjectId } from "mongodb";
import { IBaseInterface } from "../../../base.interface";

export interface IReferral extends IBaseInterface {
  sender: ObjectId;
  receiver: ObjectId;
  coin: number;
}
