import { ObjectId } from "mongodb";
import {
  IMessage,
  IGetMessagesInput,
  IChatInput,
  IChat,
  ICountMessagesInput,
  IChatUser,
} from "../interfaces";
import { ChatModel } from "../models";
import { UserModel } from "../../user/models";

export default class ChatRepository {
  public async findUserById(id: string): Promise<IChatUser | undefined> {
    return (
      await UserModel.findById(id, {
        name: 1,
        image: 1,
        is_online: 1,
        last_seen: 1,
      })
    )?.toJSON();
  }

  public async findUserByChatId(
    chatId: number
  ): Promise<IChatUser | undefined> {
    return (
      await UserModel.findOne({ chatId }, { name: 1, image: 1 })
    )?.toJSON();
  }

  public async findMessages({
    limit,
    offset,
    receiverId,
    userId,
  }: IGetMessagesInput): Promise<IMessage[]> {
    return await ChatModel.find<IMessage>({
      $or: [
        { sender: new ObjectId(userId), receiver: new ObjectId(receiverId) },
        { sender: new ObjectId(receiverId), receiver: new ObjectId(userId) },
      ],
    })
      .populate({
        path: "sender",
        select: "name image",
      })
      .populate({
        path: "receiver",
        select: "name image",
      })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip((offset - 1) * limit);
  }
  public async countMessages({
    receiverId,
    userId,
  }: ICountMessagesInput): Promise<number> {
    return await ChatModel.find({
      $or: [
        { sender: new ObjectId(userId), receiver: new ObjectId(receiverId) },
        { sender: new ObjectId(receiverId), receiver: new ObjectId(userId) },
      ],
    }).countDocuments();
  }

  public async findMessage(id: string): Promise<IMessage | null> {
    return (
      await ChatModel.findById(id)
        .populate({ path: "sender", select: "name image" })
        .populate({ path: "receiver", select: "name image" })
    )?.toJSON() as IMessage;
  }

  public async storeMessage(input: IChatInput): Promise<IChat> {
    return await ChatModel.create({ ...input, seen: false });
  }

  public async updateSeen(id: string) {
    await ChatModel.findByIdAndUpdate(id, { seen: true });
  }

  public async setOnline(userId: string) {
    await UserModel.findByIdAndUpdate(userId, { is_online: true });
  }

  public async setOffline(userId: string) {
    await UserModel.findByIdAndUpdate(userId, {
      is_online: false,
      last_seen: new Date(),
    });
  }
}
