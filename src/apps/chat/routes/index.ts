import { Router } from "express";
import ChatController from "../controllers";
import chatMiddleware from "../../../middlewares/chat.middleware";

const chatRouter = Router();

const controller = new ChatController();

chatRouter.get(
  "/:id",
  chatMiddleware,
  async (req, res) => await controller.findMessages(req, res)
);

chatRouter.get("/getAllChats/:id", controller.fetchChats);

export default chatRouter;
