import { NextApiRequest, NextApiResponse } from "next/types";
import path from "path";
import { fileURLToPath } from "url";

export default function hendler(_: NextApiRequest, res: NextApiResponse) {
  res.json([
    "這裏就是放一些 簡單工具用的",
    "畢竟是實驗室自己開的 又不是通用的",
    "所以 會有一些自己的東西 很正常啦",
  ])
};