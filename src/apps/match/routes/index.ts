import { Router } from "express";
import MatchController from "../controller";

const matchRouter = Router();
const controller = new MatchController();

matchRouter.get("/getAllMatches/:id", controller.fetchMatches);

matchRouter.get(
  "/",
  async (req, res) => await controller.findByPagination(req, res)
);

export default matchRouter;
