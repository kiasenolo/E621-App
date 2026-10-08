type OnClick = any
import { ReactNode } from "react"

export type Os = { //神奇的系統
  DefaultIcon?: ReactNode //預設的圖示
  menuBarButtons: Array<{ //底欄的按鈕
    name: string //名字
    icon: ReactNode //圖標
    onClick: OnClick //按下之後的事件（onClickType）
  }>
  mainButtons: Array<{ //主要的按鈕
    name: string //名字
    buttons: Array<{ //按鈕們
      name: string //名字
      cml: string //要執行的系統指令
      icon?: ReactNode //圖標（svg）
    }>
  }>
  powerOptions: Array<{
    icon: ReactNode
    type: "cmdLine"
    cmd: string
    tip: string
  } | {
    icon: ReactNode
    type: "jsFunc"
    cmd: () => void
    tip: string
  }>
}