import { Router } from "express";
import BoostController from "../controllers";

const boostRoutes = Router();
const controller = new BoostController();

boostRoutes.get(
  "/",
  async (req, res) => await controller.findByPagination(req, res)
);

export default boostRoutes;
