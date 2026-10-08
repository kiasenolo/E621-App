import { useCallback, useEffect, useRef, useState, useMemo, JSX, CSSProperties } from "react"
import style from "./style.module.scss"
import { SnapPosition, WindowAnchor, WindowManager, WindowManagerEventMap } from "@/data/components/Window/WindowManager"
import { _app, Kiasole, newInput } from "@/app/_app"
import { Button } from "./Button"
import { WindowRect } from "@/data/components/Window/Window"
import functions from "@/data/module/functions"
import React from "react"
import Fuse from "fuse.js"
import color from "@/data/module/color"
import clsx from "clsx/lite"
import { ElectrApiType } from "../../../type"
import * as e621Type from "../../types/appTypes"
import * as workSpaceType from "../../types/workSpaceType"
import { newEmptyAccount } from "../../core/appStorage"
import * as e621DatabaseCache from "../../core/cacheSystem"
import { MakeID } from "../../utlis/other"
import { setCacheRoot } from "../../core/cache"
import { E621_BASE_URL, E621_DB, ELECTRON_WIN_STATE, Resolution, SET_E621_BASE_URL, StopEvent, WSA, apiCore, baseUrlList, baseUrlLoaded, createWindow, devopts, displayDesktop, electronMode, electronWinAction, importing, isLogin, nowSaveInfo, nowSetting, setDisableWindowKeyEvent, setDisplayDesktop, setE621DB, setIsLogin, setUsrIndx, setWmRef, storage, usrIndx, wmRef } from "../../core/globals"
import { DELAY_EFFECT, SetS, acts, debugMenu, dragItem, otherMenu, parseE621Url, setChackWallpaperUse, t, updateAllWindowTitles } from "../../core/helpers"
import { fuckingState } from "../../core/hooks"
import { MenuAction } from "../../core/menuAction"
import { Background, TaskbarClock } from "../../ui/DesktopParts"
import { NODATA } from "../../ui/NoData"
import { RunBox, windowsList } from "../../ui/RunBox"
import { windowActionList } from "../../ui/WindowFrame"
import { WindowSelector } from "../../ui/WindowSelector"
import { windowsType } from "../../windows/windowsType"

export const Desktop = () => {
  const [ready, setReady] = useState(false);

  setWmRef(useRef<WindowManager<e621Type.defaul> | null>(null));

  const resolution = fuckingState.resolution();

  // #region 一坨 State
  const [workSpaces, setWorkSpaces] = useState<workSpaceType.WorkSpaces.WorkSpaces[]>([]);
  const [nowWorkSpace, setNowWorkSpace] = useState<string>("");
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [background, setBackground] = useState<workSpaceType.Unit.BaseItem.Image>({ url: "" })
  const [mouseIsPress, setMouseIsPress] = useState<boolean>(false)
  const [windowsList, setWindowsList] = useState<windowsList>([])

  const [workSpaceEditor, setWorkSpaceEditor] = useState(false);
  const [startMenu, setStartMenu] = useState<boolean>(false)
  const [dropMenuBtn, setDropMenuBtn] = useState(-1)
  const [snap, setSnap] = useState<SnapPosition | null>(null)
  const [snapStyle, setSnapStyle] = useState<CSSProperties>({
    opacity: 0,
  })
  const [PERF_ClassList, setPERF_ClassList] = useState<string[]>([])
  // #endregion

  // #region 一坨 Ref
  const isInitialMount = useRef(true);
  const originalStatesRef = useRef<Map<string, { isMinimized: boolean, isFocused: boolean }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCancelAreaRef = useRef<HTMLDivElement>(null);
  const snapElementRef = useRef<HTMLDivElement>(null);
  const dragTimeOut = useRef<NodeJS.Timeout>(setTimeout(() => { }, 0));
  const liveSnapshotRef = useRef<{ id: string; snapshot: workSpaceType.Unit.windowsStatus } | null>(null);
  const prevWorkSpaceEditorRef = useRef(false);
  const wsSwitchingRef = useRef(false);
  const workSpaceEditorRef = useRef(workSpaceEditor);
  workSpaceEditorRef.current = workSpaceEditor;
  // #endregion

  setChackWallpaperUse((id) => {
    return !!id && workSpaces.some(e => e.setting.wallpaper.fromPost?.id === id);
  })

  useEffect(() => {
    setCacheRoot(`${WSA.rootDir}/${usrIndx}/.cache`);

    setE621DB(new e621DatabaseCache.E621Database(usrIndx, storage));
    E621_DB.init()
  }, [])

  useEffect(() => {
    if (!isLogin || !usrIndx || !nowSetting.lang) return;
    (async () => {

      const names = await WSA.listWorkspaces(usrIndx)
      const workSpaces: workSpaceType.WorkSpaces.WorkSpaces[] = []

      for (let index = 0; index < names.length; index++) {
        const name = names[index];
        workSpaces.push({
          id: name,
          note: await WSA.getWorkspaceInfo(usrIndx, name, "note"),
          preview: await WSA.getWorkspaceInfo(usrIndx, name, "preview"),
          setting: await WSA.getWorkspaceInfo(usrIndx, name, "setting"),
          status: await WSA.getWorkspaceInfo(usrIndx, name, "status"),
        })
      }

      setWorkSpaces(workSpaces);
      const targetWsId = (await (await WSA.userState(usrIndx)).get()).nowWorkSpace;
      const exists = workSpaces.some(ws => ws.id === targetWsId);
      const finalWsId = exists ? targetWsId : (workSpaces[0]?.id || "");
      setNowWorkSpace(finalWsId);

      setWorkspaceLoaded(true);
    })()

    const onWsAdded = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) setWorkSpaces(prev => [...prev, e.detail.ws]);
    };

    const onWsUpdated = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) setWorkSpaces(prev => prev.map(ws => ws.id === e.detail.wsId ? { ...ws, ...e.detail.partial } : ws));
    };

    const onWsDeleted = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) {
        const deletedWsId = e.detail.wsId;
        setWorkSpaces(prev => {
          const deletedIndex = prev.findIndex(ws => ws.id === deletedWsId);
          const updated = prev.filter(ws => ws.id !== deletedWsId);

          setNowWorkSpace(current => {
            if (current === deletedWsId) {
              if (updated.length === 0) return "";
              const prevIndex = deletedIndex === 0 ? updated.length - 1 : deletedIndex - 1;
              return updated[prevIndex]?.id || updated[0]?.id || "";
            }
            return current;
          });

          return updated;
        });
      }
    };

    const onStateSet = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) {
        const targetWsId = e.detail.value.nowWorkSpace;
        setWorkSpaces(workspaces => {
          const exists = workspaces.some(ws => ws.id === targetWsId);
          const finalWsId = exists ? targetWsId : (workspaces[0]?.id || "");
          setNowWorkSpace(finalWsId);
          return workspaces;
        });
      }
    };

    const onWsAppearance = (e: CustomEvent) => {
      if (e.detail.userId !== usrIndx) return;
      setWorkSpaces(prev => prev.map(ws =>
        ws.id === e.detail.wsId ? { ...ws, setting: e.detail.value } : ws
      ));
    };

    WSA.addEventListener("workspace:added", onWsAdded);
    WSA.addEventListener("workspace:updated", onWsUpdated);
    WSA.addEventListener("workspace:deleted", onWsDeleted);
    WSA.addEventListener("user:stateSet", onStateSet);
    WSA.addEventListener("workspace:appearance", onWsAppearance);

    return () => {
      WSA.removeEventListener("workspace:added", onWsAdded);
      WSA.removeEventListener("workspace:updated", onWsUpdated);
      WSA.removeEventListener("workspace:deleted", onWsDeleted);
      WSA.removeEventListener("user:stateSet", onStateSet);
      WSA.removeEventListener("workspace:appearance", onWsAppearance);
    };
  }, [isLogin, usrIndx, nowSetting.lang]);

  const inputKeyEvent = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter": {
        StopEvent(e);
        e.currentTarget.blur();
        break;
      }
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
      case "Escape": {
        StopEvent(e);
        break;
      }
    }
  }, [])

  const applySnapshot = useCallback((snapshot: workSpaceType.Unit.windowsStatus) => {
    const wm = wmRef.current
    if (wm) {
      wm.applySnapshot(
        snapshot,
        (windowId, customData) => {

          if (!customData) return <div>Error: No Data</div>;

          switch (customData.type) {
            case "postSearch":
              const pureId = windowId.replace("post_search-", "");

              return <windowsType.postSearch id={pureId} />;

            case "post":
              return <windowsType.post id={windowId.replace("post-", "")} />;

            case "postGetByID":
              return <windowsType.postGetByID id={windowId.replace("post_get_by_id-", "")} />;

            case "pool":
              return <windowsType.pool id={windowId.replace("pool-", "")} />;

            case "viewer":
              return <windowsType.viewer id={windowId.replace("viewer-", "")} />;

            case "preview":
              return <windowsType.peekPreview />;

            case "setting":
              return <windowsType.setting />;

            case "tmp":
              return <windowsType.tmpList />;

            default:
              return <div>Unknown Window Type</div>;
          }
        }
      );
    }
  }, [])

  const Logout = async () => {
    setDisplayDesktop(false);
    setWorkSpaces([]);
    setNowWorkSpace("");
    const appState = await WSA.getAppStatus();
    await WSA.setAppStatus({ ...appState, autoLogin: false, rememberPassword: "" });
    setUsrIndx("");
    setIsLogin(false);
  }

  const saveWinStatus = useCallback(async (logout?: boolean, noNotic?: boolean) => {
    const wm = wmRef.current;
    if (!wm || !nowWorkSpace) return;

    const currentSnapshot = wm.captureSnapshot();
    await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });

    if (!noNotic) {
      _app.throwNewNotic(t("Notic.system.windowsStatusSaved"));
    }

    if (logout) Logout();
  }, [nowWorkSpace]);

  const reranderWindowContent = useCallback(() => {
    const wm = wmRef.current;
    if (!wm) return;
    const wins = wm.captureSnapshot();

    wins.forEach(winData => {
      const win = wm.getWindow(winData.id)
      if (!win) return;
      win.update({
        children: (() => {
          const winID = winData.id;

          switch (winData.customData!.type) {
            case "postSearch":
              const pureId = winID.replace("post_search-", "");

              return <windowsType.postSearch id={pureId} />;

            case "post":
              return <windowsType.post key={winData.customData!.data.postId} id={winID.replace("post-", "")} />;

            case "postGetByID":
              return <windowsType.postGetByID id={winID.replace("post_get_by_id-", "")} />;

            case "pool":
              return <windowsType.pool id={winID.replace("pool-", "")} />;

            case "viewer":
              return <windowsType.viewer id={winID.replace("viewer-", "")} />;

            case "preview":
              return <windowsType.peekPreview />;

            case "setting":
              return <windowsType.setting />;

            case "tmp":
              return <windowsType.tmpList />;

            default:
              return <div>Unknown Window Type</div>;
          }
        })()
      })
    })
  }, [])

  const { RunboxElement, setRunBox, runBox, runBoxInputRef } = RunBox(
    {
      saveWinStatus,
      windowsList,
      setWorkSpaceEditor,
      Logout
    }
  )

  const { isSelecting, selectedWindowId, setTarget } = WindowSelector({
    eventLock: (runBox || workSpaceEditor),
    windowsList,
    onSelectStart: () => {
      setStartMenu(false);
      const wm = wmRef.current;
      if (!wm) return;

      originalStatesRef.current.clear();

      windowsList.forEach(winInfo => {
        const win = wm.getWindow(winInfo.id);
        if (!win) return;

        originalStatesRef.current.set(winInfo.id, {
          isMinimized: win.isMinimized,
          isFocused: win.isFocused,
        });

        if (win.isMinimized) {
          win.focus();
        }
      });
    },

    onSelect: (id) => {
      windowsList.map(e => e.id).forEach(e => {
        const ele = document.getElementById(e)!
        ele.style.opacity = ".5";
        ele.style.pointerEvents = "none";
        ele.style.zIndex = "1";
        ele.style.transition = "";
      });
      const ele = document.getElementById(id)!
      ele.style.opacity = "";
      ele.style.zIndex = "10";
      ele.style.transition = "none";
    },

    onSelectEnd: (selectedId) => {
      windowsList.map(e => e.id).forEach(e => {
        const ele = document.getElementById(e)!
        ele.style.opacity = "";
        ele.style.zIndex = "";
        ele.style.pointerEvents = "";
        ele.style.transition = "";
      });

      const wm = wmRef.current;
      if (!wm) return;

      windowsList.forEach(winInfo => {
        const win = wm.getWindow(winInfo.id);
        if (!win) return;

        if (winInfo.id === selectedId) {
          if (win.isMinimized) {
            win.minimize();
          }
          win.focus();
        } else {
          const originalState = originalStatesRef.current.get(winInfo.id);
          if (originalState?.isMinimized && !win.isMinimized) {
            win.minimize();
          }
        }
      });

      originalStatesRef.current.clear();
    },
  });

  // #region 操他媽的工作區

  const handleSwitchWorkspace = useCallback(async (newWsId: string) => {
    const wm = wmRef.current;
    if (!wm || newWsId === nowWorkSpace || wsSwitchingRef.current) return;

    wsSwitchingRef.current = true;
    try {
      const currentSnapshot = wm.captureSnapshot();
      await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });

      const stateObj = await WSA.userState(usrIndx);
      await stateObj.set(prev => ({ ...prev, nowWorkSpace: newWsId }));
    } finally {
      wsSwitchingRef.current = false;
    }
  }, [nowWorkSpace]);

  const handleDeleteWorkspace = useCallback(async (targetId: string) => {
    if (workSpaces.length <= 1) {
      _app.throwNewNotic(t("Notic.system.keepOneWorkspace"));
      return;
    }

    const wm = wmRef.current;
    const currentSnapshot = wm ? wm.captureSnapshot() : [];

    let nextWsId = nowWorkSpace;
    if (targetId === nowWorkSpace) {
      const idx = workSpaces.findIndex(w => w.id === targetId);
      const nextIdx = Math.max(0, idx - 1);
      const fallback = workSpaces.filter(w => w.id !== targetId);
      nextWsId = fallback[nextIdx]?.id || fallback[0].id;
    }

    if (nowWorkSpace !== targetId) {
      await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });
    }

    const stateObj = await WSA.userState(usrIndx);
    await stateObj.set({ nowWorkSpace: nextWsId });
    await WSA.deleteWorkspace(usrIndx, targetId);
  }, [workSpaces, nowWorkSpace]);

  const handleAddWorkspace = useCallback(async () => {
    const newId = MakeID();
    const wm = wmRef.current;
    const currentSnapshot = wm ? wm.captureSnapshot() : [];

    if (nowWorkSpace) await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });
    const currentWs = await WSA.getWorkspace(usrIndx, nowWorkSpace);

    await WSA.addWorkspace(usrIndx, {
      id: newId,
      note: { name: "New Desktop", note: "" },
      preview: [],
      status: [],
      setting: {
        wallpaper: currentWs.setting.wallpaper,
        color: currentWs.setting.color,
      }
    });

    const stateObj = await WSA.userState(usrIndx);
    await stateObj.set({ nowWorkSpace: newId });
  }, [nowWorkSpace]);
  // #endregion

  // #region 純他媽監聽 State

  /* 我拿來解決效能的東西 啊 就是節能模式 啊 十分好 */
  const perf = nowSetting.performance
  useEffect(() => {
    const p = nowSetting.performance
    const list = []

    if (!p.All) {
      list.push("NONE_TRANSITION")
      list.push("NONE_FILTER")
      list.push("NONE_BACKDROP_FILTER")
      list.push("NONE_ANIMATION")
    } else {
      if (!p.transition) {
        list.push("NONE_TRANSITION")
      }
      if (!p.cssFilter) {
        list.push("NONE_FILTER")
      }
      if (!p.backdropFilter) {
        list.push("NONE_BACKDROP_FILTER")
      }
      if (!p.cssAnimation) {
        list.push("NONE_ANIMATION")
      }
    }

    SetS.setting(usrIndx, e => {
      e.wmSettings.nonTransparens = !p.backdropFilter || !p.All || !p.transparenWinodw
      return e
    })

    setPERF_ClassList(list)

  }, [
    perf.All,
    perf.transition,
    perf.cssFilter,
    perf.backdropFilter,
    perf.cssAnimation,
    perf.transparenWinodw,
  ]);

  /* wm的設定 */
  useEffect(() => {
    if (wmRef.current)
      wmRef.current.setting.set(nowSetting.wmSettings)
  }, [nowSetting.wmSettings])

  /* nowWorkSpace他變化了 他變了 他拉了 */
  useEffect(() => {
    if (isInitialMount.current || !nowWorkSpace) return;

    let cancelled = false;
    const targetWsId = nowWorkSpace;

    (async () => {
      const wm = wmRef.current;
      if (!wm) return;

      wm.getWindows().forEach(winInfo => wm.destroyWindow(winInfo.id));
      const newWorkspace = await WSA.getWorkspaceInfo(usrIndx, targetWsId, "status");
      if (cancelled) return;

      if (newWorkspace) {
        applySnapshot(newWorkspace as any);
      }

      if (workSpaceEditorRef.current) {
        liveSnapshotRef.current = {
          id: targetWsId,
          snapshot: newWorkspace || [],
        };
      }
    })();

    return () => { cancelled = true; };
  }, [nowWorkSpace, applySnapshot]);

  /* 開工作區管理器 全村的人都要先消失 — 僅在進入編輯器時保存，切換工作區由 handleSwitchWorkspace 負責 */
  useEffect(() => {
    const justOpened = workSpaceEditor && !prevWorkSpaceEditorRef.current;
    prevWorkSpaceEditorRef.current = workSpaceEditor;

    if (!justOpened) return;

    setRunBox(false);
    setStartMenu(false);

    const wm = wmRef.current;
    if (wm && nowWorkSpace) {
      const currentSnapshot = wm.captureSnapshot();

      liveSnapshotRef.current = {
        id: nowWorkSpace,
        snapshot: currentSnapshot
      };

      WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot })
        .catch(err => console.error("Auto-save on entering workspace editor failed:", err));
    }
  }, [workSpaceEditor, nowWorkSpace]);

  /* 某些東西出現後 我們就不要影響其他人了 */
  useEffect(() => {
    setDisableWindowKeyEvent(startMenu || workSpaceEditor || runBox)
  }, [startMenu, workSpaceEditor, runBox])

  /* 桌布更新 */
  useEffect(() => {
    if (!nowWorkSpace || workSpaces.length === 0) return;
    const currentWorkspace = workSpaces.find(w => w.id === nowWorkSpace);
    if (!currentWorkspace) return;

    const wallpaper = currentWorkspace.setting.wallpaper ?? nowSetting.appearance.wallpaper;
    const color = currentWorkspace.setting.color ?? nowSetting.appearance.color;

    setBackground(typeof wallpaper === "number" ? currentWorkspace.setting.wallpaper : wallpaper);
    _app.setColor(color);

    const event = (ev: CustomEvent<{
      userId: string;
      wsId: string;
      value: workSpaceType.WorkSpaces.Setting;
    }>) => {


      setBackground(ev.detail.value.wallpaper);
      _app.setColor(ev.detail.value.color);

    }

    WSA.addEventListener("workspace:appearance", event)

    return () => {
      WSA.removeEventListener("workspace:appearance", event)
    }
  }, [nowWorkSpace, workSpaces, nowSetting]);

  /* 語言改了 重新渲染視窗 */
  useEffect(() => {
    if (isInitialMount.current) return;
    reranderWindowContent()
    updateAllWindowTitles()
  }, [nowSetting.lang, E621_BASE_URL, reranderWindowContent]);

  /* E621 的基礎連結 */
  useEffect(() => {
    if (!baseUrlLoaded) return;
    SetS.usrInfo(usrIndx, p => {
      if (p.user.baseUrl === E621_BASE_URL) return p
      p.user.baseUrl = E621_BASE_URL
      return p
    })
    apiCore.setBaseURL(E621_BASE_URL)
  }, [E621_BASE_URL]);

  /* 設定 E621 的認證 */
  useEffect(() => {
    const authInfo = nowSaveInfo.user.e621;
    if (authInfo?.key && authInfo?.name && authInfo) {
      apiCore.setUserAuth({
        key: authInfo.key,
        name: authInfo.name
      })
    } else { apiCore.setUserAuth() }
  }, [nowSaveInfo.user.e621?.key, nowSaveInfo.user.e621?.name, nowSaveInfo.user.e621]);

  /* AppSetting的更新 */
  useEffect(() => {
    const winID = "app-setting"

    if (wmRef.current?.hasWindowID(winID)) {
      wmRef.current.updateWindow(winID, {
        children: <windowsType.setting />
      })
    }
  }, [nowSetting, nowSaveInfo])

  /* 自動漂流到他該去的地方 */
  useEffect(() => {
    document.getElementById("workspace-" + nowWorkSpace)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "start"
    })
  }, [nowWorkSpace])

  // #endregion

  // #region 按鍵的 Event

  /* 給Menu用的滑鼠按下去 */
  useEffect(() => {
    if (!mouseIsPress) return

    const clickEvent = () => {
      setMouseIsPress(false)
    }

    document.addEventListener("click", clickEvent)
    return () => {
      document.removeEventListener("click", clickEvent)
    }
  }, [mouseIsPress])

  /* 一些全域的快速鍵 */
  useEffect(() => {
    let keyispress = false
    const openRunBox = (e: any) => {
      keyispress = true
      const runInp = runBoxInputRef.current
      if (!runInp) return;
      e.preventDefault()
      setStartMenu(false)
      setRunBox(e => {
        if (!e) { runInp.focus() } else { runInp.blur(); };
        return !e
      })
    };

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Escape": {
          setWorkSpaceEditor(false)
          break
        }
      }

      if (e.altKey && !e.shiftKey && e.code === "KeyW") {
        setWorkSpaceEditor(e => !e)
      }

      if (workSpaceEditor) return
      if (keyispress) return;

      if (e.altKey && !e.shiftKey) {
        switch (e.code) {
          case "KeyO": {
            keyispress = true
            createWindow(wmRef, { type: "setting", data: "NONE" })
            break;
          }

          case "Digit0": {
            wmRef.current?.getWindow(windowsList[9].id)?.focus();
            break;
          }

          case "KeyR": {
            openRunBox(e);
            break;
          }
        }
      }

      switch (e.code) {
        case "Escape": {
          keyispress = true
          setStartMenu(false)
          setRunBox(false)
          const runInp = runBoxInputRef.current
          if (runInp) { runInp.blur(); };
          break;
        }

        case "F1": {
          openRunBox(e);
        }
      }

      if (e.altKey && e.ctrlKey) {
        keyispress = true
        setStartMenu(e => {
          if (!e) setRunBox(false);
          return !e
        })
      }
    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [workSpaceEditor])

  /* 純針對workSpaceEditor */
  const currentWsIndex = workSpaces.findIndex(w => w.id === nowWorkSpace);
  useEffect(() => {
    let keyispress = false

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      const usingKey = (e.altKey && e.shiftKey)
      if (!(workSpaceEditor || usingKey)) return;

      if (e.code.startsWith("Digit") && usingKey) {
        const changews = (indx: number) => {
          handleSwitchWorkspace(workSpaces[indx].id)
        }

        const number = Number(e.code.slice(5))

        if (number === 0) {
          changews(9)
        } else {
          changews(number - 1)
        }
      }
      switch (e.code) {
        case "ArrowUp":
        case "ArrowLeft": {
          if (keyispress) return;
          keyispress = true
          if (currentWsIndex > 0) {
            if (usingKey) {
              saveWinStatus(false, true);
            }
            handleSwitchWorkspace(workSpaces[currentWsIndex - 1].id)
          }
          break;
        }

        case "ArrowDown":
        case "ArrowRight": {
          if (keyispress) return;
          keyispress = true
          if (currentWsIndex < workSpaces.length - 1) {
            if (usingKey) {
              saveWinStatus(false, true);
            }
            handleSwitchWorkspace(workSpaces[currentWsIndex + 1].id)
          }
          break;
        }
      }
    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [workSpaceEditor, nowWorkSpace, workSpaces])

  /* 二些全域的快速鍵 */
  useEffect(() => {
    let keyispress = false

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      if (workSpaceEditor) return
      if (keyispress) return;

      if (e.ctrlKey && (e.code === "KeyQ")) {
        e.preventDefault();
        keyispress = true
        wmRef.current?.nowFocusedWindow?.close();
      }

      if (e.altKey && !e.shiftKey) {
        const win = wmRef.current?.nowFocusedWindow

        if (!win) return;

        const ev = (e: KeyboardEvent) => {
          keyispress = true
          e.preventDefault()
        }

        switch (e.code) {
          case "ArrowDown": {
            ev(e)
            if (win.isMaximized) {
              win.toggleMaximize();
            } else {
              win.minimize();
            }
            break;
          }

          case "ArrowUp": {
            ev(e)
            if (!win.isMaximized) {
              win.toggleMaximize();
            }
            break;
          }

          case "Comma": {
            ev(e)
            win.minimize();
            break;
          }

          case "ArrowLeft": {
            ev(e)
            if (!win.isMaximized) {
              win.setRect({
                height: 100,
                width: 50,
                left: 0,
                top: 0,
              }, "%");
            }
            break;
          }

          case "ArrowRight": {
            ev(e)
            if (!win.isMaximized) {
              win.setRect({
                height: 100,
                width: 50,
                left: 50,
                top: 0,
              }, "%");
            }
            break;
          }
        }


        if (e.code.startsWith("Digit")) {
          const wm = wmRef.current
          if (!wm) return;

          const focusWin = (indx: number) => {
            const win = windowsList[indx];
            if (!win) return;
            const id = win.id;
            id ? wm.getWindow(id)?.focus() : "";
          }

          const number = Number(e.code.slice(5))

          if (number === 0) {
            focusWin(10)
          } else {
            focusWin(number - 1)
          }
        }
      }

    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [windowsList, workSpaceEditor])

  // #endregion

  // #region 初始化

  /* 取消首次渲染標記 */
  useEffect(() => {
    if (workspaceLoaded) {
      isInitialMount.current = false;
    }
  }, [workspaceLoaded]);

  /* 初始化wm */
  useEffect(() => {
    if (workspaceLoaded && containerRef.current && !wmRef.current) {
      wmRef.current = new WindowManager(containerRef.current);
    }
  }, [workspaceLoaded]);

  /* 寫這坨注解的時候 就是爲了找這個 */
  /* 這個是他媽的 初始化動畫 */
  useEffect(() => {
    if (!isLogin || !workspaceLoaded) return;

    (async () => {
      await functions.timeSleep(.5e3)
      setReady(true)
    })()
  }, [isLogin, workspaceLoaded])

  /* 初始化狀態 */
  useEffect(() => {
    const wm = wmRef.current;
    if (!wm || !ready) return;

    WSA.getUser(usrIndx).then(async (user) => {
      if (!user.workSpaces || user.workSpaces.length <= 0) {
        const defaultWs = newEmptyAccount.workSpaces[0];
        await WSA.addWorkspace(usrIndx, defaultWs as any);
        user.workSpaces = [defaultWs as any];
      }

      const currentWorkspace = user.workSpaces.find(w => w.id === user.state.nowWorkSpace) || user.workSpaces[0];
      const targetStatus = currentWorkspace.status || [];

      if (targetStatus.length > 0) {
        setTimeout(() => {
          applySnapshot(targetStatus);
          setWindowsList(wm.getWindows());
        }, 500);
      }
    }).catch(err => {
      console.error("Desktop Initialization Error:", err);
    });

  }, [ready]);

  // #endregion

  /* 關是窗前先問你個問題 */
  useEffect(() => {
    if (!devopts.askYouBeforeYouLeave) return;
    let messageIsDisplay = false
    let eventBlock = true
    const awa = (e: BeforeUnloadEvent) => {
      if (eventBlock) e.preventDefault();
      if (messageIsDisplay) return;
      if (electronMode) {
        messageIsDisplay = true
        newInput.message(t("ELECTRON.beforeUnload.msg"),
          [
            {
              name: t("ELECTRON.beforeUnload.cancel"),
              value: "nah",
            },
            {
              name: t("ELECTRON.beforeUnload.no"),
              value: "no",
              key: "Backspace",
            },
            {
              name: t("ELECTRON.beforeUnload.yes"),
              value: "yes",
              key: "Enter",
            },
          ],
          e => {
            switch (e) {
              case "yes": {
                saveWinStatus()
                eventBlock = false
                messageIsDisplay = false
                electronWinAction("CLOSE")
                return;
              }
              case "no": {
                eventBlock = false
                messageIsDisplay = false
                electronWinAction("CLOSE")
                return;
              }
              case "nah": {
                messageIsDisplay = false
                return;
              }
            }
          }, () => messageIsDisplay = false
        )
      }
    }

    window.addEventListener('beforeunload', awa)

    return () => {
      window.removeEventListener('beforeunload', awa)
    }
  }, [saveWinStatus])


  // #region 視窗管理相關

  /* 工作列更新 */
  useEffect(() => {
    const wm = wmRef.current
    if (!wm) return;

    const update = () => {
      setWindowsList(wm.getWindows())
    }

    update()

    const list: (keyof WindowManagerEventMap<any>)[] = [
      "create",
      "minimize",
      "blur",
      "close",
      "focus",
      "moveEnd",
      "resizeEnd",
      "idupdate",
    ]

    list.forEach(e => wm.addEventListener(e, update))

    return () => {
      if (wm) {
        list.forEach(e => wm.removeEventListener(e, update))
      }
    }
  }, [workspaceLoaded, nowSetting.lang])

  /* fucking *SnapPreview* */
  useEffect(() => {
    const wm = wmRef.current
    if (!wm) return;

    const end = () => setSnap(null);

    const prev = (data: {
      id: string;
      snapPosition: SnapPosition | null;
    }) => {
      setSnap(data.snapPosition)
    };

    wm.addEventListener("snapPreview", prev)
    wm.addEventListener("snapEnd", end)


    return () => {
      if (wm) {
        wm.removeEventListener("snapPreview", prev)
        wm.removeEventListener("snapEnd", end)
      }
    }
  }, [workspaceLoaded])

  /* 欸 snap 的他媽的視覺效果 幹 */
  useEffect(() => {
    const wm = wmRef.current
    const snEle = snapElementRef.current
    if (!wm) return;
    // if (!snEle) return;

    const getSnap = (rect?: WindowRect): CSSProperties => {
      switch (snap) {

        case "top": return {
          width: "100%",
          height: "100%",
          left: "0",
          top: "0",
        }

        case "left": return {
          width: "50%",
          height: "100%",
          left: "0",
          top: "0",
        }

        case "right": return {
          width: "50%",
          height: "100%",
          left: "50%",
          top: "0",
        }

        case "top-left": return {
          width: "50%",
          height: "50%",
          left: "0",
          top: "0",
        }

        case "top-right": return {
          width: "50%",
          height: "50%",
          left: "50%",
          top: "0",
        }

        case "bottom-left": return {
          width: "50%",
          height: "50%",
          left: "0",
          top: "50%",
        }

        case "bottom-right": return {
          width: "50%",
          height: "50%",
          left: "50%",
          top: "50%",
        }

        case null: return {
          opacity: 0,
          transition: "none",
          width: rect?.width + "%",
          height: rect?.height + "%",
          top: rect?.top + "%",
          left: rect?.left + "%",
        }
      }
    }

    const prev = (data: {
      id: string;
      rect?: WindowRect;
    }) => {
      const thisStyle = getSnap(data.rect)
      setSnapStyle(thisStyle)
    };

    const movend = () => {
      const thisStyle = getSnap()
      setSnapStyle({
        ...thisStyle,
        opacity: 0,
      })
    }

    wm.addEventListener("move", prev)
    wm.addEventListener("moveEnd", movend)

    return () => {
      if (wm) {
        wm.removeEventListener("move", prev)
        wm.removeEventListener("moveEnd", movend)
      }
    }
  }, [snap, workspaceLoaded])

  // #endregion

  /* 手動存工作區狀態 啊他會自動幫你存 放心 */
  useEffect(() => {
    let isPress = false;

    const intr = setInterval(saveWinStatus, 300e3);

    const event = (e: KeyboardEvent) => {
      if (isPress) return;
      if (e.ctrlKey && (e.code === "KeyS")) {
        isPress = true;
        if (!wmRef.current) return;
        e.preventDefault();
        saveWinStatus();
      }
    };

    const up = () => {
      isPress = false;
    };

    document.addEventListener("keydown", event);
    document.addEventListener("keyup", up);

    return () => {
      document.removeEventListener("keydown", event);
      document.removeEventListener("keyup", up);
      clearInterval(intr);
    };
  }, [saveWinStatus]);

  // #region 沒有拖只有放

  /* 全局的拖放 */
  useEffect(() => {
    const dragoverEvent = (e: DragEvent) => e.preventDefault();
    const dropEvent = (e: DragEvent) => {
      if (startMenu || workSpaceEditor || runBox) return;
      if (!e.dataTransfer) return;

      const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)
      const item = e.dataTransfer.items[0]

      const scale = 100 / nowSetting.appearance.scale;

      const position: {
        left: number;
        top: number;
        anchor: WindowAnchor;
      } = {
        left: scale * e.clientX,
        top: scale * e.clientY,
        anchor: "center-center",
      }

      if (itemdata) {
        StopEvent(e)
        const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
        const { data, type } = item

        switch (type) {
          case "post": {
            createWindow(wmRef,
              {
                type: "postGetByID",
                data: {
                  currentId: data.id,
                  status: "success",
                  fetchedPost: data
                }
              }, position)
            break;
          };
          case "postId": {
            createWindow(wmRef,
              {
                type: "postGetByID",
                data: {
                  currentId: data,
                  status: "loading",
                }
              }, position)
            break;
          };
          case "pool": {
            createWindow(wmRef,
              {
                type: "pool",
                data
              }, position)
            break;
          }
          case "poolId": {
            createWindow(wmRef,
              {
                type: "pool",
                data: {
                  poolId: data,
                  nowPage: 1,
                  pageCache: {},
                }
              }, position)
            break;
          }
          case "postSearch": {
            createWindow(wmRef,
              {
                type: "postSearch",
                data
              }, position)
            break;
          };
          case "tag": {
            if (data.action === "=") {
              createWindow(wmRef,
                {
                  type: "postSearch",
                  data: {
                    nowPage: 1,
                    pageCache: [],
                    searchTags: [data.tag],
                  }
                }, position)
            }
            break;
          };
          case "postImg": {
            createWindow(wmRef,
              {
                type: "viewer",
                data: data
              }, position)
            break;
          };
          case "temp": {
            createWindow(wmRef,
              {
                type: "tmp",
              }, position)
            break;
          };
          case "setting": {
            createWindow(wmRef,
              {
                type: "setting",
                data
              }, position)
            break;
          };
        };
      } else if (item) {
        if (item.kind !== "string") return;
        StopEvent(e);
        item.getAsString((text) => {

          const res = parseE621Url(text)
          if (!res) return;
          switch (res.type) {
            case "post": {
              createWindow(wmRef,
                {
                  type: "postGetByID",
                  data: {
                    currentId: res.postId!,
                    status: "loading",
                  }
                }, position)
              break;
            }
            case "postSearch": {
              createWindow(wmRef,
                {
                  type: "postSearch",
                  data: {
                    nowPage: 1,
                    pageCache: [],
                    searchTags: res.searchTags!
                  }
                }, position)
              break;
            }
          }
        })
      }
    }
    document.addEventListener("dragover", dragoverEvent)
    document.addEventListener("drop", dropEvent)

    return () => {
      document.removeEventListener("dragover", dragoverEvent)
      document.removeEventListener("drop", dropEvent)
    };
  }, [startMenu, workSpaceEditor, runBox])

  /* 全局的拖放 but 上面那條 cancel */
  useEffect(() => {
    const dragstart = () => {
      if (dragCancelAreaRef.current) {
        dragCancelAreaRef.current.classList.add(style["activ"]);
      }
    };

    const dragend = () => {
      if (dragCancelAreaRef.current) {
        dragCancelAreaRef.current.classList.remove(style["activ"]);
      }
    };

    document.addEventListener("dragstart", dragstart);
    document.addEventListener("dragend", dragend);

    return () => {
      document.removeEventListener("dragstart", dragstart);
      document.removeEventListener("dragend", dragend);
    };
  }, []);


  // #endregion

  const onClickEvent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, menu: MenuAction.Item[]) => {
    event.stopPropagation()
    event.preventDefault()
    const btn = (event.target as HTMLButtonElement)
    const btnRect = btn.getBoundingClientRect()
    const x = btnRect.top
    const y = btnRect.left + (btnRect.width / 2)
    MenuAction.showMenu(menu, [x, y], "bc")
  }

  const windowAction: (id: string) => MenuAction.Item[] = (id) => {
    const win = wmRef.current?.getWindow(id)

    return windowActionList(win);
  }

  type WorkSpacesMenuProp = {
    workSpaces: workSpaceType.WorkSpaces.WorkSpaces[];
    resolution: Resolution;
    nowWorkSpace: string
    handleSwitchWorkspace: (s: string) => Promise<void>
    handleDeleteWorkspace: (s: string) => Promise<void>
    handleAddWorkspace: () => Promise<void>
    inputKeyEvent: (e: React.KeyboardEvent<HTMLInputElement>) => void
  }

  const WorkSpacesMenu = useCallback(({
    workSpaces,
    resolution,
    nowWorkSpace,
    handleSwitchWorkspace,
    handleDeleteWorkspace,
    handleAddWorkspace,
    inputKeyEvent,
  }: WorkSpacesMenuProp) => {
    const [keyWord, setKeyWord] = useState("")
    const [filteredWorkSpaces, setFltrdWS] = useState<workSpaceType.WorkSpaces.WorkSpaces[]>([])

    useEffect(() => {
      if (keyWord) {
        const fuse = new Fuse(workSpaces, {
          includeScore: true,
          threshold: 0.3,
          keys: [
            "note.name",
            "note.note",
          ]
        });
        setFltrdWS(fuse.search(keyWord).map(e => e.item))
      } else setFltrdWS(workSpaces)
    }, [keyWord, workSpaces])

    return <div className={style["menu"]} >
      <input
        type="text"
        placeholder={t("workSpaceManager.search.placeholder")}
        onInput={e => setKeyWord(e.currentTarget.value)}
        onKeyDown={(e) => {
          inputKeyEvent(e)
          if (e.code === "Escape") {
            if (e.currentTarget.value) {
              e.currentTarget.value = ""
              setKeyWord("")
            } else {
              e.currentTarget.blur();
            }
          }
        }}
      />
      <div className={style["list"]}>
        {filteredWorkSpaces.map((e, i) => (
          <div
            className={clsx(
              style["workSpace"],
              nowWorkSpace === e.id && style["activ"]
            )}
            key={e.id}
            id={"workspace-" + e.id}
          >
            <div className={style["top"]}>
              <input
                type="text"
                key={e.note.name}
                defaultValue={e.note.name}
                placeholder={t("workSpaceManager.name.placeholder")}
                onKeyDown={(el) => {
                  inputKeyEvent(el)
                  switch (el.code) {
                    case "Enter":
                    case "NumpadEnter": {
                      WSA.updateWorkspace(usrIndx, e.id, {
                        note: { ...e.note, name: el.currentTarget.value }
                      })
                      return;
                    }
                  }
                }}
                onBlur={(el) => {
                  WSA.updateWorkspace(usrIndx, e.id, {
                    note: { ...e.note, name: el.currentTarget.value }
                  })
                }}
                style={{ color: e.setting.color }}
              />
              {workSpaces.length > 1 && (
                <button onClick={() => handleDeleteWorkspace(e.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" style={{ fill: e.setting.color }}><path d="m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z" /></svg>
                </button>
              )}
            </div>
            <button
              className={style["desktopPreview"]}
              onClick={() => handleSwitchWorkspace(e.id)}
              style={{
                aspectRatio: `${resolution[0]} / ${resolution[1]}`,
                borderColor: e.setting.color
              }}
            >
              {e.note.note && <div className={style["note"]}><span style={{ color: e.setting.color }}>{`${e.note.note}`}</span></div>}
              <div className={style["indexNumber"]}><span style={{ color: e.setting.color }}>{`# ${i.toString().padStart((workSpaces.length - 1).toString().length, "0")}`}</span></div>
              <div className={style["backdrop2"]} style={{ opacity: !!e.note.note ? 1 : 0 }} />
              <div className={style["backdrop"]} />
              <div className={style["windows"]} >
                {(e.id === nowWorkSpace && liveSnapshotRef.current?.id === nowWorkSpace
                  ? liveSnapshotRef.current.snapshot
                  : e.status
                ).filter(win => !win.isMinimized).map((win, i) => <div
                  className={style["win"]}
                  key={i}
                  style={{ zIndex: win.zIndex }}
                >
                  <div
                    className={style["position"]}
                    style={{
                      borderColor: color.bright(e.setting.color, .8),
                      backgroundColor: color.bright(e.setting.color, .3) + "80",
                      top: win.rect.top + "%",
                      left: win.rect.left + "%",
                      width: win.rect.width + "%",
                      height: win.rect.height + "%",
                    }}
                  />
                </div>)}
              </div>
              <Background className={style["Background"]} bg={e.setting.wallpaper} />
            </button>
          </div>
        ))}
        <button onClick={handleAddWorkspace} className={style["add"]}>
          {t("workSpaceManager.newDesktop")}
        </button>
      </div>
    </div>
  }, [])

  type WorkspaceTipsProp = {
    nowWorkSpace: string;
    workSpaces: workSpaceType.WorkSpaces.WorkSpaces[];
    workSpaceEditor: boolean;
    WSInfoShow: boolean;
  }

  let WSInfoTmOut = useRef(setTimeout(() => { }, 250))
  const [WSInfoShow, setWSInfoShow] = useState(false)
  const showOncesWsInfo = () => {
    setWSInfoShow(true)
    WSInfoTmOut.current = setTimeout(() => {
      setWSInfoShow(false)
    }, 250);
  }

  const WorkspaceTips = useCallback(({
    nowWorkSpace,
    workSpaces,
    workSpaceEditor,
    WSInfoShow
  }: WorkspaceTipsProp) => {
    const index = workSpaces.findIndex(e => e.id === nowWorkSpace)
    if (index === -1) return;
    const ws = workSpaces[index]!


    useEffect(() => {
      const kd = (e: KeyboardEvent) => {
        const isPress = e.altKey && e.shiftKey
        if (isPress) {
          clearTimeout(WSInfoTmOut.current)
          setWSInfoShow(true)
        } else {
          WSInfoTmOut.current = setTimeout(() => {
            setWSInfoShow(false)
          }, 250);
        }
      };

      document.addEventListener("keydown", kd)
      document.addEventListener("keyup", kd)
      return () => {
        document.removeEventListener("keydown", kd)
        document.removeEventListener("keyup", kd)
      }
    }, [])

    return <div className={clsx(style["WorkspaceTips"], (WSInfoShow || workSpaceEditor) && style["show"])} >
      <div className={style["Backdrop"]} />
      <div className={style["Information"]} key={nowWorkSpace}>
        <div className={style["name"]}>{ws.note.name}</div>
        <div className={clsx(style["note"], ws.note.note && style["havNote"])}>{ws.note.note || "NOTHING"}</div>
        <div className={style["index"]}>{`# ${index.toString().padStart((workSpaces.length - 1).toString().length, "0")}`}</div>
      </div>
    </div>
  }, [])

  type AltRightDragType = {
    w: number
    h: number
    x: number
    y: number
  } | null
  type AltRightStatusType = "drag" | "canopen" | "waiting" | "null"

  const [altRightDrag, setAltRightDrag] = useState<AltRightDragType>(null)
  const [altRightStatus, setAltRightStatus] = useState<AltRightStatusType>("null")

  useEffect(() => {
    // return;
    if (workSpaceEditor) return;
    if (runBox) return;
    if (startMenu) return;

    let isDown = false
    let canopen = false
    let startPos: [number, number] = [0, 0]
    let lastPost: AltRightDragType = null

    const axc = (_start: number, _dist: number): [number, number] => {
      const scale = 100 / nowSetting.appearance.scale
      const start = _start * scale;
      const dist = _dist * scale;

      const afterMin = dist - start;
      const isNav = afterMin < 0 ? true : false;
      if (isNav) return [start - Math.abs(afterMin), Math.abs(afterMin)]
      else return [start, Math.abs(afterMin)]
    }

    const setAltR = (data: AltRightDragType) => {
      lastPost = data
      setAltRightDrag(data)
    }

    const mousedown = (e: MouseEvent) => {
      if (!(e.button === 0 && e.ctrlKey && e.shiftKey)) return
      e.preventDefault()
      isDown = true;
      startPos = [e.clientX, e.clientY];
      setAltRightStatus("drag")

      const x = axc(startPos[0], startPos[0]);
      const y = axc(startPos[1], startPos[1]);
      setAltR({
        x: x[0],
        w: x[1],
        y: y[0],
        h: y[1],
      })

      canopen = false

    }

    const mousemove = (e: MouseEvent) => {
      if (!(e.button === 0)) return
      if (!isDown) return;
      e.preventDefault()

      const x = axc(startPos[0], e.clientX);
      const y = axc(startPos[1], e.clientY);

      if (x[1] > 650 && y[1] > 450) {
        setAltRightStatus("canopen")
        canopen = true
      } else {
        setAltRightStatus("drag")
        canopen = false
      }

      setAltR({
        x: x[0],
        w: x[1],
        y: y[0],
        h: y[1],
      })

    }

    const mouseup = (e: MouseEvent) => {
      isDown = false
      startPos = [0, 0]
      if (canopen) {
        canopen = false
        const p = lastPost
        createWindow(wmRef, {
          type: "postSearch",
          data: {
            nowPage: 1,
            pageCache: [],
            searchTags: [],
          }
        }, {
          left: p?.x,
          top: p?.y,
          height: p?.h,
          width: p?.w,
        })
        setAltRightStatus("null")
        // setAltRightStatus("waiting")
      } else {
        setAltRightStatus("null")
      }
    }

    const unfocus = () => {
      isDown = false
      canopen = false
      startPos = [0, 0]
      setAltRightStatus("null")
    }

    document.addEventListener("mousedown", mousedown)
    document.addEventListener("mousemove", mousemove)
    document.addEventListener("mouseup", mouseup)
    window.addEventListener("blur", unfocus)

    return () => {
      document.removeEventListener("mousedown", mousedown)
      document.removeEventListener("mousemove", mousemove)
      document.removeEventListener("mouseup", mouseup)
      window.removeEventListener("blur", unfocus)
    }

  }, [workSpaceEditor, runBox, startMenu])

  // #region 你要學會跟 Electron 講道理

  /* Electron 的選單 Event */
  const menuHandlerRef = useRef<(id: string) => void>(() => { });

  menuHandlerRef.current = (id) => {
    const wm = wmRef.current

    const prefixHandlers: [string, (arg: string) => void][] = [
      [
        "ws.change.",
        (arg) => {
          saveWinStatus(false, true);
          handleSwitchWorkspace(arg)
          clearTimeout(WSInfoTmOut.current)
          showOncesWsInfo()
        }
      ],
      [
        "win.focus.",
        (arg) => {
          const win = wm?.getWindow(arg)
          win?.focus()
        }
      ],
      [
        "baseUrl.set.",
        SET_E621_BASE_URL
      ],
      [
        "windowAct.",
        (arg) => {
          if (wm?.nowFocusedWindow?.id)
            windowAction(wm?.nowFocusedWindow.id)[+arg]?.action?.()
        }
      ],
    ];

    for (const [prefix, fn] of prefixHandlers) {
      if (id.startsWith(prefix)) return fn(id.slice(prefix.length));
    }

    const winList = windowsList.map(e => wmRef.current?.getWindow(e.id))

    switch (id) {

      /* WS */
      case "ws.toggleEdit": {
        setWorkSpaceEditor(e => !e)
        break;
      }

      case "ws.next": {
        saveWinStatus(false, true);
        handleSwitchWorkspace(workSpaces[currentWsIndex + 1].id)
        showOncesWsInfo()
        break;
      }

      case "ws.previous": {
        saveWinStatus(false, true);
        handleSwitchWorkspace(workSpaces[currentWsIndex - 1].id)
        showOncesWsInfo()
        break;
      }

      case "ws.save": {
        saveWinStatus();
        break;
      }

      /* win */
      case "win.all.close": {
        winList.forEach(e => e?.close())
        break;
      }

      case "win.all.mini": {
        winList.forEach(e => e?.minimize())
        break;
      }

      case "win.all.res": {
        winList.forEach(e => e?.focus())
        break;
      }

    }
  };

  useEffect(() => {
    if (!electronMode) return;
    const listener = (e: CustomEvent<ElectrApiType.MenuClickDetail>) => menuHandlerRef.current(e.detail.id);

    document.addEventListener("APP-MENU-CLICK", listener);
    return () => document.removeEventListener("APP-MENU-CLICK", listener);
  }, []);

  /* Electron 的選單 */
  {

    const DebugMenu = useMemo<ElectrApiType.MenuItemSpec>((() => debugMenu(t)), [nowSetting.lang])
    const OtherMenu = useMemo<ElectrApiType.MenuItemSpec[]>((() => otherMenu(t)), [ELECTRON_WIN_STATE, nowSetting.lang])

    const awa = useMemo<ElectrApiType.MenuItemSpec>(() => ({
      label: t("ELECTRON.menu.Debug"),
      submenu: [
        {
          label: t("ELECTRON.menu.Debug.devTool"),
          role: 'toggleDevTools',
        },
        {
          type: "separator",
        },
        {
          label: t("ELECTRON.menu.Debug.clearConsole"),
          id: "debug.clearConsole",
        },
        {
          label: t("ELECTRON.menu.Debug.remountApp"),
          id: "debug.remount",
        },
      ]
    }), [nowSetting.lang])

    const baseUrlMenu = useMemo<ElectrApiType.MenuItemSpec>(() => {

      const ls: ElectrApiType.MenuItemSpec[] = baseUrlList.map(e => ({
        label: e[1] + "\t" + e[0],
        enabled: E621_BASE_URL !== e[0],
        id: "baseUrl.set." + e[0]
      }))

      return {
        label: t("ELECTRON.menu.BaseURL"),
        submenu: ls
      }
    }, [E621_BASE_URL, nowSetting.lang])

    const WorkSpace = useMemo<ElectrApiType.MenuItemSpec>(() => {
      const wsList: ElectrApiType.MenuItemSpec[] = workSpaces.map((ws, i) => ({
        label: ws.note.name
          + (ws.note?.note ? " // " + functions.str.textOverflowReplace(ws.note.note, 20) : "")
          + (i >= 10 ? "" : "\tAlt+Shift+" + (i + 1).toString().padStart(2, "0").slice(1)),
        enabled: ws.id !== nowWorkSpace,
        id: "ws.change." + ws.id,
      }))

      return {
        label: t("ELECTRON.menu.WorkSpace"),
        submenu: [
          {
            label: t("ELECTRON.menu.WorkSpace.editor") + "\tAlt+W",
            id: "ws.toggleEdit",
          },
          {
            label: t("runBox.actions.saveWorkSpaceStatus") + "\tCtrl+S",
            id: "ws.save",
          },
          {
            label: t("ELECTRON.menu.WorkSpace.next") + "\tAlt+Shift+Right",
            id: "ws.next",
          },
          {
            label: t("ELECTRON.menu.WorkSpace.previous") + "\tAlt+Shift+Left",
            id: "ws.previous",
          },
          { type: "separator" },
          ...wsList,
        ]
      }
    }, [workSpaceEditor, nowWorkSpace, workSpaces, nowSetting.lang])

    const Windows = useMemo<ElectrApiType.MenuItemSpec>(() => {
      const wm = wmRef.current
      const winList: ElectrApiType.MenuItemSpec[] = windowsList.map((win, i) => {
        const isMini = wm?.getWindow(win.id)?.isMinimized
        return {
          label:
            (wm?.nowFocusedWindow?.id === win.id ? "* " : "") +
            (isMini ? "- " : "") +
            win.title
            + (i >= 10 ? "" : "\tAlt+" + (i + 1).toString().padStart(2, "0").slice(1)),
          id: "win.focus." + win.id,
          enabled: !workSpaceEditor,
        }
      })

      return {
        label: t("ELECTRON.menu.WindowsManagement"),
        submenu: [
          {
            label: t("runBox.intro.toggleWindows.moreAction.closeAllWindow"),
            id: "win.all.close",
            enabled: !workSpaceEditor,
          },
          {
            label: t("runBox.intro.toggleWindows.moreAction.minimizeAllWindow"),
            id: "win.all.mini",
            enabled: !workSpaceEditor,
          },
          {
            label: t("runBox.intro.toggleWindows.moreAction.restoreAllWindow"),
            id: "win.all.res",
            enabled: !workSpaceEditor,
          },
          { type: "separator" },
          ...winList
        ]
      }
    }, [windowsList, workSpaceEditor, nowSetting.lang])

    const Window = useMemo<ElectrApiType.MenuItemSpec>(() => {

      const nowWin = wmRef?.current?.nowFocusedWindow

      const btnLs: ElectrApiType.MenuItemSpec[] = windowAction("").map((btn, i) => ({
        label: btn?.name,
        id: "windowAct." + i,
        enabled: (!workSpaceEditor) && !!nowWin
      }))

      return {
        label: t("menuButton.top.Window"),
        submenu: [
          {
            label: nowWin?.title ?? "NONE",
          },
          {
            type: "separator"
          },
          ...btnLs
        ]
      }
    }, [windowsList, workSpaceEditor, nowSetting.lang])

    useEffect(() => {
      if (!electronMode) return;

      window.electronAPI.setMenu([
        ...OtherMenu,
        Window,
        Windows,
        WorkSpace,
        baseUrlMenu,
        DebugMenu,
      ])

    }, [OtherMenu, Windows, WorkSpace, baseUrlMenu, DebugMenu])
  }

  // #endregion


  if (!workspaceLoaded) return <div
    id={style["Desktop"]}
    style={{
      zoom: `${nowSetting.appearance.scale}%`
    }}
  >
    <NODATA.Loading />
  </div>;


  return (
    displayDesktop && <div
      id={style["Desktop"]}
      className={clsx(
        !ready && style["hide"],
        workSpaceEditor && style["workSpaceEditor"],
        ...PERF_ClassList.map(e => style[e]),
      )}

      style={{
        zoom: `${nowSetting.appearance.scale}%`
      }}
    >

      {importing && <div className={style["Importing"]}>
        <div className={style["dark"]} />
        <NODATA.Loading />
      </div>}


      <div
        className={style["workSpaceMgr"]}
      >
        <WorkSpacesMenu
          workSpaces={workSpaces}
          resolution={resolution}
          nowWorkSpace={nowWorkSpace}
          handleSwitchWorkspace={handleSwitchWorkspace}
          handleDeleteWorkspace={handleDeleteWorkspace}
          handleAddWorkspace={handleAddWorkspace}
          inputKeyEvent={inputKeyEvent}
        />
      </div>

      <div className={style["textArea"]}>
        {(() => {
          const ws = workSpaces.find(w => w.id === nowWorkSpace);
          if (!ws) return null;
          return <>
            <div className={style["name"]}>
              <input
                key={nowWorkSpace + "-name:" + ws.note.name}
                type="text"
                defaultValue={ws.note.name}
                placeholder={t("workSpaceManager.name.placeholder")}
                onKeyDown={(el) => {
                  inputKeyEvent(el)
                  switch (el.code) {
                    case "Enter":
                    case "NumpadEnter": {
                      WSA.updateWorkspace(usrIndx, ws.id, {
                        note: { ...ws.note, name: el.currentTarget.value }
                      })
                      return;
                    }
                  }
                }}
                onBlur={(el) => WSA.updateWorkspace(usrIndx, ws.id, {
                  note: { ...ws.note, name: el.currentTarget.value }
                })}
                style={{ color: ws.setting.color }}
              />
            </div>
            <div className={style["note"]}>
              <input
                key={nowWorkSpace + "-note:" + ws.note.note}
                type="text"
                defaultValue={ws.note.note ?? ""}
                placeholder={t("workSpaceManager.note.placeholder")}
                onKeyDown={(el) => {
                  inputKeyEvent(el)
                  switch (el.code) {
                    case "Enter":
                    case "NumpadEnter": {
                      WSA.updateWorkspace(usrIndx, ws.id, {
                        note: { ...ws.note, note: el.currentTarget.value }
                      })
                      return;
                    }
                  }
                }}
                onBlur={(el) => WSA.updateWorkspace(usrIndx, ws.id, {
                  note: { ...ws.note, note: el.currentTarget.value }
                })}
                style={{ color: ws.setting.color }}
              />
            </div>
          </>;
        })()}
      </div>

      <div
        className={style["mainArea"]}
        onClick={e => e.isTrusted ? setWorkSpaceEditor(false) : ""}
      >

        <WorkspaceTips
          nowWorkSpace={nowWorkSpace}
          workSpaces={workSpaces}
          workSpaceEditor={workSpaceEditor}
          WSInfoShow={WSInfoShow}
        />

        <div className={style["WindowSelector"]}>

        </div>

        <div className={style["Buttons"]}>
          <div className={clsx(style["MainArea"], startMenu && style["startMenu"])}>

            <div className={style["StartMenu"]}
              onDrop={e => { setStartMenu(false); }}
            >

              {nowSetting.appearance.KIASTALA && <div className={style["KIASTALA"]}>
                <div>
                  <div className={style["LINIE"]} />
                </div>

                <div>
                  <div className={style["CORE"]} />
                </div>

                {
                  [
                    /* Size , Duration , Width , Blur , Opacity */
                    [100, .3, 10, 1, .8],
                    [200, .5, 10, 5, .8],
                    [300, 1, 10, 8, .5],
                    [500, 2, 15, 10, .25],
                    [700, 5, 20, 15, .1],
                    [1000, 10, 30, 20, .1],
                    [1600, 20, 40, 5, .1],
                    [2000, 30, 50, 10, .1],
                    [2500, 50, 60, 15, .1],
                  ].map((e, i) => <div>
                    <div
                      key={i}
                      className={style["CER"]}
                      style={{
                        width: e[0] + "px",
                        height: e[0] + "px",
                        filter: `blur(${e[3]}px)`,
                        opacity: e[4],
                        transform: i % 2 === 0 ? "translate(-50%, -50%)" : "translate(-50%, -50%) rotateY(180deg)"
                      }}
                    >
                      <div
                        key={i}
                        style={{
                          animationDuration: e[1] + "s",
                        }}
                      >
                        <div style={{
                          borderWidth: e[2] + "px",
                        }} />
                      </div>
                    </div>
                  </div>
                  )
                }
              </div>}

              <div className={style["Side"]}>
                <div>
                  {
                    ([
                      [
                        t("startMenuSide.logout"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" /></svg>,
                        () => {
                          saveWinStatus(true)
                        }
                      ],
                      [
                        t("startMenuSide.appSetting"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M433-80q-27 0-46.5-18T363-142l-9-66q-13-5-24.5-12T307-235l-62 26q-25 11-50 2t-39-32l-47-82q-14-23-8-49t27-43l53-40q-1-7-1-13.5v-27q0-6.5 1-13.5l-53-40q-21-17-27-43t8-49l47-82q14-23 39-32t50 2l62 26q11-8 23-15t24-12l9-66q4-26 23.5-44t46.5-18h94q27 0 46.5 18t23.5 44l9 66q13 5 24.5 12t22.5 15l62-26q25-11 50-2t39 32l47 82q14 23 8 49t-27 43l-53 40q1 7 1 13.5v27q0 6.5-2 13.5l53 40q21 17 27 43t-8 49l-48 82q-14 23-39 32t-50-2l-60-26q-11 8-23 15t-24 12l-9 66q-4 26-23.5 44T527-80h-94Zm7-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>,
                        () => acts.windows.setting()
                      ],
                      [
                        t("runBox"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" /></svg>,
                        () => setRunBox(true),
                        true,
                      ],
                      [
                        t("workSpaceManager"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M640-160v-360H160v360h480Zm80-200v-80h80v-360H320v200h-80v-200q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v360q0 33-23.5 56.5T800-360h-80ZM160-80q-33 0-56.5-23.5T80-160v-360q0-33 23.5-56.5T160-600h480q33 0 56.5 23.5T720-520v360q0 33-23.5 56.5T640-80H160Zm400-603ZM400-340Z" /></svg>,
                        () => setWorkSpaceEditor(true),
                      ],
                      [
                        t("startMenuSide.console"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm187-200-76-76q-12-12-11.5-28t12.5-28q12-11 28-11.5t28 11.5l104 104q12 12 12 28t-12 28L328-308q-11 11-27.5 11.5T272-308q-11-11-11-28t11-28l75-76Zm173 160q-17 0-28.5-11.5T480-320q0-17 11.5-28.5T520-360h160q17 0 28.5 11.5T720-320q0 17-11.5 28.5T680-280H520Z" /></svg>,
                        () => Kiasole.toggle(),
                      ],
                    ] as ([string, JSX.Element, () => {}] | [string, JSX.Element, () => {}, boolean])[]).map((e, i) => <button
                      key={i}
                      hover-tips={e[0]}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        e[2]();
                        setStartMenu(false)
                      }}
                      style={{ marginTop: e[3] ? "auto" : "" }}
                    >{e[1]}</button>)
                  }
                </div>
              </div>

              <div className={style["Buttons"]}>
                {
                  ([
                    [
                      t("windowsType.postSearch"),
                      <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                      () => {
                        createWindow(wmRef, {
                          type: "postSearch",
                          data: {
                            nowPage: 1,
                            pageCache: [],
                            searchTags: [],
                          }
                        })
                      },
                      {
                        type: "postSearch",
                        data: {
                          nowPage: 1,
                          pageCache: [],
                          searchTags: [],
                        }
                      }
                    ],
                    [
                      t("windowsType.postGetByID"),
                      <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                      () => {
                        createWindow(wmRef, {
                          type: "postGetByID",
                          data: {
                            currentId: 5613429,
                            status: "loading",
                          }
                        })
                      },
                      {
                        type: "postId",
                        data: 5613429,
                      }
                    ],
                    [
                      t("windowsType.pool"),
                      <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                      () => {
                        createWindow(wmRef, {
                          type: "pool",
                          data: {
                            poolId: 44182,
                            nowPage: 1,
                            pageCache: {},
                          }
                        })
                      },
                      {
                        type: "poolId",
                        data: 44182
                      }
                    ],
                    [
                      t("windowsType.tmpList"),
                      <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                      () => acts.windows.tempList(),
                      {
                        type: "temp",
                      }
                    ],
                  ] as ([string, JSX.Element, () => {}, e621Type.DragItemType.defaul] | [string, JSX.Element, () => {}])[]).map((btn, i) => <div
                    key={i}
                    style={{
                      transitionDelay: DELAY_EFFECT(startMenu ? `${(i * .05) + .2}s` : "")
                    }}
                  >
                    <button
                      className={clsx(
                        dropMenuBtn === i && style["dropReady"]
                      )}
                      onClick={() => {
                        btn[2]()
                        setStartMenu(false)
                      }}

                      draggable={btn.length === 4}
                      onDragStart={ev => { btn[3] ? dragItem(ev, btn[3]) : ""; }}
                      onDrag={() => setStartMenu(false)}

                      onDragEnter={(e) => {
                        clearTimeout(dragTimeOut.current);
                        e.preventDefault();
                        setDropMenuBtn(i)
                        dragTimeOut.current = setTimeout(() => {
                          btn[2]();
                          setDropMenuBtn(-1)
                          setStartMenu(false);
                        }, 300);
                      }}

                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDropMenuBtn(-1)
                        clearTimeout(dragTimeOut.current);
                      }}

                      onDragOver={(e) => {
                        e.preventDefault();
                      }}

                    >
                      <div className={style["icon"]}>{btn[1]}</div>
                      <div className={style["name"]}>
                        <span>
                          {btn[0]}
                        </span>
                      </div>
                    </button>
                  </div>
                  )
                }
              </div>

            </div>

            {RunboxElement}

            <div className={style["SnapPreview"]}>
              <div
                style={snapStyle}
              />
            </div>

            <div className={style["Windows"]}>
              <div className={style["RightDrag"]}>
                {altRightDrag && (() => {
                  const { h, w, x, y } = altRightDrag
                  return <div
                    className={clsx(style["area"], style[altRightStatus])}
                    style={{
                      width: w,
                      height: h,
                      top: y,
                      left: x,
                    }}
                  />
                })()}
                {/* <input type="text" /> */}
              </div>
              <div ref={containerRef} className={style["WM"]} />
            </div>

            <div className={style["CancelDrag"]}>
              <div className={style["main"]} ref={dragCancelAreaRef}>
                <div className={style["bg"]} />

                <div className={style["btn"]}>
                  <div
                    className={style["area"]}
                    onDragEnter={e => { e.currentTarget.classList.add(style["activ"]) }}
                    onDragLeave={e => { e.currentTarget.classList.remove(style["activ"]) }}
                    onDrop={e => { e.currentTarget.classList.remove(style["activ"]); StopEvent(e) }}
                  >
                    <span>{t("Desktop.drag.Cancel")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={style["Bar"]}
            onDragEnter={e => { e.currentTarget.classList.add(style["activ"]) }}
            onDragLeave={e => { e.currentTarget.classList.remove(style["activ"]) }}
            onDrop={e => { e.currentTarget.classList.remove(style["activ"]); StopEvent(e) }}
          >
            <div className={style["Left"]}>
              <Button
                onDrop={e => { e.preventDefault(); e.stopPropagation(); }}
                status={startMenu ? "isOpen" : "icon"}
                title={t("taskBar.startMenu")}

                onClick={() => setStartMenu(e => {
                  if (!e) setRunBox(false);
                  return !e
                })}

                onDragEnter={(e) => {
                  e.preventDefault();
                  clearTimeout(dragTimeOut.current);

                  dragTimeOut.current = setTimeout(() => {
                    setStartMenu(e => {
                      if (!e) setRunBox(false);
                      return !e
                    });
                  }, 250);
                }}

                onDragLeave={(e) => {
                  e.preventDefault();
                  clearTimeout(dragTimeOut.current);
                }}

                onDragOver={(e) => {
                  e.preventDefault();
                }}

              >
                <svg width="37.812" height="32" viewBox="0 0 37.812 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M37.0567 17.2745L28.3305 32L9.48148 32L0 16L9.48148 3.33786e-06L28.3305 0L37.812 16L37.0567 17.2745L37.0567 17.2745ZM25.4815 27L32 16L25.4815 5L12.3305 5L5.81198 16L12.3305 27L25.4815 27L25.4815 27Z" fillRule="evenodd" transform="translate(0 -0)" />
                </svg>
              </Button>
            </div>
            <div className={style["List"]} overflow-bar-none="">
              {windowsList.map((win) => {
                const thisWindow = wmRef.current?.getWindow(win.id);
                return <Button
                  key={win.id}
                  status={thisWindow?.isMinimized ? "mini" : thisWindow?.isFocused ? "focus" : "blur"}
                  title={win.title}

                  onDragEnter={(e) => {
                    if (!e.dataTransfer) return;
                    wmRef.current?.bringToFront(win.id)
                  }}

                  onMouseEnter={(event) => {
                    if (!mouseIsPress) return
                    onClickEvent(event, windowAction(win.id))
                  }}

                  onMouseDown={() => {
                    setMouseIsPress(true)
                  }}

                  onClick={event => {
                    switch (event?.button) {
                      case 0: {
                        if (startMenu) {
                          setStartMenu(false);
                          thisWindow?.focus()
                          return;
                        }

                        if (thisWindow?.isTop) {
                          thisWindow?.minimize()
                        } else {
                          thisWindow?.focus()
                        }

                        return;
                      };
                    };
                  }}

                  onMouseUp={(event) => {
                    switch (event?.button) {
                      case 1: {
                        thisWindow?.close();
                        setMouseIsPress(false)
                        MenuAction.closeMenu()
                        return;
                      };

                      case 2: {
                        onClickEvent(event, windowAction(win.id))
                        return;
                      };
                    };
                  }}

                  onMouseMove={(event) => {
                    if (!mouseIsPress) return
                    event.stopPropagation();
                    onClickEvent(event, windowAction(win.id))
                  }}

                  onContextMenu={e => { e.preventDefault(); onClickEvent(e, windowAction(win.id)) }}
                >
                  {(() => {
                    const owo = wmRef.current?.getWindow(win.id)

                    switch (owo?.customData?.type) {
                      case "postSearch":
                        return <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>
                      case "post":
                      case "postGetByID":
                        return <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M780-120H180q-24.75 0-42.37-17.63Q120-155.25 120-180v-600q0-24.75 17.63-42.38Q155.25-840 180-840h600q24.75 0 42.38 17.62Q840-804.75 840-780v600q0 24.75-17.62 42.37Q804.75-120 780-120Zm-20-143H200v78h560v-78Zm-560-41h560v-78H200v78Zm0-129h560v-327H200v327Zm0 170v78-78Zm0-41v-78 78Zm0-129v-327 327Zm0 51v-51 51Zm0 119v-41 41Z" /></svg>
                      case "setting":
                        return <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M421-80q-14 0-25-9t-13-23l-15-94q-19-7-40-19t-37-25l-86 40q-14 6-28 1.5T155-226L97-330q-8-13-4.5-27t15.5-23l80-59q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-80-59q-12-9-15.5-23t4.5-27l58-104q8-13 22-17.5t28 1.5l86 40q16-13 37-25t40-18l15-95q2-14 13-23t25-9h118q14 0 25 9t13 23l15 94q19 7 40.5 18.5T669-710l86-40q14-6 27.5-1.5T804-734l59 104q8 13 4.5 27.5T852-580l-80 57q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l80 58q12 8 15.5 22.5T863-330l-58 104q-8 13-22 17.5t-28-1.5l-86-40q-16 13-36.5 25.5T592-206l-15 94q-2 14-13 23t-25 9H421Zm15-60h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Zm44-210q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-130Z" /></svg>

                    }
                  })()}
                </Button>
              })}
            </div>
            <div className={style["Right"]}>
              <TaskbarClock formats={nowSetting.appearance.clockFormat} />
            </div>
          </div>
        </div>

        <Background className={style["Background"]} bg={background} key={nowWorkSpace} />
      </div>

      <div className={style["BlurBackground"]}>
        <Background className={style["Background"]} bg={background} key={nowWorkSpace} />
      </div>
    </div >
  )
}

