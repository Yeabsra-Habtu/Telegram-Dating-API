import mongoose from "mongoose";
import { config } from "../config";

const connectDb = async () => {
  try {
    mongoose.set("strictQuery", false);
    const mongoDbConnection = await mongoose.connect(`${config.DATABASE_URL}`, {
      retryReads: true,
      retryWrites: true,
    });
    if (mongoDbConnection.connection.readyState === 1) {
      console.log("DB connected successfully....");
    } else {
      console.log("DB connection failed");
    }
  } catch (error: any) {
    console.error("DB connection failed", error);
  }
};

export { connectDb };
