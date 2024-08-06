import moment from "moment";
import { SubscriptionType } from "../../payment/interfaces";
import { GenderEnum, IUser } from "../../user/interfaces";
import { IUserCash } from "../interfaces";

export const selectLanguage = `👇 Choose your language
ENG - English
AMH - Amharic
ORM - Afan Oromo
`;

export const selectGender = `Your gender
👇 Press the button`;

export const enterCity = `Enter your city
👇 Write the name of the city
For example: Addis Ababa`;

export const selectCountry = (
  data: string[]
) => `Select your city from the list:
${data.join("\n")}

👇🏻👇🏻👇🏻Press the number button`;

export const enterAge = `
How old are you?
👇 Submit number
For example - 25`;

export const enterProfileImage = `
✅ Final step!

Add your photo or make a selfie!

👇 Press sketch 📎 and select photo`;

export const moderatingPhone =
  "⏱ Please, stay for a while. Your photo is moderating right now ...";

export const successProfile =
  "✅ Congratulations! Your photo has passed moderation.";

export const agreement =
  '📄\nBy clicking the "Continue" button, you confirm that you accept the User Agreement and Privacy Policy.';

export const successfullyRegistered = `Here you can view 🎯 new profiles, 💘 your matches  or change your 📝 profile

Have a question? Official Tindu's support 👉 @TinduHelpBot`;

export const loading = `⏳`;

export const userProfile = (user: IUser, gift: number) => `${user.name}, ${
  user.age
}
⏱ Activity: ${moment(user.last_seen).fromNow()}
🎁 Received: ${gift} gifts`;

export const matchSuccuss = `🎉 Great start!
You liked Bico - if she likes you back, it's a match!`;

export const mainMenu = `Here you can view 🎯 new profiles, 💘 your matches  or change your 📝 profile

Have a question? Official Tindu's support 👉 @TinduHelpBot`;

export const sendGiftConfirmation = `For what gifts are?

Gift is a great possibility to stand out from the crowd?!

⭐ Your sympathy(!) will see your present!

More over .... if you got  >>❌<<, already, then someone can change decision 😍

👇 Press CONTINUE
`;

export const sendGft = (coin: number) => `Want to stand out from the crowd?
Give to your sympathy a gift!

There are ${coin} coins on your balance.
💐 — 400 coins
🧁 — 500 coins
🧸 — 600 coins

👇Choose a gift👇`;

export const invalidLang =
  "Invalid language\n👇🏻👇🏻👇🏻Press one of the below button";

export const invalidGender =
  "Invalid gender\n👇🏻👇🏻👇🏻Press one of the below button";

export const invalidCountry = (
  data: string[]
) => `Invalid country\n\nSelect your city from the list:
${data.join("\n")}

👇🏻👇🏻👇🏻Press the number button`;

export const invalidProfileImage = `
Invalid input

Add your photo or make a selfie!

👇 Press sketch 📎 and select photo`;

export const invalidCity = `Invalid input

Enter your city
👇 Write the name of the city
For example: Addis Ababa`;

export const invalidInput = `Invalid input\n\n
Here you can view 🎯 new profiles, 💘 your matches  or change your 📝 profile
`;

export const invalidAgreement =
  'Invalid input\nBy clicking the "Continue" button, you confirm that you accept the User Agreement and Privacy Policy.';

export const start = "Please use /start command to register";

export const getCoin = `<b>You have used all your free profile view coins.

Purchase Coins:</b>

⭐️ 25000 coins = 99 ETB
 2500 coins = 15 ETB 
 1200 coins = 8 ETB

👇How many coins do you want to get?`;

export const coinLacking = (
  coin: number
) => `<b>To send the gift, you are lacking ${coin} coin.</b>

⭐️ 25000 coins = 99 ETB
 2500 coins = 15 ETB 
 1200 coins = 8 ETB

👇How many coins do you want to get?`;

export const vip = `<b>Want to save money? <u>Became a VIP member right now!</u></b>`;

export const paymentSuccess = (
  coin: number
) => `Your payment has been successfully completed. 

Your current coin balance: ${coin}

You can view 🎯 new profiles, 💘 your matches 
`;
export const replyText = (user: IUser) => `Search settings:

Location: ${user?.search_settings?.country}, ${user?.search_settings?.city}
Gender: ${
  user?.gender === GenderEnum.female ? GenderEnum.male : GenderEnum.female
}
Age: from ${user?.search_settings?.age?.min} to ${
  user?.search_settings?.age?.max
}`;
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const subscriptionPaymentSuccess = (
  subscription: SubscriptionType,
  startDate: Date,
  endDate: Date
) => `Your subscription payment has been successfully completed. 

You have subscribed for ${subscription.replace("Month", " Month")}

Your Subscription started on ${
  months[startDate.getMonth() - 1]
}, ${startDate.getDate()} ${startDate.getFullYear()} and ends at ${
  months[endDate.getMonth() - 1]
}, ${endDate.getDate()} ${endDate.getFullYear()}

You can view 🎯 new profiles, 💘 your matches 
`;

export const boostPaymentSuccess = (
  boost: number
) => `Your boost payment has been successfully completed. 

You have been boosted for ${boost} hours

You can view 🎯 new profiles, 💘 your matches 
`;

export const sendFlower = (name: string) =>
  `💐 You just sent Flowers to ${name}!`;

export const sendDessert = (name: string) =>
  `🧁 You just sent Dessert to ${name}!`;

export const sendSoftToy = (name: string) =>
  `🧸 You just sent Soft Toy to ${name}!`;

export const likedYou = (name: string) =>
  `🎉 ${name} liked you. Open the "Likes you" section and start chatting right new!`;

export const userLikedYouVip = (user: IUser) => `${user.name}, ${user.age}
⏱ Activity: ${moment(user.last_seen).fromNow()}

💘 User already liked you!

🔐 This user is available only in Premium!`;

export const info = `Save time with our Likes You feature, which lets you see who likes you. From your Likes You list you can like (auto-match) or dislike persons.

Need help? Please contact us 👉 @TinduHelpBot`;

export const chatOptionText = (name: string) =>
  `💬 Select chat mode with ${name}`;

export const startChatText = (name: string) =>
  `💬 To start chat with ${name} use the button below👇👇👇`;

export const settingText = `Choose a section 👇 👇 👇`;

export const boostText = `⚡️ <b>Want to stand out from the crowd?</b> ⚡️

Be first on the list - get more likes from other users!

🚀 24h = 7.99 Birr
🚀 12h = 6.99 Birr
🚀 6h = 4.99 Birr

Activate Boost right now!

👇👇👇`;

export const shareText =
  "💰 💰 💰 💰 Use the button below, and share Tindu to friends to gain 400 coins\n\n👇👇👇";

export const referralCoinText =
  "💰 💰 💰 💰 Congratulations! You have earned 400 coins! 💰 💰 💰 💰";

export const invalidImageEmoji = "⁉";

export const invalidImageText =
  "❌ Your photo has been declined. Reason: missing_face. Please upload a new profile photo or take a selfie right now!";

export const getCoinText = (
  coin: number
) => `There are ${coin} coins on your balance.

⭐️ 25000 coins = 99 Birr
 2500 coins = 15 Birr
 1200 coins = 8 Birr

👇How many coins do you want to get?`;

export const getVipText = `Your VIP status is not activated.

With VIP you will get:
✅  See who likes you
✅  Unlimited access to all profiles
✅  Access to “Stories” filters
✅  Get matches faster
✅  +1,000 coins each month
✅  Personal support
✅  No ads

Need help? Contact us - @TinduHelpBot`;

export const profileText = (user: IUser) => `${user.name}, ${user.age}
🌐 ${user.country}, ${user.city}
Gender: 🎩 I'm ${user.gender}

🆔 ${user.chatId}`;

export const searchSettingsText = `Update your search settings:`;
export const updateAgeRangeText = `Please enter your desired age range (e.g., 25-35):`;
export const updateLocationText = `Please enter your desired location:`;
export const updateSuccessText = `Your search settings have been updated successfully.`;

export const flowerUrl =
  "https://res.cloudinary.com/dsdpkdj7b/image/upload/v1718439245/tindu/images/rhmsg7hsujv73d7tkcpn.jpg";

export const dessertUrl =
  "https://res.cloudinary.com/dsdpkdj7b/image/upload/v1718459891/tindu/images/hvvyyuvrnwptnmugsvyy.jpg";

export const softToyUrl =
  "https://res.cloudinary.com/dsdpkdj7b/image/upload/v1718459983/tindu/images/ge3yguts39bnkprcuvjj.jpg";

export const boostUrl =
  "https://res.cloudinary.com/dsdpkdj7b/image/upload/v1719057520/tindu/images/nffvmqz4brtuugyphd8h.jpg";
