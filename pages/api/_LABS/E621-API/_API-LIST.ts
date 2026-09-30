import { NextApiRequest, NextApiResponse } from "next";
import { E621Internal } from "./lib/e621-core";

export const LABS_E621_API = E621Internal.methods

export default function hendler(req: NextApiRequest, res: NextApiResponse) {
  res.json([
    "這邊是那來放API調用的地方",
    "主要是因爲我每個API都有自己的格式 再加上我懶",
    "所以就有了這個文件awa",
  ])
};