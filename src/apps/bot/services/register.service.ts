import { CommandContext, Context, HearsContext } from "grammy";
import {
  agreement,
  enterAge,
  enterCity,
  enterProfileImage,
  invalidAgreement,
  invalidCountry,
  invalidGender,
  invalidImageEmoji,
  invalidImageText,
  invalidLang,
  invalidProfileImage,
  moderatingPhone,
  referralCoinText,
  selectCountry,
  selectGender,
  selectLanguage,
  start,
  successProfile,
  successfullyRegistered,
} from "../helpers/text";
import {
  agreementInlineKeyboard,
  continueKeyboard,
  countryKeyboard,
  genderKeyboard,
  langKeyboard,
  menuKeyboard,
  removeKeyboard,
} from "../helpers/keyboard";
import RegisterRepository from "../repositories/register.repository";
import {
  tempDownloadImage,
  fetchCountriesByCityApi,
} from "../../../helpers/api";
import { convertNumToEmoji } from "../../../helpers";
import { BotContext } from "../contexts";
import { IRegister, LangEnum, Question, RankEnum } from "../../user/interfaces";
import { faceDetector } from "../../../helpers/faceDetector";
import { uploadToCloudinary } from "../../../helpers/fileUpload";

export default class RegisterService {
  private readonly repo = new RegisterRepository();

  public async getRegisterFrom(chatId: number): Promise<IRegister | null> {
    return await this.repo.getRegister(chatId);
  }

  public async handleStart(ctx: HearsContext<Context>) {
    await ctx.replyWithVideo(
      "https://res.cloudinary.com/dsdpkdj7b/video/upload/v1717921271/xdjrme425tj0eyrydzhy.mp4",
      { caption: selectLanguage, reply_markup: langKeyboard }
    );
    // check if user is registering from share
    const temp = ctx.message?.text?.split(" ");
    const data: any = {};
    if (temp && temp[1]) data.userId = temp[1];
    await this.repo.cacheRegister(ctx.chatId, { current: "lang", data });
  }

  public async handleLanguage(ctx: any) {
    await ctx.replyWithVideo(
      "https://res.cloudinary.com/dsdpkdj7b/video/upload/v1717921271/xdjrme425tj0eyrydzhy.mp4",
      { caption: selectGender, reply_markup: genderKeyboard }
    );
    await this.repo.setLang(ctx.chatId, ctx.message!.text);
  }

  public async handleGender(ctx: any) {
    await ctx.reply(enterCity, { reply_markup: { remove_keyboard: true } });
    await this.repo.setGender(ctx.chatId, ctx.message!.text.split(" ")[2]);
  }

  public async handleCity(ctx: CommandContext<Context>) {
    const countries = await fetchCountriesByCityApi(ctx.message!.text);
    if (countries && countries?.length > 0) {
      const data = countries.map(
        (value, index) =>
          `${convertNumToEmoji(index + 1)}  ${value.city}, ${value.country}`
      );
      ctx.reply(selectCountry(data), {
        reply_markup: countryKeyboard(data),
      });
      await this.repo.setCity(ctx.chatId, ctx.message!.text, data);
    } else {
      ctx.reply("City Name not found. Please enter valid city name");
    }
  }

  public async handleCountry(ctx: CommandContext<Context>) {
    await ctx.reply(enterAge, removeKeyboard);
    const message = ctx.message!.text.split(", ");
    await this.repo.setCountry(
      ctx.chatId,
      message[0].split(" ").slice(1).join(" ").trim(),
      message[1].trim()
    );
  }

  public async handleAge(ctx: CommandContext<Context>) {
    const age = ctx.message?.text;
    if (!age || isNaN(Number(age))) {
      return ctx.reply("Age must be number", removeKeyboard);
    }
    // check if age is not decimal point and is between 18 and 100
    if (Number(age) % 1 !== 0 || Number(age) < 18 || Number(age) > 100) {
      await ctx.reply("Please enter a valid age", removeKeyboard);
    } else {
      await ctx.reply(enterProfileImage, removeKeyboard);
      await this.repo.setAge(ctx.chatId, Number(age));
    }
  }

  public async handleProfile(ctx: any) {
    const photos = ctx.message.photo;
    if (photos.length > 0) {
      await ctx.reply(moderatingPhone, removeKeyboard);
      const photo = await ctx.getFile();
      // download image to temp directory
      const path = await tempDownloadImage(photo);
      if (path) {
        // check if face is detected
        if (await faceDetector(path)) {
          await ctx.reply(successProfile, { reply_markup: continueKeyboard });
          // TODO: on deployment comment uploadToCloudinary and uncomment uploadToDigitalOceanSpace
          const url = await uploadToCloudinary(photo);
          // const url = await uploadToDigitalOceanSpace(path);
          ctx.reply(agreement, { reply_markup: agreementInlineKeyboard });
          await this.repo.setProfile(ctx.chatId, url);
        } else {
          await ctx.reply(invalidImageEmoji);
          ctx.reply(invalidImageText);
        }
      } else {
        ctx.reply(invalidProfileImage, removeKeyboard);
      }
    } else ctx.reply("Please send a photo");
  }

  public async handleRegisterUser(
    ctx: CommandContext<Context>,
    data: IRegister
  ) {
    const user = await this.repo.createAndCacheUser({
      age: data.data.age!,
      city: data.data.city!,
      country: data.data.country!,
      gender: data.data.gender!,
      image: data.data.image!,
      chatId: ctx.chatId,
      language: data.data.lang as LangEnum,
      name: ctx.from?.first_name ?? ctx.from!.username!,
      search_settings: {
        age: { min: 18, max: 35 },
        city: data.data.city!,
        country: data.data.country!,
      },
      ranking_class: RankEnum.standard,
      questions: questions,
    });
    ctx.reply(successfullyRegistered, {
      reply_markup: menuKeyboard(String(user!._id)),
    });
    // if user is registered using share link add 400 coin for both users
    if (data.data.userId) {
      const user = await this.repo.addShareCoinToUsers(
        data.data.userId,
        ctx.chatId
      );
      if (user?.chatId) {
        ctx.api.sendMessage(user.chatId, referralCoinText);
        const registeredUser = await this.repo.findByChatId(ctx.chatId);
        await this.repo.cache(registeredUser!);
        await this.repo.cache(user);
      }
    }
  }

  public async handleMessage(ctx: CommandContext<BotContext>) {
    // get registration form
    const data: IRegister | null = await this.getRegisterFrom(ctx.chatId);
    if (!data) ctx.reply(start);
    else if (data.current === "lang")
      ctx.reply(invalidLang, { reply_markup: langKeyboard });
    else if (data.current === "gender")
      ctx.reply(invalidGender, { reply_markup: genderKeyboard });
    else if (data.current === "city") await this.handleCity(ctx as any);
    else if (data.current === "country") {
      // check if country is valid
      if (data.cities?.includes(ctx.message!.text))
        this.handleCountry(ctx as any);
      else
        ctx.reply(invalidCountry(data.cities!), {
          reply_markup: countryKeyboard(data.cities!),
        });
    } else if (data.current === "age") this.handleAge(ctx as any);
    else if (data.current === "image")
      ctx.reply(invalidProfileImage, removeKeyboard);
    else if (data.current === "confirm") {
      if (ctx.message!.text === "✅ Continue")
        this.handleRegisterUser(ctx as any, data);
      else ctx.reply(invalidAgreement, { reply_markup: continueKeyboard });
    } else ctx.handleInvalidInput(ctx as any);
  }
}

const questions: Question[] = [
  { question: `How would you describe yourself in three words?`, answer: "" },
  { question: `What do you enjoy doing in your free time?`, answer: "" },
  {
    question: `What are some of your favorite movies, books, or TV shows?`,
    answer: "",
  },
  {
    question: `Do you have any favorite travel destinations or places you would love to visit someday?`,
    answer: "",
  },
  {
    question: `What type of music do you enjoy listening to? Any favorite artists or bands?`,
    answer: "",
  },
  {
    question: `What are some of your favorite hobbies or activities?`,
    answer: "",
  },
  { question: `What do you value most in a relationship?`, answer: "" },
  {
    question: `Are you more of an introvert or extrovert? How do you typically spend your weekends?`,
    answer: "",
  },
  { question: `What is your favorite type of food or cuisine?`, answer: "" },
  {
    question: `Can you share a fun fact or something interesting about yourself that is not on your profile?`,
    answer: "",
  },
  {
    question: `What do you do for a living, and how did you choose your career path?`,
    answer: "",
  },
  {
    question: `Do you have any pets? If so, can you tell me more about them?`,
    answer: "",
  },
  { question: `What is your ideal first date like?`, answer: "" },
  {
    question: `What are some goals or dreams you are working towards?`,
    answer: "",
  },
  {
    question: `How do you handle stress or unwind after a long day?`,
    answer: "",
  },
];
