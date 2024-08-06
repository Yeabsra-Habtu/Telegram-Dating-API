import { error400 } from "../../../helpers/error";
import BoostRepository from "../repositories";

export default class BoostService {
  private readonly repo = new BoostRepository();

  public async findByPagination(page: number, limit: number) {
    // check if page and limit are valid
    if (page < 1 || limit < 1) return error400("Invalid page or limit");
    const data = await this.repo.findByPagination(page - 1, limit);
    const total = await this.repo.countByPagination();
    return { data, page, limit, total };
  }
}
