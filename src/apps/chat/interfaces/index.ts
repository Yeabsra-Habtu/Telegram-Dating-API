import { ObjectId } from "mongodb";
import { IBaseInterface } from "../../../base.interface";

export interface ISendMessageInput {
  receiverId: string;
  message: string;
}

export interface IChatInput {
  sender: ObjectId;
  receiver: ObjectId;
  message: string;
}

export interface IChat extends IChatInput, IBaseInterface {
  seen: boolean;
}

export interface IChatUser {
  _id: ObjectId;
  image: string;
  name: string;
}

export interface IMessage {
  _id: ObjectId;
  sender: IChatUser;
  receiver: IChatUser;
  seen: false;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMessageResponse {
  data: IMessage[];
  user: IChatUser;
  receiver: IChatUser;
  total: number;
  offset: number;
  limit: number;
}

export interface IGetMessagesInput {
  userId: string;
  receiverId: string;
  offset: number;
  limit: number;
}

export interface ICountMessagesInput {
  userId: string;
  receiverId: string;
}
