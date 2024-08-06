import "./config";
import { createServer } from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import { webhookCallback } from "grammy";
import { bot } from "./apps/bot";
import { config } from "./config";
import { connectDb } from "./connection/db";
import { redisClient } from "./connection/redis";
import cloudinary from "cloudinary";
import paymentRouter from "./apps/payment/routes";
import userRouter from "./apps/user/routes";
import chatRouter from "./apps/chat/routes";
import { Server } from "socket.io";
import socketMiddleware from "./middlewares/socket.middleware";
import socketManager from "./apps/chat/socket";
import { ISocket } from "./base.interface";
import { initializeFaceDetector } from "./helpers/faceDetector";
import matchRouter from "./apps/match/routes";
import { promises } from "fs";
import transactionRouter from "./apps/transaction/routes";
import referralRouter from "./apps/referral/routes";
import boostRoutes from "./apps/boost/routes";
import coinRouter from "./apps/coin/routes";
import { CronJob } from "cron";
import { CoinTransactionService } from "./apps/coin/services";
import { BotService } from "./apps/bot/services";
import SettingRepository from "./apps/setting/repositories";

// initialize face detection library
initializeFaceDetector();

// initialize express app
const app = express();

app.use(cors());

// add middleware for parsing request body to JSON
app.use(express.json());

// add bot webhook as middleware
app.use(`/api/v1/webhook`, webhookCallback(bot, "express"));

// add all routes
app.post("/api/v1/auth/login", (req: Request, res: Response) => {
  const data = req.body;
  if (
    data &&
    data.email === "admin@gmail.com" &&
    data.password === "passw0rd"
  ) {
    res.json({
      status: 200,
      message: "Login Success",
    });
  } else {
    res.status(400).json({
      status: 400,
      message: "Invalid email or password",
    });
  }
});
app.use("/api/v1/boosts", boostRoutes);
app.use("/api/v1/chats", chatRouter);
app.use("/api/v1/coins", coinRouter);
app.use("/api/v1/matches", matchRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/referrals", referralRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/users", userRouter);

app.get("/api/v1/users/image/:name", async (_: Request, res: Response) => {
  const name = _.params.name;
  const path = `${__dirname.replace(/(src|build)/, "")}upload/images/${name}`;
  res.sendFile(path);
});

// configure cloudinary
cloudinary.v2.config({
  cloud_name: config.CLOUDINARY_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});
// connect db
connectDb().then(() => {
  // create server
  const server = createServer(app);

  // create socket io server and add cors
  const io = new Server(server, { cors: { origin: "*" } });

  // add socket io middleware
  io.use(socketMiddleware);

  // add socket io event
  io.on("connection", (socket: ISocket) => socketManager(socket));

  // start server
  server.listen(config.PORT, async () => {
    // create default settings
    await SettingRepository.createDefault();

    // create default upload folder inside apps/user/controllers/upload/images
    try {
      await promises.mkdir(`src/apps/user/controllers/upload/images`, {
        recursive: true,
      });
      await promises.mkdir(`build/apps/user/controllers/upload/images`, {
        recursive: true,
      });
      console.log("default upload folder created");
    } catch (error) {
      console.log("", error);
    }
    const cronJobTimeInterval = await SettingRepository.cronJobTimeInterval();
    const job = new CronJob(`* */${cronJobTimeInterval} * * *`, async () => {
      await Promise.all([
        CoinTransactionService.updateUserRank(),
        CoinTransactionService.notifyUser(),
      ]);
    });
    job.start();
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    await bot.api.setWebhook(`${config.APP_URL}/api/v1/webhook`);
    console.log(`Webhook is set successfully...`);
    console.log(await bot.api.getWebhookInfo());
    await BotService.setDescription();
    await redisClient.ping();
    console.log("Redis is connected successfully....");
    console.log(`Listening on port ${config.PORT}`);
  });
});
