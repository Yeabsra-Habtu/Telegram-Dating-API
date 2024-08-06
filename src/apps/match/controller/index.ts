import { Request, Response } from "express";
import { MatchModel } from "../models";
import { isValidObjectId } from "mongoose";
import { ObjectId } from "mongodb";
import MatchService from "../services";

export default class MatchController {
  private readonly service = new MatchService();

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

  public async fetchMatches(req: Request, res: Response) {
    const { id } = req.params;
    if (isValidObjectId(id))
      try {
        const matches = await MatchModel.find({
          $or: [{ liked_id: new ObjectId(id) }, { liker_id: new ObjectId(id) }],
        })
          .populate({
            path: "liked_id",
            select: "name image",
          })
          .populate({
            path: "liker_id",
            select: "name image",
          });
        res.json(matches);
      } catch (error) {
        res.status(500).json("error");
      }
  }
}
