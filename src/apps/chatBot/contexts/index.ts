import { Api, CommandContext, Context } from "grammy";
import { Update, UserFromGetMe } from "grammy/types";
import ChatBotService from "../services";
import { IChatUserCache } from "../interfaces";

export class ChatBotContext extends Context {
  private currentUser!: IChatUserCache;
  public readonly service = new ChatBotService();

  constructor(update: Update, api: Api, me: UserFromGetMe) {
    super(update, api, me);
  }

  public async findUser(): Promise<IChatUserCache | undefined> {
    const user = await this.service.findUser(this.chatId!);
    if (user) this.currentUser = user;
    return user;
  }
}
