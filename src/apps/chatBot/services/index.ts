import { IChatUserCache } from "../interfaces";
import ChatBotRepository from "../repositories";

export default class ChatBotService {
  private currentUser: IChatUserCache | undefined;
  private readonly repo = new ChatBotRepository();

  public get user() {
    return this.currentUser;
  }

  public async findUser(chatId: number): Promise<IChatUserCache | undefined> {
    this.currentUser = await this.repo.findUser(chatId);
    return this.currentUser;
  }
}
