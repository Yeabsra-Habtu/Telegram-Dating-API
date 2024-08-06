import { Request, Response } from "express";
import { UserService } from "../services";
import { error400 } from "../../../helpers/error";
import {
  deleteFromCloudinary,
  uploadFileToCloudinary,
} from "../../../helpers/fileUpload";
import { unlinkSync } from "fs";
import multer from "multer";
import { UserModel } from "../models";
import { generateChatToken } from "../../../helpers/jwt";

export default class UserController {
  private readonly service = new UserService();

  public multerParser = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, `${__dirname}/upload/images`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedFileType = ["jpg", "jpeg", "png"];
      if (allowedFileType.includes(file.mimetype.split("/")[1])) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
  });

  public async findByPagination(req: Request, res: Response) {
    // get pagination from query and set default values
    const { page = "1", per_page = "10", search = "" } = req.query;

    const data = await this.service.findByPagination(
      Number(page),
      Number(per_page),
      search as string
    );
    if ("data" in data) res.json(data);
    else res.status(400).json(data);
  }
  public async findUserById(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const data = await this.service.findUserById(id);
      if ("_id" in data) res.json(data);
      else res.status(400).json(data);
    } else res.status(400).json(error400("id is required"));
  }

  public async findUserByIdForWithdraw(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const data = await this.service.findUserByIdForWithdraw(id);
      if ("data" in data) res.json(data);
      else res.status(400).json(data);
    } else res.status(400).json(error400("id is required"));
  }

  public async activate(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const data = await this.service.activate(id);
      if ("_id" in data) res.json(data);
      else res.status(400).json(data);
    } else res.status(400).json(error400("id is required"));
  }

  public async generateChatToken(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const token = generateChatToken(id);
      res.json({ token });
    } else res.status(400).json(error400("id is required"));
  }
  public async deactivate(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const data = await this.service.deactivate(id);
      if ("_id" in data) res.json(data);
      else res.status(400).json(data);
    } else res.status(400).json(error400("id is required"));
  }

  public async myProfile(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const data = await this.service.findUserById(id);
      if ("_id" in data) res.json(data);
      else res.status(400).json(data);
    } else res.status(400).json(error400("id is required"));
  }

  public async photoUploader(req: Request, res: Response) {
    const { id } = req.params;
    const url = await uploadFileToCloudinary(req.file!.path);
    if (!url) {
      console.log("upload to cloudinary failed");
    }
    console.log("uploaded: ", url);
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.photoUrls) {
      user.photoUrls = [];
    }

    user.photoUrls.push(url);

    await user.save();
    console.log("user photo: ", user.photoUrls);
    unlinkSync(req.file!.path);
    res.json({ success: true, photos: user.photoUrls });
  }

  public async photoDeleter(req: Request, res: Response) {
    const { id } = req.params;
    const { url } = req.params;
    const newUrl = url.split("/");
    const fileWithExtension = newUrl[newUrl.length - 1];
    const fileWithoutExtension = fileWithExtension.split(".")[0];
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const index = user.photoUrls.indexOf(url);
    if (index !== -1) {
      user.photoUrls.splice(index, 1);
      console.log("photo deleted from url array", fileWithoutExtension);
    }

    await UserModel.findByIdAndUpdate(id, {
      $set: { photoUrls: user.photoUrls },
    });

    const deletedPhoto = await deleteFromCloudinary(
      `tindu/images/${fileWithoutExtension}`
    );
    res.json({ success: true, deletedPhoto });
  }

  public async findUserDetail(req: Request, res: Response) {
    const { id } = req.params;
    if (id) {
      const data = await this.service.findUserDetail(id);
      if ("data" in data) res.json(data);
      else res.status(400).json(data);
    } else res.status(400).json(error400("id is required"));
  }

  public async answerQuestion(req: Request, res: Response) {
    const { id } = req.params;
    const { question, answer } = req.body;
    if (id) {
      const updatedUser = this.service.handleAnsweringQuestionsFromWeb(
        id,
        question,
        answer
      );
      if (await updatedUser) {
        res.json({ success: true, updatedUser });
      } else {
        res.json({ success: false });
      }
    }
  }
}
