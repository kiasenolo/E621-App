'use client'

import HoverTips from "@/data/components/HoverTips"
import { useHasHeadSetting } from "@/data/components/HeadSetting"
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import colormgr from '@/data/module/color'
import { _app, bindApp, bindAppScale, bindPowerSaveingMode } from './bridge'
import { useFlag, useMultiFingerDoubleTap } from './hooks'
import useLocalStorage from '@/data/module/use/LocalStorage'
import { Kiasole, consoleShell, toggleKiasole } from './kiasole/consoleStore'
import { Terminal } from './kiasole/Terminal'
import { ColorControl, useColorLists } from './overlays/ColorControl'
import { InputOverlay, newInput } from './overlays/InputOverlay'
import inputStyle from './overlays/InputOverlay/style.module.scss'
import { EffectLayer, NoticLayer, clearNotic, flash, throwNewNotic, throwNotic } from './overlays/notifications'
import { SVGFilters } from './overlays/SVGFilters'

import style from './_app.module.scss'

export { _app, _appScale, _powerSaveingMode, _setAppScale, _setPowerSaveingMode } from './bridge'
export { newInput, newInputSync, newInputCloseEvents } from './overlays/InputOverlay'
export { Kiasole, toggleKiasole } from './kiasole/consoleStore'
export type { setCustomCommandType } from './kiasole/parser'

const cursorNames = [
  "act-default",
  "act-ew-resize",
  "act-nesw-resize",
  "act-ns-resize",
  "act-nwse-resize",
  "act-pointer",
  "act-text",
  "act-url",
  "hov-default",
  "hov-ew-resize",
  "hov-nesw-resize",
  "hov-ns-resize",
  "hov-nwse-resize",
  "hov-pointer",
  "hov-text",
  "hov-url",
]

const obsHiddenIds = [
  style["CursorEffects"],
  style["ColorControCenter"],
  style["Effect"],
  inputStyle["InputOverlay"],
  style["Console"]
]

function KiaseApp({ children }: { children: ReactNode }) {

  const [OBS_MODE, setObsMode] = useState<boolean>(false)
  const hasHeadSetting = useHasHeadSetting()

  const [color, setColor] = useState<string>("#ffffff")
  const [color2, setColor2] = useState<string>("#ffffff")
  const [powerSaveingMode, setPowerSaveingMode] = useState<boolean>(false)
  const [appScale, setAppScale] = useState<number>(100)

  const [colorPanelEnabled, setColorPanelEnabled] = useFlag(true)
  const [colorPanelHidden, setColorPanelHidden] = useFlag(false)
  const [cursorEffects, setCursorEffects] = useFlag(false)
  const [cursorHeld, setCursorHeld] = useState(false)

  const colorLists = useColorLists()
  const shell = consoleShell.use()
  const consoleRef = useRef<HTMLDivElement>(null)
  const [savedShell, setSavedShell] = useLocalStorage<{ height?: string, zoom?: string }>("KIASE-APP/kiasole/shell", {})
  const shellHydrated = useRef(false)

  useEffect(() => {
    consoleShell.set(s => ({ ...s, height: savedShell.height, zoom: savedShell.zoom }))
    shellHydrated.current = true
  }, [])

  useEffect(() => {
    if (!shellHydrated.current) return
    setSavedShell({ height: shell.height, zoom: shell.zoom })
  }, [shell.height, shell.zoom])

  useEffect(() => {
    const urlParams = new URL(window.location.toString()).searchParams

    setObsMode(urlParams.has("obsMode"))

    const Color = urlParams.get("color")
    if (Color) {
      setColor(Color)
    }

    const Blur = urlParams.get("blur")
    if (Blur && !Number.isNaN(+`${Blur}`)) {
      document.documentElement.style.setProperty("--blur-effect", `${Blur}px`)
    }

    const NONE_BG = urlParams.has("NONE_BACKGROUND")
    document.body.style.background = NONE_BG ? "none" : ""
    document.documentElement.style.background = NONE_BG ? "none" : ""
  }, [])

  useLayoutEffect(() => {
    bindPowerSaveingMode(powerSaveingMode, setPowerSaveingMode)
  }, [powerSaveingMode])

  useLayoutEffect(() => {
    bindAppScale(appScale, setAppScale)
  }, [appScale])

  useLayoutEffect(() => {
    bindApp({
      disableColor: () => setColorPanelEnabled(false),
      enableColor: () => setColorPanelEnabled(true),
      toggleColor: sta => setColorPanelEnabled(sta),
      hideColorPanel: sta => setColorPanelHidden(sta),
      setColor(color: string) {
        setColor(color)
        return colormgr.hexToRgb(color)
      },
      setColor2(color: string) {
        setColor2(color)
        return colormgr.hexToRgb(color)
      },
      color,
      color2,
      informalFunction: {
        CursorEffects(mode, status) {
          if (powerSaveingMode) return false;
          return setCursorEffects(mode === "TOG" ? undefined : (status ?? false))
        }
      },
      throwNotic,
      throwNewNotic,
      clearNotic,
      Effects: {
        FLASH: flash
      }
    })
  }, [color, color2, powerSaveingMode, setColorPanelEnabled, setColorPanelHidden, setCursorEffects])

  useMultiFingerDoubleTap({
    3: () => toggleKiasole(),
    4: () => setPowerSaveingMode(prev => !prev),
  })

  useEffect(() => {
    const okd = (e: KeyboardEvent) => {
      if (e.code === "Backquote") {
        if (cursorEffects && powerSaveingMode) return;
        setCursorHeld(true)
      }

      if (e.code === "Escape") {
        newInput._close(true)
      }
    }

    const oku = () => {
      setCursorHeld(false)
    }

    document.addEventListener("keydown", okd)
    document.addEventListener("keyup", oku)

    return () => {
      document.removeEventListener("keydown", okd)
      document.removeEventListener("keyup", oku)
    }
  }, [powerSaveingMode, cursorEffects])

  useEffect(() => {
    const onkeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.altKey || e.metaKey) && (e.code === "KeyI")) {
        toggleKiasole()
      }
      if (e.metaKey && e.altKey && (e.code === "Backquote")) {
        setPowerSaveingMode(e => !e)
      }
    }

    document.addEventListener("keydown", onkeydown);
    return () => {
      document.removeEventListener("keydown", onkeydown);
    };
  }, []);

  useEffect(() => {
    const input = consoleRef.current?.querySelector("input")
    if (shell.open) input?.focus()
    else input?.blur()
  }, [shell.open])

  const exitConsole = useCallback(() => {
    toggleKiasole(false)
    Kiasole.log("Terminal Closed")
  }, [])

  const has = (id: string) => !shell.removed.includes(id)

  return (
    <>
      <SVGFilters />
      {!hasHeadSetting && <title>{"KIASENOLO"}</title>}
      {!OBS_MODE && <>
        <link rel="icon" href="/favicon.svg" sizes="any" />
        {cursorNames.map(e => <link key={e} rel="preload" href={`/_SYSTEM/Cursor/${e}.svg`} as="image" />)}
      </>}

      <div
        style={{
          zoom: appScale + "%",
        }}
        id={style["KIASE_APP"]}
        className={powerSaveingMode ? style["PowerSaveingMode"] : ""}
      >
        {!OBS_MODE && <>
          {has("ColorControCenter") && (
            <div id={style["ColorControCenter"]} className={colorPanelEnabled ? "" : style["Disable"]} style={{ display: colorPanelHidden ? "none" : "" }}>
              <div className={style["DisableText"]}>
                {"THE COLOR SETTING IS DISABLE"}
              </div>
              <div className={style["Frame"]}>
                <ColorControl prefix="--theme-color" className={style["Pri"]} color={color} setColor={setColor} lists={colorLists} />
                <ColorControl prefix="--theme-color2" className={style["Sec"]} color={color2} setColor={setColor2} lists={colorLists} />
              </div>
            </div>
          )}

          {has("Effect") && <EffectLayer />}

          {has("Notic") && <NoticLayer />}

          {has("InputOverlay") && <InputOverlay powerSave={powerSaveingMode} />}

          {has("Console") && (
            <div
              ref={consoleRef}
              id={style["Console"]}
              className={shell.open ? style["display"] : undefined}
              style={{
                height: shell.height,
                zoom: shell.zoom,
                ...(shell.takeover ? { height: "100%", transform: " translate(-50%, 0)", transition: "none" } : {}),
              }}
            >
              <Terminal powerSaveingMode={powerSaveingMode} exitCommand={exitConsole} />
            </div>
          )}
        </>}

        {has("Main") && (
          <div
            id={style["Main"]}
            className={cursorHeld ? style["hideCursor"] : undefined}
          >
            {children}
          </div>
        )}

      </div>

      {!OBS_MODE && <HoverTips />}
      {OBS_MODE && <style>
        {"html,body{background-color:#0000;}"}
        {"nextjs-portal{display:none;}"}
        {obsHiddenIds.map(e => "#" + e + "{display:none;}")}
      </style>}
    </>
  )
}

export default KiaseApp;