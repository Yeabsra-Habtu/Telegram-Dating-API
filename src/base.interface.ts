import { Schema } from "mongoose";
import { Request } from "express";
import { Socket } from "socket.io";

export enum TokenTypeEnum {
  chat = "chat",
  boost = "boost",
}

export interface IRequest extends Request {
  user?: {
    id: string;
  };
}

export interface ISocket extends Socket {
  user?: {
    id: string;
  };
}

export interface IBaseInterface {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IError {
  status: 400 | 401;
  message: string;
  error: string;
}

export interface IApiResponse<T> {
  data?: T;
  error?: IError;
}
