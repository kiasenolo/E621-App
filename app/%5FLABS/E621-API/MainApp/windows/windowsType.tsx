import { useCallback, useEffect, useState } from "react"
import { _app } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import React from "react"
import { apiCore, wmRef } from "../core/globals"
import { getWindowTitle } from "../core/helpers"
import { searchWindow } from "./searchWindow"
import { ViewerWindow } from "./viewerWindow"
import { post } from "./post"
import { postGetByID } from "./postGetByID"
import { peekPreview } from "./peekPreview"
import { setting } from "./setting"
import { tmpList } from "./tmpList"
import "./createWindow"

export type windowProp = { id: string }

const viewer = function ({ id }: windowProp) {
  const windowID = `viewer-${id}`;
  const thisWindow = wmRef.current?.getWindow(windowID);

  const savedData = thisWindow?.customData?.type === "viewer"
    ? thisWindow.customData.data
    : undefined;

  const [fetchedPost, setPostData] = useState<E621.Post>(savedData!);
  const [fetching, setFetching] = useState<boolean>(false);

  const fetchPost = useCallback(async () => {
    const postId = fetchedPost.id;
    setFetching(true);

    try {
      const result = await apiCore.methods.posts.get({
        id: postId,
      });
      if (result) {
        setPostData(result);
        setFetching(false);
      }
    } catch (e) {
      console.error(`Post ${postId} load failed: ${e}`);
      _app.throwNewNotic(`Post ${postId} load failed: ${e}`);
      setFetching(false);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    thisWindow?.setTitle(getWindowTitle({ type: "viewer", data: fetchedPost }))
  }, [])

  return (<ViewerWindow
    reloadBtn={fetchPost}
    fetching={fetching}
    post={fetchedPost}
    winID={windowID}
  />);
}

export const windowsType = {
  postSearch: function ({ id }: windowProp) {
    return <searchWindow.UnifiedPostBrowser id={id} mode="postSearch" />;
  },
  post,
  postGetByID,
  pool: function ({ id }: windowProp) {
    return <searchWindow.UnifiedPostBrowser id={id} mode="pool" />;
  },
  viewer,
  peekPreview,
  setting,
  tmpList,
}
