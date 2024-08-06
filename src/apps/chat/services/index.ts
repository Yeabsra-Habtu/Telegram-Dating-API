import { IError } from "../../../base.interface";
import { error400 } from "../../../helpers/error";
import {
  IChat,
  IChatInput,
  IGetMessagesInput,
  IMessage,
  IMessageResponse,
} from "../interfaces";
import ChatRepository from "../repositories";

export default class ChatService {
  private readonly repo = new ChatRepository();

  public async findMessages(
    input: IGetMessagesInput,
    chatId: number
  ): Promise<IMessageResponse | IError> {
    // get user by chatId
    const user = await this.repo.findUserByChatId(chatId);
    // ger receiver user
    const receiver = await this.repo.findUserById(input.receiverId);
    // check if user id the same with the sender id, and receiver id exit
    if (receiver?.name && user?._id) {
      const data = await this.repo.findMessages(input); // get messages by by pagination
      const total = await this.repo.countMessages({
        receiverId: input.receiverId,
        userId: input.userId,
      });
      return {
        data,
        limit: input.limit,
        offset: input.offset,
        total,
        user: user!,
        receiver,
      };
    } else return error400("User not found");
  }

  public async storeMessage(input: IChatInput): Promise<IMessage> {
    const chat = await this.repo.storeMessage(input);
    return (await this.repo.findMessage(String(chat._id)))!;
  }

  public async updateSeen(id: string) {
    await this.repo.updateSeen(id);
  }

  public async updateUserToOnline(userId: string) {
    return await this.repo.setOnline(userId);
  }

  public async updateUserToOffline(userId: string) {
    return await this.repo.setOffline(userId);
  }
}
