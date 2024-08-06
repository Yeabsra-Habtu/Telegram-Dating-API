import { Schema, model } from "mongoose";
import { GenderEnum, IUser, LangEnum, Question, RankEnum } from "../interfaces";
import { SubscriptionType } from "../../payment/interfaces";

const questionSchema = {
  question: { type: String, required: false },
  answer: { type: String, required: false },
};
const userSchema = new Schema<IUser>(
  {
    chatId: { type: Number, required: true, unique: true },
    age: { type: Number, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    image: { type: String, required: true },
    name: { type: String, required: true },
    gender: { type: String, required: true, enum: GenderEnum },
    is_active: { type: Boolean, required: true, default: true },
    free_match_count: { type: Number, required: true, default: 10 },
    coin: { type: Number, required: true, default: 400 },
    language: { type: String, enum: LangEnum, required: false },
    subscription: {
      type: {
        subscription_type: {
          type: String,
          required: true,
          enum: SubscriptionType,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
      },
      required: false,
      default: null,
      _id: false,
    },
    boost: {
      type: {
        boost_type: { type: Number, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
      },
      required: false,
      default: null,
      _id: false,
    },
    is_online: { type: Boolean, required: true, default: false },
    last_seen: { type: Date, required: true, default: new Date() },
    search_settings: {
      type: {
        city: { type: String },
        country: { type: String },
        age: {
          min: { type: Number },
          max: { type: Number },
        },
      },
      required: false,
      default: null,
      _id: false,
    },
    ranking_class: {
      type: String,
      enum: RankEnum,
      required: true,
      default: RankEnum.standard,
    },
    photoUrls: { type: [String], required: false, default: [] },
    questions: {
      type: [questionSchema],
      required: false,
      default: [],
      _id: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret, __) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const UserModel = model<IUser>("users", userSchema);
