import { useCallback, useEffect, useRef, useState, JSX, Fragment } from "react"
import style from "./style.module.scss"
import { _app, newInput } from "@/app/_app"
import { cloneDeep } from "lodash"
import functions from "@/data/module/functions"
import KiloDown from "@/data/components/KiloDown"
import React from "react"
import PACKAGE_LIST from "@/package.json"
import clsx from "clsx/lite"
import * as e621Type from "../../types/appTypes"
import * as workSpaceType from "../../types/workSpaceType"
import { newEmptyAccount } from "../../core/appStorage"
import langList from "../../langList/_langList"
import { E621_BASE_URL, MenuButtonType, SET_E621_BASE_URL, SET_READY, WSA, baseUrlList, disableWindowKeyEvent, nowSaveInfo, nowSetting, setImporting, setIsLogin, usrIndx, wmRef } from "../../core/globals"
import { DELAY_EFFECT, SetS, acts, dragItem, getWindowTitle, t } from "../../core/helpers"
import { fuckingState } from "../../core/hooks"
import { MenuAction } from "../../core/menuAction"
import { SettingEditor } from "../../core/settingEditor"
import { Background, ClockPreview } from "../../ui/DesktopParts"
import { NODATA } from "../../ui/NoData"
import { WINDOW_FRAME, windowAction } from "../../ui/WindowFrame"

export const setting = function () {
  const windowID = `app-setting`;
  const thisWindow = wmRef.current?.getWindow(windowID)!;

  const { settingTabs } = e621Type.window.dataType
  const [nowPage, setNowPage] = useState<e621Type.window.dataType.settingTabs._All>("NONE")
  const [showIndex, setShowIndex] = useState<boolean>(false)
  const [showTabs, setShowTabs] = useState<boolean>(false)

  const tCategory = (cat: string) => {
    const capCat = functions.str.capitalizeWords(cat);
    return t(`setting.${capCat}` as any);
  };

  const tPage = (cat: string, page: string) => {
    const capCat = functions.str.capitalizeWords(cat);
    let p = page;
    return t(`setting.${capCat}.${p}` as any);
  };

  useEffect(() => {
    if (thisWindow.customData?.type === "setting")
      setNowPage(thisWindow.customData.data)
  }, []);

  useEffect(() => {
    thisWindow?.setData({
      type: "setting",
      data: nowPage
    });

    thisWindow?.setTitle(getWindowTitle({ type: "setting", data: nowPage }));
  }, [nowPage]);

  type PageBtn = {
    nowPage: e621Type.window.dataType.settingTabs._All;
  };

  type Page = {
    children?: JSX.Element,
  };

  const Page = useCallback(({ children }: Page) => {
    const [start, setStart] = useState<boolean>(false)

    const eRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    return <div ref={eRef} className={clsx(style["page"], start && style["START"])}>
      <div>
        {children}
      </div>
    </div>
  }, []);

  const PageButtonsList = useCallback(({ nowPage }: PageBtn) => {
    const [start, setStart] = useState<boolean>(false)
    const [backing, setBacking] = useState<boolean>(false)

    const eRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    useEffect(() => {
      let animationId: NodeJS.Timeout
      let keyispress = false

      const changePage = (offset: number) => {
        setNowPage(e => {
          const _ = cloneDeep(e)
          if (_ === "NONE") return _;

          const list = settingTabs.categorieList;

          let nowtar = list.indexOf(_.categorie);
          let count = list.length;

          nowtar += offset; nowtar = (nowtar % count + count) % count;

          _.categorie = list[nowtar];
          _.pages = settingTabs.pageList[_.categorie][0] as any

          return _
        })
      }

      const changeTab = (offset: number) => {
        setNowPage(e => {
          const _ = cloneDeep(e)
          if (_ === "NONE") return _;

          const list = settingTabs.pageList[_.categorie];

          let nowtar = list.indexOf(_.pages);
          let count = list.length;

          nowtar += offset; nowtar = (nowtar % count + count) % count;

          _.pages = list[nowtar] as any;

          return _
        })
      }

      const isFocus = () => !wmRef.current?.getWindow(thisWindow.id)?.isFocused;

      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
        setShowTabs(e.shiftKey && e.ctrlKey)
        if (isFocus()) return;
        if (keyispress) return;

        if (e.shiftKey) {
          if (e.ctrlKey) {

            switch (e.code) {
              case "ArrowLeft": {
                changePage(-1)
                e.preventDefault();
                break;
              }
              case "ArrowRight": {
                changePage(1)
                e.preventDefault();
                break;
              }
              case "ArrowUp": {
                changeTab(-1)
                e.preventDefault();
                break;
              }
              case "ArrowDown": {
                changeTab(1)
                e.preventDefault();
                break;
              }
            }

            return;
          }
          return;
        }

        keyispress = true

        switch (e.code) {
          case "Escape": {
            setBacking(true)
            animationId = setTimeout(() => {
              setNowPage("NONE")
              setBacking(false)
            }, .5e3)
            break
          }
        }

      }

      const keyup = (e: KeyboardEvent) => {
        if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
        setShowTabs(e.shiftKey && e.ctrlKey)
        if (isFocus()) return;
        keyispress = false
        switch (e.code) {
          case "Escape": {
            clearTimeout(animationId);
            setBacking(false)
          }
        }
      }

      const onwheel = (e: WheelEvent) => {
        if (disableWindowKeyEvent) return;
        if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
        if (!e.ctrlKey) return;
        e.preventDefault();
        if (e.shiftKey) {
          if (e.deltaY > 0) {
            changePage(1)
          } else if (e.deltaY < 0) {
            changePage(-1)
          }
        } else {
          if (e.deltaY > 0) {
            changeTab(1)
          } else if (e.deltaY < 0) {
            changeTab(-1)
          }
        };
      }

      document.addEventListener("keydown", keydown)
      document.addEventListener("keyup", keyup)
      document.addEventListener("wheel", onwheel, { passive: false })

      return () => {
        document.removeEventListener("keydown", keydown)
        document.removeEventListener("keyup", keyup)
        document.removeEventListener("wheel", onwheel)
      }

    }, [])

    if (nowPage === "NONE") return;

    return <div className={clsx(style["list"], start && style["START"])} ref={eRef}>
      <div
        className={clsx(style["buttonFrame"], style["frist"], backing && style["backing"])}
      >
        <button onClick={() => setNowPage("NONE")}>
          {t("setting.Back")}
        </button>
        <div className={style["backMask"]}>
          {t("setting.Back")}
        </div>
      </div>

      {settingTabs.pageList[nowPage.categorie].map((e, i) =>
        <div
          className={style["buttonFrame"]}
          style={{
            transitionDelay: DELAY_EFFECT(`${i * .05 + .05}s`)
          }}
          key={i}
        >
          <button
            className={clsx(nowPage.pages === e && style["activ"])}
            key={i}
            onClick={() => setNowPage({ categorie: nowPage.categorie, pages: e as any })}
          >
            {tPage(nowPage.categorie, e as string)}
          </button>
        </div>
      )}
    </div>
  }, []);

  const PasswordInput = useCallback((props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const [view, setView] = useState(false)
    const v = (e: any, state: boolean) => { e.preventDefault(); setView(state) }
    return (
      <div className={style["PasswordInput"]}>
        <input
          {...props}
          kiase-sty=""
          type={view ? "text" : "password"}
        />
        <button
          kiase-sty=""
          non-pad=""
          svg-icon=""
          onMouseDown={e => v(e, true)}
          onMouseUp={e => v(e, false)}
          onTouchStart={e => v(e, true)}
          onTouchEnd={e => v(e, false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M599-361q49-49 49-119t-49-119q-49-49-119-49t-119 49q-49 49-49 119t49 119q49 49 119 49t119-49Zm-187-51q-28-28-28-68t28-68q28-28 68-28t68 28q28 28 28 68t-28 68q-28 28-68 28t-68-28ZM220-270.5Q103-349 48-480q55-131 172-209.5T480-768q143 0 260 78.5T912-480q-55 131-172 209.5T480-192q-143 0-260-78.5ZM480-480Zm207 158q95-58 146-158-51-100-146-158t-207-58q-112 0-207 58T127-480q51 100 146 158t207 58q112 0 207-58Z" /></svg>
        </button>
      </div>
    )
  }, [])

  const Pages = useCallback(({ nowPage }: PageBtn) => {
    if (nowPage === "NONE") return "none :p"

    const NowPage = () => {
      switch (nowPage.categorie) {
        case "search": {
          switch (nowPage.pages) {
            case "general": {

              const [defSrchSet, setDefSrchSet] = useState(nowSetting.search.defaultSearchFilter)

              useEffect(() => {
                (async () => {
                  const _set = await WSA.userSetting(usrIndx);
                  const get = await _set.get();
                  get.search.defaultSearchFilter = defSrchSet;
                  _set.set(get)
                })()
              }, [defSrchSet])

              return <>
                <KiloDown.Subtitle>{t("setting.Search.defaultSearchFilter")}</KiloDown.Subtitle>

                <KiloDown.Thirdtitle>{t("windowsType.postSearch.filter.rating")}</KiloDown.Thirdtitle>
                <div className={style["buttonList"]}>
                  {
                    ([
                      [defSrchSet.rating?.s, "s"],
                      [defSrchSet.rating?.q, "q"],
                      [defSrchSet.rating?.e, "e"],
                    ] as [boolean, ("s" | "q" | "e")][]).map(rat => {
                      return <button
                        kiase-sty=""
                        key={rat[1]}
                        className={clsx(rat[0] && style["activ"])}
                        onClick={() => {
                          setDefSrchSet(prev => ({
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
                <KiloDown.Thirdtitle>{t("windowsType.postSearch.filter.type")}</KiloDown.Thirdtitle>
                <div className={style["buttonList"]}>
                  {
                    ([
                      [defSrchSet.type?.vid, "vid"],
                      [defSrchSet.type?.gif, "gif"],
                      [defSrchSet.type?.pic, "pic"],
                    ] as [boolean, ("vid" | "gif" | "pic")][]).map(tType => (
                      <button
                        kiase-sty=""
                        key={tType[1]}
                        className={clsx(tType[0] && style["activ"])}
                        onClick={() => {
                          setDefSrchSet(prev => ({
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
                <KiloDown.Thirdtitle>{t("windowsType.postSearch.filter.sortBy")}</KiloDown.Thirdtitle>
                <div className={style["buttonList"]}>
                  {
                    ([
                      "newest", "score", "favs", "size"
                    ] as ("newest" | "score" | "favs" | "size")[]).map(sort => {
                      return <button
                        kiase-sty=""
                        key={sort}
                        className={clsx(sort === "newest" ? "" : sort === defSrchSet.sortBy && style["activ"])}
                        onClick={() => {
                          setDefSrchSet(prev => ({
                            ...prev,
                            sortBy: sort
                          }))
                        }}
                      >{t("windowsType.postSearch.filter.sortBy." + sort as any)}</button>
                    })
                  }
                </div>
                <br />
                <button
                  kiase-sty=""
                  className={clsx(defSrchSet.reverse && style["activ"])}
                  onClick={() => {
                    setDefSrchSet(prev => ({
                      ...prev,
                      reverse: !prev.reverse
                    }))
                  }}
                >{t("windowsType.postSearch.filter.sortBy.reverse")}</button>
              </>
            }
            case "tags": {

              return <></>
            }
            case "history": {

              return <></>
            }
            case "export/import": {

              return <></>
            }
          }
        }

        case "account": {
          switch (nowPage.pages) {
            case "local": {

              const [nameMsg, setNameMsg] = useState<string>("")
              const [passMsg, setPassMsg] = useState<string>("")

              const [currentPass, setCurrentPass] = useState<string>("")
              const [newPass, setNewPass] = useState<string>("")
              const [newPassAgain, setNewPassAgain] = useState<string>("")

              const [nowUserName, setnowUserName] = useState<string>(nowSaveInfo.user.name)
              const [currentName, setCurrentName] = useState<string>(nowUserName)

              const nowPass = nowSaveInfo.user.passKey

              useEffect(() => { setnowUserName(nowSaveInfo.user.name) }, [nowSaveInfo.user.name])

              const setPass = useCallback((pass?: string) => {
                SetS.appState(e => {
                  e.rememberPassword = pass || ""
                  return e
                })
                SetS.usrInfo(usrIndx, e => {
                  e.user.passKey = pass
                  return e
                })
              }, [])

              const clearInput = useCallback(() => {
                setCurrentPass("")
                setNewPass("")
                setNewPassAgain("")
              }, [])

              const setPassKey = useCallback((del?: boolean) => {
                if (nowPass) {
                  if (nowPass !== currentPass) { setPassMsg(t("setting.Account.local.changePassword.notic.noMatch")); return; };
                  if (del) {
                    setPassMsg("")
                    newInput.message(t("setting.Account.local.changePassword.pop.areYouSure"), [
                      { name: t("setting.Account.local.changePassword.pop.yes"), value: "yes", key: "Delete" },
                      { name: t("setting.Account.local.changePassword.pop.no"), value: "" },
                    ], (e) => {
                      if (e === "yes") {
                        setTimeout(() => {
                          newInput.message(t("setting.Account.local.changePassword.pop.hasGone"))
                        }, .5e3);
                        setPass()
                        clearInput()
                      }
                    })
                  } else {
                    if (newPass !== newPassAgain) { setPassMsg(t("setting.Account.local.changePassword.notic.newNoMatch")); return; }
                    setPassMsg("")
                    setPass(newPass)
                    newInput.message(t("setting.Account.local.changePassword.pop.hasChange"))
                    clearInput()
                  }
                } else {
                  setPass(currentPass)
                  newInput.message(t("setting.Account.local.setPassword.pop.success"))
                  clearInput()
                }
              }, [
                currentPass,
                newPass,
                newPassAgain,
                nowSaveInfo.user.passKey
              ])

              const setUserName = useCallback((restore?: boolean) => {
                if (restore) {
                  setCurrentName(nowUserName)
                  return;
                }

                if (currentName) {
                  setNameMsg("")
                  newInput.message(t("setting.Account.local.changeUserName.confirm").replace("$1", currentName), [
                    { name: t("setting.Account.local.changeUserName.nice"), value: "yes", key: "Enter" },
                    { name: t("setting.Account.local.changeUserName.no"), value: "no", key: "Escape" },
                  ], (e) => {
                    if (e === "yes") {
                      SetS.usrInfo(usrIndx, e => {
                        e.user.name = currentName
                        return e
                      })
                    }
                  })
                } else {
                  setNameMsg(t("setting.Account.local.changeUserName.nameIsEmpty"))
                }
              }, [currentName, nowUserName])

              return <div className={style["Account"]}>
                <KiloDown.Subtitle>{t("setting.Account.local.changeUserName")}</KiloDown.Subtitle>
                <br />
                {nameMsg ? <>
                  <span>{nameMsg}</span>
                  <br />
                  <br />
                </> : ""}
                <input
                  kiase-sty=""
                  placeholder={t("setting.Account.local.changeUserName.name")}
                  type="text"
                  onChange={e => setCurrentName(e.currentTarget.value)}
                  value={currentName}
                />
                <br />
                <br />
                <div className={style["buttonList"]}>
                  <button kiase-sty="" disabled={nowUserName === currentName} onClick={() => setUserName()}>{t("setting.Account.local.changeUserName.update")}</button>
                  <button kiase-sty="" disabled={nowUserName === currentName} onClick={() => setUserName(true)}>{t("setting.Account.local.changeUserName.restore")}</button>
                </div>

                <br />
                <br />

                {nowPass ?
                  <>
                    <KiloDown.Subtitle>{t("setting.Account.local.changePassword")}</KiloDown.Subtitle>
                    <br />
                    {passMsg ? <>
                      <span>{passMsg}</span>
                      <br />
                      <br />
                    </> : ""}
                    <PasswordInput
                      placeholder={t("setting.Account.local.changePassword.current")}
                      onChange={e => setCurrentPass(e.currentTarget.value)}
                      value={currentPass}
                    />
                    <br />
                    <br />
                    <PasswordInput
                      placeholder={t("setting.Account.local.changePassword.new")}
                      onChange={e => setNewPass(e.currentTarget.value)}
                      value={newPass}
                    />
                    <br />
                    <br />
                    <PasswordInput
                      placeholder={t("setting.Account.local.changePassword.newAgain")}
                      onChange={e => setNewPassAgain(e.currentTarget.value)}
                      value={newPassAgain}
                    />
                    <br />
                    <br />
                    <div className={style["buttonList"]}>
                      <button kiase-sty="" disabled={!(currentPass && newPass && newPassAgain)} onClick={() => setPassKey()}>{t("setting.Account.local.changePassword.update")}</button>
                      <button kiase-sty="" disabled={!(currentPass)} onClick={() => setPassKey(true)}>{t("setting.Account.local.changePassword.remove")}</button>
                    </div>
                  </>
                  :
                  <>
                    <KiloDown.Subtitle>{t("setting.Account.local.setPassword")}</KiloDown.Subtitle>
                    <br />
                    <PasswordInput
                      placeholder={t("setting.Account.local.setPassword.new")}
                      onChange={e => setCurrentPass(e.currentTarget.value)}
                      value={currentPass}
                    />
                    <br />
                    <br />
                    <button kiase-sty="" disabled={!currentPass} onClick={() => setPassKey()}>{t("setting.Account.local.setPassword.setPass")}</button>
                  </>}

                <br />
                <br />
                <br />
                <button kiase-sty="" onClick={() => {
                  newInput.message(t("setting.Account.local.deleteAccount.1"), [
                    { name: t("setting.Account.local.deleteAccount.1.yes"), value: "yes", key: "Enter" },
                    { name: t("setting.Account.local.deleteAccount.1.no"), value: "" },
                  ], (e) => {
                    if (e === "yes") {
                      setTimeout(() => {

                        newInput.message(t("setting.Account.local.deleteAccount.2"), [
                          { name: t("setting.Account.local.deleteAccount.2.yes"), value: "yes", key: "Enter" },
                          { name: t("setting.Account.local.deleteAccount.2.no"), value: "" },
                        ], (e) => {
                          if (e === "yes") {
                            setTimeout(() => {

                              newInput.message(t("setting.Account.local.deleteAccount.3"), [
                                { name: t("setting.Account.local.deleteAccount.3.yes"), value: "yes", key: "Delete" },
                                { name: t("setting.Account.local.deleteAccount.3.no"), value: "" },
                              ], (e) => {
                                if (e === "yes") {
                                  WSA.deleteUser(usrIndx).then(async () => {
                                    const appState = await WSA.getAppStatus();
                                    await WSA.setAppStatus({ ...appState, autoLogin: false, rememberPassword: "", lastUser: 0 });
                                    setIsLogin(false);
                                  });
                                }
                              })

                            }, .5e3);
                          }
                        })

                      }, .5e3);
                    }
                  })
                }}>{t("setting.Account.local.deleteAccount")}</button>
              </div>
            }
            case "avatar": {
              const [avaCfg, setAvaCfg] = useState<workSpaceType.Unit.BaseItem.Image>({
                url: ""
              })

              useEffect(() => {
                setAvaCfg(nowSaveInfo.user.avatar);
              }, [nowSaveInfo.user.avatar]);

              const updateVal = (key: keyof workSpaceType.Unit.BaseItem.Image, val: number) => {
                setAvaCfg(prev => ({ ...prev, [key]: val }));
              };

              return <div className={style["Avatar"]}>
                <div className={style["positionSet"]}>
                  <div className={style["frame"]}>
                    <div
                      className={style["image"]}
                      onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add(style["ondrag"])
                      }}

                      onDragLeave={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove(style["ondrag"])
                      }}

                      onDrop={e => {
                        if (!e.dataTransfer) return;
                        e.preventDefault();
                        e.stopPropagation();

                        const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

                        if (itemdata) {
                          const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
                          const { data, type } = item
                          if (type === "post" || type === "postImg") {
                            SetS.avatar(usrIndx, data.file.url!, data)
                            setAvaCfg({
                              url: data.file.url!,
                              positionX: 50,
                              positionY: 50,
                              fromPost: data
                            })
                          }
                        }

                        e.currentTarget.classList.remove(style["ondrag"])
                      }}
                    >
                      <Background bg={avaCfg} />
                      <div className={style["dragOverlay"]}>
                        <span>{t("setting.Account.avatar.set")}</span>
                      </div>
                    </div>
                    <div className={style["position"]}>
                      <div>
                        <span>{"X:"}</span>
                        <div>
                          <input
                            kilo-style=""
                            type="range"
                            step={.5}
                            max={100}
                            min={0}
                            kiase-sty=""
                            value={avaCfg.positionX ?? 50}
                            onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                          />
                        </div>
                        <input
                          type="number"
                          kiase-sty=""
                          step={.5}
                          max={100}
                          min={0}
                          value={avaCfg.positionX ?? 50}
                          onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                        />
                      </div>

                      <div>
                        <span>{"Y:"}</span>
                        <div>
                          <input
                            kilo-style=""
                            type="range"
                            step={.5}
                            max={100}
                            min={0}
                            kiase-sty=""
                            value={avaCfg.positionY ?? 50}
                            onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                          />
                        </div>
                        <input
                          type="number"
                          kiase-sty=""
                          step={.5}
                          max={100}
                          min={0}
                          value={avaCfg.positionY ?? 50}
                          onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                        />
                      </div>

                      <div>
                        <span>{"S:"}</span>
                        <div>
                          <input
                            kilo-style=""
                            type="range"
                            step={.5}
                            max={500}
                            min={100}
                            kiase-sty=""
                            value={avaCfg.scale ?? 100}
                            onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                          />
                        </div>
                        <input
                          type="number"
                          kiase-sty=""
                          step={.5}
                          max={500}
                          min={100}
                          value={avaCfg.scale ?? 100}
                          onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                        />
                      </div>
                    </div>

                    <button kiase-sty="" onClick={() => {
                      SetS.usrInfo(usrIndx, e => {
                        e.user.avatar = avaCfg;
                        return e;
                      });
                    }}>{t("setting.Account.avatar.apply")}</button>
                    {avaCfg.fromPost && <button
                      kiase-sty=""
                      onClick={() => acts.open.getByID(avaCfg.fromPost!)}
                      draggable={true}
                      onDragStart={(e) => {
                        dragItem(e, {
                          type: "post",
                          data: avaCfg.fromPost!
                        });
                      }}
                    >{t("setting.Account.avatar.source")}</button>}
                  </div>
                </div>
              </div>
            }
            case "e621": {
              const [nowAuth, setNowAuth] = useState<workSpaceType.Unit.E621Auth>(nowSaveInfo.user.e621 ?? {})
              const [currentKey, setCurrentKey] = useState<string>(nowAuth.key ?? "")
              const [currentName, setCurrentName] = useState<string>(nowAuth.name ?? "")

              const isSame = (nowAuth.key === currentKey) && (nowAuth.name === currentName);

              useEffect(() => {
                setNowAuth(nowSaveInfo.user.e621 ?? {})
              }, [nowSaveInfo.user.e621])

              const setAuth = useCallback((restore?: boolean) => {
                if (restore) {
                  setCurrentKey(nowAuth.key ?? "")
                  setCurrentName(nowAuth.name ?? "")
                } else {
                  newInput.message(t("setting.Account.e621.msg"), [
                    { name: t("setting.Account.e621.msg.yes"), value: "yes", key: "Enter" },
                    { name: t("setting.Account.e621.msg.no"), value: "" },
                  ], (e) => {
                    if (e === "yes") {
                      SetS.usrInfo(usrIndx, e => {
                        e.user.e621 = { key: currentKey, name: currentName }
                        return e
                      })
                    }
                  })
                }
              }, [nowAuth, currentKey, currentName])

              return <>
                <KiloDown.Subtitle>{t("setting.Account.e621.title")}</KiloDown.Subtitle>
                <KiloDown.Thirdtitle>{t("setting.Account.e621.info")}</KiloDown.Thirdtitle>
                <>
                  <br />
                  <input
                    type="text"
                    kiase-sty=""
                    placeholder={t("setting.Account.e621.inp.name")}
                    onChange={e => setCurrentName(e.currentTarget.value)}
                    value={currentName}
                  />
                  <br />
                  <br />
                  <PasswordInput
                    placeholder={t("setting.Account.e621.inp.key")}
                    onChange={e => setCurrentKey(e.currentTarget.value)}
                    value={currentKey}
                  />
                  <br />
                  <br />
                  <div className={style["buttonList"]}>
                    <button kiase-sty="" disabled={isSame} onClick={() => setAuth()}>{t("setting.Account.e621.btn.update")}</button>
                    <button kiase-sty="" disabled={isSame} onClick={() => setAuth(true)}>{t("setting.Account.e621.btn.restore")}</button>
                  </div>
                </>

                <br />
                <br />

                <KiloDown.Subtitle>{t("setting.Account.e621.baseUrl.title")}</KiloDown.Subtitle>
                <KiloDown.Thirdtitle>{t("setting.Account.e621.baseUrl.info.1")}</KiloDown.Thirdtitle>
                <KiloDown.Thirdtitle>{t("setting.Account.e621.baseUrl.info.2")}</KiloDown.Thirdtitle>
                <div className={style["buttonList"]}>
                  {baseUrlList.map((e, i) => <button
                    kiase-sty=""
                    className={clsx(E621_BASE_URL === e[0] && style["activ"])}
                    onClick={() => SET_E621_BASE_URL(e[0])}
                    key={i}
                  >{e[1]}</button>)}
                </div>
                {E621_BASE_URL === baseUrlList.find(e => e[1] === "E621")![0]
                  && <>
                    <p>{t("setting.Account.e621.baseUrl.info.3")}</p>
                  </>}
              </>
            }
            case "language": {

              const [notic, setNotic] = useState<string>("...")

              const list = Object.entries(langList).map(e => ({
                name: e[1].NAME,
                notic: e[1].NOTIC,
                id: e[0],
              }))

              return <div className={style["Language"]}>
                <div className={style["notic"]}>
                  <div><span>{notic}</span></div>
                </div>
                <div className={style["btns"]}>
                  {list.map(l => <button
                    className={clsx(nowSetting.lang === l.id && style["activ"])}
                    onMouseMove={() => setNotic(l.notic)}
                    onMouseLeave={() => setNotic("...")}
                    onClick={() => SetS.setting(usrIndx, e => {
                      e.lang = l.id
                      return e
                    })}
                    key={l.id}
                  >
                    <span>{l.name}</span>
                    <span>{l.id}</span>
                  </button>)}
                </div>
              </div>
            }
            case "export/import": {

              return <></>
            }
          }
        }

        case "download": {
          switch (nowPage.pages) {
            case "general": {

              return <></>
            }
            case "history": {

              return <></>
            }
            case "export/import": {

              return <></>
            }
          }
        }

        case "storage": {
          switch (nowPage.pages) {
            case "general": {
              return <></>
            }

            case "cache": {
              const [set, setSet] = useState(nowSetting.cache);

              const chcActiv = set.enable.global;

              useEffect(() => {
                (async () => {
                  const _set = await WSA.userSetting(usrIndx);
                  const get = await _set.get();
                  get.cache = set;
                  _set.set(get)
                })()
              }, [set])

              return <>
                <KiloDown.Subtitle>{t("setting.Storage.cache.title")}</KiloDown.Subtitle>
                <div className={style["buttonList"]}>
                  {
                    ([
                      [t("setting.Storage.cache.enable.off"), !set.enable.global, false],
                      [t("setting.Storage.cache.enable.on"), set.enable.global, true],
                    ] as [string, boolean, boolean][]).map((e, i) =>
                      <button
                        kiase-sty=""
                        className={clsx(e[1] && style["activ"])}
                        onClick={() => setSet(p => {
                          const _ = cloneDeep(p);
                          _.enable.global = e[2];
                          return _
                        })}
                        key={i}
                      >{e[0]}</button>
                    )
                  }
                </div>
                <br />
                {/* 我還沒寫 */}
                {/* <button
                  kiase-sty=""
                  className={clsx(set.downloadFromCache && style["activ"])}
                  onClick={() => setSet(p => {
                    const _ = cloneDeep(p);
                    _.downloadFromCache = !_.downloadFromCache;
                    return _
                  })}
                >{"下載時 優先從暫存區拿檔案"}</button> */}
                {/* <br /> */}
                {/* <br /> */}

                <div style={{ opacity: chcActiv ? "1" : ".6", pointerEvents: chcActiv ? "all" : "none" }}>
                  <KiloDown.Subtitle>{t("setting.Storage.cache.section.parts")}</KiloDown.Subtitle>

                  <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.post")}</KiloDown.Thirdtitle>
                  <div className={clsx(style["buttonList"], !chcActiv && style["disable"])}>
                    {
                      ([
                        [t("setting.Storage.cache.item.data"), set.enable.post.data, "data"],
                        [t("setting.Storage.cache.item.image"), set.enable.post.image, "image"],
                        [t("setting.Storage.cache.item.thumb"), set.enable.post.thumb, "thumb"],
                      ] as [string, boolean, keyof typeof set.enable.post][]).map((e, i) =>
                        <button
                          kiase-sty=""
                          className={clsx(e[1] && style["activ"])}
                          onClick={() => setSet(p => {
                            const _ = cloneDeep(p);
                            _.enable.post[e[2]] = !_.enable.post[e[2]];
                            return _
                          })}
                          key={i}
                        >{e[0]}</button>
                      )
                    }
                  </div>

                  <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.others")}</KiloDown.Thirdtitle>
                  <div className={clsx(style["buttonList"], !chcActiv && style["disable"])}>
                    {
                      ([
                        [t("setting.Storage.cache.item.pool"), set.enable.pool, "pool"],
                        [t("setting.Storage.cache.item.tags"), set.enable.tags, "tags"],
                      ] as [string, boolean, keyof typeof set.enable][]).map((e, i) =>
                        <button
                          kiase-sty=""
                          className={clsx(e[1] && style["activ"])}
                          onClick={() => setSet(p => {
                            const _ = cloneDeep(p);
                            (_.enable[e[2]] as boolean) = !_.enable[e[2]];
                            return _
                          })}
                          key={i}
                        >{e[0]}</button>
                      )
                    }
                  </div>

                  <br />

                  <KiloDown.Subtitle>{t("setting.Storage.cache.section.limits")}</KiloDown.Subtitle>
                  <div className={clsx(style["buttonList"], !chcActiv && style["disable"])}>
                    {
                      ([
                        [t("setting.Storage.cache.limit.manual"), set.isManualLimit, "isManualLimit"],
                      ] as [string, boolean, keyof typeof set][]).map((e, i) =>
                        <button
                          kiase-sty=""
                          className={clsx(e[1] && style["activ"])}
                          onClick={() => setSet(p => {
                            const _ = cloneDeep(p);
                            (_[e[2]] as boolean) = !_[e[2]];
                            return _
                          })}
                          key={i}
                        >{e[0]}</button>
                      )
                    }
                  </div>
                  <br />
                  <div small-txt="">{t("setting.Storage.cache.limit.hint")}</div>
                  <br />
                  {
                    ([
                      [t("setting.Storage.cache.limit.all"), set.limit._all, "_all"],
                    ] as [string, number, keyof typeof set.limit][]).map((e, i) =>
                      <div key={i}>
                        {e[0]}<input
                          kiase-sty=""
                          min={0}
                          type="number"
                          style={{ width: "50px", marginLeft: "10px" }}
                          defaultValue={e[1]}
                          disabled={set.isManualLimit || !chcActiv}
                          onChange={(ev) => setSet(p => {
                            const _ = cloneDeep(p);
                            (_.limit[e[2]] as number) = +ev.currentTarget.value;
                            return _
                          })}

                        />
                      </div>
                    )
                  }

                  <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.post")}</KiloDown.Thirdtitle>
                  {
                    ([
                      [t("setting.Storage.cache.item.data"), set.limit.post.data, "data"],
                      [t("setting.Storage.cache.item.image"), set.limit.post.image, "image"],
                      [t("setting.Storage.cache.item.thumb"), set.limit.post.thumb, "thumb"],
                    ] as [string, number, keyof typeof set.limit.post][]).map((e, i) =>
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", marginBottom: "10px" }}>
                        <div>
                          {e[0]}
                        </div>
                        <input
                          kiase-sty=""
                          min={0}
                          type="number"
                          style={{ width: "50px", marginLeft: "10px" }}
                          defaultValue={e[1]}
                          disabled={!set.isManualLimit || !chcActiv}
                          onChange={(ev) => setSet(p => {
                            const _ = cloneDeep(p);
                            (_.limit.post[e[2]] as number) = +ev.currentTarget.value;
                            return _
                          })}

                        />
                      </div>
                    )
                  }
                  <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.others")}</KiloDown.Thirdtitle>
                  {
                    ([
                      [t("setting.Storage.cache.item.pool"), set.limit.pool, "pool"],
                      [t("setting.Storage.cache.item.tags"), set.limit.tags, "tags"],
                    ] as [string, number, keyof typeof set.limit][]).map((e, i) =>
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", marginBottom: "10px" }}>
                        <div>
                          {e[0]}
                        </div>
                        <input
                          kiase-sty=""
                          min={0}
                          type="number"
                          style={{ width: "50px", marginLeft: "10px" }}
                          defaultValue={e[1]}
                          disabled={!set.isManualLimit || !chcActiv}
                          onChange={(ev) => setSet(p => {
                            const _ = cloneDeep(p);
                            (_.limit[e[2]] as number) = +ev.currentTarget.value;
                            return _
                          })}

                        />
                      </div>
                    )
                  }
                </div>
              </>
            }

            case "export/import": {
              return <></>
            }
          }
        }

        case "appearance": {
          switch (nowPage.pages) {
            case "general": {
              const scaleGear = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]

              const [format, setFormat] = useState<string[]>(nowSetting.appearance.clockFormat)

              return <>
                <KiloDown.Subtitle>{t("setting.Appearance.general.scale")}</KiloDown.Subtitle>
                <KiloDown.Thirdtitle>{t("setting.Appearance.general.scale.info")}</KiloDown.Thirdtitle>
                <div className={style["buttonList"]}>
                  {scaleGear.map((scale, i) => <button
                    key={i}
                    kiase-sty=""
                    btn-activ={`${nowSetting.appearance.scale === scale}`}
                    onClick={() => SetS.setting(usrIndx, e => {
                      e.appearance.scale = scale
                      return e
                    })}
                  >
                    {scale}%
                  </button>)}
                </div>

                <br />
                <br />

                <KiloDown.Subtitle>{t("setting.Appearance.general.clockFormat")}</KiloDown.Subtitle>
                <KiloDown.Thirdtitle>{t("setting.Appearance.general.clockFormat.info")}</KiloDown.Thirdtitle>
                <KiloDown.SmallText>{t("setting.Appearance.general.clockFormat.info.fun").map((e: string, i: number) => <Fragment key={i}>{e}<br /></Fragment>)}</KiloDown.SmallText>
                <KiloDown.Thirdtitle>{t("setting.Appearance.general.clockFormat.preview")}</KiloDown.Thirdtitle>
                <ClockPreview formats={format} />
                <br />
                <div small-txt="">{
                  t("setting.Appearance.general.clockFormat.formatInfo").map((e: string, i: number) => e ? <div pre-text="" key={i}>{e}</div> : <br key={i} />)
                }</div >
                <br />
                {(() => {
                  const count = format.length;
                  let txt = "";

                  if (count > 2) txt = t("setting.Appearance.general.clockFormat.overFlow");
                  else if (count <= 0) txt = t("setting.Appearance.general.clockFormat.none");

                  if (txt)
                    return <> <KiloDown.SmallText>{txt}</KiloDown.SmallText><br /><br /></>;
                })()}
                <SettingEditor.ListEditor
                  list={format}
                  onChange={setFormat}
                  children={(child) => <div className={style["ListEditor"]}>
                    <div className={style["list"]}>
                      {child.items.map((e, i) => <div className={style["item"]} key={i}>
                        <input type="text" kiase-sty="" value={e.data} onChange={t => e.ops.update(t.currentTarget.value)} />

                        <button kiase-sty="" non-pad="" onClick={() => e.ops.moveUp()}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M331-384q-8.1 0-13.05-5.4Q313-394.8 313-402q0-1 5.88-12.77L461-557q4-4 9-6t10-2q5 0 10 2t9 6l142.12 142.19q2.94 2.95 4.41 6.38Q647-405 647-401.5q0 7-4.95 12.25T629-384H331Z" /></svg>
                        </button>

                        <button kiase-sty="" non-pad="" onClick={() => e.ops.moveDown()}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M461-403 318.88-545.19q-2.94-2.95-4.41-6.38Q313-555 313-558.5q0-7 4.95-12.25T331-576h298q8.1 0 13.05 5.4Q647-565.2 647-558q0 1-5.88 12.77L499-403q-4 4-9 6t-10 2q-5 0-10-2t-9-6Z" /></svg>
                        </button>

                        <button kiase-sty="" non-pad="" onClick={() => e.ops.duplicate()}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M360-240q-29.7 0-50.85-21.15Q288-282.3 288-312v-480q0-29.7 21.15-50.85Q330.3-864 360-864h384q29.7 0 50.85 21.15Q816-821.7 816-792v480q0 29.7-21.15 50.85Q773.7-240 744-240H360Zm0-72h384v-480H360v480ZM216-96q-29.7 0-50.85-21.15Q144-138.3 144-168v-516q0-15.3 10.29-25.65Q164.58-720 179.79-720t25.71 10.35Q216-699.3 216-684v516h420q15.3 0 25.65 10.29Q672-147.42 672-132.21t-10.35 25.71Q651.3-96 636-96H216Zm144-216v-480 480Z" /></svg>
                        </button>

                        <button kiase-sty="" non-pad="" onClick={() => e.ops.remove()}>
                          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M480-429 316-265q-11 11-25 10.5T266-266q-11-11-11-25.5t11-25.5l163-163-164-164q-11-11-10.5-25.5T266-695q11-11 25.5-11t25.5 11l163 164 164-164q11-11 25.5-11t25.5 11q11 11 11 25.5T695-644L531-480l164 164q11 11 11 25t-11 25q-11 11-25.5 11T644-266L480-429Z" /></svg>
                        </button>
                      </div>)}
                    </div >
                    <button kiase-sty="" non-pad="" onClick={() => child.addItem("-mm-")}>
                      <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M444-444H276q-15.3 0-25.65-10.29Q240-464.58 240-479.79t10.35-25.71Q260.7-516 276-516h168v-168q0-15.3 10.29-25.65Q464.58-720 479.79-720t25.71 10.35Q516-699.3 516-684v168h168q15.3 0 25.65 10.29Q720-495.42 720-480.21t-10.35 25.71Q699.3-444 684-444H516v168q0 15.3-10.29 25.65Q495.42-240 480.21-240t-25.71-10.35Q444-260.7 444-276v-168Z" /></svg>
                    </button>
                  </div >}
                />
                <br />
                <div className={style["buttonList"]}>
                  <button
                    kiase-sty=""
                    disabled={nowSetting.appearance.clockFormat.join("") === format.join("")}
                    onClick={() => SetS.setting(usrIndx, e => {
                      e.appearance.clockFormat = format
                      return e
                    })
                    }
                  >{t("setting.Appearance.general.clockFormat.apply")}</button>
                  <button
                    kiase-sty=""
                    disabled={nowSetting.appearance.clockFormat.join("") === format.join("")}
                    onClick={() => {
                      setFormat(nowSetting.appearance.clockFormat)
                    }}
                  >{t("setting.Appearance.general.clockFormat.restore")}</button>
                  <button
                    kiase-sty=""
                    onClick={() => {
                      setFormat(newEmptyAccount.setting.appearance.clockFormat)
                    }}
                  >{t("setting.Appearance.general.clockFormat.restoreDefault")}</button>
                </div>


              </>
            }
            case "performance": {
              type Performance = workSpaceType.Unit.SettingUnit.Performance
              type key = keyof Performance

              const [PERFSET, SETPERF] = useState<Performance>(nowSetting.performance)

              const setValue = (target: key, value: boolean) => {
                SETPERF(e => {
                  const _ = cloneDeep(e)
                  _[target] = value
                  return _
                })
              }

              const Controler = (tar: key, cont?: key[]) => {
                const btn = (bool: boolean, click: () => void, txt: string) => (
                  <button
                    kiase-sty=""
                    onClick={click}
                    btn-activ={bool && "true"}
                  >
                    {txt}
                  </button>
                )
                return <>
                  <KiloDown.Subtitle>{t(`setting.Appearance.performance.opt.${tar}`)}</KiloDown.Subtitle>
                  <KiloDown.Thirdtitle>{t(`setting.Appearance.performance.opt.${tar}.dec`)}</KiloDown.Thirdtitle>
                  <div
                    className={clsx(
                      style["buttonList"],
                      !(cont?.every(e => PERFSET[e]) ?? true) && style["disable"]
                    )}
                  >
                    {btn(PERFSET[tar], () => setValue(tar, true), t(`setting.Appearance.performance.btn.enb`))}
                    {btn(!PERFSET[tar], () => setValue(tar, false), t(`setting.Appearance.performance.btn.deb`))}
                  </div>
                  <br />
                </>
              }

              useEffect(() => {
                SetS.setting(usrIndx, e => {
                  e.performance = PERFSET
                  return e
                })
              }, [PERFSET])

              return <>
                <KiloDown.Title>{t(`setting.Appearance.performance.info`)}</KiloDown.Title>
                <KiloDown.Subtitle>{t(`setting.Appearance.performance.dec`)}</KiloDown.Subtitle>
                <br />
                {Controler("All")}
                {Controler("cssAnimation", ["All"])}
                {Controler("transition", ["All"])}
                {Controler("transitionDelay", ["All", "transition"])}
                {Controler("cssFilter", ["All"])}
                {Controler("backdropFilter", ["All"])}
                {Controler("transparenWinodw", ["All", "backdropFilter"])}
              </>
            }
            case "theme": {
              const [newColor, setNewColor] = useState<string>("#ffffff")
              const [colorList, setColorList] = useState<string[]>([])

              useEffect(() => {
                (async () => {
                  const state = await (await WSA.userState(usrIndx)).get();
                  const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                  const wallpaperUrl = wsInfo.wallpaper.url!;
                  if (wallpaperUrl) {
                  }
                })();
              }, [nowSetting.appearance.wallpaper])

              useEffect(() => {
                (async () => {
                  const state = await (await WSA.userState(usrIndx)).get();
                  const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                  setNewColor(wsInfo.color);
                })();
              }, [])

              return <>
                <div>懶惰寫界面 先這樣吧 凑合著用</div>
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.currentTarget.value)} />
                <button kiase-sty="" onClick={() => SetS.color(usrIndx, newColor)}>{"apply"}</button>
                <br />
                {colorList}
              </>
            }
            case "wallpaper": {
              const [bgCfg, setBgCfg] = useState<workSpaceType.Unit.BaseItem.Image>({ url: "" });
              const resolution = fuckingState.resolution();

              // 透過 WSA 抓取當前工作區的桌布
              useEffect(() => {
                const getWallpaper = async () => {
                  const state = await (await WSA.userState(usrIndx)).get();
                  const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                  setBgCfg(wsInfo.wallpaper ?? nowSetting.appearance.wallpaper);
                }
                getWallpaper()

                WSA.addEventListener("workspace:appearance", getWallpaper)
                return () => {
                  WSA.removeEventListener("workspace:appearance", getWallpaper)
                }
              }, []);

              const updateVal = (key: keyof workSpaceType.Unit.BaseItem.Image, val: number) => {
                setBgCfg(prev => ({ ...prev, [key]: val }));
              };

              return <div className={style["Wallpaper"]}>
                <div className={style["positionSet"]}>
                  <div className={style["frame"]}>
                    <div
                      className={style["image"]}
                      style={{ aspectRatio: `${resolution[0]} / ${resolution[1]}` }}
                      onDragOver={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add(style["ondrag"])
                      }}

                      onDragLeave={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove(style["ondrag"])
                      }}

                      onDrop={e => {
                        if (!e.dataTransfer) return;
                        e.preventDefault();
                        e.stopPropagation();

                        const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

                        if (itemdata) {
                          const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
                          const { data, type } = item
                          if (type === "post" || type === "postImg") {
                            SetS.wallpaper(usrIndx, data.file.url!, data)
                            setBgCfg({
                              url: data.file.url!,
                              positionX: 50,
                              positionY: 50,
                              fromPost: data
                            })
                          }
                        }

                        e.currentTarget.classList.remove(style["ondrag"])
                      }}
                    >
                      <Background bg={bgCfg} />
                      <div className={style["dragOverlay"]}>
                        <span>{t("setting.Appearance.wallpaper.set")}</span>
                      </div>
                    </div>
                    <div className={style["position"]}>
                      <div>
                        <span>{"X:"}</span>
                        <div>
                          <input
                            kilo-style=""
                            type="range"
                            step={.5}
                            max={100}
                            min={0}
                            kiase-sty=""
                            value={bgCfg.positionX ?? 50}
                            onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                          />
                        </div>
                        <input
                          type="number"
                          kiase-sty=""
                          step={.5}
                          max={100}
                          min={0}
                          value={bgCfg.positionX ?? 50}
                          onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                        />
                      </div>

                      <div>
                        <span>{"Y:"}</span>
                        <div>
                          <input
                            kilo-style=""
                            type="range"
                            step={.5}
                            max={100}
                            min={0}
                            kiase-sty=""
                            value={bgCfg.positionY ?? 50}
                            onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                          />
                        </div>
                        <input
                          type="number"
                          kiase-sty=""
                          step={.5}
                          max={100}
                          min={0}
                          value={bgCfg.positionY ?? 50}
                          onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                        />
                      </div>

                      <div>
                        <span>{"S:"}</span>
                        <div>
                          <input
                            kilo-style=""
                            type="range"
                            step={.5}
                            max={500}
                            min={100}
                            kiase-sty=""
                            value={bgCfg.scale ?? 100}
                            onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                          />
                        </div>
                        <input
                          type="number"
                          kiase-sty=""
                          step={.5}
                          max={500}
                          min={100}
                          value={bgCfg.scale ?? 100}
                          onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                        />
                      </div>
                    </div>

                    <button kiase-sty="" onClick={async () => {
                      const state = await (await WSA.userState(usrIndx)).get();
                      const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                      await WSA.updateWorkspace(usrIndx, state.nowWorkSpace, {
                        setting: { ...wsInfo, wallpaper: bgCfg }
                      });
                    }}>{t("setting.Appearance.wallpaper.apply")}</button>
                    {bgCfg.fromPost && <button
                      kiase-sty=""
                      onClick={() => acts.open.getByID(bgCfg.fromPost!)}
                      draggable={true}
                      onDragStart={(e) => {
                        dragItem(e, {
                          type: "post",
                          data: bgCfg.fromPost!
                        });
                      }}
                    >{t("setting.Appearance.wallpaper.source")}</button>}
                  </div>
                </div>
              </div>
            }
          }
        }

        case "information": {
          /* 本人因爲覺得 需要保留個性 所以把這裏的i18n砍了 */
          /* KIASENOLO need keep he SOUL, so this area dont hav apply i18n*/
          /* KIASENOLO u kapste nes SOLE, sie noot o i18n aplea nes are*/
          switch (nowPage.pages) {
            case "general": {
              const [status, setStatus] = useState<string>("")
              const [exportUrl, setExportUrl] = useState<string>("")

              const [nowProcess, setNowProcess] = useState<[number, number] | null>(null)

              useEffect(() => {
                return () => {
                  exportUrl ?? URL.revokeObjectURL(exportUrl);
                }
              }, [])

              const handleExport = async () => {
                setStatus(t("IN_DEV.exporting"))
                try {
                  exportUrl ?? URL.revokeObjectURL(exportUrl);
                  setExportUrl("")
                  const data = await WSA.exportSaves()
                  const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/zip" })
                  const url = URL.createObjectURL(blob)
                  setExportUrl(url)
                  const anchor = document.createElement("a")
                  anchor.href = url
                  anchor.download = `Kilo-Saves-${Date.now()}.zip`
                  anchor.click()
                  setStatus(t("IN_DEV.exportDone"))
                } catch (error) {
                  setStatus(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
                }
              }

              const handleImport = () => {
                newInput.message(
                  t("IN_DEV.import.msg"),
                  [{ name: t("IN_DEV.import.no"), value: "" }, { name: t("IN_DEV.import.yes"), value: "ok", key: "Enter" }],
                  async (e) => {
                    if (e !== "ok") return;
                    const inp = document.createElement("input")
                    inp.type = "file"; inp.accept = ".zip"; inp.click();
                    inp.onchange = async (ev) => {
                      const files = (ev.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        try {
                          setImporting(true)
                          await WSA.importSaves(files[0])
                          SET_READY(false)
                          setTimeout(() => {
                            SET_READY(true)
                            setImporting(false)
                          }, 100);
                        } catch (error) {
                          setImporting(false)
                          setStatus(`Import failed: ${error instanceof Error ? error.message : String(error)}`)
                        }
                      }
                    }
                  }
                )
              }


              const handleExportIndexedDB = async (): Promise<void> => {
                return new Promise((resolve, reject) => {
                  const request = indexedDB.open("e621_enhanced_db");

                  request.onerror = () => reject("無法開啟資料庫");

                  request.onsuccess = async (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    const storeNames = Array.from(db.objectStoreNames);

                    if (storeNames.length === 0) {
                      alert("資料庫是空的，無需匯出");
                      db.close();
                      return resolve();
                    }

                    const exportData: Record<string, any[]> = {};

                    try {
                      const transaction = db.transaction(storeNames, "readonly");

                      await Promise.all(
                        storeNames.map((name) => {
                          return new Promise<void>((res, rej) => {
                            const store = transaction.objectStore(name);
                            const req = store.getAll();
                            req.onsuccess = () => {
                              exportData[name] = req.result;
                              res();
                            };
                            req.onerror = () => rej(`讀取 Store ${name} 失敗`);
                          });
                        })
                      );

                      const jsonStr = JSON.stringify(exportData);
                      const blob = new Blob([jsonStr], { type: "application/json" });
                      const url = URL.createObjectURL(blob);

                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `backup_${new Date().toISOString().slice(0, 10)}.indxdb`;
                      a.click();

                      setTimeout(() => URL.revokeObjectURL(url), 1000);

                      db.close();
                      resolve();
                    } catch (err) {
                      db.close();
                      reject(err);
                    }
                  };
                });
              };

              const handleImportIndexedDB = async (): Promise<void> => {
                return new Promise((resolve, reject) => {
                  const inp = document.createElement("input");
                  inp.type = "file";
                  inp.accept = ".indxdb";

                  inp.onchange = async (ev) => {
                    const file = (ev.target as HTMLInputElement).files?.[0];
                    if (!file) return reject("未選擇檔案");

                    const reader = new FileReader();
                    reader.onload = async (loadEv) => {
                      try {
                        const content = loadEv.target?.result?.toString() ?? "";
                        const decodedData = JSON.parse(content);

                        const dbRequest = indexedDB.open("e621_enhanced_db");
                        dbRequest.onsuccess = (event) => {
                          const db = (event.target as IDBOpenDBRequest).result;
                          const fileStoreNames = Object.keys(decodedData);

                          const validStoreNames = fileStoreNames.filter(name =>
                            db.objectStoreNames.contains(name)
                          );

                          if (validStoreNames.length === 0) {
                            db.close();
                            return reject("匯入檔案中沒有符合的資料表");
                          }

                          const transaction = db.transaction(validStoreNames, "readwrite");

                          transaction.oncomplete = () => {
                            db.close();
                            alert("匯入成功");
                            resolve();
                          };

                          transaction.onerror = (e) => {
                            console.error("Transaction Error:", e);
                            reject("寫入資料失敗");
                          };

                          validStoreNames.forEach((name) => {
                            const store = transaction.objectStore(name);
                            store.clear();
                            decodedData[name].forEach((item: any) => {
                              store.put(item);
                            });
                          });
                        };

                        dbRequest.onerror = () => reject("無法開啟資料庫進行匯入");

                      } catch (err) {
                        reject("解析檔案失敗，格式可能不正確");
                      }
                    };
                    reader.readAsText(file);
                  };

                  inp.click();
                });
              };


              const handleImportOld = () => {
                newInput.message(
                  t("IN_DEV.import.msg"),
                  [{ name: t("IN_DEV.import.no"), value: "" }, { name: t("IN_DEV.import.yes"), value: "ok", key: "Enter" }],
                  async (e) => {
                    if (e !== "ok") return;
                    const inp = document.createElement("input")
                    inp.type = "file"; inp.accept = ".wss"; inp.click();
                    inp.onchange = async (ev) => {
                      const files = (ev.target as HTMLInputElement).files;
                      const reader = new FileReader();
                      if (files && files[0]) {
                        reader.onload = async (loadEv) => {
                          await WSA.importSavesOld(JSON.parse(functions.fromBase64(loadEv.target?.result?.toString() ?? "{}")))
                          SET_READY(false)
                          setImporting(true)
                          setTimeout(() => {
                            SET_READY(true)
                            setImporting(false)
                          }, 100);
                        }
                        reader.readAsText(files[0]);
                      }
                    }
                  }
                )
              }

              const handleExportToFolder = async () => {
                if (!('showDirectoryPicker' in window)) {
                  setStatus("瀏覽器不支援（請用 Chrome/Edge）");
                  return;
                }
                try {
                  const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                  setStatus(t("IN_DEV.exporting"));
                  await WSA.exportToDirectoryHandle(dirHandle, (n1, n2) => setNowProcess([n1, n2]));
                  setStatus(t("IN_DEV.exportDone"));
                } catch (error: any) {
                  if (error.name !== 'AbortError') {
                    setStatus(`匯出失敗: ${error.message}`);
                  }
                }
              };

              const handleImportFromFolder = async () => {
                if (!('showDirectoryPicker' in window)) {
                  setStatus("瀏覽器不支援（請用 Chrome/Edge）");
                  return;
                }

                let dirHandle: any;
                try {
                  dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
                } catch (error: any) {
                  if (error.name !== 'AbortError') {
                    setStatus(`無法開啟資料夾: ${error.message}`);
                  }
                  return;
                }

                newInput.message(
                  t("IN_DEV.import.msg"),
                  [
                    { name: t("IN_DEV.import.no"), value: "" },
                    { name: t("IN_DEV.import.yes"), value: "ok", key: "Enter" }
                  ],
                  async (e) => {
                    if (e !== "ok") return;
                    try {
                      setImporting(true);
                      setStatus("匯入中...");
                      await WSA.importFromDirectoryHandle(dirHandle, (n1, n2) => setNowProcess([n1, n2]));
                      SET_READY(false);
                      setTimeout(() => {
                        SET_READY(true);
                        setImporting(false);
                        setStatus("資料夾匯入完成。");
                      }, 100);
                    } catch (error: any) {
                      setImporting(false);
                      if (error.name !== 'AbortError') {
                        setStatus(`匯入失敗: ${error.message}`);
                      }
                    }
                  }
                );
              };

              const clickTimes = useRef(0)

              return <div className={style["Information"]}>
                <div className={style["Background"]}>
                  <NODATA.Fetching />
                </div>
                <div className={style["Text"]}>
                  <div className={style["Frame"]}>
                    <h1 onClick={() => {
                      clickTimes.current++
                      if (clickTimes.current >= 5) {
                        clickTimes.current = 0;
                        WSA.userSetting(usrIndx).then(e => {
                          e.set(p => {
                            p.appearance.KIASTALA = !p.appearance.KIASTALA
                            return p
                          })
                        })
                      }
                    }}>E621 App</h1>
                    <h2>inDev 0.1.1</h2>
                    <h3>{navigator.appVersion}</h3>

                    <br />

                    <h2>
                      {[
                        "用視窗化的方式 來用你的E621",
                        "十分好玩 下次別玩了",
                        "",
                        "寫這個東西 還是很開心的",
                        "雖然 真的有夠難寫",
                        "但是起碼 我做到了",
                        "直覺的交互 直覺的邏輯",
                        "還有吃效能的動畫 欸十分好",
                        "反正 就 也算是圓了一個KILO OS的夢吧",
                        "我不知道 反正 就這樣",
                        "哦對了 雖然 這句是我朋友講的 但我還是要講",
                        "就 額 就 我好像真的把E621當專業軟體在寫欸",
                        "",
                        "--20260417",
                        "怎麽説 今天更新的東西 讓我突然覺得這東西可以向直接提升不知道幾倍 幹超爽",
                        "然後你可以透過改存檔的方式 直接把其他的使用者 複製過來 超爽",
                        "當然 改名也可以 因爲我沒有專門的注冊表去注冊使用者列表",
                        "使用者列表是掃路徑 掃出來的",
                      ].map((e, i) => <Fragment key={i}>{e}<br /></Fragment>)}

                      <br />

                      <a href="https://github.com/kiasenolo/E621-App" kilo-style="" target="_blank">{t("setting.Information.general.repoLink")}</a>
                    </h2>

                  </div>
                  <br />
                  {t("IN_DEV.tips").map((e: string, i: number) => <KiloDown.Thirdtitle key={i}>{e}</KiloDown.Thirdtitle>)}
                  <div className={style["buttonList"]}>
                    <button kiase-sty="" onClick={handleExport}>
                      {t("IN_DEV.save")}
                    </button>
                    <button kiase-sty="" onClick={handleImport}>
                      {t("IN_DEV.import")}
                    </button>
                  </div>
                  <br />
                  <div className={style["buttonList"]}>
                    <button kiase-sty="" onClick={handleExportToFolder}>
                      {t("IN_DEV.saveToFolder")}
                    </button>
                    <button kiase-sty="" onClick={handleImportFromFolder}>
                      {t("IN_DEV.importFromFolder")}
                    </button>
                  </div>
                  <br />
                  <div className={style["buttonList"]}>
                    <button kiase-sty="" onClick={handleImportOld}>
                      {t("IN_DEV.importOld")}
                    </button>
                  </div>
                  <KiloDown.Thirdtitle>{`${status ? status : "..."}` + (nowProcess ? (` [ ${nowProcess[1]} / ${nowProcess[0]} ]`) : "")}</KiloDown.Thirdtitle>
                  <br />
                  <button kiase-sty="" disabled={!!!exportUrl} onClick={() => {
                    const anchor = document.createElement("a")
                    anchor.href = exportUrl
                    anchor.download = `Kilo-Saves-${Date.now()}.zip`
                    anchor.click()
                  }}>{t("IN_DEV.downloadAgain")}</button>
                  <br />
                  <br />
                  <KiloDown.Thirdtitle>{"Indexed DB"}</KiloDown.Thirdtitle>
                  <br />
                  <button kiase-sty="" onClick={handleExportIndexedDB}>
                    {t("IN_DEV.save")}
                  </button>
                  <button kiase-sty="" onClick={handleImportIndexedDB}>
                    {t("IN_DEV.import")}
                  </button>
                </div>
              </div>
            }

            case "license": {
              return <div className={style["Information"]}>
                <div className={style["Text"]}>
                  <div className={style["Frame"]}>
                    <h1>MIT license</h1>
                    <br />
                    <h2>
                      Copyright (C) 2026 KIASENOLO
                      <br />
                      <br />
                      Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                      <br />
                      <br />
                      The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                      <br />
                      <br />
                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                    </h2>
                  </div>
                </div>
              </div>
            }
            case "package": {
              type ITEM_TYPE = {
                name: string,
                key: string,
                info: string,
                url: string,
              }

              const LIST: ITEM_TYPE[] = [
                {
                  name: "Next.JS",
                  key: "next",
                  info: "額.....從小用到的大的框架",
                  url: "https://nextjs.org/"
                },
                {
                  name: "React",
                  key: "react",
                  info: "額....也是從小用到大的函式庫",
                  url: "https://react.dev/"
                },
                {
                  name: "SASS/SCSS",
                  key: "sass",
                  info: "寫樣式表用的",
                  url: "https://sass-lang.com/"
                },
                {
                  name: "CLSX",
                  key: "clsx",
                  info: "很好用的 處理className用的",
                  url: "https://www.npmjs.com/package/clsx"
                },
                {
                  name: "Node Vibrant",
                  key: "node-vibrant",
                  info: "抓顔色用的（ 我現階段還沒實作相關的東西 ）",
                  url: "https://vibrant.dev/"
                },
                {
                  name: "Fuse.JS",
                  key: "fuse.js",
                  info: "模糊搜尋 給RunBox用的",
                  url: "https://www.fusejs.io/"
                },
                {
                  name: "JSZip",
                  key: "jszip",
                  info: "把打包成zip的神奇東西 匯出存檔用的",
                  url: "https://stuk.github.io/jszip/"
                },
                {
                  name: "Lodash",
                  key: "lodash",
                  info: "一個很帥的工具集 額 我拿來處理物件用的",
                  url: "https://lodash.com/"
                },
                {
                  name: "SHA256",
                  key: "js-sha256",
                  info: "一個哈希工具 在我這邊是拿來生快取的檔名用的",
                  url: "https://www.npmjs.com/package/js-sha256"
                }
              ]

              return <div className={style["Information"]}>
                <div className={style["Text"]}>
                  <div className={style["Frame"]}>
                    <h1>Package List</h1>
                    {LIST.map((e, i) => <div key={i}>
                      <h2>
                        {"<-\\"} <a href={e.url} kilo-style="" target="_blank">{e.name} - {(PACKAGE_LIST.dependencies as any)[e.key as any]}</a>
                        <br />
                        {"/->"} {e.info}
                      </h2>
                      <br />
                    </div>)}
                  </div>
                </div>
              </div>
            }
          }
        }
      }
    }

    return <Page>
      {NowPage()}
    </Page>
  }, []);

  const SettingAndList = useCallback(({ nowPage }: PageBtn) => {
    if (nowPage === "NONE") return "none :p"
    return <div className={style["frame"]}>
      <PageButtonsList nowPage={nowPage} />
      <Pages nowPage={nowPage} key={nowPage.pages} />
    </div>
  }, [Pages, PageButtonsList])

  return (
    <WINDOW_FRAME className={
      [
        style["Setting"],
        nowPage !== "NONE" && style["inSetting"]
      ].join(" ")
    } menulist={
      [
        windowAction(windowID),
        [
          t("menuButton.top.Category"),
          [
            {
              name: t("setting.Home"),
              action() { setNowPage("NONE") },
            },
            ...settingTabs.categorieList.map(e => ({
              name: tCategory(e),
              action() {
                setNowPage({
                  categorie: e,
                  pages: settingTabs.pageList[e]![0] as any
                })
              }
            })) as MenuAction.Item[]
          ]
        ],
        ...(nowPage !== "NONE" ?
          [
            [
              t("menuButton.top.Tab"),
              settingTabs.pageList[nowPage.categorie].map(e => ({
                name: tPage(nowPage.categorie, e),
                action() {
                  setNowPage({
                    categorie: nowPage.categorie,
                    pages: e as any
                  })
                }
              }))
            ]
          ]
          : []) as MenuButtonType[]
      ]}>
      <div className={style["home"]}>
        {(
          [
            [
              "search",
              <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>
            ],
            [
              "account",
              <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M222-255q63-44 125-67.5T480-346q71 0 133.5 23.5T739-255q44-54 62.5-109T820-480q0-145-97.5-242.5T480-820q-145 0-242.5 97.5T140-480q0 61 19 116t63 109Zm257.81-195q-57.81 0-97.31-39.69-39.5-39.68-39.5-97.5 0-57.81 39.69-97.31 39.68-39.5 97.5-39.5 57.81 0 97.31 39.69 39.5 39.68 39.5 97.5 0 57.81-39.69 97.31-39.68 39.5-97.5 39.5Zm.66 370Q398-80 325-111.5t-127.5-86q-54.5-54.5-86-127.27Q80-397.53 80-480.27 80-563 111.5-635.5q31.5-72.5 86-127t127.27-86q72.76-31.5 155.5-31.5 82.73 0 155.23 31.5 72.5 31.5 127 86t86 127.03q31.5 72.53 31.5 155T848.5-325q-31.5 73-86 127.5t-127.03 86Q562.94-80 480.47-80Zm-.47-60q55 0 107.5-16T691-212q-51-36-104-55t-107-19q-54 0-107 19t-104 55q51 40 103.5 56T480-140Zm0-370q34 0 55.5-21.5T557-587q0-34-21.5-55.5T480-664q-34 0-55.5 21.5T403-587q0 34 21.5 55.5T480-510Zm0-77Zm0 374Z" /></svg>
            ],
            [
              "download",
              <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M479.87-325q-5.87 0-10.87-2-5-2-10-7L308-485q-9-9.27-8.5-21.64.5-12.36 9.11-21.36 9.39-9 21.89-9t21.5 9l98 99v-341q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v341l99-99q8.8-9 20.9-8.5 12.1.5 21.49 9.5 8.61 9 8.61 21.5t-9 21.5L501-334q-5 5-10.13 7-5.14 2-11 2ZM220-160q-24 0-42-18t-18-42v-113q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v113h520v-113q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v113q0 24-18 42t-42 18H220Z" /></svg>
            ],
            [
              "storage",
              <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M120-160v-148h720v148H120Zm60-38h72v-72h-72v72Zm-60-454v-148h720v148H120Zm60-38h72v-72h-72v72Zm-60 284v-148h720v148H120Zm60-38h72v-72h-72v72Z" /></svg>
            ],
            [
              "appearance",
              <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M583-40H440q-14.45 0-24.23-9.78Q406-59.55 406-74v-250q0-14.45 9.77-24.23Q425.55-358 440-358h41v-133H140q-24.75 0-42.37-17.63Q80-526.25 80-551v-193q0-24.75 17.63-42.38Q115.25-804 140-804h83v-42q0-14.45 9.77-24.22Q242.55-880 257-880h509q14.45 0 24.22 9.78Q800-860.45 800-846v152q0 14.45-9.78 24.22Q780.45-660 766-660H257q-14.45 0-24.23-9.78Q223-679.55 223-694v-50h-83v193h341q24.75 0 42.38 17.62Q541-515.75 541-491v133h42q14.45 0 24.22 9.77Q617-338.45 617-324v250q0 14.45-9.78 24.22Q597.45-40 583-40Zm-117-60h91v-198h-91v198ZM283-720h457v-100H283v100Zm183 620h91-91ZM283-720v-100 100Z" /></svg>
            ],
            [
              "information",
              <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M483.18-280q12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-180q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v180q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63Zm-3.2-314q14.02 0 23.52-9.2T513-626q0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2Zm.29 514q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z" /></svg>
            ],
          ] as [e621Type.window.dataType.settingTabs.categorieType, JSX.Element][]).map((e, i) =>
            <button
              key={i}
              className={clsx(showIndex && style["displayIndex"])}
              onClick={() => {
                setNowPage({
                  categorie: e[0],
                  pages: settingTabs.pageList[e[0]][0] as any
                })
              }}>
              <div className={style["icon"]}>{e[1]}</div>
              <div className={style["index"]}>{i + 1}</div>
              <div className={style["name"]}>{tCategory(e[0])}</div>
            </button>)
        }

      </div>
      <div className={style["setting"]}>
        {nowPage === "NONE" ? "none :p" : <SettingAndList nowPage={nowPage} key={nowPage.categorie} />}
        <div className={clsx(style["tabs"], showTabs && style["display"])}>
          <div className={style["list"]}>
            {settingTabs.categorieList.map((e, i) => <span
              className={clsx(
                style["cart"],
                nowPage === "NONE" ? "" : (e === nowPage.categorie && style["activ"])
              )}
              onMouseEnter={() => { setNowPage({ categorie: e, pages: settingTabs.pageList[e][0] as any }) }}
              key={i}
            >
              {tCategory(e)}
            </span>)}
          </div>
        </div>
      </div>
    </WINDOW_FRAME >
  )
}
