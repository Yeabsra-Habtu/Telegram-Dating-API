import { Router } from "express";
import TransactionController from "../controllers";

const controller = new TransactionController();
const transactionRouter = Router();

transactionRouter.get(
  "/",
  async (req, res) => await controller.findByPagination(req, res)
);

export default transactionRouter;
