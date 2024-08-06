import { redisClient } from "../../../connection/redis";
import { ISocket } from "../../../base.interface";
import ChatService from "../services";
import { ObjectId } from "mongodb";
import { ISendMessageInput } from "../interfaces";
import { isValidObjectId } from "mongoose";
import { bot } from "../../bot";
import { UserModel } from "../../user/models";

const keyName = (userId: string) => `active-user-${userId}`;

async function addIdToRedis({
  userId,
  socketId,
}: {
  userId: string;
  socketId: string;
}) {
  await redisClient.set(keyName(userId), socketId);
}

async function getIdFromRedis(userId: string) {
  return await redisClient.get(keyName(userId));
}

async function deleteIdFromRedis(userId: string) {
  await redisClient.del(keyName(userId));
}

// initialize chat service
const service = new ChatService();

export default async function socketManager(socket: ISocket) {
  const userId: string = socket.user!.id; // get user id from socket
  await addIdToRedis({ userId, socketId: socket.id }); // store socket id of user on redis
  console.log("user connected: ", userId, socket.id);
  await service.updateUserToOnline(userId); // update user to online

  // on disconnect remove socket id from redis
  socket.on("disconnect", async () => {
    await deleteIdFromRedis(userId);
    await service.updateUserToOffline(userId); // update user to offline
  });

  // listen for new messages
  socket.on("send_message", async (input: ISendMessageInput, callback) => {
    // check if in coming data is full valid
    if (typeof input !== "object")
      return callback({ success: false, error: "data should be an object" });
    else if (
      typeof input.receiverId !== "string" ||
      typeof input.message !== "string"
    )
      return callback({
        success: false,
        error: "receiverId and message should be string",
      });
    else if (input.message.trim().length === 0)
      return callback({ success: false, error: "message should not be empty" });
    else if (!isValidObjectId(input.receiverId))
      return callback({
        success: false,
        error: "receiverId should be valid object id",
      });
    const { receiverId, message } = input;
    //   store on db
    const data = await service.storeMessage({
      message,
      receiver: new ObjectId(receiverId),
      sender: new ObjectId(userId),
    });
    // check if receiver is online and emit to receiver
    const receiverSocketId = await getIdFromRedis(receiverId);
    if (receiverSocketId)
      socket.to(receiverSocketId).emit("receive_message", data);
    else {
      const user = await UserModel.findById(data.receiver);
      const sender = await UserModel.findById(data.sender);
      bot.api.sendMessage(
        user!.chatId,
        `${sender?.name} has sent you a message`
      );
    }

    // emit back
    return callback({ success: true, data });
  });
}
