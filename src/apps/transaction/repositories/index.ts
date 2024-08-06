import { PaymentModel } from "../../payment/models";

export default class TransactionRepository {
  public async findByPagination(page: number, per_page: number) {
    return await PaymentModel.find(
      {},
      {
        amount: 1,
        status: 1,
        payment_method: 1,
        coin: 1,
        type: 1,
        updatedAt: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .populate({ path: "user_id", select: "name image" })
      .skip(page * per_page)
      .limit(per_page);
  }

  public async countByPagination(): Promise<number> {
    return await PaymentModel.countDocuments();
  }

  public async total(): Promise<number> {
    const data = await PaymentModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    return data.length > 0 ? data[0].total : 0;
  }
}
