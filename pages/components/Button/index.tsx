import { NextPage } from "next"
import { ReactNode } from "react"
import style from "./style.module.scss"
import NotAPage from "@/data/components/NotAPage"

/* Copy From OwOs */
type mouseEvent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
type dragEvent = (event: React.DragEvent<HTMLDivElement>) => void

export interface ButtonProp {
  children?: ReactNode;
  status: "icon" | "isOpen" | "focus" | "blur" | "mini";
  title: string;
  onClick?: (event?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseDown?: mouseEvent;
  onMouseEnter?: mouseEvent;
  onMouseMove?: mouseEvent;
  onMouseLeave?: mouseEvent;
  onMouseOver?: mouseEvent;
  onMouseUp?: mouseEvent;
  onContextMenu?: mouseEvent;
  onDrop?: dragEvent
  onDrag?: dragEvent
  onDragCapture?: dragEvent
  onDragEnd?: dragEvent
  onDragEndCapture?: dragEvent
  onDragEnter?: dragEvent
  onDragEnterCapture?: dragEvent
  onDragExit?: dragEvent
  onDragExitCapture?: dragEvent
  onDragLeave?: dragEvent
  onDragLeaveCapture?: dragEvent
  onDragOver?: dragEvent
  onDragOverCapture?: dragEvent
  onDragStart?: dragEvent
  onDragStartCapture?: dragEvent
}

export const Button: NextPage<ButtonProp> = (prop) => {

  return (
    <div
      className={style["mainButton"]}
      status-style={prop.status}
      hover-tips={prop.title}
      onClick={prop.onClick}
      onMouseDown={prop.onMouseDown}
      onMouseEnter={prop.onMouseEnter}
      onMouseMove={prop.onMouseMove}
      onMouseLeave={prop.onMouseLeave}
      onMouseOver={prop.onMouseOver}
      onMouseUp={prop.onMouseUp}
      onContextMenu={prop.onContextMenu}

      onDrop={prop.onDrop}
      onDrag={prop.onDrag}
      onDragCapture={prop.onDragCapture}
      onDragEnd={prop.onDragEnd}
      onDragEndCapture={prop.onDragEndCapture}
      onDragEnter={prop.onDragEnter}
      onDragEnterCapture={prop.onDragEnterCapture}
      onDragExit={prop.onDragExit}
      onDragExitCapture={prop.onDragExitCapture}
      onDragLeave={prop.onDragLeave}
      onDragLeaveCapture={prop.onDragLeaveCapture}
      onDragOver={prop.onDragOver}
      onDragOverCapture={prop.onDragOverCapture}
      onDragStart={prop.onDragStart}
      onDragStartCapture={prop.onDragStartCapture}
    >
      <button className={style["icon"]}>
        {prop.children ?? <svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M11 44q-1.2 0-2.1-.9Q8 42.2 8 41V7q0-1.2.9-2.1Q9.8 4 11 4h16.8q.6 0 1.175.25.575.25.975.65l9.15 9.15q.4.4.65.975T40 16.2V41q0 1.2-.9 2.1-.9.9-2.1.9Zm16.55-29.2V7H11v34h26V16.3h-7.95q-.65 0-1.075-.425-.425-.425-.425-1.075ZM11 7v9.3V7v34V7Z" /></svg>}
      </button>
    </div>
  )
}

export default function () {
  return <NotAPage info={[
    "OwOs的按鈕 但拿給E621的應用程式用了",
  ]} />
};