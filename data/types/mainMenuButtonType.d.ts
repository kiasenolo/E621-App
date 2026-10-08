export type BaseButtonType = (
  {
    info?: string,
    name: string,
    nonClickSound?: boolean
    backToRoot?: boolean
    end?: boolean
    disableInfo?: string
    disable?: boolean
  }
) & {
  events?: {
    onFocus?: () => any,
    onBlur?: () => any,
    onClick?: () => any,
  }
}

export type ButtonListType = (
  {
    type: "logoTitle",
    image: string
    maskColor?: boolean
  } | {
    type: "title",
    nonClipline?: boolean
    content: string,
  } | {
    type: "clipSpace",
  } | {
    type: "clipLine",
  } | (
    BaseButtonType & {
      type: "menu",
      buttons: ButtonListType[],
    }
  ) | (
    BaseButtonType & {
      type: "function",
      exec: () => void
    }
  ) | (
    BaseButtonType & {
      type: "url",
      url: string,
    }
  ) | (
    BaseButtonType & {
      type: "otherUrl",
      url: string,
    }
  ) | (
    BaseButtonType & {
      type: "back",
    }
  )

)