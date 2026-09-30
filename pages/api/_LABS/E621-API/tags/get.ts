import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  name: string | string[];
};

type Output = E621.Tag[];

const logic = async (opt: Input): Promise<Output> => {
  const nameString = Array.isArray(opt.name)
    ? opt.name.join(",")
    : opt.name;

  const data = await E621Internal.fetch<E621.TagsResponse>(
    "/tags.json",
    { "search[name]": nameString },
    opt.user
  );

  return data;
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const TAG_GET = useApi;
export default calcApi;