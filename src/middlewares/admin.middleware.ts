import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../helpers/jwt";
import { error401 } from "../helpers/error";

export default function isAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // check if authorized token if admin
  const authorization =
    req.headers.authorization?.replace("Bearer ", "") ?? null;
  const tokenData = authorization ? verifyToken(authorization) : null;
  if (tokenData) {
    if (tokenData["type"] !== "admin") return res.status(401).json(error401());
    next();
  } else res.status(401).json(error401());
}
