"../../../connection/redis";
import { config } from "../../../config";
import { redisClient } from "../../../connection/redis";
import { IUser } from "../../user/interfaces";
import { UserModel } from "../../user/models";
import { IChatUserCache } from "../interfaces";

export default class ChatBotRepository {
  private async findUserByChatIdFromDb(
    chatId: number
  ): Promise<IChatUserCache | undefined> {
    const data = (await UserModel.findOne({ chatId }))?.toJSON();
    if (data) return { id: String(data._id) };
  }

  private async findUserByChatIdFromRedis(
    chatId: number
  ): Promise<IChatUserCache | undefined> {
    const data = await redisClient.get(`chat-bot-${chatId}`);
    return data ? JSON.parse(data) : undefined;
  }

  public async findUser(chatId: number): Promise<IChatUserCache | undefined> {
    let data = await this.findUserByChatIdFromRedis(chatId);
    if (!data) return await this.findUserByChatIdFromDb(chatId);
    return data;
  }

  public async cache(user: IUser): Promise<IChatUserCache> {
    const data: IChatUserCache = { id: String(user._id) };
    await redisClient.set(
      `chat-bot-${user.chatId}`,
      JSON.stringify(data),
      "EX",
      config.REDIS_EXPIRE
    );
    return data;
  }
}
