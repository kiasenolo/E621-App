import { useCallback, useEffect, useRef, useState, useMemo, Dispatch, SetStateAction } from "react"
import style from "./style.module.scss"
import { _app } from "@/app/_app"
import Fuse from "fuse.js"
import * as mathjs from "mathjs"
import clsx from "clsx/lite"
import * as e621Type from "../../types/appTypes"
import { StopEvent, createWindow, nowSetting, wmRef } from "../../core/globals"
import { DELAY_EFFECT, copyString, ent, parseE621Url, t } from "../../core/helpers"

export type windowsList = {
  id: string;
  title: string;
  customData?: e621Type.defaul | undefined;
}[]

export type RunBoxArgs = {
  Logout: () => void
  saveWinStatus: (logout?: boolean) => void
  windowsList: windowsList,
  setWorkSpaceEditor: Dispatch<SetStateAction<boolean>>,
}

export const RunBox = (arg: RunBoxArgs) => {
  type Option = {
    name: string,
    engName?: string,
    action: () => void,
  }
  const [runBox, setRunBox] = useState<boolean>(false)
  const [runInput, setRunInput] = useState<string>("")
  const [options, setOptions] = useState<Option[]>([])
  const [optionIndex, setOptionIndex] = useState<number>(0)

  const runBoxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRunInput("")
  }, [runBox])

  const selectOpt = useCallback((offset: number) => {
    let nowtar = optionIndex;
    let count = options.length;
    nowtar += offset; nowtar = (nowtar % count + count) % count;
    setOptionIndex(nowtar)
  }, [options, optionIndex])

  useEffect(() => {
    if (!runBox) return;
    const keyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp": {
          selectOpt(-1)
          break;
        }
        case "ArrowDown": {
          selectOpt(1)
          break;
        }
      }
    }

    document.addEventListener("keydown", keyDown)

    return () => {
      document.removeEventListener("keydown", keyDown)
    }
  }, [runBox, selectOpt])

  const optionsList = useMemo(() => {
    const inp = runBoxInputRef.current

    const focusInp = () => inp?.focus();

    const actions: Option[] = [
      {
        name: "> " + t("windowsType.postSearch"),
        engName: "> " + ent("windowsType.postSearch"),
        action() {
          createWindow(wmRef, {
            type: "postSearch",
            data: {
              nowPage: 1,
              pageCache: [],
              searchTags: []
            }
          })
          setRunBox(false);
        },
      },
      {
        name: "> " + t("windowsType.tmpList"),
        engName: "> " + ent("windowsType.tmpList"),
        action() {
          createWindow(wmRef, {
            type: "tmp"
          })
          setRunBox(false);
        },
      },
      {
        name: "> " + t("windowsType.setting"),
        engName: "> " + ent("windowsType.setting"),
        action() {
          createWindow(wmRef, {
            type: "setting",
            data: "NONE",
          })
          setRunBox(false);
        },
      },
      {
        name: "> " + t("workSpaceManager"),
        engName: "> " + ent("workSpaceManager"),
        action() {
          arg.setWorkSpaceEditor(true);
        },
      },
      {
        name: "> " + t("runBox.actions.saveWorkSpaceStatus"),
        engName: "> " + ent("runBox.actions.saveWorkSpaceStatus"),
        action() {
          arg.saveWinStatus()
        },
      },
      {
        name: "> " + t("startMenuSide.logout"),
        engName: "> " + ent("startMenuSide.logout"),
        async action() {
          arg.saveWinStatus(true);
          setRunBox(false);
        },
      },
      {
        name: `> ${t("startMenuSide.logout")} ( ${t("runBox.actions.logout.withoutSaveStatus")} )`,
        engName: `> ${ent("startMenuSide.logout")} ( ${ent("runBox.actions.logout.withoutSaveStatus")} )`,
        action() {
          arg.Logout()
        },
      },
    ]

    const intro: Option[] = [

      {
        name: ": " + t("runBox.intro.searchPost"),
        engName: ": " + ent("runBox.intro.searchPost"),
        action() { setRunInput(":"); focusInp(); },
      },
      {
        name: ". " + t("runBox.intro.poolOrPostID"),
        engName: ". " + ent("runBox.intro.poolOrPostID"),
        action() { setRunInput("."); focusInp(); },
      },
      {
        name: "; " + t("runBox.intro.toggleWindows"),
        engName: "; " + ent("runBox.intro.toggleWindows"),
        action() { setRunInput(";"); focusInp(); },
      },
      {
        name: "> " + t("runBox.intro.appOrOtherAction"),
        engName: "> " + ent("runBox.intro.appOrOtherAction"),
        action() { setRunInput(">"); focusInp(); },
      },
      {
        name: "= " + t("runBox.intro.mathCalc"),
        engName: "= " + ent("runBox.intro.mathCalc"),
        action() { setRunInput("="); focusInp(); },
      },
    ]

    return {
      actions,
      intro,
    }

  }, [nowSetting.lang, arg])

  const opts = useMemo(() => {
    const openSearch = (tags: string) => {
      createWindow(wmRef, {
        type: "postSearch",
        data: {
          nowPage: 1,
          pageCache: [],
          searchTags: tags.split(" ")
        }
      })
      setRunBox(false)
    }

    const openPost = (id: number) => {
      createWindow(wmRef, {
        type: "postGetByID",
        data: {
          currentId: id,
          status: "loading",
        }
      })
      setRunBox(false)
    }

    const openPool = (id: number) => {
      createWindow(wmRef, {
        type: "pool",
        data: {
          poolId: id,
          nowPage: 1,
          pageCache: [],
        }
      })
      setRunBox(false)
    }

    const calc: (rawInp: string) => Option[] = (rawInp) => {
      try {
        const math = mathjs.create(mathjs.all, {
          precision: 64,
          number: "BigNumber",

        })

        const res = math.evaluate(rawInp)

        return [{
          name: `${t("runBox.intro.mathCalc.calc")} : ${res}`,
          engName: `${ent("runBox.intro.mathCalc.calc")} : ${res}`,
          action() {
            copyString(res)
            _app.throwNewNotic(t("Notic.math.copy").replace("$1", res))
            setRunBox(false)
          },
        }]
      } catch {
        return []
      }
    }

    const search: (rawInp: string) => Option[] = (rawInp) => {
      const havCalc = (/[\*\^;]|(\d\s*[\+\=])|([\+\=]\s*\d)/).test(rawInp)
      if (!havCalc) {
        return [{
          name: `${t("runBox.intro.searchPost.search")} : [ ${rawInp.split(" ")} ]`,
          engName: `${ent("runBox.intro.searchPost.search")} : [ ${rawInp.split(" ")} ]`,
          action() {
            openSearch(rawInp)
          },
        }]
      } else return [];
    }

    const openid: (rawInp: string) => Option[] = (rawInp) => {
      const num = Number(rawInp)
      if (!isNaN(num)) {
        return [{
          name: `${t("windowsType.postGetByID")} : [ ${rawInp} ]`,
          engName: `${ent("windowsType.postGetByID")} : [ ${rawInp} ]`,
          action() { openPost(+rawInp) }
        },
        {
          name: `${t("windowsType.pool")} : [ ${rawInp} ]`,
          engName: `${ent("windowsType.pool")} : [ ${rawInp} ]`,
          action() { openPool(+rawInp) },
        },]
      } else return [];
    }

    const urlprs: (rawInp: string) => Option[] = (rawInp) => {
      if (rawInp) {
        const res = parseE621Url(rawInp)
        if (!res) return []
        switch (res.type) {
          case "post": return [
            {
              name: `${t("windowsType.postGetByID")} : [ ${res.postId} ]`,
              engName: `${ent("windowsType.postGetByID")} : [ ${res.postId} ]`,
              action() { openPost(res.postId) }
            },
            ...(res.searchTags ? [
              {
                name: `${t("runBox.intro.searchPost.search")} : [ ${res.searchTags} ]`,
                engName: `${ent("runBox.intro.searchPost.search")} : [ ${res.searchTags} ]`,
                action() { openSearch(res.searchTags!.join(" ")) }
              },
            ] : [])
          ];
          case "postSearch": return [
            {
              name: `${t("runBox.intro.searchPost.search")} : [ ${res.searchTags} ]`,
              engName: `${ent("runBox.intro.searchPost.search")} : [ ${res.searchTags} ]`,
              action() { openSearch(res.searchTags!.join(" ")) }
            },
          ];
          case "pool": return [
            {
              name: `${t("windowsType.pool")} : [ ${res.poolId} ]`,
              engName: `${ent("windowsType.pool")} : [ ${res.poolId} ]`,
              action() { openPool(res.poolId) }
            },
          ];
          default: return []
        }
      } else {
        return []
      }
    }

    return {
      openSearch,
      openid,
      calc,
      search,
      urlprs,
    }
  }, [nowSetting.lang])

  useEffect(() => {
    const { calc, openid, search, openSearch, urlprs } = opts
    setOptionIndex(0)
    if (!runBox) { setOptions([]); return; };
    const rawInp = runInput.trim()
    const inpText = rawInp.slice(1)

    const searchOptions = {
      includeScore: true,
      threshold: 0.3,
      keys: [
        "name",
        "engName",
      ]
    };

    if (rawInp.startsWith(">")) {
      const { actions: apps } = optionsList
      if (inpText) {
        const fuse = new Fuse(apps, searchOptions);

        setOptions(fuse.search(inpText).map(e => e.item))

      } else {
        setOptions(apps)
      }
    } else if (rawInp.startsWith(":")) {
      if (inpText) {
        setOptions([
          ...search(inpText)
        ])
      } else {
        setOptions([
          {
            name: t("runBox.intro.searchPost.noTag"),
            engName: ent("runBox.intro.searchPost.noTag"),
            action() {
              openSearch("")
            },
          }

        ])
      }
    } else if (rawInp.startsWith(".")) {
      if (inpText) {
        const ls = openid(inpText)
        if (ls.length > 0) {
          setOptions(ls)
        } else {
          setOptions([{
            name: t("runBox.intro.poolOrPostID.NaN"),
            engName: ent("runBox.intro.poolOrPostID.NaN"),
            action() { setRunInput(".") },
          }])
        }
      } else {
        setOptions([])
      }
    } else if (rawInp.startsWith("=")) {
      if (inpText) {
        setOptions(calc(inpText))
      } else {
        setOptions([])
      }
    } else if (rawInp.startsWith(";")) {
      const winList = arg.windowsList.map(e => wmRef.current?.getWindow(e.id))

      const list: Option[] = [
        ...winList.map(e => ({
          name: `; ${e?.title}`,
          action() { e?.focus(); setRunBox(false); },
        })),
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction"),
          action() {
            setRunInput(";;")
          },
        }
      ]

      const actions: Option[] = [
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction.closeAllWindow"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction.closeAllWindow"),
          action() {
            winList.forEach(e => e?.close())
            setRunBox(false)
          },
        },
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction.minimizeAllWindow"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction.minimizeAllWindow"),
          action() {
            winList.forEach(e => e?.minimize())
            setRunBox(false)
          },
        },
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction.restoreAllWindow"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction.restoreAllWindow"),
          action() {
            winList.forEach(e => e?.focus())
            setRunBox(false)
          },
        },
      ]

      if (inpText) {
        if (winList.length > 0) {
          if (inpText.startsWith(";")) {
            const inpTxt = inpText.slice(1)
            if (inpTxt) {
              const fuse = new Fuse(actions, searchOptions);
              setOptions(fuse.search(inpTxt).map(e => e.item))
            } else {
              setOptions(actions)
            }
          } else {
            const fuse = new Fuse(list, searchOptions);
            setOptions(fuse.search(inpText).map(e => e.item))
          }
        }
      } else {
        if (winList.length > 0) {
          setOptions(list)
        } else {
          setOptions([])
        }
      }
    } else {
      const { intro: action, actions: apps } = optionsList

      if (rawInp) {
        const all = [...action, ...apps]
        const fuse = new Fuse(all, searchOptions);
        const res = fuse.search(rawInp).map(e => e.item)
        if (res.length > 0) {
          setOptions(fuse.search(rawInp).map(e => e.item))
        } else {
          const res = urlprs(rawInp)
          if (res.length > 0) {
            setOptions(res)
          } else {
            setOptions([
              ...openid(rawInp),
              ...search(rawInp),
              ...calc(rawInp),
            ])
          }
        }
      } else {
        setOptions(action)
      }
    }
  }, [runInput, runBox, opts])

  return {
    setRunBox,
    runBox,
    setRunInput,
    runBoxInputRef,
    RunboxElement: (<div
      className={clsx(
        style["Run"],
        !runBox && style["hide"],
      )}
      onClick={() => setRunBox(false)}
    >
      <input
        className={style["input"]}
        type="text"
        placeholder={t("runBox.placeholder")}
        value={runInput}
        ref={runBoxInputRef}
        onChange={e => setRunInput(e.currentTarget.value)}
        onKeyDown={e => {
          switch (e.code) {
            case "ArrowUp":
            case "ArrowDown": {
              e.preventDefault()
              break
            }
          }
          if (e.key === "Enter") {
            if (options.length > 0) {
              options[optionIndex].action();
            } else {

            }
          }
        }}
        onClick={StopEvent}
      />

      {options.length > 0
        ?
        options.map((e, i) =>
          <div
            key={`${i}_${e.name}`}
            className={style["btf-frm"]}
            style={{
              transitionDelay: DELAY_EFFECT(`${i * .05}s`)
            }}
          >
            <button
              onClick={(ev) => { StopEvent(ev); e.action(); }}
              onMouseMove={() => setOptionIndex(i)}
              className={clsx(optionIndex === i && style["focus"])}
            >{e.name}</button>
          </div>
        )
        : <button key={"NONE"} no-res="">{t("runBox.NONE")}</button>
      }
    </div>)
  }
}

