import fs from "fs";
import axios from "axios";
import { randomUUID } from "crypto";
import { File } from "@grammyjs/types/message.js";
import { config } from "../config";
import { IApiResponse } from "../base.interface";
import { error400 } from "./error";
import { IChapaApiResponse, IChapaPayment } from "../apps/payment/interfaces";
import { tmpdir } from "os";

export const fetchCountriesByCityApi = async (city: string) => {
  const response = await axios.get(
    `https://ccsapi.up.railway.app/api/v1/search-db?search=${city}`
  );
  if (response.data?.results) {
    const data: { city: string; country: string }[] = response.data.results.map(
      ({ csc }: any) => {
        const temp = csc.split(",");
        return { city: temp[0], country: temp[2] };
      }
    );
    return data;
  } else return null;
};

export const downloadImage = async (photo: File) => {
  const url = `https://api.telegram.org/file/bot${config.TELEGRAM_API_TOKEN}/${photo.file_path}`;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const dir = "upload/images";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const path = `${dir}/${randomUUID()}.${photo.file_path?.split(".").pop()}`;
  fs.writeFileSync(path, Buffer.from(buffer));
  return path;
};

export const tempDownloadImage = async (photo: File) => {
  const url = `https://api.telegram.org/file/bot${config.TELEGRAM_API_TOKEN}/${photo.file_path}`;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const dir = tmpdir();
  const path = `${dir}/${randomUUID()}.${photo.file_path?.split(".").pop()}`;
  fs.writeFileSync(path, Buffer.from(buffer));
  return path;
};

export const payWithChapaApi = async (
  data: IChapaPayment
): Promise<IApiResponse<IChapaApiResponse>> => {
  const url = "https://api.chapa.co/v1/transaction/initialize";
  return new Promise((resolve) => {
    axios
      .post(url, data, {
        headers: { Authorization: `Bearer ${config.CHAPA_AUTHORIZATION}` },
      })
      .then((response) => resolve({ data: response.data }))
      .catch((error) => {
        resolve({ error: error?.response?.data ?? error400("Network error") });
      });
  });
};
