import { Request, Response, NextFunction } from "express";
import { error400 } from "../helpers/error";
import { verifyToken } from "../helpers/jwt";
import { isValidObjectId } from "mongoose";
import { PaymentType } from "../apps/payment/interfaces";
import { IRequest } from "../base.interface";

export default function paymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.query.token;
  if (token && typeof token === "string") {
    try {
      const data: any = verifyToken(token);
      // check if chatId and amount exist else throw error
      if (!data.chatId || !data.amount || !data.coin)
        res.status(401).json(error400("Invalid token"));
      else next();
    } catch (error) {
      res.status(401).json(error400("Invalid token"));
    }
  } else {
    res.status(401).json(error400("Token query missing"));
  }
}

export function boostPaymentMiddleware(
  req: IRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? null;
  if (token && typeof token === "string") {
    try {
      const data: any = verifyToken(token);
      // check if user id and type is boost exist else throw error
      if (!data.userId || !data.type)
        res.status(401).json(error400("Invalid token"));
      else if (data.type !== PaymentType.boost)
        res.status(401).json(error400("Invalid token"));
      else if (!isValidObjectId(data.userId))
        res.status(401).json(error400("Invalid token"));
      else {
        req.user = { id: data.userId };
        next();
      }
    } catch (error) {
      res.status(401).json(error400("Invalid token"));
    }
  } else {
    res.status(401).json(error400("Token query missing"));
  }
}
