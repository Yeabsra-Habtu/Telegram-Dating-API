import { IError } from "../base.interface";

export function error400(message: string): IError {
  return {
    status: 400,
    message,
    error: "Bad Request",
  };
}

export function error401(): IError {
  return {
    status: 401,
    message: "Unauthorized",
    error: "Unauthorized",
  };
}
