import { Schema, model } from "mongoose";
import { ISuggestion } from "../interfaces";

const suggestionSchema = new Schema<ISuggestion>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
    suggested_user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    liked: { type: Boolean, default: null },
    liked_back: { type: Boolean, default: null },
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

export const SuggestionModel = model<ISuggestion>(
  "suggestions",
  suggestionSchema
);
