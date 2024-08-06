import jwt from "jsonwebtoken";
import { config } from "../config";
import { TokenTypeEnum } from "../base.interface";

export function generateToken(data: any) {
  return jwt.sign(data, config.JWT_SECRETE, { expiresIn: "24h" });
}

export function generateChatToken(userId: string) {
  return jwt.sign({ userId, type: TokenTypeEnum.chat }, config.JWT_SECRETE);
}

export function generateBoostToken(userId: string) {
  return jwt.sign({ userId, type: TokenTypeEnum.boost }, config.JWT_SECRETE);
}

export function verifyToken(token: string): { [key: string]: string | number } {
  return jwt.verify(token, config.JWT_SECRETE) as any;
}

export function decodeToken(token: string) {
  return jwt.decode(token);
}
