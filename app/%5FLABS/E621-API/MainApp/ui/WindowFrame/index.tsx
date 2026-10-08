import { useEffect, useState } from "react"
import style from "./style.module.scss"
import { WindowInstance } from "@/data/components/Window/WindowManager"
import React from "react"
import clsx from "clsx/lite"
import * as e621Type from "../../types/appTypes"
import { MenuButtonType, WindowFrameProps, wmRef } from "../../core/globals"
import { t } from "../../core/helpers"
import { MenuAction } from "../../core/menuAction"

export const WINDOW_FRAME = ({
  menulist,
  className,
  children,
  onDrop,
  onDrag,
  onDragCapture,
  onDragEnd,
  onDragEndCapture,
  onDragEnter,
  onDragEnterCapture,
  onDragExit,
  onDragExitCapture,
  onDragLeave,
  onDragLeaveCapture,
  onDragOver,
  onDragOverCapture,
  onDragStart,
  onDragStartCapture,

}: WindowFrameProps) => {
  const [hasClick, setHasClick] = useState(false)
  const [nowButton, setNowButton] = useState(-1)

  useEffect(() => {
    if (!hasClick) return

    const clickEvent = () => {
      setHasClick(false)
      setNowButton(-1)
    }

    document.addEventListener("dragstart", clickEvent)
    document.addEventListener("click", clickEvent)
    return () => {
      document.removeEventListener("dragstart", clickEvent)
      document.removeEventListener("click", clickEvent)
    }
  }, [hasClick])


  const onClickEvent = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, menu: MenuAction.Item[], frs?: boolean) => {
    event.stopPropagation()
    event.preventDefault()
    const btn = (event.target as HTMLButtonElement)
    const btnRect = btn.getBoundingClientRect()
    const x = btnRect.bottom
    const y = btnRect.left + (frs ? 20 : 0)
    MenuAction.showMenu(menu, [x, y], undefined, () => { setHasClick(false) })
  }

  return <>
    <div className={style["WindowFrame"]} >
      <div className={style["ButtonList"]}>
        <div className={style["text"]}>
          {menulist.map((btns, i) =>
            <button
              key={"btn_" + i}
              kiase-style=""
              className={clsx(nowButton === i && style["activ"])}

              onMouseEnter={(event) => {
                if (!hasClick) return
                onClickEvent(event, btns[1], i === 0)
                setNowButton(i)
              }}
              onMouseDown={(event) => {
                if (hasClick) { setHasClick(false); setNowButton(-1); return; }
                event.stopPropagation();
                onClickEvent(event, btns[1], i === 0)
                setHasClick(true)
                setNowButton(i)
              }}
              onClick={(event) => {
                if (!hasClick) { setHasClick(false); return; }
                onClickEvent(event, btns[1], i === 0)
                setHasClick(true)
                setNowButton(i)
              }}

              style={{ zIndex: menulist.length - i }}
            >
              <div>{btns[0]}</div>
            </button>
          )}
        </div>
      </div>

      <div
        className={clsx(style["MainContent"], className)}
        onDrop={onDrop}
        onDrag={onDrag}
        onDragCapture={onDragCapture}
        onDragEnd={onDragEnd}
        onDragEndCapture={onDragEndCapture}
        onDragEnter={onDragEnter}
        onDragEnterCapture={onDragEnterCapture}
        onDragExit={onDragExit}
        onDragExitCapture={onDragExitCapture}
        onDragLeave={onDragLeave}
        onDragLeaveCapture={onDragLeaveCapture}
        onDragOver={onDragOver}
        onDragOverCapture={onDragOverCapture}
        onDragStart={onDragStart}
        onDragStartCapture={onDragStartCapture}
      >
        {children}
      </div>
    </div>
  </>
}

export const windowActionList: (win?: WindowInstance<e621Type.defaul>) => MenuAction.Item[] = (win) => {
  const setRct = (s: number,) => win?.setRect({ width: s, height: s, left: 50, top: 50 }, "%", "center-center");

  const ReactList: number[] = [
    90,
    80,
    70,
    60,
  ]

  return [
    ...ReactList.map(e => ([t("menuButton.ResetRect").replace("$1", e), () => setRct(e)])),
    [t("menuButton.Center"), () => win?.setRect({ top: 50, left: 50 }, "%", "center-center")],
    [t("menuButton.Minimize"), () => win?.minimize()],
    // [win?.isMaximized ? t("menuButton.Restore") : t("menuButton.Maximize"), () => win?.toggleMaximize()],
    [t("menuButton.Close"), () => win?.close()],
  ].map(e => ({
    name: e[0],
    action: e[1]
  }))
}

export const windowAction: (windowID: string, other?: MenuAction.Item[]) => MenuButtonType = (windowID, other) => {
  const win = wmRef.current?.getWindow(windowID)
  return [
    t("menuButton.top.Window"),
    [
      ...other ?? [],
      ...windowActionList(win),
    ],
  ]
}

