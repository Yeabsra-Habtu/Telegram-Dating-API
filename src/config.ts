import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export const config = {
  PORT: process.env.PORT!,
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  TELEGRAM_API_TOKEN: process.env.TELEGRAM_API_TOKEN!,
  TELEGRAM_SECRET_TOKEN: process.env.TELEGRAM_SECRET_TOKEN!,
  APP_URL: process.env.APP_URL!,
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  SPACE_ACCESS_KEY_ID: process.env.SPACE_ACCESS_KEY_ID!,
  SPACE_SECRET_ACCESS_KEY: process.env.SPACE_SECRET_ACCESS_KEY!,
  SPACE_ENDPOINT: process.env.SPACE_ENDPOINT!,
  SPACE_BUCKET_NAME: process.env.SPACE_BUCKET_NAME!,
  JWT_SECRETE: process.env.JWT_SECRETE!,
  CHAPA_AUTHORIZATION: process.env.CHAPA_AUTHORIZATION!,
  WEB_BOT_URL: process.env.WEB_BOT_URL!,
  CHAT_TELEGRAM_API_TOKEN: process.env.CHAT_TELEGRAM_API_TOKEN!,
  CHAT_TELEGRAM_LINK: process.env.CHAT_TELEGRAM_LINK!,
  TELEGRAM_LINK: process.env.TELEGRAM_LINK!,
  REDIS_EXPIRE: 172800,
};

console.log("Environment variables successfully loaded....");
