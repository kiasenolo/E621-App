import { useEffect, useState } from "react"
import style from "./style.module.scss"
import { _app, Kiasole } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import React from "react"
import { apiCore, wmRef } from "../../core/globals"
import { getWindowTitle, t } from "../../core/helpers"
import { menuBtn } from "../../core/menuButtons"
import { Components } from "../../ui/Components"
import { NODATA } from "../../ui/NoData"
import { WINDOW_FRAME, windowAction } from "../../ui/WindowFrame"
import { windowProp, windowsType } from "../windowsType"

export const postGetByID = function ({ id }: windowProp) {
  const windowID = `post_get_by_id-${id}`;
  const thisWindow = wmRef.current?.getWindow(windowID);

  const savedData = thisWindow?.customData?.type === "postGetByID"
    ? thisWindow.customData.data
    : undefined;

  const [inputId, setInputId] = useState<string | number>(savedData?.currentId ?? "");
  const [fetchedPost, setFetchedPost] = useState<E621.Post | null | undefined>(savedData?.fetchedPost);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(savedData?.status ?? "idle");
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleSearch = async (nextId: string | number) => {
    const targetId = Number(nextId);
    if (isNaN(targetId) || targetId <= 0) {
      console.error("Invalid ID");
      return;
    }

    const targetWindowID = `post_get_by_id-${targetId}`;

    if (targetWindowID !== windowID && wmRef.current?.hasWindowID(targetWindowID)) {
      Kiasole.log(`Window ${targetWindowID} already exists. Focusing...`);
      wmRef.current.bringToFront(targetWindowID);
      if (fetchedPost)
        setInputId(fetchedPost.id)
      return;
    }

    setStatus("loading");
    setFetchedPost(undefined);
    setFetchError(null);

    try {
      const result = await apiCore.methods.posts.get({
        id: targetId,
      });

      if (result) {
        setFetchedPost(result);
        setStatus("success");
        setFetchError(null);
        if (targetWindowID !== windowID) {
          thisWindow?.setData({
            type: "postGetByID",
            data: {
              currentId: targetId,
              fetchedPost: result,
              status: "success"
            }
          });

          const success = wmRef.current?.updateWindowID(windowID, targetWindowID);

          if (success) {
            wmRef.current?.updateWindow(targetWindowID, {
              children: <windowsType.postGetByID id={targetId.toString()} />
            });
          }
        }

      } else {
        setFetchedPost(null);
        setStatus("error");
      }
    } catch (e) {
      console.error(e);
      setFetchError(String(e));
      setStatus("error");
    }
  };

  useEffect(() => {
    thisWindow?.setData({
      type: "postGetByID",
      data: {
        currentId: inputId,
        fetchedPost: fetchedPost,
        status: status
      }
    });
    thisWindow?.setTitle(getWindowTitle({
      type: "postGetByID",
      data: { currentId: inputId, fetchedPost, status }
    }));
  }, [inputId, fetchedPost, status]);

  useEffect(() => {
    if (status === "loading") {
      handleSearch(inputId);
    }
  }, []);

  return (
    <WINDOW_FRAME
      menulist={[
        windowAction(windowID),
        [
          t("menuButton.top.Data"),
          [
            {
              name: t("menuButton.Reload"),
              action() { handleSearch(inputId) },
            },
          ],
        ],
        [
          t("menuButton.top.Other"),
          menuBtn.post(inputId, fetchedPost, {}, "id"),
        ]
      ]}
    >
      <div className={style["postGetByID"]}>
        <div className={style["Input"]}>
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.code === "NumpadEnter") {
                handleSearch(e.currentTarget.value);
              }
            }}
            placeholder="Input Post ID..."
          />
        </div>
        {fetchedPost &&
          <Components.Post key={fetchedPost.id} postData={fetchedPost} thisWindow={thisWindow} />
        }
        {!fetchedPost && status !== "error" && <NODATA.Fetching />}
        {status === "error" && fetchError && (
          <NODATA.Error error={fetchError} Reload={() => handleSearch(inputId)} />
        )}
      </div>
    </WINDOW_FRAME >
  );
}
