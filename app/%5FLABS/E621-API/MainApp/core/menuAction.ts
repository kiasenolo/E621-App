import * as e621Type from "../types/appTypes"
import { dragEvent } from "./globals"

export namespace MenuAction {

  export type Item = {
    name: string
    action?: () => void | Promise<void>,
    onContextMenu?: () => void | Promise<void>,
    dragItem?: e621Type.DragItemType.defaul,
    active?: boolean,
  } | undefined


  export type CenterPoint =
    | "tl"
    | "tc"
    | "tr"
    | "cl"
    | "cc"
    | "cr"
    | "bl"
    | "bc"
    | "br"

  export type ActionType = {
    showMenu: (
      menuList: Item[],
      position: [number, number],
      center?: CenterPoint,
      onDrag?: (e: dragEvent) => void,
    ) => void
    closeMenu: () => void
  }
}


export const MenuAction: MenuAction.ActionType = {
  showMenu: () => { },
  closeMenu: () => { }
}

