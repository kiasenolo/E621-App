import { useCallback, useEffect, useState, ReactNode } from "react"
import { _app } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import React from "react"
import { apiCore, disableWindowKeyEvent, wmRef } from "../../core/globals"
import { getWindowTitle, t, tools } from "../../core/helpers"
import { menuBtn } from "../../core/menuButtons"
import { Components } from "../../ui/Components"
import { NODATA } from "../../ui/NoData"
import { WINDOW_FRAME, windowAction } from "../../ui/WindowFrame"
import { windowProp, windowsType } from "../windowsType"

export const post = function ({ id }: windowProp) {
  const windowID = `post-${id}`
  const thisWindow = wmRef.current?.getWindow(windowID)

  const savedData = thisWindow?.customData?.type === "post"
    ? thisWindow.customData.data
    : undefined;

  const [postId, setPostId] = useState<number>(savedData?.postId ?? 0);
  const [postData, setPostData] = useState<E621.Post | undefined>(savedData?.cachedPost);
  const [isLoading, setIsLoading] = useState<boolean>(!savedData?.cachedPost);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [parentDataState, setParentDataState] = useState(savedData?.parentData);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setPostData(undefined);
    setFetchError(null);
    try {
      const result = await apiCore.methods.posts.get({
        id: postId,
      });
      if (result) {
        setPostData(result);
        setFetchError(null);
      }
    } catch (e) {
      console.error(`Post ${postId} load failed: ${e}`);
      setFetchError(String(e));
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const handleKeyNavigation = useCallback(async (direction: 1 | -1) => {
    if (!parentDataState || (parentDataState.componentType !== "postSearch" && parentDataState.componentType !== "pool")) return;

    const pData = parentDataState.customData.data as any;
    let currentCache = { ...pData.pageCache };
    let currentPage = pData.nowPage;

    let processed = tools.applyFiltersAndSort(currentCache[currentPage] || [], pData.searchFilter);
    let currentIndex = processed.findIndex(p => p.id === postId);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < processed.length) {
      const nextPost = processed[nextIndex];
      setPostId(nextPost.id);
      setPostData(nextPost);
    } else {
      let targetPage = currentPage + direction;
      if (targetPage < 1) {
        _app.throwNewNotic(t("Notic.post.notPreviousPage"))
        if (thisWindow?.customData?.type === "post") {
          const { parentData } = thisWindow?.customData?.data
          if (parentData) {
            const { rect, windowID, customData, componentType } = parentData

            let reconstructedChildren: ReactNode = null;

            if (componentType === "postSearch") {
              const parentId = windowID.replace("post_search-", "");
              reconstructedChildren = <windowsType.postSearch id={parentId} />;
            } else if (componentType === "pool") {
              const parentId = windowID.replace("pool-", "");
              reconstructedChildren = <windowsType.pool id={parentId} />;
            }

            if (wmRef.current?.getWindow(windowID)) {
              wmRef.current.updateWindow(windowID, { customData });
              wmRef.current.bringToFront(windowID)
            } else {
              wmRef.current?.createWindow({
                id: windowID,
                title: parentData.title,
                rect,
                children: reconstructedChildren,
                customData: customData
              })
            }
          }
        }
        return
      };

      setIsLoading(true);
      setPostData(undefined);

      let foundPost: E621.Post | undefined = undefined;
      let attempts = 0;

      const searchTagsQuery = parentDataState.componentType === "postSearch"
        ? pData.searchTags
        : [`pool:${pData.poolId}`];

      while (!foundPost && attempts < 3 && targetPage > 0) {
        let targetPosts = currentCache[targetPage];

        if (!targetPosts) {
          try {
            targetPosts = await apiCore.methods.posts.search({
              tags: searchTagsQuery,
              page: targetPage,
              limit: 300,
            });
            currentCache[targetPage] = targetPosts;
          } catch (e) {
            console.error(`第 ${targetPage} 頁抓取失敗: ${e}`);
            break;
          }
        }

        let targetProcessed = tools.applyFiltersAndSort(targetPosts, pData.searchFilter);

        if (targetProcessed.length > 0) {
          foundPost = direction === 1 ? targetProcessed[0] : targetProcessed[targetProcessed.length - 1];
        } else {
          targetPage += direction;
          attempts++;
        }
      }

      if (foundPost) {
        setPostId(foundPost.id);
        setPostData(foundPost);

        setParentDataState((prev: any) => {
          if (!prev || (prev.componentType !== "postSearch" && prev.componentType !== "pool")) return prev;
          return {
            ...prev,
            customData: {
              ...prev.customData,
              data: {
                ...prev.customData.data,
                nowPage: targetPage,
                pageCache: currentCache
              }
            }
          };
        });
      } else {
        fetchPost();
      }
      setIsLoading(false);
    }
  }, [postId, parentDataState, fetchPost]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newParentData = customEvent.detail;
      if (newParentData && JSON.stringify(parentDataState) !== JSON.stringify(newParentData)) {
        setParentDataState(newParentData);
      }
    };
    const eventName = `SYNC_PARENT_DATA_${thisWindow?.id}`;
    window.addEventListener(eventName, handleSync);
    return () => window.removeEventListener(eventName, handleSync);
  }, [thisWindow?.id, parentDataState]);

  useEffect(() => {
    const wm = wmRef.current
    if (!wm) return;
    if (!parentDataState) return;
    const { windowID, customData, componentType } = parentDataState
    const win = wm.getWindow(windowID);
    if (!win) return;
    if (win.customData?.type !== "postSearch") return;

    const currentParentData = win.customData?.data;

    if (JSON.stringify(currentParentData) !== JSON.stringify(customData.data)) {

      win.update({
        customData,
      });

      window.dispatchEvent(new CustomEvent(`SYNC_PARENT_DATA_${windowID}`, {
        detail: customData.data
      }));
    }

  }, [parentDataState]);

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (disableWindowKeyEvent) return;
      const win = wmRef.current?.getWindow(thisWindow?.id!);
      if (!win?.isFocused) return;

      if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleKeyNavigation(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleKeyNavigation(1);
      }
    };

    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [handleKeyNavigation, thisWindow?.id]);

  useEffect(() => {
    thisWindow?.setData({
      type: "post",
      data: {
        postId,
        cachedPost: postData,
        parentData: parentDataState
      }
    });
    if (postData)
      thisWindow?.setTitle(getWindowTitle({
        type: "post",
        data: { postId, cachedPost: postData, parentData: parentDataState }
      }))
    else
      thisWindow?.setTitle(getWindowTitle({
        type: "post",
        data: { postId, parentData: parentDataState }
      }))
  }, [postData, postId, parentDataState]);

  return (
    <>
      <WINDOW_FRAME
        menulist={[
          windowAction(windowID, [
            {
              name: t("menuButton.RestoreParentWindow"),
              action() {
                if (thisWindow?.customData?.type === "post") {
                  const { parentData } = thisWindow?.customData?.data
                  if (parentData) {
                    const { rect, windowID, customData, componentType } = parentData

                    let reconstructedChildren: ReactNode = null;

                    if (componentType === "postSearch") {
                      const parentId = windowID.replace("post_search-", "");
                      reconstructedChildren = <windowsType.postSearch id={parentId} />;
                    } else if (componentType === "pool") {
                      const parentId = windowID.replace("pool-", "");
                      reconstructedChildren = <windowsType.pool id={parentId} />;
                    }

                    if (wmRef.current?.getWindow(windowID)) {
                      wmRef.current.updateWindow(windowID, { customData });
                      wmRef.current.bringToFront(windowID)
                    } else {
                      wmRef.current?.createWindow({
                        id: windowID,
                        title: parentData.title,
                        rect,
                        children: reconstructedChildren,
                        customData: customData
                      })
                    }
                  }
                }
              },
            },
          ]),
          [
            t("menuButton.top.Data"),
            [
              {
                name: t("menuButton.Reload"),
                action() { fetchPost() },
              },
            ],
          ],
          [
            t("menuButton.top.Other"),
            menuBtn.post(postId, postData,
              thisWindow?.customData?.type === "post" ?
                {
                  q: (() => {
                    const { parentData } = thisWindow?.customData?.data
                    if (parentData) {
                      if (parentData.componentType === "postSearch") {
                        return parentData.customData.data.searchTags.join(" ")
                      } else if (parentData.componentType === "pool") {
                        return `pool:${parentData.customData.data.poolId}`
                      }
                    }
                  })()
                }
                : {}),
          ]
        ]}
      >
        {(postData && !isLoading) &&
          <Components.Post key={postData.id} postData={postData} thisWindow={thisWindow} />
        }
        {isLoading && <NODATA.Fetching />}
        {!isLoading && !postData && fetchError && (
          <NODATA.Error error={fetchError} Reload={fetchPost} />
        )}
      </WINDOW_FRAME >
    </>
  );
}
