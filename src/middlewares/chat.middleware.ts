import { Response, NextFunction } from "express";
import { error400 } from "../helpers/error";
import { verifyToken } from "../helpers/jwt";
import { IRequest, TokenTypeEnum } from "../base.interface";

export default function chatMiddleware(
  req: IRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace("Bearer ", "") ?? null;
  if (token) {
    try {
      const data = verifyToken(token);
      // check if user id exist and token type is chat
      if (!data.userId || data.type !== TokenTypeEnum.chat)
        res.status(401).json(error400("Invalid token"));
      else {
        req.user = { id: data.userId as string };
        next();
      }
    } catch (error) {
      res.status(401).json(error400("Invalid token"));
    }
  } else res.status(401).json(error400("Token query missing"));
}
