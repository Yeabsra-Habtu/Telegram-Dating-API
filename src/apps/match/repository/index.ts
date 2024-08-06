import { IMatch } from "../interfaces";
import { MatchModel } from "../models";

export default class MatchRepository {
  public async findByPagination(
    page: number,
    limit: number
  ): Promise<IMatch[]> {
    return (
      await MatchModel.find()
        .populate({ path: "liker_id", select: "name age city country image" })
        .populate({ path: "liked_id", select: "name age city country image" })
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit)
    )?.map((user) => user.toJSON());
  }

  public async countByPagination(): Promise<number> {
    return await MatchModel.countDocuments();
  }
}
