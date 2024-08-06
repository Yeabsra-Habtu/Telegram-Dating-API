import { Bot } from "grammy";
import { config } from "../../config";
import { ChatBotContext } from "./contexts";
import { unauthorizedErrorText } from "./helper/text";
import { telegramBotKeyboard } from "./helper/keyboard";

// get token from config and check if token is provided
const token = config.CHAT_TELEGRAM_API_TOKEN;
if (!token) throw new Error("CHAT_TELEGRAM_API_TOKEN is unset");

// initialize bot
export const chatBot = new Bot(config.CHAT_TELEGRAM_API_TOKEN, {
  ContextConstructor: ChatBotContext,
});

// add middleware to the bot
chatBot.use(async (ctx, next) => {
  // get user info
  const user = await ctx.findUser();
  // if user exists go to next execution
  if (user) await next();
  else ctx.reply(unauthorizedErrorText, { reply_markup: telegramBotKeyboard });
});

// handler start command
chatBot.command("start", async (ctx) => {});

// handle
