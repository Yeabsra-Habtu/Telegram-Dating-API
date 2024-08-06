import { IBoost } from "../interfaces";
import { BoostModel } from "../models";

export default class BoostRepository {
  public async findByPagination(
    page: number,
    limit: number
  ): Promise<IBoost[]> {
    return (
      await BoostModel.find()
        .populate({ path: "user_id", select: "name image" })
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit)
    )?.map((user) => user.toJSON());
  }

  public async countByPagination(): Promise<number> {
    return await BoostModel.countDocuments();
  }
}
