export interface execCommand {
    type: "execCommand",
    cmd: string
}

export interface other {
    type: "other",
    cmd: () => void
}

export interface ContextMenuDisableButtonType {
    type: "disableButton"
    name: string
    tips?: string
    icon?: ReactDOM
    hotkey?: string
}

export interface ContextMenuButtonType {
    type: "button"
    name: string
    function: execCommand | other
    tips?: string
    icon?: ReactDOM
    hotkey?: string
}
export interface ContextMenuClipLineType {
    type: "ClipLine"
}

export type ButtonType = ContextMenuButtonType | ContextMenuDisableButtonType | ContextMenuClipLineType

export interface ContextMenuProp {
    useFunction?: boolean
    otherButton?: Array<ButtonType>
}