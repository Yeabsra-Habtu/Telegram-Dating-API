import { InlineKeyboard, Keyboard } from "grammy";
import { Other } from "../interfaces";
import {
  generateBoostToken,
  generateChatToken,
  generateToken,
} from "../../../helpers/jwt";
import { config } from "../../../config";

export const langKeyboard = Keyboard.from([
  [Keyboard.text("ENG"), Keyboard.text("AMH"), Keyboard.text("ORM")],
  [Keyboard.text("⬅️ Back")],
]).resized();

export const genderKeyboard = Keyboard.from([
  [Keyboard.text("🎩 I'm male"), Keyboard.text("🎩 I'm female")],
]).resized();

export const countryKeyboard = (data: string[]) =>
  Keyboard.from(data.map((value) => [Keyboard.text(value)])).resized();

export const agreementInlineKeyboard = InlineKeyboard.from([
  [InlineKeyboard.url("✅ 👉 Read agreement", "https://google.com")],
]);

export const continueKeyboard = Keyboard.from([
  [Keyboard.text("✅ Continue")],
]).resized();

// Get matches function keyboards inline
export const menuKeyboard = (id: string) =>
  Keyboard.from([
    [
      Keyboard.text("✳️ START ✳️"),
      Keyboard.webApp("💘 Matches", `${config.WEB_BOT_URL}/match/${id}`),
    ],
    [Keyboard.text("💗 Likes You"), Keyboard.text("⚙")],
    [
      Keyboard.text("💰"),
      Keyboard.webApp("💸 Withdraw", `${config.WEB_BOT_URL}/withdraw/${id}`),
    ],
  ]).resized();

export const viewProfileKeyboard = (id: string) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.webApp(
        "💥 View Profile",
        `${config.WEB_BOT_URL}/users/${id}`
      ),
    ],
  ]);

export const matchKeyboard = Keyboard.from([
  [Keyboard.text("❌"), Keyboard.text("💚")],
  [Keyboard.text("Main menu"), Keyboard.text("🎁 Send gift")],
]).resized();

export const successMatchKeyboard = Keyboard.from([
  [Keyboard.text("👉 Got it!")],
]).resized();

export const sendGiftContinueKeyboard = Keyboard.from([
  [Keyboard.text("⏩ Continue ⏩")],
]).resized();

export const sendGiftKeyboard = Keyboard.from([
  [
    Keyboard.text("💐 Flowers"),
    Keyboard.text("🧁 Dessert"),
    Keyboard.text("🧸 Soft Toy"),
  ],
  [Keyboard.text("⬅️ Back"), Keyboard.text("ℹ️")],
]).resized();

export const removeKeyboard: Other<"sendMessage", "chat_id" | "text"> = {
  reply_markup: { remove_keyboard: true },
};

export const coinKeyboard = (chatId: number, amount: number[]) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.webApp(
        "⭐️ 25000 coins⭐️",
        `${config.WEB_BOT_URL}/payments/chapa?token=${generateToken({
          chatId,
          amount: amount[0],
          coin: 25000,
        })}`
      ),
    ],
    [
      InlineKeyboard.webApp(
        "2500 coins",
        `${config.WEB_BOT_URL}/payments/chapa?token=${generateToken({
          chatId,
          amount: amount[1],
          coin: 2500,
        })}`
      ),
    ],
    [
      InlineKeyboard.webApp(
        "1200 coins",
        `${config.WEB_BOT_URL}/payments/chapa?token=${generateToken({
          chatId,
          amount: amount[2],
          coin: 1200,
        })}`
      ),
    ],
  ]);

export const vipKeyboard = (userId: string, suggestedId?: string) => {
  const data: any = { userId: userId };
  if (suggestedId) data.suggestedId = suggestedId;
  return InlineKeyboard.from([
    [
      InlineKeyboard.webApp(
        "👑 Get VIP 💥",
        `${config.WEB_BOT_URL}/buy-vip?token=${generateToken(data)}`
      ),

      // when user likes you
      // return like and dislike with profile page
    ],
  ]);
};

export const seeWhoLikeYouKeyboard = (id: string) =>
  InlineKeyboard.from([[InlineKeyboard.text("👣 See who likes you", id)]]);

export const likePagination = (isFirst: boolean, isLast: boolean) =>
  Keyboard.from([
    [
      isLast ? Keyboard.text("⛔️") : Keyboard.text("⏪"),
      isFirst ? Keyboard.text("⛔️") : Keyboard.text("⏩"),
    ],
    [Keyboard.text("Main menu"), Keyboard.text("ℹ️")],
  ]).resized();

export const viewVipProfileKeyboard = (id: string) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.text("❌", `dislike-${id}`),
      InlineKeyboard.text("💚", `like-${id}`),
    ],
    [
      InlineKeyboard.webApp(
        "💥 View Profile",
        `${config.WEB_BOT_URL}/users/${id}`
      ),
    ],
  ]);

export const startChatKeyboard = (senderId: string, receiverId: string) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.webApp(
        "✅ Start Chat",
        `${config.WEB_BOT_URL}/chats/${receiverId}?token=${generateChatToken(
          senderId
        )}`
      ),
    ],
  ]);

export const chatModeKeyboard = (userId: string) =>
  InlineKeyboard.from([
    [InlineKeyboard.text("🙎🏻‍♂️ Start Chat", `start-chat-${userId}`)],
    [
      InlineKeyboard.text(
        "👤 Start Chat Anonymously",
        `chat-anonymously-${userId}`
      ),
    ],
  ]);

export const settingKeyboard = Keyboard.from([
  [Keyboard.text("👤 My profile"), Keyboard.text("🔍 Search settings")],
  [Keyboard.text("🚀 Boost"), Keyboard.text("👑 VIP")],
  [Keyboard.text("Main menu")],
])
  .resized()
  .oneTime();

export const boostKeyboard = (userId: string) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.webApp(
        "🚀 24 hours",
        `${config.WEB_BOT_URL}/buy-boost/1/menu?token=${generateBoostToken(
          userId
        )}`
      ),
      InlineKeyboard.webApp(
        "12 hours",
        `${config.WEB_BOT_URL}/buy-boost/2/menu?token=${generateBoostToken(
          userId
        )}`
      ),
      InlineKeyboard.webApp(
        "6 hours",
        `${config.WEB_BOT_URL}/buy-boost/3/menu?token=${generateBoostToken(
          userId
        )}`
      ),
    ],
  ]);

export const shareKeyboard = (name: string, id: string) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.switchInline(
        "🗣 Share 🗣",
        `${name} share to join Tindu Dating bot.\n👉 👉 👉 Please use the following link to join and get 400 coins:\n👇👇👇\n${config.TELEGRAM_LINK}?start=${id}`
      ),
    ],
  ]);

export const profileKeyboard = Keyboard.from([
  [Keyboard.text("Name"), Keyboard.text("Date of Birth")],
  [Keyboard.text("Photo"), Keyboard.text("About")],
  [Keyboard.text("⬅️ Back"), Keyboard.text("Interface lang")],
]);
export const searchSettingsKeyboard = Keyboard.from([
  [Keyboard.text("Change Location")],
  [Keyboard.text("Change Age Range")],
  [Keyboard.text("⬅️ Back")],
]);

export const updateAgeRangeKeyboard = new InlineKeyboard()
  .text("25-35", "age-25-35")
  .text("35-45", "age-35-45")
  .text("45-55", "age-45-55");

export const updateLocationKeyboard = new InlineKeyboard()
  .text("New York", "location-ny")
  .text("Los Angeles", "location-la")
  .text("San Francisco", "location-sf");

export const myProfileKeyboard = (userId: string) =>
  InlineKeyboard.from([
    [
      InlineKeyboard.webApp(
        "💥 Your profile",
        `${config.WEB_BOT_URL}/my-profile/${userId}`
      ),
    ],
  ]);
