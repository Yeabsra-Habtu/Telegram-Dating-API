import { Schema, model } from "mongoose";
import { IChat } from "../interfaces";

const chatSchema = new Schema<IChat>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "users", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "users", required: true },
    seen: { type: Boolean, default: false },
    message: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret, __) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const ChatModel = model("chats", chatSchema);
