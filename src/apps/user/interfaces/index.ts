import { IBaseInterface } from "../../../base.interface";
import { GiftEnum } from "../../bot/interfaces";
import { SubscriptionType } from "../../payment/interfaces";

export enum GenderEnum {
  male = "male",
  female = "female",
}

export enum RankEnum {
  high = "high",
  standard = "standard",
}
export enum LangEnum {
  amr = "AMH",
  orm = "ORM",
  eng = "ENG",
}
export interface Question {
  question: string;
  answer: string;
}
export interface IUserInput {
  chatId: number;
  name: string;
  age: number;
  country: string;
  city: string;
  image: string;
  gender: GenderEnum;
  language: LangEnum;
  search_settings: ISearchSetting;
  ranking_class: RankEnum;
  questions: Question[];
}

export interface ISearchSetting {
  city: string;
  country: string;
  age: {
    min: number | null;
    max: number | null;
  };
}
export interface IUser extends IUserInput, IBaseInterface {
  is_active: boolean;
  free_match_count: number;
  coin: number;
  subscription: ISubscription | null;
  boost: IBoost;
  is_online: boolean;
  last_seen: Date;
  language: LangEnum;
  search_settings: {
    city: string;
    country: string;
    age: {
      min: number;
      max: number;
    };
  };
  ranking_class: RankEnum;
  photoUrls: string[];
  questions: Question[];
}

export interface ISubscription {
  subscription_type: SubscriptionType;
  startDate: Date;
  endDate: Date;
}

export interface IBoost {
  boost_type: number;
  startDate: Date;
  endDate: Date;
}

export type CurrentKey =
  | "lang"
  | "gender"
  | "city"
  | "country"
  | "age"
  | "image"
  | "confirm";

export interface IRegister {
  current: CurrentKey;
  data: {
    age?: number;
    city?: string;
    country?: string;
    gender?: GenderEnum;
    image?: string;
    chatId?: number;
    name?: string;
    userId?: string;
    lang?: LangEnum;
  };
  cities?: string[];
}

export interface IUserResponse extends IUser {
  gift: number;
}

export interface IUserWithdrawResponse {
  data: IUser;
  minimumWithdrawableCoin: number;
  oneCoinInBirr: number;
}

export interface IUserLikeCountData {
  likes: [{ count: number }];
  dislikes: [{ count: number }];
  likers: [{ count: number }];
  dislikers: [{ count: number }];
  likeChart: { _id: { date: string }; count: number }[];
  dislikeChart: { _id: { date: string }; count: number }[];
}

export interface IUserLikeCount {
  likes: { count: number };
  dislikes: { count: number };
  likers: { count: number };
  dislikers: { count: number };
  likeChart: { date: string; count: number }[];
  dislikeChart: { date: string; count: number }[];
}

export interface IUserGiftCountData {
  [GiftEnum.flower]: [{ count: number }];
  [GiftEnum.dessert]: [{ count: number }];
  [GiftEnum.softToy]: [{ count: number }];
}

export interface IUserGiftCount {
  [GiftEnum.flower]: { count: number };
  [GiftEnum.dessert]: { count: number };
  [GiftEnum.softToy]: { count: number };
}

export interface IUserDetailResponse extends IUserLikeCount, IUserGiftCount {
  data: IUser;
}
