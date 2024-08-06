import { isValidObjectId } from "mongoose";
import { IError } from "../../../base.interface";
import { error400 } from "../../../helpers/error";
import {
  IUser,
  IUserDetailResponse,
  IUserInput,
  IUserResponse,
  IUserWithdrawResponse,
} from "../interfaces";
import { UserRepository } from "../repositories";
import multer from "multer";
import { UserModel } from "../models";
import { isDate } from "moment";
import { BotRepository } from "../../bot/repositories";

export class UserService {
  private static _repo = UserRepository;
  private repo = new UserRepository();

  public static async findUser(chatId: number) {
    // get user from cache
    const user = await this._repo.fetchCache(chatId);
    if (user) return user;
    else {
      // get user from database
      const data = await this._repo.findByChatId(chatId);
      if (data) this._repo.cache(data); //  cache user

      return data;
    }
  }

  public static async getRegister(chatId: number) {
    return await this._repo.getRegister(chatId);
  }

  public static async createAndCacheUser(data: IUserInput) {
    const user = await this._repo.store(data);
    await this._repo.cache(user);
    await this._repo.deleteRegister(data.chatId);
  }

  public static async startUserRegistration(chatId: number) {
    await this._repo.cacheRegister(chatId, { current: "lang", data: {} });
  }

  public static async setLang(chatId: number, lang: string) {
    let data = await this._repo.getRegister(chatId);
    data = { current: "gender", data: { ...data.data, lang } };
    await this._repo.cacheRegister(chatId, data);
  }

  public async findById(id: string) {
    //   validate id is ObjectId
    if (isValidObjectId(id)) {
      const data = await this.repo.findById(id);
      if (data) return await this.repo.findById(id);
      else return error400("User not found");
    } else return error400("Invalid id");
  }

  public static async setGender(chatId: number, gender: string) {
    let data = await this._repo.getRegister(chatId);
    data = { current: "city", data: { ...data.data, gender } };
    await this._repo.cacheRegister(chatId, data);
  }

  public static async setCity(chatId: number, city: string) {
    let data = await this._repo.getRegister(chatId);
    data = { current: "country", data: { ...data.data, city } };
    await this._repo.cacheRegister(chatId, data);
  }

  public static async setCountry(
    chatId: number,
    city: string,
    country: string
  ) {
    let data = await this._repo.getRegister(chatId);
    data = { current: "age", data: { ...data.data, country, city } };
    await this._repo.cacheRegister(chatId, data);
  }

  public static async setAge(chatId: number, age: number) {
    let data = await this._repo.getRegister(chatId);
    data = { current: "image", data: { ...data.data, age } };
    await this._repo.cacheRegister(chatId, data);
  }
  public static async setProfile(chatId: number, image: string) {
    let data = await this._repo.getRegister(chatId);
    data = { current: "confirm", data: { ...data.data, image } };
    await this._repo.cacheRegister(chatId, data);
  }

  public async findByPagination(page: number, limit: number, search: string) {
    // check if page and limit are valid
    if (page < 1 || limit < 1) return error400("Invalid page or limit");
    const data = await this.repo.findByPagination(page - 1, limit, search);
    const total = await this.repo.countByPagination(search);
    const topGift = await this.repo.topGift();
    const topVip = await this.repo.topVip();
    const topBooster = await this.repo.topBooster();
    return { data, page, limit, total, topBooster, topGift, topVip };
  }

  public async findUserById(id: string): Promise<IError | IUserResponse> {
    //   validate id is ObjectId
    if (isValidObjectId(id)) {
      const data = await this.repo.findById(id);
      if (data) {
        const gift = await this.repo.countUserGift(id);
        delete (data as any).__v;
        return { ...data, gift };
      } else return error400("User not found");
    } else return error400("Invalid id");
  }

  public async findUserByIdForWithdraw(
    id: string
  ): Promise<IError | IUserWithdrawResponse> {
    //   validate id is ObjectId
    if (isValidObjectId(id)) {
      const data = await this.repo.findById(id);
      if (data) {
        const { minimumWithdrawableCoin, oneCoinInBirr } =
          await this.repo.findSetting();
        return { data, minimumWithdrawableCoin, oneCoinInBirr };
      } else return error400("User not found");
    } else return error400("Invalid id");
  }

  public async activate(id: string): Promise<IError | IUserResponse> {
    // validate id is ObjectId
    if (isValidObjectId(id)) {
      const data = await this.repo.findById(id);
      if (data) {
        await this.repo.activate(id);
        const data = (await this.repo.findById(id))!;
        // update user cash also
        await new BotRepository().cache(data);
        const gift = await this.repo.countUserGift(id);
        delete (data as any).__v;
        return { ...data, gift };
      } else return error400("User not found");
    } else return error400("Invalid id");
  }

  public async deactivate(id: string): Promise<IError | IUserResponse> {
    // validate id is ObjectId
    if (isValidObjectId(id)) {
      const data = await this.repo.findById(id);
      if (data) {
        await this.repo.deactivate(id);
        const data = (await this.repo.findById(id))!;
        // update user cash also
        await new BotRepository().cache(data);
        const gift = await this.repo.countUserGift(id);
        delete (data as any).__v;
        return { ...data, gift };
      } else return error400("User not found");
    } else return error400("Invalid id");
  }

  public async findUserDetail(
    id: string
  ): Promise<IUserDetailResponse | IError> {
    //   validate id is ObjectId
    if (isValidObjectId(id)) {
      //   get user from database
      const data = await this.repo.findById(id);
      if (data) {
        // fetch user likes count
        const likes = await this.repo.userLikeCount(data._id);
        // fetch user gift count
        const gift = await this.repo.userGiftCount(data._id);
        return { data, ...likes, ...gift };
      } else return error400("User not found");
    } else return error400("Invalid id");
  }

  public async handleAnsweringQuestionsFromWeb(
    id: string,
    question: string,
    answer: string
  ) {
    const user = await UserModel.findById(id);

    const currentIndex = user?.questions.findIndex(
      (value) => value.question === question!
    );

    user!.questions[currentIndex!]!.answer = answer;

    const updatedUser = await UserModel.updateOne(
      { _id: id },
      { $set: { questions: user?.questions } }
    );
    if (updatedUser) {
      return updatedUser;
    }
  }
}
