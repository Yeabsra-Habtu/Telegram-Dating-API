import { Request, Response } from "express";
import { PaymentStatusEnum, SubscriptionType } from "../interfaces";
import PaymentService from "../services";
import { error400 } from "../../../helpers/error";
import { decodeToken } from "../../../helpers/jwt";
import { isValidObjectId } from "mongoose";
import { IRequest } from "../../../base.interface";

export default class PaymentController {
  private service = new PaymentService();

  public async payWithChapa(req: Request, res: Response) {
    //   extract user chat id and amount
    const token: any = decodeToken(req.query.token as string);
    const chatId = Number(token.chatId);
    const amount = Number(token.amount);
    const coin = Number(token.coin);

    // check if both field are numbers
    if (isNaN(chatId) || isNaN(amount)) {
      res.status(400).json(error400("chatId and amount must be numbers"));
    } else {
      const data = await this.service.payWithChapa({ chatId, amount, coin });
      if ("error" in data) res.status(400).json(data);
      else res.status(201).json(data);
    }
  }

  public async chapaWebhook(req: Request, res: Response) {
    const data = req.body;
    await this.service.updateStatus(
      data.trx_ref,
      data.status === "success"
        ? PaymentStatusEnum.success
        : PaymentStatusEnum.failed
    );
    res.json({ status: "success", message: "Webhook called successfully" });
  }

  public async payVipWithChapa(req: Request, res: Response) {
    const userId = req.body.userId;
    const subscriptionType = req.body.subscriptionType;

    // check if user id is valid object id type
    if (!isValidObjectId(userId))
      res.status(400).json(error400("Invalid user id"));
    // check if subscription type is valid
    else if (!(subscriptionType in SubscriptionType))
      res.status(400).json(error400("Invalid subscription type"));
    else {
      const data = await this.service.payVipWithChapa({
        userId,
        subscriptionType,
      });
      if ("error" in data) res.status(400).json(data);
      else res.status(201).json(data);
    }
  }

  public async vipChapaWebhook(req: Request, res: Response) {
    const data = req.body;
    await this.service.updateVipStatus(
      data.trx_ref,
      data.status === "success"
        ? PaymentStatusEnum.success
        : PaymentStatusEnum.failed
    );
    res.json({ status: "success", message: "Webhook called successfully" });
  }

  public async payBoostWithChapa(req: IRequest, res: Response) {
    const userId = req.user!.id;
    const boost = req.body.boost;

    // check if user id is valid object id type
    if (!isValidObjectId(userId))
      res.status(400).json(error400("Invalid user id"));
    // check if subscription type is valid
    else if (![6, 12, 24].includes(boost))
      res.status(400).json(error400("Invalid boost type"));
    else {
      const data = await this.service.payBoostWithChapa({
        userId,
        boost: boost as number,
      });
      if ("error" in data) res.status(400).json(data);
      else res.status(201).json(data);
    }
  }

  public async boostChapaWebhook(req: Request, res: Response) {
    const data = req.body;
    await this.service.updateBoostStatus(
      data.trx_ref,
      data.status === "success"
        ? PaymentStatusEnum.success
        : PaymentStatusEnum.failed
    );
    res.json({ status: "success", message: "Webhook called successfully" });
  }

  public async withdrawWithChapa(req: IRequest, res: Response) {
    const userId = req.body.userId;
    const coin = req.body.coin;

    // check if user id is valid object id type
    if (!isValidObjectId(userId))
      res.status(400).json(error400("Invalid user id"));
    // check if coin is number
    else if (isNaN(coin)) res.status(400).json(error400("Invalid coin"));
    else {
      const data = await this.service.withdrawWithChapa({
        userId,
        coin: coin as number,
      });
      if ("error" in data) res.status(400).json(data);
      else res.status(201).json(data);
    }
  }

  public async withdrawChapaWebhook(req: Request, res: Response) {
    const data = req.body;
    await this.service.updateWithdrawStatus(
      data.trx_ref,
      data.status === "success"
        ? PaymentStatusEnum.success
        : PaymentStatusEnum.failed
    );
    res.json({ status: "success", message: "Webhook called successfully" });
  }
}
