import cloudinary from "cloudinary";
import { File } from "@grammyjs/types/message.js";
import { config } from "../config";
// TODO: uncomment the following code on production
// commented b/c on render build failed b/c the memory exceeded
// import { Endpoint, S3 } from "aws-sdk";
// import { readFile } from "fs/promises";
// // define digital ocean space endpoint
// const spaceEndpoint = new Endpoint(config.SPACE_ENDPOINT);
// // create an instance of AWs S3 with provided credentials
// const s3 = new S3({
//   endpoint: spaceEndpoint,
//   accessKeyId: config.SPACE_ACCESS_KEY_ID,
//   secretAccessKey: config.SPACE_SECRET_ACCESS_KEY,
// });

export async function uploadToCloudinary(photo: File) {
  const url = `https://api.telegram.org/file/bot${config.TELEGRAM_API_TOKEN}/${photo.file_path}`;
  const response = await cloudinary.v2.uploader.upload(url, {
    folder: "tindu/images",
    overwrite: true,
    resource_type: "image",
  });
  return response.secure_url;
}

export async function uploadFileToCloudinary(photo: any) {
  const response = await cloudinary.v2.uploader.upload(photo, {
    folder: "tindu/images",
    overwrite: true,
    resource_type: "image",
  });
  return response.secure_url;
}

export async function deleteFromCloudinary(photo: any) {
  const response = await cloudinary.v2.uploader.destroy(photo);
  console.log("THIS: ", response);
  return response;
}

export async function uploadToDigitalOceanSpace(
  path: string
): Promise<string | null> {
  // TODO: removing the next line on production and uncomment the code bellow
  return null;
  // try {
  //   const fileName = path.split("/").pop()!;
  //   const file = await readFile(path);
  //   const data = await s3
  //     .upload({
  //       Bucket: config.SPACE_BUCKET_NAME,
  //       Key: fileName,
  //       Body: file,
  //       ACL: "public-read",
  //     })
  //     .promise();
  //   return data.Location;
  // } catch (_) {
  //   return null;
  // }
}
