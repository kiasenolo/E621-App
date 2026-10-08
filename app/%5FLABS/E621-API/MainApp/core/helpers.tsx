import { _app } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import { makeQuery } from "./apiUse"
import { cloneDeep, merge } from "lodash"
import functions from "@/data/module/functions"
import React from "react"
import Fuse from "fuse.js"
import { ElectrApiType } from "../../type"
import * as e621Type from "../types/appTypes"
import * as workSpaceType from "../types/workSpaceType"
import { newEmptyAccount } from "../core/appStorage"
import langList, { langType } from "../langList/_langList"
import { GetNowTime } from "../utlis/other"
import { Cache } from "./cache"
import { E621_BASE_URL, ELECTRON_WIN_STATE, WSA, _setNowSetting, createWindow, defaultE926, nowSetting, wmRef } from "./globals"
import { toProxiedUrl } from "../ui/DesktopParts"

export const setNowSetting = (e: workSpaceType.Unit.Setting) => {
  Cache.syncSettings(e.cache)
  return _setNowSetting(merge({}, newEmptyAccount.setting, e));
}

export const t = (key: keyof langType) => {
  const list = (langList as any)[String(nowSetting.lang).replace("-", "_").toLowerCase()] ?? (langList as any).en_us

  if (list) {
    const tt = list[key] ?? key;

    return tt
  } else {
    return key.match(/\.([^.]+$)/)?.[1]
  }
};

export const ent = (key: keyof langType) => {
  const list = (langList as any).en_us

  if (list) {
    const tt = list[key] ?? key;

    return tt
  } else {
    return key.match(/\.([^.]+$)/)?.[1]
  }
};

export const getWindowTitle = (
  customData: e621Type.defaul,
  options?: { isOfflineMode?: boolean }
): string => {
  const offlineSuffix = options?.isOfflineMode ? " { OFFLINE DB }" : "";

  const tagsToStr = (arr: string[]) => arr.length === 0 ?
    undefined :
    arr.map(e => e.replace(/_/g, " ")).join(",");

  switch (customData.type) {
    case "postSearch": {
      const { searchTags } = customData.data;
      const tagsPart = searchTags.length === 0
        ? t("windowsType.postSearch.title.noTags")
        : searchTags.join(",");
      return `${t("windowsType.postSearch")} [ ${tagsPart} ]${offlineSuffix}`;
    }
    case "pool": {
      const { poolId, poolInfo, nowPage: page } = customData.data;
      if (poolInfo) {
        return `${t("windowsType.pool")} : ${poolInfo.name.replace(/_/g, " ")} [Page ${page}]${offlineSuffix}`;
      }
      if (poolId) {
        return `${t("windowsType.pool")} : ${poolId} [ Page : ${page} ]${offlineSuffix}`;
      }
      return `${t("windowsType.pool")}${offlineSuffix}${offlineSuffix}`;
    }
    case "post": {
      const { postId, cachedPost } = customData.data;
      if (cachedPost) {
        const { artist, copyright } = cachedPost.tags

        return `${t("windowsType.post")} / ${tagsToStr(artist) || tagsToStr(copyright.slice(0, 1))} - ${cachedPost.id}`;
      }
      return `${t("windowsType.post")} / ${postId}`;
    }
    case "postGetByID": {
      const { currentId } = customData.data;
      return `${t("windowsType.postGetByID")} [ ${currentId} ]`;
    }
    case "viewer": {
      return `${t("windowsType.viewer")} [ ${customData.data.id} ]`;
    }
    case "preview": {
      return `${t("windowsType.preview")} [ ${customData.data.id} ]`;
    }
    case "setting": {
      const nowPage = customData.data;
      if (nowPage === "NONE") {
        return t("windowsType.setting");
      }
      const capCat = functions.str.capitalizeWords(nowPage.categorie);
      return `${t("windowsType.setting")} / ${t(`setting.${capCat}` as any)} > ${t(`setting.${capCat}.${nowPage.pages}` as any)}`;
    }
    case "tmp": {
      return t("windowsType.tmpList");
    }
    default:
      return "";
  }
};

export const updateAllWindowTitles = () => {
  const wm = wmRef.current;
  if (!wm) return;

  wm.getWindows().forEach(winInfo => {
    const win = wm.getWindow(winInfo.id);
    if (!win?.customData) return;
    win.setTitle(getWindowTitle(win.customData));
  });
};

/* ========================================================================================= */

export const DELAY_EFFECT = (has: any, not?: any) => {
  const performance = nowSetting.performance;
  const { transition, transitionDelay } = performance;
  return (transition && transitionDelay) ? has : not;
}

/* ========================================================================================= */

export const E6BaseU = () => E621_BASE_URL ?? defaultE926
export const E6Url = {
  post: (id: number | string, urlQue?: object) => {
    return `${E6BaseU()}/posts/${id}${urlQue ? "?" : ""}${makeQuery(urlQue ?? {})}`
  },
  pool: (id: number | string) => {
    return `${E6BaseU()}/pools/${id}`
  },
  search: (searchTags: string[]) => {
    return `${E6BaseU()}/posts?${new URLSearchParams({ tags: searchTags.join(" ") }).toString()}`
  },
};

export let ChackWallpaperUse = (id?: number) => { return false }

export const SetS = {
  appState: async (
    chang: (e: workSpaceType.App) => workSpaceType.App
  ) => {
    await WSA.setAppStatus(chang(await WSA.getAppStatus()))
  },
  setting: async (
    id: string,
    chang: (e: workSpaceType.Unit.Setting) => workSpaceType.Unit.Setting
  ) => {
    const set = await WSA.userSetting(id)
    await set.set(chang(await set.get()))
  },
  usrInfo: async (
    id: string,
    chang: (e: workSpaceType.Unit.SaveInfo) => workSpaceType.Unit.SaveInfo
  ) => {
    const set = await WSA.userSaveInfo(id)
    await set.set(chang(await set.get()))
  },
  wallpaper: async (id: string, url: string, post?: E621.Post,) => {
    if (ChackWallpaperUse(post?.id)) _app.throwNewNotic(t("Notic.system.wallpaperHasBeenUse"));
    const { state } = await WSA.getUser(id)
    await WSA.setWorkspaceAppearance(
      id,
      state.nowWorkSpace,
      p => ({
        ...p,
        wallpaper: {
          url,
          fromPost: post,
          positionX: 50,
          positionY: 50,
          scale: 100,
        }
      }))
  },
  color: async (id: string, color: string,) => {
    const state = await (await WSA.userState(id)).get()
    const wsInfo = await WSA.getWorkspaceInfo(id, state.nowWorkSpace, "setting")
    await WSA.updateWorkspace(id, state.nowWorkSpace, {
      setting: {
        wallpaper: wsInfo.wallpaper,
        color: color
      }
    })
  },
  avatar: async (id: string, url: string, post?: E621.Post,) => {
    await SetS.usrInfo(id, e => {
      e.user.avatar = {
        url,
        positionX: 50,
        positionY: 50,
        fromPost: post
      }
      return e
    })
  },
}

export const acts = {
  saveToTmp: async (id: string, item: e621Type.defaul, windowId: string) => {
    await WSA.addTmpItem(id, {
      createAt: GetNowTime(),
      windowId,
      data: cloneDeep(item),
    })
  },
  open: {
    getByID: (post: E621.Post) => { },
    view: (post: E621.Post) => { },
    browser: {
      post: (id: number | string, urlQue?: object) => {
        open(E6Url.post(id, urlQue))
      },
      pool: (id: number | string) => {
        open(E6Url.pool(id))
      },
      search: (searchTags: string[]) => {
        open(E6Url.search(searchTags))
      },
    },
  },
  windows: {
    tempList: () => {
      createWindow(wmRef, {
        type: "tmp",
      })
    },
    setting: () => {
      createWindow(wmRef, {
        type: "setting",
        data: "NONE"
      })
    },
  },
  setting: {
    wallpaper: () => {
      createWindow(wmRef, {
        type: "setting",
        data: {
          categorie: "appearance",
          pages: "wallpaper"
        },
      }, {}, true)
    },
    avatar: () => {
      createWindow(wmRef, {
        type: "setting",
        data: {
          categorie: "account",
          pages: "avatar"
        },
      }, {}, true)
    },
  }
}

export type parseE621Url = (urlString: string) =>
  | { type: "post"; postId: number; searchTags?: string[] }
  | { type: "postSearch"; searchTags: string[] }
  | { type: "pool"; poolId: number }
  | { type: "poolSearch"; searchTags: string[] }
  | null;

export const parseE621Url: parseE621Url = (urlString) => {
  try {
    if (!urlString || typeof urlString !== 'string') return null;

    let formattedUrl = urlString.trim();

    if (!/^https?:\/\//i.test(formattedUrl)) {
      if (formattedUrl.startsWith('//')) {
        formattedUrl = `https:${formattedUrl}`;
      } else {
        formattedUrl = `https://${formattedUrl}`;
      }
    }

    const url = new URL(formattedUrl);

    const hostname = url.hostname.toLowerCase();
    const isAllowedHost = ['e621.net', 'e926.net'].some(
      host => hostname === host || hostname === `www.${host}`
    );

    if (!isAllowedHost) {
      return null;
    }

    const getSearchTags = (): string[] => {
      const tagsParam =
        url.searchParams.get("q") ||
        url.searchParams.get("tags") ||
        url.searchParams.get("search[name_matches]") ||
        "";

      return tagsParam
        .trim()
        .split(/\s+/)
        .filter((tag) => tag.length > 0);
    };

    const pathname = url.pathname;

    const postMatch = pathname.match(/^\/posts\/(\d+)$/);
    if (postMatch) {
      const tags = getSearchTags()
      return {
        type: "post",
        postId: parseInt(postMatch[1], 10),
        searchTags: tags.length ? tags : undefined
      };
    }

    if (pathname === "/posts" || pathname === "/posts/") {
      return {
        type: "postSearch",
        searchTags: getSearchTags()
      };
    }

    const poolMatch = pathname.match(/^\/pools\/(\d+)$/);
    if (poolMatch) {
      return {
        type: "pool",
        poolId: parseInt(poolMatch[1], 10)
      };
    }

    if (pathname === "/pools" || pathname === "/pools/") {
      return {
        type: "poolSearch",
        searchTags: getSearchTags()
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};

export const copyString = (data: string) => {
  navigator.clipboard.writeText(data)
};

export const dragItem = (e: React.DragEvent, item: e621Type.DragItemType.defaul, ext?: object) => {
  if (item.type === "text") { e.dataTransfer.setData("text/plain", item.data); return; };
  e.dataTransfer.setData(e621Type.DragItemType.appname, JSON.stringify(item));

  let url = "";

  switch (item.type) {
    case "postSearch": {
      url = E6Url.search(item.data.searchTags);
      break;
    };
    case "tag": {
      url = E6Url.search([(item.data.action === "-" ? "-" : "") + item.data.tag]);
      break;
    };

    case "post": {
      url = E6Url.post(item.data.id);
      break;
    };
    case "postId": {
      url = E6Url.post(item.data);
      break;
    };
    case "postImg": {
      url = item.data.file.url!;
      break;
    };

    case "pool": {
      url = E6Url.pool(item.data.poolId);
      break;
    };
    case "poolId": {
      url = E6Url.pool(item.data);
      break;
    };

  };

  e.dataTransfer.setData("text/uri-list", url + makeQuery(ext ?? {}))
  e.dataTransfer.setData("text/plain", url + makeQuery(ext ?? {}));
}

export const cnvFormat = {
  downloads: (post: E621.Post, addDate: number, format: string) => {
    /*
     *
     * 基本上 能加的東西 都比照 The Wolf's Stash
     * 當然 會有一些額外的東西 所以一樣的 能打斜綫來區分路徑 就是 不同資料夾
     *
     * %id%                       - 作品ID
     *
     * %artist%                   - 作者名 預設用“_”來分割
     * %artist(,)%                - 作者名 可以自定分割符 括號裏面指定分隔符
     * %artist--tag1,tag2%        - 作者名 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %artist(,)--tag1,tag2%     - 作者名 既自定了分割符 又自定了要排掉的東西
     *
     * %character%                - 角色名稱 預設用“_”來分割
     * %character(,)%             - 角色名稱 可以自定分割符 括號裏面指定分隔符
     * %character--tag1,tag2%     - 角色名稱 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %character(,)--tag1,tag2%  - 角色名稱 既自定了分割符 又自定了要排掉的東西
     *
     * %copyright%                - 版權 預設用“_”來分割
     * %copyright(,)%             - 版權 可以自定分割符 括號裏面指定分隔符
     * %copyright--tag1,tag2%     - 版權 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %copyright(,)--tag1,tag2%  - 版權 既自定了分割符 又自定了要排掉的東西
     *
     * %general%                  - 主要 預設用“_”來分割
     * %general(,)%               - 主要 可以自定分割符 括號裏面指定分隔符
     * %general--tag1,tag2%       - 主要 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %general(,)--tag1,tag2%    - 主要 既自定了分割符 又自定了要排掉的東西
     *
     * %species%                  - 物種 預設用“_”來分割
     * %species(,)%               - 物種 可以自定分割符 括號裏面指定分隔符
     * %species--tag1,tag2%       - 物種 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %species(,)--tag1,tag2%    - 物種 既自定了分割符 又自定了要排掉的東西
     *
     * %tags%                     - 所有標簽 預設用“_”來分割
     * %tags(,)%                  - 所有標簽 可以自定分割符 括號裏面指定分隔符
     * %tags--tag1,tag2%          - 所有標簽 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %tags(,)--tag1,tag2%       - 所有標簽 既自定了分割符 又自定了要排掉的東西
     *
     * %rating%                   - 分級
     * %rating(S|Q|E)%            - 分級 但用你自己定義的詞
     *
     * %score%                    - 作品評分
     * %favs%                     - 收藏數
     *
     * :HH:                       - 加入到下載隊列的時間 24小時制的小時
     * :mm:                       - 加入到下載隊列的時間 分鐘
     * :ss:                       - 加入到下載隊列的時間 秒
     * :ms:                       - 加入到下載隊列的時間 毫秒 (我相信沒人用到)
     *
     * -YY-                       - 加入到下載隊列的時間 四位數的年份
     * -yy-                       - 加入到下載隊列的時間 兩位數的年份
     * -mm-                       - 加入到下載隊列的時間 數字的月
     * -dd-                       - 加入到下載隊列的時間 日
     *
     *
     * 反正 下面先列出幾個範例
     *
     * KIASE.PIC_DB的標準格式 平臺_評級_作品ID_日期_時間
     * 笑死 這個東西其實就是從pixiv存圖用的格式改出來的
     * E621_%rating(NOR|NOR|SEX)%_%id%_-YY--mm--dd-_:HH::mm::ss:
     * 這個是沒有前綴的版本
     * %rating(NOR|NOR|SEX)%_%id%_-YY--mm--dd-_:HH::mm::ss:
     *
     * 很經典的 作者加上ID
     * 然後每次存某些東西的時候 都有個sound_warning 所以索性拔掉
     * %artist--sound_warning% - %id%
     *
     */
    const date = new Date(addDate);

    const pad = (num: number, pad?: number) => {
      return num.toString().padStart(pad ?? 2, "0");
    };

    const str = (num: number) => {
      return num.toString()
    };

    const tagReplase = (source: string, name: string, array: string[]) => {
      const filterArray = (excludeStr: string) => {
        const excludes = excludeStr.split(",").map(e => e.trim());
        return array.filter(item => !excludes.includes(item));
      };

      return source
        .replaceAll(
          new RegExp(`%${name}\\((.*?)\\)--(.*?)%`, "g"),
          (_, join: string, exclude: string) => filterArray(exclude).join(join)
        )
        .replaceAll(
          new RegExp(`%${name}--(.*?)%`, "g"),
          (_, exclude: string) => filterArray(exclude).join("_")
        )
        .replaceAll(
          new RegExp(`%${name}\\((.*?)\\)%`, "g"),
          (_, join: string) => array.join(join)
        )
        .replaceAll(`%${name}%`, array.join("_"));
    };

    const rep01 = format
      .replaceAll(":HH:", pad(date.getHours()))
      .replaceAll(":mm:", pad(date.getMinutes()))
      .replaceAll(":ss:", pad(date.getSeconds()))
      .replaceAll(":ms:", pad(date.getMilliseconds(), 3))
      .replaceAll("-YY-", str(date.getFullYear()))
      .replaceAll("-yy-", str(date.getFullYear()).slice(-2))
      .replaceAll("-mm-", pad(date.getMonth() + 1))
      .replaceAll("-dd-", pad(date.getDate()))
      .replaceAll("%id%", str(post.id))
      .replaceAll("%artist%", post.tags.artist.join("_"))
      .replaceAll("%character%", post.tags.character.join("_"))
      .replaceAll("%copyright%", post.tags.copyright.join("_"))
      .replaceAll("%general%", post.tags.general.join("_"))
      .replaceAll("%species%", post.tags.species.join("_"))
      .replaceAll("%rating%", post.rating.toUpperCase())
      .replaceAll("%score%", str(post.score.total))
      .replaceAll("%favs%", str(post.fav_count))
      .replaceAll("%tags%", [
        ...post.tags.artist,
        ...post.tags.character,
        ...post.tags.copyright,
        ...post.tags.general,
        ...post.tags.invalid,
        ...post.tags.lore,
        ...post.tags.meta,
        ...post.tags.species,
      ].join("_"))
      .replaceAll(/%rating\((.*)\|(.*)\|(.*)\)%/g, (_, s, q, e) => {
        switch (post.rating) {
          case "s": return s
          case "q": return q
          case "e": return e
        }
      });

    const allTags = [
      ...post.tags.artist,
      ...post.tags.character,
      ...post.tags.copyright,
      ...post.tags.general,
      ...post.tags.invalid,
      ...post.tags.lore,
      ...post.tags.meta,
      ...post.tags.species,
    ];

    const rep02 = tagReplase(rep01, "artist", post.tags.artist);
    const rep03 = tagReplase(rep02, "character", post.tags.character);
    const rep04 = tagReplase(rep03, "copyright", post.tags.copyright);
    const rep05 = tagReplase(rep04, "general", post.tags.general);
    const rep06 = tagReplase(rep05, "species", post.tags.species);
    const rep07 = tagReplase(rep06, "tags", allTags);

    return rep07
  },
  clock: (_date: number, format: string) => {
    /*
     * :hh: - 12小時制的小時
     * :HH: - 24小時制的小時
     * :mm: - 分鐘
     * :ss: - 秒
     *
     * -YY- - 四位數的年份
     * -yy- - 兩位數的年份
     * -MM- - 月
     * -mm- - 數字的月
     * -dd- - 日
     */
    const date = new Date(_date);

    const pad = (num: number) => {
      return num.toString().padStart(2, "0");
    };

    const str = (num: number) => {
      return num.toString()
    };

    const rep01 = format
      .replaceAll(":HH:", pad(date.getHours()))
      .replaceAll(":mm:", pad(date.getMinutes()))
      .replaceAll(":ss:", pad(date.getSeconds()))
      .replaceAll("-YY-", str(date.getFullYear()))
      .replaceAll("-yy-", str(date.getFullYear()).slice(-2))
      .replaceAll("-MM-", [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
      ][date.getMonth()])
      .replaceAll("-mm-", pad(date.getMonth() + 1))
      .replaceAll("-dd-", pad(date.getDate()))

    return rep01
  },
}

export const SEARCH_HISTORY_LIMIT = 100;

export const tools = {
  /** 依查詢詞相關性排序（精確 > 前綴 > 包含 > 其餘），同分再比 post_count */
  sortTagsByRelevance: (tags: E621.Tag[], query: string): E621.Tag[] => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    const rank = (name: string) => {
      const n = name.toLowerCase();
      if (n === q) return 0;
      if (n.startsWith(q)) return 1;
      if (n.includes(q)) return 2;
      return 3;
    };
    return [...tags].sort((a, b) => {
      const ra = rank(a.name);
      const rb = rank(b.name);
      if (ra !== rb) return ra - rb;
      return b.post_count - a.post_count;
    });
  },
  /** 依相關性過濾／排列搜尋紀錄；空查詢時回傳原順序（新→舊） */
  sortHistoryByRelevance: (history: string[], query: string): string[] => {
    const q = query.trim();
    if (!q) return history;
    const fuse = new Fuse(history, {
      includeScore: true,
      threshold: 0.4,
    });
    const fuzzy = fuse.search(q).map(e => e.item);
    if (fuzzy.length > 0) return fuzzy;
    const lower = q.toLowerCase();
    return history.filter(h => h.toLowerCase().includes(lower));
  },
  /** 取輸入中正在編輯的最後一個 token（去掉 -/~ 前綴） */
  getSuggestToken: (tags: string[]): { raw: string; query: string } => {
    const raw = tags.length > 0 ? (tags[tags.length - 1] ?? "") : "";
    const query = raw.replace(/^[-~]+/, "");
    return { raw, query };
  },
  applyFiltersAndSort: (currentPosts: E621.Post[], searchFilter?: e621Type.window.dataType.searchFilter) => {
    let result = [...currentPosts];
    if (!searchFilter) return result;

    const { s, q, e } = searchFilter.rating ?? {};
    if (s || q || e) {
      result = result.filter(post => {
        if (post.rating === "s") return s;
        if (post.rating === "q") return q;
        if (post.rating === "e") return e;
        return false;
      });
    }

    const { vid, gif, pic } = searchFilter.type ?? {};
    if (vid || gif || pic) {
      result = result.filter(post => {
        const ext = post.file.ext;
        if (vid && (ext === "webm" || ext === "mp4")) return true;
        if (gif && ext === "gif") return true;
        if (pic && (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp")) return true;
        return false;
      });
    }

    if (searchFilter.sortBy) {
      result.sort((a, b) => {
        switch (searchFilter.sortBy) {
          case "score": return b.score.total - a.score.total;
          case "favs": return b.fav_count - a.fav_count;
          case "size": return b.file.size - a.file.size;
          case "newest":
          default: return b.id - a.id;
        }
      });
    }

    if (searchFilter.reverse) {
      result.reverse();
    }

    return result;
  },
  convertToPng: async function (blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) resolve(pngBlob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for conversion"));
      };

      img.src = url;
    });
  },
  downloadMedia: async function (url: string, filename: string) {
    try {
      const proxiedUrl = toProxiedUrl(url);
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      _app.throwNewNotic(t("Notic.Downloading.err"));
    }
  },
}

/* ========================================================================================= */

export const debugMenu = (tf: typeof t): ElectrApiType.MenuItemSpec => ({
  label: tf("ELECTRON.menu.Debug"),
  submenu: [
    {
      label: tf("ELECTRON.menu.Debug.devTool"),
      role: 'toggleDevTools',
    },

    {
      label: tf("ELECTRON.menu.Debug.kiasole"),
      id: "debug.kiasole"
    },
    {
      type: "separator",
    },
    {
      label: tf("ELECTRON.menu.Debug.clearConsole"),
      id: "debug.clearConsole",
    },
    {
      label: tf("ELECTRON.menu.Debug.remountApp"),
      id: "debug.remount",
    },
  ]
})

export const otherMenu = (tf: typeof t): ElectrApiType.MenuItemSpec[] => {
  const appInfo = ELECTRON_WIN_STATE
  return [
    {
      label: tf("ELECTRON.menu.App"),
      submenu: ([
        ['MINI', tf("ELECTRON.menu.App.MINI")],
        (
          appInfo.isMaximized ?
            ['RSTR', tf("ELECTRON.menu.App.RSTR")] :
            ['MAXI', tf("ELECTRON.menu.App.MAXI")]
        ),
        ['HIDE', tf("ELECTRON.menu.App.HIDE")],
        "CLIP",
        ['CLOSE', tf("ELECTRON.menu.App.CLOSE")],
        ['KILL', tf("ELECTRON.menu.App.KILL")],
      ] as ([string, string] | "CLIP")[]).map(b =>
      (typeof b === "string" ?
        { type: "separator" }
        :
        {
          label: b[1],
          id: "appWin.act." + b[0]
        })
      )
    },
    {
      label: tf("ELECTRON.menu.Edit"),
      submenu: [
        {
          label: tf("ELECTRON.menu.Edit.Undo"),
          role: 'undo'
        },
        {
          label: tf("ELECTRON.menu.Edit.Redo"),
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: tf("ELECTRON.menu.Edit.Cut"),
          role: 'cut'
        },
        {
          label: tf("ELECTRON.menu.Edit.Copy"),
          role: 'copy'
        },
        {
          label: tf("ELECTRON.menu.Edit.Paste"),
          role: 'paste'
        },
        {
          label: tf("ELECTRON.menu.Edit.Delete"),
          role: 'delete'
        },
        { type: 'separator' },
        {
          label: tf("ELECTRON.menu.Edit.SelectAll"),
          role: 'selectAll'
        }
      ]
    }
  ]
}

/* ========================================================================================= */


export const setChackWallpaperUse = (fn: typeof ChackWallpaperUse) => { ChackWallpaperUse = fn }
