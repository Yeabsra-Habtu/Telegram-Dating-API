import { Schema, model } from "mongoose";
import { ISetting, SettingNameEnum } from "../interfaces";

const settingSchema = new Schema<ISetting>(
  {
    name: { type: String, enum: SettingNameEnum, required: true, unique: true },
    value: { type: Number, required: true },
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

export const SettingModel = model<ISetting>("settings", settingSchema);
