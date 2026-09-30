import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  id: number;
};

type Output = E621.Post | null;

const logic = async (opt: Input): Promise<Output> => {
  try {
    const data = await E621Internal.fetch<{ post: E621.Post }>(
      `/posts/${opt.id}.json`,
      {},
      opt.user
    );
    return data.post;
  } catch (e) {
    return null;
  }
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const POST_GET = useApi;
export default calcApi;