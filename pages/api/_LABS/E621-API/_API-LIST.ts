import { NextApiRequest, NextApiResponse } from "next";

import { POST_GET } from "./posts/get";
import { POST_SEARCH } from "./posts/search";

import { TAG_GET } from "./tags/get";
import { TAG_MATCH } from "./tags/name_match";

import { POOL_GET } from "./pools/get";

import { WIKI_GET } from "./wiki/get";
import { WIKI_SEARCH_BODY } from "./wiki/search_body";
import { WIKI_SEARCH_TITLE } from "./wiki/search_title";

export const LABS_E621_API = {
  posts: {
    get: POST_GET,
    search: POST_SEARCH,
  },
  tags: {
    get: TAG_GET,
    nameMatch: TAG_MATCH,
  },
  pools: {
    get: POOL_GET,
  },
  wiki: {
    get: WIKI_GET,
    searchBody: WIKI_SEARCH_BODY,
    searchTitle: WIKI_SEARCH_TITLE,
  },
}

export default function hendler(req: NextApiRequest, res: NextApiResponse) {
  res.json([
    "這邊是那來放API調用的地方",
    "主要是因爲我每個API都有自己的格式 再加上我懶",
    "所以就有了這個文件awa",
  ])
};