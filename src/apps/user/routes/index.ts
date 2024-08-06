import { Router } from "express";
import UserController from "../controllers";

const controller = new UserController();
const userRouter = Router();

userRouter.get(
  "/",
  async (req, res) => await controller.findByPagination(req, res)
);

userRouter.get(
  "/:id",
  async (req, res) => await controller.findUserById(req, res)
);

userRouter.get(
  "/:id/withdraw",
  async (req, res) => await controller.findUserByIdForWithdraw(req, res)
);

userRouter.patch(
  "/:id/activate",
  async (req, res) => await controller.activate(req, res)
);

userRouter.patch(
  "/:id/deactivate",
  async (req, res) => await controller.deactivate(req, res)
);

userRouter.get(
  "/:id/detail",
  async (req, res) => await controller.findUserDetail(req, res)
);

userRouter.get(
  "/my-profile/:id",
  async (req, res) => await controller.myProfile(req, res)
);

userRouter.post(
  "/:id/upload",
  controller.multerParser.single("image"),
  controller.photoUploader
);

userRouter.get("/generateToken/:id", async (req, res) =>
  controller.generateChatToken(req, res)
);

userRouter.delete("/:id/delete/:url", controller.photoDeleter);

userRouter.post(
  "/question/:id",
  async (req, res) => await controller.answerQuestion(req, res)
);

export default userRouter;
