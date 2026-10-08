import { _app, Kiasole } from "@/app/_app"
import { merge } from "lodash"
import React from "react"
import * as e621Type from "../../types/appTypes"
import { GetNowTime } from "../../utlis/other"
import { createWindow, nowSetting, setCreateWindow, wmRef } from "../../core/globals"
import { acts, getWindowTitle } from "../../core/helpers"
import { windowsType } from "../windowsType"

acts.open.getByID = (post) => {
  const windowID = `post_get_by_id-${post.id}`
  const postID = post.id
  if (wmRef.current?.getWindow(windowID))
    wmRef.current.bringToFront(windowID)
  else
    createWindow(wmRef, {
      type: "postGetByID",
      data: {
        currentId: postID,
        status: "success",
        fetchedPost: post
      }
    })
}

acts.open.view = (post) => {
  const windowID = `viewer-${post.id}`
  if (wmRef.current?.getWindow(windowID))
    wmRef.current.bringToFront(windowID)
  else
    createWindow(wmRef, {
      type: "viewer",
      data: post
    })
}

setCreateWindow(function (wmRef, customData, other, setData) {
  const wm = wmRef.current
  const createAt = GetNowTime();

  const hasId = (winID: string) => {
    if (wm?.getWindow(winID)) {
      wm?.bringToFront(winID)
      const win = wm?.getWindow(winID)
      win?.setRect({
        top: other?.top,
        left: other?.left,
        height: other?.height,
        width: other?.width,
      }, "px", other?.anchor)

      if (setData) {
        win?.setData(customData)

        win?.setTitle(getWindowTitle(customData))

        switch (customData.type) {
          case "postSearch": {
            return win?.update({
              children: <windowsType.postSearch id={`${createAt}`} key={createAt} />,
            })
          }

          case "postGetByID": {
            const { data } = customData
            const cId = data.currentId;
            return win?.update({
              children: <windowsType.postGetByID id={`${cId}`} key={createAt} />,
            })
          }

          case "pool": {
            const { data } = customData
            const pId = data.poolId;
            return win?.update({
              children: <windowsType.pool id={`${pId}`} key={createAt} />,
            })
          }

          case "viewer": {
            const { data } = customData;
            const pId = data.id;
            return win?.update({
              children: <windowsType.viewer id={`${pId}`} key={createAt} />,
            })
          }

          case "preview": {
            return win?.update({
              children: <windowsType.peekPreview key={createAt} />,
            })
          }

          case "setting": {
            return win?.update({
              children: <windowsType.setting key={createAt} />,
            })
          }

          case "tmp": {
            return win?.update({
              children: <windowsType.tmpList key={createAt} />,
            })
          }

          case "post": {
            const { data } = customData;
            const pId = data.postId;
            return win?.update({
              children: <windowsType.post id={`${pId}`} key={createAt} />
            })
          }
        }
      }
      return true
    } else {
      return false
    }
  }

  switch (customData.type) {
    case "setting": {
      const id = `app-setting`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: getWindowTitle({ type: "setting", data: customData.data }),
        children: <windowsType.setting />,
        ...other,
        customData,
      });
    }

    case "tmp": {
      const id = `tmp-list`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: getWindowTitle({ type: "tmp" }),
        children: <windowsType.tmpList />,
        ...other,
        customData,
      })
    }
  }


  switch (customData.type) {

    case "postSearch": {
      const id = `post_search-${createAt}`;

      if (hasId(id)) return id;

      const { defaultSearchFilter } = nowSetting.search

      type dType = e621Type.window.postSearch

      const defaultData: dType = {
        type: "postSearch",
        data: {
          nowPage: 1,
          pageCache: {},
          searchTags: [],
          searchFilter: defaultSearchFilter
        }
      }
      const data: dType = merge({}, defaultData, customData)

      return wm?.createWindow({
        id,
        title: getWindowTitle(data),
        children: <windowsType.postSearch id={`${createAt}`} />,
        ...other,
        customData: data
      })
    }

    case "postGetByID": {
      const { data } = customData
      const cId = data.currentId;
      const id = `post_get_by_id-${cId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: getWindowTitle(customData),
        children: <windowsType.postGetByID id={`${cId}`} />,
        ...other,
        customData,
      })
    }

    case "pool": {
      const { data } = customData
      const pId = data.poolId;
      const id = `pool-${pId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: getWindowTitle(customData),
        children: <windowsType.pool id={`${pId}`} />,
        ...other,
        customData,
      })
    }

    case "viewer": {
      const { data } = customData;
      const pId = data.id;
      const id = `viewer-${pId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: getWindowTitle(customData),
        children: <windowsType.viewer id={`${pId}`} />,
        ...other,
        customData,
      })
    }

    case "preview": {
      const id = `peek-preview`;
      Kiasole.log(JSON.stringify(customData))

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: getWindowTitle(customData),
        children: <windowsType.peekPreview />,
        height: 720,
        width: 1280,
        ...other,
        customData,
        actions: {
          canClose: false,
          canMaximize: false,
          canMinimize: false,
        }
      })
    }
  }
})


