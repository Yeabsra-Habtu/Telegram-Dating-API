import { IReferral } from "../interfaces";
import { ReferralModel } from "../models";

export default class ReferralRepository {
  public async findByPagination(
    page: number,
    limit: number
  ): Promise<IReferral[]> {
    return (
      await ReferralModel.find()
        .populate({ path: "sender", select: "name image" })
        .populate({ path: "receiver", select: "name image" })
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit)
    )?.map((referral) => referral.toJSON());
  }

  public async countByPagination(): Promise<number> {
    return await ReferralModel.countDocuments();
  }
}
