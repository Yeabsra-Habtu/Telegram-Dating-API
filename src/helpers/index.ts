import { createHmac, randomBytes } from "crypto";
import { config } from "../config";

export const convertNumToEmoji = (num: number) => {
  const data: { [key: string]: string } = {
    1: "1️⃣",
    2: "2️⃣",
    3: "3️⃣",
    4: "4️⃣",
    5: "5️⃣",
    6: "6️⃣",
    7: "7️⃣",
    8: "8️⃣",
    9: "9️⃣",
  };
  return num
    .toString()
    .split("")
    .map((i) => data[i])
    .join("");
};

export const txtRef = () => randomBytes(20).toString("hex");

export function checkTelegramInitData(data: string): number | undefined {
  // convert data to URLSearchParams which is query key value pair
  const initData = new URLSearchParams(data);
  // get hash value
  const hash = initData.get("hash");
  // sort initData
  initData.sort();
  // create validate data
  const validateData: string[] = [];
  initData.forEach(
    (value, key) => key !== "hash" && validateData.push(`${key}=${value}`)
  );
  // create secret
  const secret = createHmac("sha256", "WebAppData")
    .update(config.TELEGRAM_API_TOKEN)
    .digest();
  // create hash
  const hashData = createHmac("sha256", secret)
    .update(validateData.join("\n"))
    .digest("hex");
  // check of hash and hashData are equal
  if (hashData === hash) return JSON.parse(initData.get("user")!).id as number;
}
