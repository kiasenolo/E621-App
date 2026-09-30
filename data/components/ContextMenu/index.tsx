import type { NextPage } from 'next';
import { useEffect } from 'react';
import style from "./style.module.scss";
import { ButtonType, ContextMenuProp } from "./type"

let focusTarget: EventTarget | null = null

const ContextMenuButton: Array<ButtonType> = [
  {
    type: "button",
    name: "複製",
    function: {
      type: "other",
      cmd: async () => {
        const selection = window.getSelection();
        const Target_ = focusTarget as unknown as HTMLInputElement | HTMLTextAreaElement;
        Target_.focus()
        try {
          await navigator.clipboard.writeText((selection || "").toString());
        } catch (err) {
        }
      }
    },
    icon: <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M9 18q-.825 0-1.412-.587Q7 16.825 7 16V4q0-.825.588-1.413Q8.175 2 9 2h9q.825 0 1.413.587Q20 3.175 20 4v12q0 .825-.587 1.413Q18.825 18 18 18Zm0-2h9V4H9v12Zm-4 6q-.825 0-1.413-.587Q3 20.825 3 20V7q0-.425.288-.713Q3.575 6 4 6t.713.287Q5 6.575 5 7v13h10q.425 0 .713.288.287.287.287.712t-.287.712Q15.425 22 15 22ZM9 4v12V4Z" /></svg>,
    hotkey: "Ctrl + C"
  },
  {
    type: "button",
    name: "剪下",
    function: {
      type: "other",
      cmd: async () => {
        const selection = window.getSelection();
        const Target_ = focusTarget as unknown as HTMLInputElement | HTMLTextAreaElement;
        Target_.focus()
        try {
          await navigator.clipboard.writeText((selection || "").toString());
          selection?.deleteFromDocument()
        } catch (err) {
        }
      }
    },
    icon: <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M19.6 21.6 12 14l-2.35 2.35q.2.375.275.8.075.425.075.85 0 1.65-1.175 2.825Q7.65 22 6 22q-1.65 0-2.825-1.175Q2 19.65 2 18q0-1.65 1.175-2.825Q4.35 14 6 14q.425 0 .85.075t.8.275L10 12 7.65 9.65q-.375.2-.8.275Q6.425 10 6 10q-1.65 0-2.825-1.175Q2 7.65 2 6q0-1.65 1.175-2.825Q4.35 2 6 2q1.65 0 2.825 1.175Q10 4.35 10 6q0 .425-.075.85t-.275.8L21.6 19.6q.425.425.425 1t-.425 1q-.425.425-1 .425t-1-.425ZM15 11l-2-2 6.6-6.6q.425-.425 1-.425t1 .425q.425.425.425 1t-.425 1ZM6 8q.825 0 1.412-.588Q8 6.825 8 6t-.588-1.412Q6.825 4 6 4t-1.412.588Q4 5.175 4 6t.588 1.412Q5.175 8 6 8Zm6 4.5q.225 0 .363-.137.137-.138.137-.363 0-.225-.137-.363-.138-.137-.363-.137-.225 0-.363.137-.137.138-.137.363 0 .225.137.363.138.137.363.137ZM6 20q.825 0 1.412-.587Q8 18.825 8 18q0-.825-.588-1.413Q6.825 16 6 16t-1.412.587Q4 17.175 4 18q0 .825.588 1.413Q5.175 20 6 20Z" /></svg>,
    hotkey: "Ctrl + X"
  },
  {
    type: "button",
    name: "貼上",
    function: {
      type: "other",
      cmd: async () => {
        const Target_ = focusTarget as unknown as HTMLInputElement | HTMLTextAreaElement;
        Target_.focus()
        try {
          const text = await navigator.clipboard.readText();
          if (Target_) {
            const start = Target_.selectionStart || 0;
            const end = Target_.selectionEnd || 0;
            const textBefore = Target_.value.substring(0, start);
            const textAfter = Target_.value.substring(end);
            Target_.value = textBefore + text + textAfter;
            Target_.setSelectionRange(start + text.length, start + text.length);
          }
        } catch (err) {
          console.error('Failed to read clipboard contents: ', err);
        }
      }
    },
    icon: <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M12 5q.425 0 .713-.288Q13 4.425 13 4t-.287-.713Q12.425 3 12 3t-.712.287Q11 3.575 11 4t.288.712Q11.575 5 12 5ZM5 21q-.825 0-1.413-.587Q3 19.825 3 19V5q0-.825.587-1.413Q4.175 3 5 3h4.175q.275-.875 1.075-1.438Q11.05 1 12 1q1 0 1.788.562.787.563 1.062 1.438H19q.825 0 1.413.587Q21 4.175 21 5v14q0 .825-.587 1.413Q19.825 21 19 21Zm0-2h14V5h-2v1q0 .825-.587 1.412Q15.825 8 15 8H9q-.825 0-1.412-.588Q7 6.825 7 6V5H5v14Z" /></svg>,
    hotkey: "Ctrl + V"
  },
]

function mapButton(button: ButtonType, i: number) {
  switch (button.type) {

    case 'button': {
      let onClick: () => void = () => { }

      switch (button.function.type) {
        case 'execCommand': {
          onClick = () => {
            (focusTarget as unknown as HTMLElement).focus()
            setTimeout(() => {
              document.execCommand(button.function.cmd as string)
            }, 1)
          }
          break
        }
        case 'other': {
          onClick = button.function.cmd
          break

        }
      }
      return <button
        onMouseDown={(event) => {
          if (button.function.type === "execCommand") {
            event.preventDefault()
          }
          onClick();
        }}
        key={i}
        hover-tips={button.tips}
      >
        {button.icon}
        <div className={style["name"]}>{button.name}</div>
        <div className={style["hotkey"]}>{button.hotkey || ""}</div>
      </button>
    }

    case 'disableButton': {
      return <button
        key={i}
        hover-tips={button.tips}
        style={{ opacity: .5, pointerEvents: "none" }}
      >
        {button.icon}
        <div className={style["name"]}>{button.name}</div>
        <div className={style["hotkey"]}>{button.hotkey || ""}</div>
      </button>
    }

    case 'ClipLine': {
      return <div key={i} className={style["ClipLine"]}></div>
    }

  }
}

function menu() {
  return document.getElementById(style.menu)!
}

function showMenu(x: number, y: number) {
  menu().style.left = x + 'px';
  menu().style.top = y + 'px';
  menu().classList.add(style.show);
}

function hideMenu() {
  menu().classList.remove(style.show);
}

function onMouseDown() {
  hideMenu();
  document.removeEventListener('mousedown', onMouseDown);
}

export function onContextMenu(e: MouseEvent) {
  e.preventDefault();
  focusTarget = e.target
  showMenu(e.pageX, e.pageY);
  document.addEventListener('mousedown', onMouseDown, false);
}

const ContextMenu: NextPage<ContextMenuProp> = (prop) => {
  useEffect(() => {
    if (!prop.useFunction) {
      document.addEventListener('contextmenu', onContextMenu, false);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onMouseDown()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu, false);
      document.removeEventListener("keydown", onKeyDown);
    }
  })

  return (
    <>
      <div id={style["menu"]}>
        {ContextMenuButton.map(mapButton)}
        {prop.otherButton ? <div className={style["ClipLine"]}></div> : ""}
        {prop.otherButton ? prop.otherButton.map(mapButton) : ""}
      </div>
    </>
  )
}

export default ContextMenu;

