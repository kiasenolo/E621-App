'use client'

import { useCallback, useEffect, useRef, useState, JSX } from "react"
import style from "./style.module.scss"
import winStyle from "@/data/components/Window/style.module.scss"
import { _app, Kiasole, newInput } from "@/app/_app"
import functions from "@/data/module/functions"
import React from "react"
import HeadSetting from "@/data/components/HeadSetting"
import clsx from "clsx/lite"
import useLocalStorage from "@/data/module/use/LocalStorage"
import { ElectrApiType } from "../type"
import { newEmptyAccount } from "./core/appStorage"
import * as WSAction from "./core/appStorage"
import { Desktop } from "./screen/Desktop"
import { Login } from "./screen/Login"
import StorageSelect from "./screen/StorageSelect"
import { APP_READY, ELECTRON_APP_INFO_NOREADY, ELECTRON_APP_INFO_TYPE, ELECTRON_WIN_STATE, NOW_STORAGE, READY, SET_APP_READY, SET_E621_BASE_URL, SET_ELECTRON_WIN_STATE, SET_READY, STORAGE_SELECT_MODE, WSA, _setNowSetting, apiCore, appName, appTitle, bindState, defaultE926, displayDesktop, electronAppIsReady, electronMode, electronSetTitle, electronWinAction, isLogin, nowSaveInfo, setAppTitle, setBaseUrlLoaded, setCanCors, setElectronMode, setForseUseProxy, setNowSaveInfo, setStorage, setWSA, storage, usrIndx } from "./core/globals"
import { debugMenu, ent, otherMenu, setNowSetting } from "./core/helpers"
import { fuckingState } from "./core/hooks"
import { Menu } from "./ui/DesktopParts"
import { ErrFrame } from "./ui/ErrFrame"

export function App() {
  bindState.isLogin(useState(false));
  bindState.displayDesktop(useState(false));
  bindState.appReady(useState(false));
  bindState.offlineMode(useState(false));
  bindState.baseUrl(useState(defaultE926));
  bindState.electronWin(useState<ELECTRON_APP_INFO_TYPE>(ELECTRON_APP_INFO_NOREADY));
  bindState.nowSetting(useState(newEmptyAccount.setting));
  bindState.nowSaveInfo(useState(newEmptyAccount.saveInfo));
  bindState.importing(useState<boolean>(false))


  const [electronLoadError, setElectronLoadError] = useState<boolean>(false)
  const [electronLoadErrorMsg, setElectronLoadErrorMsg] = useState<string[]>([])
  const [electronLoadWarn, setElectronLoadWarn] = useState<boolean>(false)
  const [skipLoadWarn, setSkipLoadWarn] = useState<boolean>(false)

  const [isElectronVerifyed, setIsElectronVerifyed] = useState<boolean>(false)

  const [keyIsDown, _keyIsDown] = useState(false)
  const [hide, _hide] = useState(false)
  const [ready, _ready] = useState(false)
  const TIMEOUT = 1.3e3;

  const res = fuckingState.resolution()
  const frsStart = useRef(true)
  const isInElectron = () => navigator.appVersion.toLowerCase().includes("electron")

  // #region Electron 相關的東西

  /* 驗證 Electron */
  useEffect(() => {
    if (!electronMode) { SET_APP_READY(true); return }
    if (!isInElectron() && !skipLoadWarn) {
      setElectronLoadWarn(true)
      return
    }
    const havError = (msg: string[]) => {
      setElectronLoadError(true)
      setElectronLoadErrorMsg(msg)
    }

    const errMsgs: string[] = []
    const { electronAPI } = window
    if (electronAPI) {
      const functionsList: [any, string][] = [
        [electronAPI.setMenu ?? undefined, "setMenu"],
        [electronAPI.windowAction ?? undefined, "windowAction"],
        [electronAPI.setTitle ?? undefined, "setTitle"],
        [electronAPI.appReady ?? undefined, "appReady"],
      ]

      for (let index = 0; index < functionsList.length; index++) {
        const func = functionsList[index];
        if (!func[0]) errMsgs.push(`window.electronAPI.${func[1]} 缺失`)
      }

      if (errMsgs.length > 0) return havError(errMsgs)

    } else {
      return havError(["window.electronAPI 缺失"])
    }
    setIsElectronVerifyed(true)
    SET_APP_READY(true)
  }, [APP_READY, skipLoadWarn, electronLoadWarn, isElectronVerifyed])

  /* Error Message */
  const eRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!electronMode) return;

    if (!(electronLoadError || electronLoadWarn)) return;
    if (isElectronVerifyed) return;

    void eRef.current!.clientHeight
    _ready(true)
  }, [
    electronLoadError,
    electronLoadWarn,
    isElectronVerifyed,
  ])

  /* 初始化 Electron */
  useEffect(() => {
    if (!isElectronVerifyed) return;
    electronAppIsReady()
  }, [APP_READY, isElectronVerifyed])

  /* AppMenu 的 Event */
  useEffect(() => {
    if (!isElectronVerifyed) return;
    document.addEventListener("APP-MENU-CLICK", (e) => {
      const id = e.detail.id

      const prefixHandlers: [string, (arg: string) => void][] = [
        [
          "appWin.act.",
          (arg) => electronWinAction(arg as ElectrApiType.WindowAction)
        ]
      ];

      for (const [prefix, fn] of prefixHandlers) {
        if (id.startsWith(prefix)) return fn(id.slice(prefix.length));
      }

      switch (id) {

        case "debug.clearConsole": {
          console.clear();
          break;
        }
        case "debug.kiasole": {
          Kiasole.toggle()
          break;
        }

        case "debug.remount": {
          SET_APP_READY(false)
          setTimeout(() => {
            SET_APP_READY(true)
          }, 50);
          break;
        }
      }
    });
  }, [isElectronVerifyed])

  /* 同步視窗狀態 */
  useEffect(() => {
    if (!isElectronVerifyed) return;
    const updateState = (e: CustomEvent<ELECTRON_APP_INFO_TYPE>): void => {
      SET_ELECTRON_WIN_STATE(e.detail)
    }

    document.addEventListener("WIN-STATE", updateState)
    return () => {
      document.removeEventListener("WIN-STATE", updateState)
    }
  }, [isElectronVerifyed])

  /* 更新 Menu */
  useEffect(() => {
    if (!isElectronVerifyed) return;
    if (!isLogin) window.electronAPI.setMenu([
      ...otherMenu(ent),
      debugMenu(ent)
    ])
  }, [ELECTRON_WIN_STATE, isLogin, isElectronVerifyed])

  /* 更新視窗標題 */
  useEffect(() => {
    if (!isElectronVerifyed) return;
    electronSetTitle(appTitle);
  }, [isLogin, appTitle, isElectronVerifyed])

  // #endregion

  /* 更新標題 */
  useEffect(() => {
    if (isLogin) return setAppTitle(`${appName} [ ${nowSaveInfo.user.name} ]`);
    setAppTitle(appName);
  }, [isLogin, nowSaveInfo])


  useEffect(() => {
    const mousedown = (e: MouseEvent) => {
      if (e.button === 4 || e.button === 3)
        e.preventDefault();
    }

    const keydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "AltLeft":
        case "AltRight":
        case "F1":
          { e.preventDefault(); return; }
      }
    }

    document.addEventListener("mousedown", mousedown)
    document.addEventListener("mouseup", mousedown)
    document.addEventListener("keydown", keydown)


    return () => {
      document.removeEventListener("mousedown", mousedown)
      document.removeEventListener("mouseup", mousedown)
      document.removeEventListener("keydown", keydown)
    }
  }, [])

  useEffect(() => {
    if (!isLogin || !usrIndx) { setBaseUrlLoaded(false); return; }

    (async () => {
      try {
        const setting = await (await WSA.userSetting(usrIndx)).get();
        const saveInfo = await (await WSA.userSaveInfo(usrIndx)).get();

        const url = saveInfo.user.baseUrl ?? defaultE926
        apiCore.setBaseURL(url)
        setBaseUrlLoaded(true)
        SET_E621_BASE_URL(url)

        setNowSetting(setting);
        setNowSaveInfo(saveInfo);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    })();
  }, [isLogin, usrIndx]);

  useEffect(() => {
    if (!APP_READY) return;
    const onSaveInfo = (e: any) => {
      if (e.detail.userId === usrIndx) setNowSaveInfo(e.detail.value);
    };
    const onSetting = (e: any) => {
      if (e.detail.userId === usrIndx) setNowSetting(e.detail.value);
    };

    WSA.addEventListener("user:saveInfoSet", onSaveInfo);
    WSA.addEventListener("user:settingSet", onSetting);
    return () => {
      WSA.removeEventListener("user:saveInfoSet", onSaveInfo);
      WSA.removeEventListener("user:settingSet", onSetting);
    };
  }, [APP_READY]);

  useEffect(() => {
    if (!isLogin) {
      setNowSetting(newEmptyAccount.setting)
      setNowSaveInfo(newEmptyAccount.saveInfo)
    }
  }, [isLogin])

  useEffect(() => {
    if (!APP_READY) return;
    _app.hideColorPanel(true)

    return () => {
      _app.hideColorPanel(false)
    }
  }, [APP_READY])

  useEffect(() => {
    if (!APP_READY) return;
    if (frsStart.current) { frsStart.current = false; return; };
    const ele = document.getElementById(style["Resolution"])!
    ele.classList.add(style["hide"])
    return () => {
      ele.classList.remove(style["hide"])
      void ele.clientHeight
    }
  }, [APP_READY, res])

  const startAnimation = useCallback(async () => {
    _hide(true)
    _keyIsDown(true)
    await functions.timeSleep(TIMEOUT)
    void eRef.current?.clientHeight
    _ready(false)
    _hide(false)
    _keyIsDown(false)
  }, [])

  const DontUseElectronMode = useCallback(async () => {
    const base = async () => {
      await startAnimation()
      setElectronMode(false)
      functions.UrlParamsTools.removeParams("electron")
      SET_READY(false)
      await functions.timeSleep(50)
      SET_READY(true)
    }
    if (isInElectron()) {
      return newInput.message([
        "可是你確實身在一個electron的環境裡面誒",
        "你確定你要停用electronMode?",
        "如果你的loader預設是沒有frame的 你會很痛苦誒 你東西會關不掉",
      ].join("<br />"),
        [
          {
            name: "蛤？那算了",
            value: ""
          },
          {
            name: "我有frame包可以的兄弟",
            value: "IM-FUCKING-GOOD"
          }
        ], (e) => { if (e === "IM-FUCKING-GOOD") base() })
    }
    await base()
  }, [])

  const SkipWarn = useCallback(async () => {
    await startAnimation()
    setSkipLoadWarn(true)
  }, [])

  const Content = (() => {

    const loaderRepoLink = "https://github.com/kiasenolo/project-kilo-electron-loader";

    const electronLoader = {
      href: loaderRepoLink,
      target: "_blank",
      rel: "@kiasenolo/project-kilo-electron-loader",
      "hover-tips": loaderRepoLink,
      "kilo-style": "",
    }

    if (electronMode) {
      if (electronLoadWarn) {
        if (!skipLoadWarn) {
          return <ErrFrame
            key={"warn-1"}
            ref={eRef}
            ready={ready}
            hide={hide}
            ctns={[
              <h1>{"警告"}</h1>,
              <p>{"你人似乎不在Electron的環境裏面 也許是我的問題"}</p>,
              <p>{"這只是個警告 你可以選擇忽略這個警告"}</p>,
              <p>
                {"如果你想要使用electronLoader的話 可以來"}
                <a {...electronLoader}>{"這裏看看"}</a>
              </p>,
              <p>{"需要自己手動裝 會麻煩 但如果你願意的話 還是可以用一下的"}</p>,
              <div className={style["btns"]}>
                <button
                  onClick={_ => DontUseElectronMode()}
                  className={clsx(keyIsDown && style["pressed"])}
                >{"不使用 Electron 模式"}</button>
                <button
                  onClick={_ => SkipWarn()}
                  className={clsx(keyIsDown && style["pressed"])}
                >{"忽略警告（不推薦）"}</button>
              </div>,
            ]}
          />
        }
      }

      if (electronLoadError) {
        if (skipLoadWarn) return <ErrFrame
          key={"error-1"}
          ref={eRef}
          ready={ready}
          hide={hide}
          ctns={[
            <h1>{"錯誤"}</h1>,
            <p>{"好 你似乎真的不在一個electron的環境裡面"}</p>,
            <p>{"?electron 這個參數是給我的electron loder用的"}</p>,
            <p>
              {"同上一則警告 那 這邊我直接丟"}
              <a {...electronLoader}>{"連接"}</a>
              {"就好了"}
            </p>,
            <div className={style["btns"]}>
              <button
                onClick={_ => DontUseElectronMode()}
                className={clsx(keyIsDown && style["pressed"])}
              >{"不使用 Electron 模式"}</button>
              <button
                onClick={_ => window.open(loaderRepoLink)}
                className={clsx(keyIsDown && style["pressed"])}
              >{"那我去下載loader"}</button>
            </div>,

            <h2>{"[ 詳細資料 ]"}</h2>,
            ...electronLoadErrorMsg.map(e => <h3>{e}</h3>),
          ]}
        />

        return <ErrFrame
          key={"error-2"}
          ref={eRef}
          ready={ready}
          hide={hide}
          ctns={[
            <h1>{"錯誤"}</h1>,
            <p>{"你的electron環境 有點問題"}</p>,
            <p>{"主要是過不了基礎驗證 功能缺失"}</p>,
            <p>{"你可能需要更新你的electron框架"}</p>,
            <p>
              {"你可以去"}
              <a {...electronLoader}>{"這裡"}</a>
              {"拿到新版本的electron框架"}
            </p>,

            <div className={style["btns"]}>
              <button
                onClick={_ => DontUseElectronMode()}
                className={clsx(keyIsDown && style["pressed"])}
              >{"不使用 Electron 模式"}</button>
              <button
                onClick={_ => window.open(loaderRepoLink)}
                className={clsx(keyIsDown && style["pressed"])}
              >{"那我去更新loader"}</button>
            </div>,

            <h2>{"[ 詳細資料 ]"}</h2>,
            ...electronLoadErrorMsg.map(e => <h3>{e}</h3>),
          ]}
        />
      }
    }

    if (APP_READY)
      return <div id={style["Frame"]} >
        {!isLogin ? <Login key={usrIndx} /> : <></>}
        {(isLogin && displayDesktop) ? <Desktop key={usrIndx} /> : <></>}
      </div >

  })()

  const win = (
    <div
      className={clsx(
        winStyle["window"],
        winStyle["active"],
        winStyle["nonTransparens"],
        ELECTRON_WIN_STATE.isFocused ? "" : winStyle["blurred"],
      )}
    >
      <div className={winStyle["title"]} style={{ display: ELECTRON_WIN_STATE.isFullScreen ? "none" : "" }}>
        <span className={winStyle["text"]}>{appTitle}</span>
        <span className={winStyle["btns"]}>
          <div className={clsx(winStyle["DropArea"], style["electron-drag"])}></div>
          {isElectronVerifyed ?
            <>
              <div className={winStyle["btn3"]} onClick={() => electronWinAction("MINI")} onContextMenu={() => electronWinAction("HIDE")}>
                <div className={winStyle["icon"]}>
                  <svg width="22" height="3" viewBox="0 0 22 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0L20 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                  </svg>
                </div>
                <div className={winStyle["bg"]} />
              </div>
              <div className={winStyle["btn2"]} onClick={() => ELECTRON_WIN_STATE.isMaximized ? electronWinAction("RSTR") : electronWinAction("MAXI")}>
                <div className={winStyle["icon"]}>
                  {ELECTRON_WIN_STATE.isMaximized ? (
                    <svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0L10 4L20 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                    </svg>
                  ) : (
                    <svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 4L10 0L20 4" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                    </svg>
                  )}
                </div>
                <div className={winStyle["bg"]} />
              </div>
              <div className={winStyle["btn1"]} onClick={() => electronWinAction("CLOSE")} onContextMenu={() => electronWinAction("KILL")}>
                <div className={winStyle["icon"]}>
                  <svg width="28.28" height="28.28" viewBox="0 0 28.28 28.28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path d="M0 0L14.1421 14.1421" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                      <path d="M0 14.1421L14.1421 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                    </g>
                  </svg>
                </div>
                <div className={winStyle["bg"]} />
              </div>
            </>
            :
            <div className={winStyle["btn1"]} onClick={() => window.close()} onContextMenu={() => window.close()}>
              <div className={winStyle["icon"]}>
                <svg width="28.28" height="28.28" viewBox="0 0 28.28 28.28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g>
                    <path d="M0 0L14.1421 14.1421" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                    <path d="M0 14.1421L14.1421 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                  </g>
                </svg>
              </div>
              <div className={winStyle["bg"]} />
            </div>
          }
        </span>
      </div >
      <div className={clsx(winStyle["content"], style["winBackground"])}>
        {Content}
      </div>
    </div >
  )

  return (<div
    id={style["APP"]}
  >
    <div id={style["Resolution"]} className={style["hide"]}>
      <div>{res[0]}x{res[1]}</div>
    </div>
    <Menu />
    {electronMode ?
      win
      :
      Content
    }
  </div>);
}

export default function E621App() {
  bindState.appTitle(useState(appName));
  bindState.ready(useState(false));
  bindState.offlineMode(useLocalStorage("E621-APP/OFFLINE", false));
  bindState.storageSelectMode(useLocalStorage("E621-APP/storageSelect", false));
  bindState.nowStorage(useLocalStorage("E621-APP/nowStorage", "Main"));

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => setStorage(NOW_STORAGE), [NOW_STORAGE])

  useEffect(() => {
    const urlParams = new URL(window.location.toString()).searchParams

    if (urlParams.has("electron")) {
      setElectronMode(true);
      setCanCors(true);
    }

    if (STORAGE_SELECT_MODE) {
      SET_READY(false);
      setAppTitle("Select Storage...")
      return
    }

    if (urlParams.has("forseUseProxy")) {
      setForseUseProxy(true)
    }

    setWSA(new WSAction.WorkSpaceActions(storage, () => {
      SET_READY(true)
    }, false))
  }, [STORAGE_SELECT_MODE])

  if (!mounted) return <HeadSetting title={appTitle} />

  if (STORAGE_SELECT_MODE) return <>
    <HeadSetting title={appTitle} />
    <StorageSelect />
  </>

  return (<>
    <HeadSetting title={appTitle} />
    {READY && <App />}
  </>)
}
