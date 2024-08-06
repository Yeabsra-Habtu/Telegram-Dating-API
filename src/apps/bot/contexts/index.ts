import { Api, CommandContext, Context, HearsContext } from "grammy";
import { Update, UserFromGetMe } from "grammy/types";
import RegisterService from "../services/register.service";
import { BotService } from "../services";
import {
  continueKeyboard,
  countryKeyboard,
  genderKeyboard,
  langKeyboard,
  menuKeyboard,
  removeKeyboard,
} from "../helpers/keyboard";
import {
  invalidAgreement,
  invalidCity,
  invalidCountry,
  invalidGender,
  invalidInput,
  invalidLang,
  invalidProfileImage,
  mainMenu,
} from "../helpers/text";
import { IUserCash } from "../interfaces";

export class BotContext extends Context {
  public readonly registerService = new RegisterService();
  public readonly service = new BotService();
  private currentUser: IUserCash | undefined;

  constructor(update: Update, api: Api, me: UserFromGetMe) {
    super(update, api, me);
  }

  public async getUser() {
    this.currentUser = await this.service.findCurrentUser(this.chatId!);
  }

  public user() {
    return this.currentUser;
  }

  public async handleStart(ctx: HearsContext<BotContext>) {
    // check if user is registered
    if (this.currentUser) {
      // send main menu
      ctx.reply(mainMenu, { reply_markup: menuKeyboard(ctx.user()!.id) });
    } else this.registerService.handleStart(ctx);
  }

  public async handleInvalidInput(ctx: CommandContext<BotContext>) {
    // check if user exits
    if (ctx.user()) {
      ctx.reply(invalidInput, { reply_markup: menuKeyboard(ctx.user()!.id) });
    } else {
      // get registration form
      const data = await ctx.registerService.getRegisterFrom(ctx.chatId);
      if (!data) ctx.reply("Please use /start command to register");
      else if (data.current === "lang")
        ctx.reply(invalidLang, { reply_markup: langKeyboard });
      else if (data.current === "gender")
        ctx.reply(invalidGender, { reply_markup: genderKeyboard });
      else if (data.current === "city")
        await ctx.reply(invalidCity, removeKeyboard);
      else if (data.current === "country")
        ctx.reply(invalidCountry(data.cities!), {
          reply_markup: countryKeyboard(data.cities!),
        });
      else if (data.current === "age") ctx.reply("Please enter a valid age");
      else if (data.current === "image")
        ctx.reply(invalidProfileImage, removeKeyboard);
      else if (data.current === "confirm")
        ctx.reply(invalidAgreement, { reply_markup: continueKeyboard });
    }
  }
}
