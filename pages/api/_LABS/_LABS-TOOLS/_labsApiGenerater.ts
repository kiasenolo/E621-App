import { NextApiRequest, NextApiResponse } from "next";

/* 
 * 這個東西是丟上去伺服器的時候才會用到
 * true  :  強制不使用proxy
 * false :  用不用proxy由參數決定
 */
export const dontUseProxy = true

export function LABS_API_GENERATER<T1, T2>(
  routePath: string,
  calc: (option: T1) => T2 | Promise<T2>
) {

  const getRoutePath = (inputPath: string) => {
    let cleanedPath = inputPath.startsWith("file://") ? inputPath.slice(7) : inputPath;
    cleanedPath = cleanedPath.replace(/\\/g, "/");
    const match = cleanedPath.match(/pages\/(.*)/);

    if (match && match[1]) {
      return "/" + match[1].replace(/\.(ts|js|tsx)$/, "");
    }
    return cleanedPath;
  }

  const apiPath = getRoutePath(routePath);

  const useApi = async (options: T1, native?: boolean) => {
    if (native || dontUseProxy) return await calc(options)

    const res = await fetch(apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options)
    })

    if (!res.ok) {
      const errJson = await res.json();
      console.error("API Error:", errJson);
      throw new Error(errJson.error || "API call failed");
    }

    const json = await res.json()
    return json as T2
  };

  const calcApi = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    if (dontUseProxy) return res.status(404).json({ "msg": "nope" });
    const _options = req.body as T1;

    if (_options) {
      const out: Awaited<T2> = await calc(_options)
      return res.json(out)
    } else {
      throw Error("EMPTY")
    }

  }

  return {
    useApi,
    calcApi,
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json([
    "聽過預製菜嗎？ 聽過對吧",
    "意思大概就是 菜先做好 之後拿出來用 對吧",
    "那你聽過預製API嗎？ 欸想不到吧 就連API也不是現做的哦",
    "好啦好像也不能這樣講 因爲這個東西是負責把框架的部分生出來",
    "額 框架是預製 只有API的處理 是現做的",
  ])
};