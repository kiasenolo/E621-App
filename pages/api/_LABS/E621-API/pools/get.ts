import { E621 } from "../types/e621";
import { E621Internal } from "../lib/e621-core";
import { LABS_API_GENERATER } from "../../_LABS-TOOLS/_labsApiGenerater";

type Input = E621.BaseRequest & {
  id: number;
};

type Output = E621.Pool | null;

const logic = async (opt: Input): Promise<Output> => {
  try {
    const data = await E621Internal.fetch<E621.Pool>(
      `/pools/${opt.id}.json`,
      {},
      opt.user
    );
    return data;
  } catch {
    return null;
  }
};

const { useApi, calcApi } = LABS_API_GENERATER<Input, Output>(import.meta.url, logic);

export const POOL_GET = useApi;
export default calcApi;