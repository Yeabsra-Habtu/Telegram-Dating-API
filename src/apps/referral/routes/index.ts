import { Router } from "express";
import ReferralController from "../controllers";

const referralRouter = Router();

const controller = new ReferralController();

referralRouter.get(
  "/",
  async (req, res) => await controller.findByPagination(req, res)
);

export default referralRouter;
