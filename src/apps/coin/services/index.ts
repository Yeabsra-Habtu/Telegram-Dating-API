import { ObjectId } from "mongodb";
import { bot } from "../../bot";
import { RankEnum } from "../../user/interfaces";
import { UserRepository } from "../../user/repositories";
import { CoinRepository } from "../repositories";
import { error400 } from "../../../helpers/error";

export class CoinTransactionService {
  private static repo = CoinRepository;
  private static userRepo = UserRepository;
  private readonly _repo = new CoinRepository();

  public static async updateUserRank() {
    // get total spent last month for users
    const transactions = await this.repo.getTotalSpentLastMonth();
    // get ranking amount
    const rankingAmount = await this.repo.rankingCoin();
    const updatedUsers: ObjectId[] = [];
    const promiseAwait = [];
    if (transactions) {
      for (const transaction of transactions) {
        const rank =
          transaction.totalSpent >= rankingAmount
            ? RankEnum.high
            : RankEnum.standard;
        promiseAwait.push(
          this.userRepo.updateUserRankClass(transaction._id, rank)
        );
        updatedUsers.push(transaction._id);
      }
      await Promise.all(promiseAwait);
    }
    // update all users not inside inside updatedUsers
    await this.userRepo.updateUserRank(updatedUsers);
    console.log("User Rank Updated");
  }

  public static async notifyUser() {
    // fetch all users which have last seen before 3 days ago
    const users = await CoinRepository.fetchUserNotActiveForTheLast3Days();
    // get each user last liker
    const usersWithLastLikes = await Promise.all(
      users.map(async (user) => {
        const lastLike = await CoinRepository.fetchUserLastLiker(user._id);
        return { user, lastLike };
      })
    );
    // if user has last liker, send notification to that user else send notification that he/she is not active on the site lately
    await Promise.all(
      usersWithLastLikes.map(async (userWithLastLike) => {
        if (userWithLastLike.lastLike) {
          await bot.api.sendPhoto(
            userWithLastLike.user.chatId,
            userWithLastLike.lastLike.suggested_user_id.image
          );
        } else {
          await bot.api.sendMessage(
            userWithLastLike.user.chatId,
            "Your perfect match might be waiting! Check who's interested in you and see if it's meant to be"
          );
        }
      })
    );

    console.log("User notified");
  }

  // public static async incrementVipPerMonthCoin(userId: ObjectId) {
  //   // fetch all users which have active vip
  //   const users =>
  //   await this.repo.incrementVipPerMonthCoin(userId);
  // }

  public async findByPagination(page: number, limit: number) {
    // check if page and limit are valid
    if (page < 1 || limit < 1) return error400("Invalid page or limit");
    const data = await this._repo.findByPagination(page - 1, limit);
    const total = await this._repo.countByPagination();
    return { data, page, limit, total };
  }
}
