import { ObjectId } from "mongodb";
import { config } from "../../../config";
import { redisClient } from "../../../connection/redis";
import { IUserInput, IRegister, IUser } from "../../user/interfaces";
import { UserModel } from "../../user/models";
import { IUserCash } from "../interfaces";
import { SettingModel } from "../../setting/models";
import { SettingNameEnum } from "../../setting/interfaces";

export default class RegisterRepository {
  private model = UserModel;
  private redis = redisClient;

  public async store(data: IUserInput) {
    const response = await this.model.create(data);
    return response.toJSON();
  }

  public async cacheRegister(chatId: number, data: IRegister) {
    await this.redis.set(
      `register_${chatId}`,
      JSON.stringify(data),
      "EX",
      172800
    );
  }

  public async getRegister(chatId: number) {
    const data = await this.redis.get(`register_${chatId}`);
    return data ? JSON.parse(data) : null;
  }

  public async deleteRegister(chatId: number) {
    await this.redis.del(`register_${chatId}`);
  }

  public async setLang(chatId: number, lang: string) {
    let data = await this.getRegister(chatId);
    data = { current: "gender", data: { ...data.data, lang } };
    await this.cacheRegister(chatId, data);
  }

  public async setGender(chatId: number, gender: string) {
    let data = await this.getRegister(chatId);
    data = { current: "city", data: { ...data.data, gender } };
    await this.cacheRegister(chatId, data);
  }

  public async setCity(chatId: number, city: string, cities: string[]) {
    let data = await this.getRegister(chatId);
    data = { current: "country", data: { ...data.data, city }, cities };
    await this.cacheRegister(chatId, data);
  }

  public async setCountry(chatId: number, city: string, country: string) {
    let data = await this.getRegister(chatId);
    data = { current: "age", data: { ...data.data, country, city } };
    await this.cacheRegister(chatId, data);
  }

  public async setAge(chatId: number, age: number) {
    let data = await this.getRegister(chatId);
    data = { current: "image", data: { ...data.data, age } };
    await this.cacheRegister(chatId, data);
  }
  public async setProfile(chatId: number, image: string) {
    let data = await this.getRegister(chatId);
    data = { current: "confirm", data: { ...data.data, image } };
    await this.cacheRegister(chatId, data);
  }
  public async createAndCacheUser(data: IUserInput) {
    const user = await this.store(data);
    await this.cache(user);
    await this.deleteRegister(data.chatId);
    return user;
  }

  public async cache(user: IUser) {
    const data: IUserCash = {
      id: String(user._id),
      free_match_count: user.free_match_count,
      is_active: user.is_active,
      coin: user.coin,
      gender: user.gender,
      ranking_class: user.ranking_class,
      search_settings: user.search_settings,
    };
    await this.redis.set(
      `user_${user.chatId}`,
      JSON.stringify(data),
      "EX",
      config.REDIS_EXPIRE
    );
  }

  public async addShareCoinToUsers(
    userId: string,
    chatId: number
  ): Promise<IUser | undefined> {
    const coin = (await SettingModel.findOne({
      name: SettingNameEnum.ShareCoin,
    }))!.value;
    await UserModel.updateMany(
      { $or: [{ _id: new ObjectId(userId) }, { chatId }] },
      { $inc: { coin } }
    );
    return (await UserModel.findById(userId))?.toJSON();
  }

  public async findByChatId(chatId: number): Promise<IUser | undefined> {
    return (await UserModel.findOne({ chatId }))?.toJSON();
  }
}
