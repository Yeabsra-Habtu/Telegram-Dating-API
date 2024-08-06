import { InlineKeyboard } from "grammy";
import { config } from "../../../config";

export const telegramBotKeyboard = InlineKeyboard.from([
  [InlineKeyboard.url("👉 Join", config.TELEGRAM_LINK)],
]);
