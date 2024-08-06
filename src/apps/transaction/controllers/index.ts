import { Request, Response } from "express";
import TransactionService from "../services";

export default class TransactionController {
  private readonly service = new TransactionService();

  public async findByPagination(req: Request, res: Response) {
    // get pagination from query and set default values
    const { page = "1", per_page = "10" } = req.query;

    const data = await this.service.findByPagination(
      Number(page),
      Number(per_page)
    );
    if ("data" in data) res.json(data);
    else res.status(400).json(data);
  }
}
