import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  tags: string | string[];
  limit?: number;
  page?: number | string;
};

type Output = E621.Post[];

const logic = async (opt: Input): Promise<Output> => {
  const tagString = Array.isArray(opt.tags)
    ? opt.tags.join(" ")
    : opt.tags;

  const data = await E621Internal.fetch<{ posts: E621.Post[] }>(
    "/posts.json",
    {
      tags: tagString,
      limit: opt.limit || 75,
      page: opt.page || 1
    },
    opt.user
  );
  return data.posts;
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const POST_SEARCH = useApi;
export default calcApi;