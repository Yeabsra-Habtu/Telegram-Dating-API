import { Router } from "express";
import CoinController from "../controllers";

const controller = new CoinController();
const coinRouter = Router();

coinRouter.get(
  "/",
  async (req, res) => await controller.findByPagination(req, res)
);

export default coinRouter;
