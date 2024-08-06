import { type Methods, type RawApi } from "grammy/out/core/client";
import { type Other as OtherApi } from "grammy/out/core/api";
import {
  GenderEnum,
  ISearchSetting,
  ISubscription,
  RankEnum,
} from "../../user/interfaces";

export type Other<
  M extends Methods<RawApi>,
  X extends string = never
> = OtherApi<RawApi, M, X>;

export enum CurrentActionEnum {
  register = "register",
  matchSuggested = "matchSuggested",
  sendGift = "sendGift",
  likeList = "likeList",
  suggestion = "suggestion",
  changingName = "changingName",
  changingAge = "changingAge",
  changingLocation = "changingLocation",
  changingProfilePicture = "changingProfilePicture",
  changingLang = "changingLang",
  none = "none",
  updateAgeRange = "updateAgeRange",
  updateLocation = "updateLocation",
  updateSearchSetting = "updateSearchSetting",
  updateCountry = "updateCountry",
  answeringQuestion = "answeringQuestion",
}

export enum GiftEnum {
  flower = "flower",
  dessert = "dessert",
  softToy = "softToy",
}

export interface IUserCash {
  id: string;
  search_settings: ISearchSetting;
  ranking_class: RankEnum;
  free_match_count: number;
  is_active: boolean;
  coin: number;
  gender: GenderEnum;
  action?: CurrentActionEnum;
  gift?: GiftEnum;
  likePage?: number;
  likeTotalPage?: number;
  subscription?: ISubscription;
  suggestionId?: string;
  cities?: [string];
  dislike?: number;
  question?: string;
  questionIndex?: number;
}
