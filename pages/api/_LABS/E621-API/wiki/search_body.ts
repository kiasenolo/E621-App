import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  body_matches: string;
  limit?: number;
  page?: number | string;
};

type Output = E621.WikiPage[];

const logic = async (opt: Input): Promise<Output> => {
  const data = await E621Internal.fetch<E621.WikiPage[]>(
    "/wiki_pages.json",
    {
      "search[body_matches]": opt.body_matches,
      limit: opt.limit ?? 20,
      page: opt.page ?? 1,
    },
    opt.user
  );
  return data;
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const WIKI_SEARCH_BODY = useApi;
export default calcApi;
