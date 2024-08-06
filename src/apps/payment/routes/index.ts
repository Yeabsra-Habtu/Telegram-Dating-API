import { Router } from "express";
import PaymentController from "../controllers";
import paymentMiddleware, {
  boostPaymentMiddleware,
} from "../../../middlewares/payment.middleware";

const paymentRouter = Router();

const controller = new PaymentController();

// chapa payment route
paymentRouter.post(
  "/chapa",
  paymentMiddleware,
  async (req, res) => await controller.payWithChapa(req, res)
);

// chapa webhook route
paymentRouter.get(
  "/chapa/webhook",
  async (req, res) => await controller.chapaWebhook(req, res)
);

// chapa vip payment route
paymentRouter.post(
  "/vip/chapa",
  async (req, res) => await controller.payVipWithChapa(req, res)
);

// vip chapa webhook route
paymentRouter.get(
  "/vip/chapa/webhook",
  async (req, res) => await controller.vipChapaWebhook(req, res)
);

// chapa vip payment route
paymentRouter.post(
  "/boost/chapa",
  boostPaymentMiddleware,
  async (req, res) => await controller.payBoostWithChapa(req, res)
);

// vip chapa webhook route
paymentRouter.get(
  "/boost/chapa/webhook",
  async (req, res) => await controller.boostChapaWebhook(req, res)
);

// withdraw payment route
paymentRouter.post(
  "/withdraw/chapa",
  async (req, res) => await controller.withdrawWithChapa(req, res)
);

// vip chapa webhook route
paymentRouter.get(
  "/withdraw/chapa/webhook",
  async (req, res) => await controller.withdrawChapaWebhook(req, res)
);

export default paymentRouter;
