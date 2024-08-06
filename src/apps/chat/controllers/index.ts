import { Response, query } from "express";
import ChatService from "../services";
import { IRequest } from "../../../base.interface";
import { isValidObjectId } from "mongoose";
import { error400 } from "../../../helpers/error";
import { checkTelegramInitData } from "../../../helpers";
import { ChatModel } from "../models";
import { ObjectId } from "mongodb";
import { UserModel } from "../../user/models";

export default class ChatController {
  private readonly service = new ChatService();

  public async findMessages(req: IRequest, res: Response) {
    const { id: receiverId } = req.params;
    const userId = req.user!.id;
    const offset = Number(req.query.offset ?? "1");
    const limit = Number(req.query.limit ?? "10");
    const intiData = req.headers["x-init-data"];
    // check if receiver id is valid object id type
    if (!isValidObjectId(receiverId))
      res.status(400).json(error400("Invalid receiver id"));
    else if (!intiData)
      res.status(400).json(error400("initData is required as query param"));
    else {
      // check it telegram init data is valid
      const chatId = checkTelegramInitData(String(intiData));
      if (offset < 0 || limit < 0)
        res
          .status(400)
          .json(error400("Invalid offset or limit, must be greater than 0"));
      else if (chatId) {
        const result = await this.service.findMessages(
          {
            offset,
            limit,
            userId,
            receiverId,
          },
          chatId
        );
        if ("data" in result) res.send(result);
        else res.status(400).json(result);
      } else res.status(400).json(error400("Invalid init data"));
    }
  }

  public async fetchChats(req: IRequest, res: Response) {
    const { id } = req.params;
    if (isValidObjectId(id)) {
      try {
        const objectId = new ObjectId(id);
        const chats = await ChatModel.aggregate([
          { $match: { $or: [{ sender: objectId }, { receiver: objectId }] } },
          {
            $project: {
              userId: {
                $cond: {
                  if: { $eq: ["$sender", objectId] },
                  then: "$receiver",
                  else: "$sender",
                },
              },
              createdAt: 1,
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$userId",
              lastMessageTime: { $first: "$createdAt" },
            },
          },
          { $sort: { lastMessageTime: -1 } },
        ]);
        const data = await UserModel.populate(chats, {
          path: "_id",
          select: "name image",
        });

        res.json(
          data.map((value: any) => ({
            ...value._id.toJSON(),
            lastMessageTime: value.lastMessageTime,
          }))
        );
      } catch (error) {
        res.status(500).json("error");
      }
    } else {
      res.status(400).json("Invalid ID");
    }
  }
}
