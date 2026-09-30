import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  query: string;
  limit?: number;
};

type Output = E621.Tag[];

const logic = async (opt: Input): Promise<Output> => {
  const data = await E621Internal.fetch<E621.TagsResponse>(
    "/tags.json",
    {
      "search[name_matches]": `*${opt.query}*`,
      "search[order]": "count",
      limit: opt.limit || 20
    },
    opt.user
  );
  return data;
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const TAG_MATCH = useApi;
export default calcApi;