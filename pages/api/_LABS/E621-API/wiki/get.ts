import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  title: string;
};

type Output = E621.WikiPage | null;

const logic = async (opt: Input): Promise<Output> => {
  try {
    const encoded = encodeURIComponent(opt.title.replace(/ /g, "_"));
    const data = await E621Internal.fetch<E621.WikiPage>(
      `/wiki_pages/${encoded}.json`,
      {},
      opt.user
    );
    return data;
  } catch (e) {
    return null;
  }
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const WIKI_GET = useApi;
export default calcApi;
