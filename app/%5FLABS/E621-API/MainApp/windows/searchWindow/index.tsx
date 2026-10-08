import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import style from "./style.module.scss"
import { Kiasole } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import { cloneDeep } from "lodash"
import functions from "@/data/module/functions"
import React from "react"
import clsx from "clsx/lite"
import * as e621Type from "../../types/appTypes"
import * as WSAction from "../../core/appStorage"
import { E621_DB, MenuButtonType, OFFLINE_MODE, PostsCache, StopEvent, WSA, apiCore, createWindow, disableWindowKeyEvent, nowSetting, usrIndx, wmRef } from "../../core/globals"
import { DELAY_EFFECT, SEARCH_HISTORY_LIMIT, acts, getWindowTitle, t, tools } from "../../core/helpers"
import { MenuAction } from "../../core/menuAction"
import { menuBtn } from "../../core/menuButtons"
import { Components } from "../../ui/Components"
import { NODATA } from "../../ui/NoData"
import { WINDOW_FRAME, windowAction } from "../../ui/WindowFrame"
import { windowsType } from "../windowsType"

export namespace searchWindow {

  const JumpToPageOverlay = ({
    jupToPage,
    jupPage,
    setJupPage,
    setJupToPage,
    setPage
  }: {
    jupToPage: boolean,
    jupPage: number,
    setJupPage: (p: number) => void,
    setJupToPage: (b: boolean) => void,
    setPage: (p: number | ((prev: number) => number)) => void
  }) => {
    const touchAreaRef = useRef<HTMLDivElement>(null);
    const backButtonRef = useRef<HTMLButtonElement>(null);
    const backLineRef = useRef<HTMLDivElement>(null);
    const applyButtonRef = useRef<HTMLButtonElement>(null);
    const applyLineRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const offset = 200

      let startPointX = 0
      let x = 0

      const touchArea = touchAreaRef.current
      const backButton = backButtonRef.current
      const backLine = backLineRef.current
      const applyButton = applyButtonRef.current
      const applyLine = applyLineRef.current

      const isLoad = touchArea && backButton && backLine && applyButton && applyLine

      if (!isLoad) return;
      if (!jupToPage) return;

      const onTouchStart = (e: TouchEvent) => {
        startPointX = e.touches[0].clientX
      }

      const onTouchMove = (e: TouchEvent) => {
        x = startPointX - e.touches[0].clientX

        const _x = x / 7

        if (x > 0) {
          applyButton.style.transform = ""
          applyLine.style.transform = ""

          backButton.style.transform = `translateX(-${_x}px)`
          backLine.style.transform = `translateX(-${_x}px)`
        } else {
          backButton.style.transform = ""
          backLine.style.transform = ""

          applyButton.style.transform = `translateX(${Math.abs(_x)}px)`
          applyLine.style.transform = `translateX(${_x}px)`
        }

        if (x > offset) {
          applyButton.style.opacity = ""
          applyLine.style.opacity = ""
          backButton.style.opacity = ".5"
          backLine.style.opacity = ".5"
        } else if (x < -offset) {
          backButton.style.opacity = ""
          backLine.style.opacity = ""
          applyButton.style.opacity = ".5"
          applyLine.style.opacity = ".5"
        } else {
          backButton.style.opacity = ""
          backLine.style.opacity = ""
          applyButton.style.opacity = ""
          applyLine.style.opacity = ""
        }

      }

      const onTouchEnd = (e: TouchEvent) => {
        startPointX = 0

        if (x > offset) {
          setJupToPage(false)
          backButton.click()
        } else if (x < -offset) {
          setJupToPage(false)
          applyButton.click()
        }

        backButton.style.transform = ""
        backLine.style.transform = ""
        applyButton.style.transform = ""
        applyLine.style.transform = ""
        backButton.style.opacity = ""
        backLine.style.opacity = ""
        applyButton.style.opacity = ""
        applyLine.style.opacity = ""
      }

      touchArea.addEventListener("touchstart", onTouchStart)
      touchArea.addEventListener("touchmove", onTouchMove)
      touchArea.addEventListener("touchend", onTouchEnd)

      return () => {
        touchArea.removeEventListener("touchstart", onTouchStart)
        touchArea.removeEventListener("touchmove", onTouchMove)
        touchArea.removeEventListener("touchend", onTouchEnd)
      }

    }, [jupToPage, jupPage, setJupToPage, setPage]);

    useEffect(() => {
      const input = inputRef.current
      if (!input) return;
      if (jupToPage) input.focus();
      else input.blur()
    }, [jupToPage]);

    return (
      <div ref={touchAreaRef} className={clsx(style["JumpToPage"], jupToPage && style["show"])}>
        <div className={style["Inner"]}>
          <div className={style["Back"]}>
            <button ref={backButtonRef} onClick={() => setJupToPage(false)}>{t("windowsType.postSearch.jumpToPage.Cancel")}</button>
          </div>
          <div className={clsx(style["line"], style["top"])}><div ref={backLineRef} /></div>
          <div className={style["Input"]}>
            {t("windowsType.postSearch.jumpToPage")}
            <input
              ref={inputRef}
              type="number"
              value={jupPage}
              onChange={(e) => setJupPage(+e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(~~(jupPage > 0 ? jupPage : 1));
                  setJupToPage(false);
                }
              }}
            />
          </div>
          <div className={clsx(style["line"], style["bottom"])}><div ref={applyLineRef} /></div>
          <div className={style["Apply"]}>
            <button ref={applyButtonRef} onClick={() => {
              setPage(~~(jupPage > 0 ? jupPage : 1));
              setJupToPage(false);
            }}>{t("windowsType.postSearch.jumpToPage.Apply")}</button>
          </div>
        </div>
      </div>
    );
  };

  export const UnifiedPostBrowser = ({ id, mode }: { id: string, mode: "postSearch" | "pool" }) => {
    const POSTS_PER_DISPLAY_PAGE = 75;
    const DISPLAY_PAGES_PER_FETCH = 4;

    const toApiPage = (dp: number) => Math.ceil(dp / DISPLAY_PAGES_PER_FETCH);
    const toSliceIdx = (dp: number) => (dp - 1) % DISPLAY_PAGES_PER_FETCH;

    const windowID = mode === "postSearch" ? `post_search-${id}` : `pool-${id}`;
    const thisWindow = wmRef.current?.getWindow(windowID)!;

    const savedData = thisWindow?.customData?.type === mode ? thisWindow.customData.data : undefined;

    const [page, setPage] = useState<number>(savedData?.nowPage ?? 1);
    const [postsCache, setPostsCache] = useState<PostsCache>(savedData?.pageCache ?? {});
    const postsCacheRef = useRef<PostsCache>(postsCache);
    const [jupToPage, setJupToPage] = useState<boolean>(false);
    const [jupPage, setJupPage] = useState<number>(1);
    const [isFocuOnIt, setFocuOnIt] = useState<boolean>(false);

    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

    const [searchTags, setSearchTags] = useState<string[]>(mode === "postSearch" ? ((savedData as e621Type.window.dataType.postSearch)?.searchTags ?? ["yonkagor", "webm"]) : []);
    const [searchTagsInput, setSearchTagsInput] = useState<string[]>(searchTags);
    const [searchFilter, setSearchFilter] = useState<e621Type.window.dataType.searchFilter>(savedData?.searchFilter ?? nowSetting.search.defaultSearchFilter);
    const [filterPanel, setFilterPanel] = useState<boolean>(false);

    /* 搜尋紀錄 / 自動選字 —— UI 自行接這些 state */
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [historySuggestions, setHistorySuggestions] = useState<string[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<E621.Tag[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [suggestToken, setSuggestToken] = useState("");

    const [poolIdInput, setPoolIdInput] = useState<string | number>(mode === "pool" ? ((savedData as e621Type.window.dataType.pool)?.poolId || id || "") : "");
    const [poolId, setPoolId] = useState<number>(mode === "pool" ? ((savedData as e621Type.window.dataType.pool)?.poolId || Number(id) || 0) : 0);
    const [poolInfo, setPoolInfo] = useState<E621.Pool | undefined>(mode === "pool" ? (savedData as e621Type.window.dataType.pool)?.poolInfo : undefined);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [fetchId, setFetchId] = useState<number>(0);
    const fetchIdRef = useRef<number>(0);
    fetchIdRef.current = fetchId;
    const fetchingPages = useRef<Set<string>>(new Set());
    const fetchQueueRef = useRef<Promise<void>>(Promise.resolve());
    const scrollPage = useRef<HTMLDivElement>(null);
    const touchAreaRef = useRef<HTMLDivElement>(null);

    const currentPosts = useMemo(() => postsCache[page] || [], [postsCache, page]);
    const processedPosts = useMemo(() => tools.applyFiltersAndSort(currentPosts, searchFilter), [currentPosts, searchFilter]);

    const currentCustomData = useMemo<e621Type.defaul>(() => {
      if (mode === "postSearch") {
        return {
          type: "postSearch",
          data: {
            nowPage: page,
            pageCache: postsCache,
            searchTags: searchTags,
            searchFilter: searchFilter,
          }
        };
      } else {
        return {
          type: "pool",
          data: {
            poolId: poolId,
            poolInfo: poolInfo,
            nowPage: page,
            pageCache: postsCache,
            searchFilter: searchFilter,
          }
        };
      }
    }, [mode, page, postsCache, searchTags, searchFilter, poolId, poolInfo]);

    const peekPreRef = useRef<E621.Post | undefined>(undefined);
    const processedPostsRef = useRef(processedPosts);
    processedPostsRef.current = processedPosts;

    const listContextRef = useRef({
      id,
      mode,
      page,
      postsCache,
      searchTags,
      searchFilter,
      poolId,
      poolInfo,
      windowID,
      thisWindow,
    });
    listContextRef.current = {
      id,
      mode,
      page,
      postsCache,
      searchTags,
      searchFilter,
      poolId,
      poolInfo,
      windowID,
      thisWindow,
    };

    const cardEvent = useMemo(() => ({
      mouseMove(p: E621.Post) {
        peekPreRef.current = p;
      },
      mouseLeave() {
        peekPreRef.current = undefined;
      },
    }), []);

    const searchQuery = mode === "postSearch" ? searchTags.join(" ") : `pool:${poolId}`;

    const handleCardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
      const postId = Number(event.currentTarget.dataset.postId);
      const post = processedPostsRef.current.find(p => p.id === postId);
      if (!post) return;

      const ctx = listContextRef.current;
      const winID = `post-${ctx.id}`;
      const children = <windowsType.post key={post.id} id={ctx.id} />;
      const customData: e621Type.window.post = {
        type: "post",
        data: {
          postId: post.id, cachedPost: post,
          parentData: {
            windowID: ctx.windowID,
            title: ctx.thisWindow?.title!,
            componentType: ctx.mode,
            rect: ctx.thisWindow?.rect!,
            customData:
              ctx.mode === "postSearch" ? {
                type: ctx.mode,
                data: {
                  nowPage: ctx.page,
                  pageCache: ctx.postsCache,
                  searchTags: ctx.searchTags,
                  searchFilter: ctx.searchFilter,
                }
              } :
                {
                  type: ctx.mode,
                  data: {
                    poolId: ctx.poolId,
                    poolInfo: ctx.poolInfo,
                    nowPage: ctx.page,
                    pageCache: ctx.postsCache,
                    searchFilter: ctx.searchFilter,
                  }
                } as any
          }
        }
      }
      if (!wmRef.current?.hasWindowID(winID)) {
        wmRef.current?.createWindow({ id: winID, children, customData })
      } else {
        wmRef.current.updateWindow(winID, { children, customData });
        wmRef.current.bringToFront(winID);
      }
    }, []);

    useEffect(() => {
      if (mode === "pool" && poolId !== 0 && (!poolInfo || poolInfo.id !== poolId)) {
        if (OFFLINE_MODE) {
          return;
        }

        apiCore.methods.pools.get({ id: poolId }).then(info => {
          if (info) {
            setPoolInfo(info as any);
            if (nowSetting.cache.enable.pool && nowSetting.cache.enable.global) {
              E621_DB?.savePool(info as any).catch(err =>
                console.error(`[E621_DB] savePool 失敗：` + err)
              );
            }
          }
        }).catch(err => console.error(`Pool Info Fetch Error: ${err}`));
      }
    }, [poolId, mode]);

    useEffect(() => {
      postsCacheRef.current = postsCache;
    }, [postsCache]);

    useEffect(() => {
      if (mode !== "postSearch") return;

      let cancelled = false;
      (async () => {
        try {
          const hist = await WSA.userHistory(usrIndx, "search");
          const list = (await hist.get()) as string[];
          if (!cancelled) setSearchHistory(Array.isArray(list) ? list : []);
        } catch (err) {
          console.error(`[searchHistory] load failed:`, err);
        }
      })();

      const onHist = (e: WSAction.WorkSpaceEventMap["user:historySet"]) => {
        if (e.detail.userId === usrIndx && e.detail.key === "search") {
          setSearchHistory(Array.isArray(e.detail.value) ? e.detail.value as string[] : []);
        }
      };
      WSA.addEventListener("user:historySet", onHist);
      return () => {
        cancelled = true;
        WSA.removeEventListener("user:historySet", onHist);
      };
    }, [mode]);

    useEffect(() => {
      if (mode !== "postSearch") {
        setHistorySuggestions([]);
        setTagSuggestions([]);
        setSuggestToken("");
        setSuggestLoading(false);
        return;
      }

      const fullQuery = searchTagsInput.join(" ").trim();
      setHistorySuggestions(tools.sortHistoryByRelevance(searchHistory, fullQuery));

      const { query } = tools.getSuggestToken(searchTagsInput);
      setSuggestToken(query);

      if (!query || query.includes(":") || OFFLINE_MODE) {
        setTagSuggestions([]);
        setSuggestLoading(false);
        return;
      }

      let cancelled = false;
      setSuggestLoading(true);
      const timer = setTimeout(async () => {
        try {
          const tags = await apiCore.methods.tags.nameMatch({
            query,
            limit: 20,
          });
          if (!cancelled) setTagSuggestions(tools.sortTagsByRelevance(tags, query));
        } catch (err) {
          console.error(`[tagSuggestions] fetch failed:`, err);
          if (!cancelled) setTagSuggestions([]);
        } finally {
          if (!cancelled) setSuggestLoading(false);
        }
      }, 250);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [mode, searchTagsInput, searchHistory]);

    const fetchPageData = useCallback(async (targetPage: number, currentFetchId: number) => {
      if (mode === "pool" && !poolId) return false;

      if (postsCacheRef.current[targetPage] !== undefined) return false;

      const apiPage = toApiPage(targetPage);

      const firstDp = (apiPage - 1) * DISPLAY_PAGES_PER_FETCH + 1;
      const coveredDps = Array.from(
        { length: DISPLAY_PAGES_PER_FETCH },
        (_, i) => firstDp + i
      );

      const allCached = coveredDps.every(dp => !!postsCacheRef.current[dp]);
      if (allCached) return false;

      const pageKey = `${currentFetchId}-api${apiPage}`;
      if (fetchingPages.current.has(pageKey)) return false;
      fetchingPages.current.add(pageKey);

      const task = async () => {
        try {
          if (currentFetchId !== fetchIdRef.current) return;

          const tagsQuery = mode === "postSearch" ? searchTags : [`pool:${poolId}`];
          Kiasole.log(`[預取] API 第 ${apiPage} 頁 → 顯示頁 ${coveredDps.join(",")}`);

          let newPosts: E621.Post[] = [];
          let usedOffline = OFFLINE_MODE;

          try {
            if (OFFLINE_MODE) {
              throw new Error("目前處於 OFFLINE_MODE，跳過 API 請求。");
            }

            newPosts = await apiCore.methods.posts.search({
              tags: tagsQuery,
              page: apiPage,
              limit: 300,
            });

            if (currentFetchId === fetchIdRef.current) {
              const shouldSaveCache = mode === "pool"
                ? (nowSetting.cache.enable.pool && nowSetting.cache.enable.global)
                : (nowSetting.cache.enable.post.data && nowSetting.cache.enable.global);

              if (shouldSaveCache) {
                E621_DB?.savePosts(newPosts).catch(err => console.error(`[E621_DB] savePosts 失敗：` + err));
              }
            }
          } catch (apiErr) {
            Kiasole.warn(`API 抓取略過或失敗，嘗試從本地資料庫讀取：${apiErr}`);
            usedOffline = true;

            if (mode === "pool" && poolId) {
              const cachedPosts = await E621_DB?.getPostsInPool(poolId);
              if (cachedPosts) {
                const startIndex = (apiPage - 1) * 300;
                newPosts = cachedPosts.slice(startIndex, startIndex + 300);
              }
            } else {
              newPosts = await E621_DB?.searchPostsLocal(searchTags, apiPage, 300) || [];
            }

            if (newPosts.length === 0) {
              throw new Error(OFFLINE_MODE ? "離線模式且本地資料庫無相關快取。" : "無法連線至 E621，且本地資料庫無相關快取。");
            }
          }

          if (currentFetchId !== fetchIdRef.current) return;

          setIsOfflineMode(usedOffline);

          setPostsCache(prev => {
            const next = { ...prev };
            coveredDps.forEach((dp, i) => {
              next[dp] = newPosts.slice(
                i * POSTS_PER_DISPLAY_PAGE,
                (i + 1) * POSTS_PER_DISPLAY_PAGE
              );
            });
            postsCacheRef.current = next;
            return next;
          });

          setFetchError(null);
        } catch (err) {
          console.error(`第 ${apiPage} 頁抓取失敗 (線上/離線皆失敗)：` + err);
          setFetchError(String(err));
        } finally {
          fetchingPages.current.delete(pageKey);
        }
      };

      fetchQueueRef.current = fetchQueueRef.current.then(task);
      await fetchQueueRef.current;
      return true;
    }, [mode, poolId, searchTags]);

    useEffect(() => {
      let isCancelled = false;
      const currentFetchId = fetchId;

      const loadData = async () => {
        const targetPages = [page, page + 1, page - 1, page + 2, page - 2].filter(p => p > 0);
        for (const p of targetPages) {
          if (isCancelled) break;
          const fetched = await fetchPageData(p, currentFetchId);
          if (fetched) await functions.timeSleep(mode === "postSearch" ? 1000 : 500);
        }
      };
      loadData();
      return () => { isCancelled = true; };
    }, [page, searchTags, poolId, fetchId, fetchPageData]);

    useEffect(() => {
      const handleSync = (e: Event) => {
        const customEvent = e as CustomEvent;
        const incomingData = customEvent.detail;
        if (incomingData) {
          if (incomingData.nowPage) setPage(incomingData.nowPage);
          if (incomingData.pageCache) {
            setPostsCache(incomingData.pageCache);
            postsCacheRef.current = incomingData.pageCache;
          }
          if (mode === "postSearch") {
            if (incomingData.searchTags) setSearchTags(incomingData.searchTags);
            if (incomingData.searchFilter) setSearchFilter(incomingData.searchFilter);
          } else if (mode === "pool") {
            if (incomingData.poolId) setPoolId(incomingData.poolId);
          }
        }
      };
      const eventName = `SYNC_PARENT_DATA_${windowID}`;
      window.addEventListener(eventName, handleSync);
      return () => window.removeEventListener(eventName, handleSync);
    }, [windowID, mode]);

    useEffect(() => {
      if (!thisWindow) return;

      thisWindow.setTitle(getWindowTitle(currentCustomData, { isOfflineMode }));
      if (thisWindow.customData?.type !== mode) return;
      if (currentCustomData.type !== mode) return;
      if (JSON.stringify(thisWindow.customData?.data) !== JSON.stringify(currentCustomData.data)) {
        thisWindow.setData(currentCustomData);

        const wm = wmRef.current;
        if (wm) {
          wm.getWindows().forEach(winInfo => {
            const childWin = wm.getWindow(winInfo.id);
            if (childWin?.customData?.type === "post" && childWin.customData.data.parentData?.windowID === thisWindow.id) {
              const childData = childWin.customData.data;
              const newParentData = { ...childData.parentData, customData: currentCustomData };
              if (JSON.stringify(childData.parentData) !== JSON.stringify(newParentData)) {
                childWin.setData({ type: "post", data: { ...childData, parentData: newParentData } as any });
                window.dispatchEvent(new CustomEvent(`SYNC_PARENT_DATA_${childWin.id}`, { detail: newParentData }));
              }
            }
          });
        }
      }
    }, [currentCustomData, isOfflineMode, thisWindow]);

    const pushSearchHistory = useCallback(async (tags: string[]) => {
      const query = tags.filter(Boolean).join(" ").trim();
      if (!query || !usrIndx) return;
      try {
        const hist = await WSA.userHistory(usrIndx, "search");
        const prev = (await hist.get()) as string[];
        const list = Array.isArray(prev) ? prev : [];
        const next = [query, ...list.filter(q => q !== query)].slice(0, SEARCH_HISTORY_LIMIT);
        await hist.set(next);
      } catch (err) {
        console.error(`[searchHistory] save failed:`, err);
      }
    }, []);

    const refreshSearch = useCallback((newVal?: any) => {
      setFetchError(null);
      setIsOfflineMode(false);
      setPostsCache({});
      postsCacheRef.current = {};
      setPage(1);
      fetchingPages.current.clear();
      setFetchId(id => id + 1);
      if (mode === "postSearch" && newVal) {
        setSearchTags(newVal);
        void pushSearchHistory(newVal);
      }
      if (mode === "pool" && newVal !== undefined) {
        const parsedId = Number(newVal) || 0;
        setPoolId(parsedId);
        if (parsedId !== poolId) setPoolInfo(undefined);
      }
    }, [mode, poolId, pushSearchHistory]);

    const peekPreKeyDown = useRef(false);

    useEffect(() => {
      let isdown = peekPreKeyDown.current;

      const display = () => {
        if (!peekPreRef.current) return;
        createWindow(wmRef, {
          type: "preview",
          data: peekPreRef.current
        });
      };

      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        if (isdown) return;
        if (e.code === "Space") {
          isdown = true;
          display();
        }
      };

      const keyup = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          isdown = false;
        }
      };

      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);

      return () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
      };
    }, []);

    useEffect(() => {
      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        if (!wmRef.current?.getWindow(windowID)?.isFocused) return;
        if (e.altKey) return;

        if (e.code === "Escape") {
          if (jupToPage) setJupToPage(false);
          else if (mode === "postSearch") setFilterPanel(false);
          return;
        }

        if (jupToPage || isFocuOnIt) return;

        if (e.code === "ArrowLeft") {
          e.preventDefault();
          setPage(p => (p > 1 ? p - 1 : 1));
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          setPage(p => p + 1);
        }

        if (e.shiftKey) {
          if (e.code === "KeyF") setFilterPanel(v => !v);
          if (e.code === "KeyJ") setJupToPage(v => !v);
        }
      };

      const preventBrowserNav = (e: MouseEvent) => {
        if (e.button === 3 || e.button === 4) StopEvent(e);
      };

      const mousedown = (e: MouseEvent) => {
        if (disableWindowKeyEvent) return;
        if (!wmRef.current?.getWindow(windowID)?.isFocused) return;

        if (e.button === 3 || e.button === 4) {
          if (jupToPage) {
            if (e.button === 3) setJupToPage(false);
            if (e.button === 4) { setJupToPage(false); setPage(Math.max(1, Math.floor(jupPage))); }
          } else {
            if (e.button === 3) setPage(p => (p > 1 ? p - 1 : 1));
            if (e.button === 4) setPage(p => p + 1);
          }
        }
      };

      document.addEventListener("keydown", keydown);
      document.addEventListener("mousedown", mousedown);
      document.addEventListener("mouseup", preventBrowserNav);
      document.addEventListener("click", preventBrowserNav);
      document.addEventListener("auxclick", preventBrowserNav);

      return () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("mousedown", mousedown);
        document.removeEventListener("mouseup", preventBrowserNav);
        document.removeEventListener("click", preventBrowserNav);
        document.removeEventListener("auxclick", preventBrowserNav);
      };
    }, [jupToPage, jupPage, isFocuOnIt, windowID, mode]);

    useEffect(() => {
      const statusOffset = 50;
      const offset = 200;
      let startPointX = 0, startPointY = 0;
      let status: "NONE" | "X" | "Y" = "NONE";
      let x = 0, y = 0;
      const touchArea = touchAreaRef.current;

      if (jupToPage) return;

      const onTouchStart = (e: TouchEvent) => {
        if (!touchArea) return;
        startPointX = e.touches[0].clientX;
        startPointY = e.touches[0].clientY;
      };
      const onTouchMove = (e: TouchEvent) => {
        if (!touchArea) return;
        x = startPointX - e.touches[0].clientX;
        y = startPointY - e.touches[0].clientY;
        if (status === "X") e.preventDefault();
        if (status === "Y") { x = 0; return; }

        const transform = () => { touchArea.style.transform = `translateX(${-1 * (x / 10)}px)` };
        if (x > offset || (x < -offset && page > 1)) {
          touchArea.style.opacity = ".5"; transform();
        } else {
          touchArea.style.opacity = ""; transform();
        }
        if (status !== "NONE") return;
        if (x > statusOffset || x < -statusOffset) status = "X";
        if (y > statusOffset || y < -statusOffset) status = "Y";
      };
      const onTouchEnd = () => {
        if (!touchArea) return;
        startPointX = 0;
        if (x > offset) { setPage(e => e + 1); void touchArea.clientHeight; }
        else if (x < -offset) { setPage(e => e > 1 ? e - 1 : 1); void touchArea.clientHeight; }
        touchArea.style.transform = ""; touchArea.style.opacity = "";
        status = "NONE";
      };

      touchArea?.addEventListener("touchstart", onTouchStart);
      touchArea?.addEventListener("touchmove", onTouchMove);
      touchArea?.addEventListener("touchend", onTouchEnd);
      return () => {
        touchArea?.removeEventListener("touchstart", onTouchStart);
        touchArea?.removeEventListener("touchmove", onTouchMove);
        touchArea?.removeEventListener("touchend", onTouchEnd);
      };
    }, [jupToPage, page, scrollPage.current]);

    useEffect(() => {
      if (scrollPage.current) scrollPage.current.scrollTo({ top: 0 });
    }, [page]);

    const showLoading = mode === "pool" ? (poolId !== 0 && !postsCache[page]) : !postsCache[page];

    const actionMenu = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => {
      event.stopPropagation(); event.preventDefault();
      const btnRect = event.currentTarget.getBoundingClientRect();
      const query = mode === "postSearch" ? searchTags.join(" ") : `pool:${poolId}`;
      MenuAction.showMenu(menuBtn.post(post.id, post, { q: query }), [btnRect.bottom, btnRect.left]);
    }, [mode, searchTags, poolId]);

    const generateMenuList = useMemo(() => {

      if (currentCustomData.type !== mode) return [];

      let list: MenuButtonType[] = [
        windowAction(windowID,
          mode === "postSearch" ? [{
            name: t("menuButton.Clone"),
            action() {
              createWindow(wmRef, cloneDeep(currentCustomData));
            },
            dragItem: {
              type: mode,
              thisWindow,
              data: currentCustomData.data
            } as any
          }] : []
        ),
        [
          t("menuButton.top.Data"),
          [
            {
              name: t("menuButton.Reload"),
              action() { refreshSearch(mode === "pool" ? poolId : undefined) },
            },
          ]
        ],
        [
          t("menuButton.top.Other"),
          [
            {
              name: t("menuButton.SaveToTmp"),
              action() {
                acts.saveToTmp(usrIndx, cloneDeep(currentCustomData), windowID);
              },
              onContextMenu() { acts.windows.tempList() },
              dragItem: {
                type: mode,
                data: currentCustomData.data
              } as any,
            },
            mode === "pool" ? {
              name: t("menuButton.OpenWithPostSearch"),
              action() {
                createWindow(wmRef, {
                  type: "postSearch",
                  data: {
                    nowPage: page,
                    pageCache: postsCache,
                    searchTags: ["pool:" + poolId],
                    searchFilter,
                  }
                });
              },
              dragItem: {
                type: "postSearch",
                data: {
                  nowPage: page,
                  pageCache: postsCache,
                  searchTags: ["pool:" + poolId],
                  searchFilter,
                }
              }
            } : undefined,
            ...menuBtn.copyJSON(currentPosts),
            ...menuBtn.copyJSON(postsCache, true, t("menuButton.CopyFullJSON"))
          ]
        ]
      ];
      return list;
    }, [mode, windowID, page, postsCache, searchFilter, poolId, currentPosts, currentCustomData, refreshSearch, thisWindow]);

    return (
      <WINDOW_FRAME
        className={style[mode]}
        menulist={generateMenuList}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => {
          if (!e.dataTransfer) return;
          const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname);
          if (itemdata) {
            const item: e621Type.DragItemType.defaul = JSON.parse(itemdata);
            if (mode === "postSearch" && item.type === "tag") {
              let newTags = [...searchTagsInput];
              const { data } = item;
              switch (data.action) {
                case "+": {
                  if (newTags.some(e => e === "-" + data.tag)) {
                    newTags = newTags.filter(e => e !== "-" + data.tag);
                  } else if (!newTags.some(e => e === data.tag)) {
                    newTags.push(data.tag);
                  }
                  StopEvent(e);
                  break;
                }
                case "-": {
                  if (newTags.some(e => e === data.tag)) {
                    newTags = newTags.filter(e => e !== data.tag);
                  } else if (!newTags.some(e => e === "-" + data.tag)) {
                    newTags.push("-" + data.tag);
                  }
                  StopEvent(e);
                  break;
                }
              }
              setSearchTagsInput(newTags);
            }
          }
        }}
      >
        <div className={style["PaginationControls"]} >
          <div />
          <div className={style["InnerFrame"]}>
            <button kiase-style="" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{"<"}</button>
            <button kiase-style="" onClick={() => { setJupToPage(true); setJupPage(page) }} >
              {t("windowsType.postSearch.page").replace("$1", page)}
            </button>
            <button kiase-style="" onClick={() => setPage(p => p + 1)}>{">"}</button>
          </div>
        </div>

        <div className={style["TagEditor"]} >
          <div className={style["InnerFrame"]}>
            {mode === "postSearch" ? (
              <input
                type="text"
                value={searchTagsInput.join(" ")}
                placeholder={t("windowsType.postSearch.placeholder")}
                onInput={(e) => setSearchTagsInput(e.currentTarget.value.split(" "))}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.code === "NumpadEnter") && searchTagsInput.join(" ") !== searchTags.join(" ")) {
                    refreshSearch(searchTagsInput)
                    e.currentTarget.blur();
                  };
                }}
                onFocus={() => setFocuOnIt(true)}
                onBlur={() => setFocuOnIt(false)} />
            ) : (
              <input
                type="text"
                value={poolIdInput}
                placeholder={t("windowsType.postSearch.placeholder.pool")}
                onInput={(e) => setPoolIdInput(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.code === "NumpadEnter") {
                    refreshSearch(Number(poolIdInput))
                    e.currentTarget.blur();
                  };
                }}
                onFocus={() => setFocuOnIt(true)}
                onBlur={() => setFocuOnIt(false)} />
            )}
            <button className={clsx(filterPanel && style["activ"])} onClick={() => setFilterPanel(e => !e)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" /></svg>
            </button>
          </div>
        </div>

        <JumpToPageOverlay jupToPage={jupToPage} jupPage={jupPage} setJupPage={setJupPage} setJupToPage={setJupToPage} setPage={setPage} />

        <div className={clsx(style["Filter"], filterPanel && style["display"])}>
          <div className={style["InnerFrame"]}>
            <div>
              <h1>{t("windowsType.postSearch.filter")}</h1>
              <h2>{t("windowsType.postSearch.filter.rating")}</h2>
              <div className={style["btns"]}>
                {
                  ([
                    [searchFilter.rating?.s, "s"],
                    [searchFilter.rating?.q, "q"],
                    [searchFilter.rating?.e, "e"],
                  ] as [boolean, ("s" | "q" | "e")][]).map(rat => {
                    return <button
                      key={rat[1]}
                      className={clsx(rat[0] && style["activ"])}
                      onClick={() => {
                        setSearchFilter(prev => ({
                          ...prev,
                          rating: {
                            s: false, q: false, e: false,
                            ...prev.rating,
                            [rat[1]]: !prev.rating?.[rat[1]]
                          }
                        }))
                      }}
                    >{t("windowsType.postSearch.filter.rating." + rat[1] as any)}</button>
                  })
                }
              </div>
              <br />
              <h2>{t("windowsType.postSearch.filter.type")}</h2>
              <div className={style["btns"]}>
                {
                  ([[searchFilter.type?.vid, "vid"], [searchFilter.type?.gif, "gif"], [searchFilter.type?.pic, "pic"],
                  ] as [boolean, ("vid" | "gif" | "pic")][]).map(tType => (
                    <button
                      key={tType[1]}
                      className={clsx(tType[0] && style["activ"])}
                      onClick={() => {
                        setSearchFilter(prev => ({
                          ...prev,
                          type: {
                            vid: false, gif: false, pic: false,
                            ...prev.type,
                            [tType[1]]: !prev.type?.[tType[1]]
                          }
                        }))
                      }}
                    >{t("windowsType.postSearch.filter.type." + tType[1] as any)}</button>
                  ))
                }
              </div>
              <h2>{t("windowsType.postSearch.filter.sortBy")}</h2>
              <div className={style["btns"]}>
                {
                  ([
                    "newest", "score", "favs", "size"
                  ] as ("newest" | "score" | "favs" | "size")[]).map(sort => {
                    return <button
                      key={sort}
                      className={clsx(sort === "newest" ? "" : sort === searchFilter.sortBy && style["activ"])}
                      onClick={() => {
                        setSearchFilter(prev => ({
                          ...prev,
                          sortBy: sort
                        }))
                      }}
                    >{t("windowsType.postSearch.filter.sortBy." + sort as any)}</button>
                  })
                }
              </div>
              <br />
              <div className={style["btns"]}>
                <button
                  className={clsx(searchFilter.reverse && style["activ"])}
                  onClick={() => {
                    setSearchFilter(prev => ({
                      ...prev,
                      reverse: !prev.reverse
                    }))
                  }}
                >{t("windowsType.postSearch.filter.sortBy.reverse")}</button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={style["List"]}
          ref={touchAreaRef}
        >
          {fetchError ? (
            <NODATA.Error error={fetchError} Reload={refreshSearch} />
          ) : showLoading ? <NODATA.Fetching key={page} /> : (
            mode === "pool" && !poolId ? <NODATA.None key={page} WithFilter={currentPosts.length > 0} /> : (
              processedPosts.length === 0 ? <NODATA.None key={page} WithFilter={currentPosts.length > 0} /> : (
                <div className={style["InnerFrame"]} ref={scrollPage} onKeyDown={e => { if (e.code === "Space") e.preventDefault(); }}>
                  {processedPosts.map((post, indx) => (
                    <Components.Card
                      event={cardEvent}
                      actionMenu={actionMenu}
                      key={post.id}
                      post={post}
                      delay={DELAY_EFFECT(indx * .005)}
                      queryQ={searchQuery}
                      onClick={handleCardClick}
                    />
                  ))}
                </div>
              )
            )
          )}
        </div>
      </WINDOW_FRAME>
    );
  };
}

