import { DeepPartial } from "@/data/someType"

export type defaultImages = {
  owos: {
    preview: string
    lock: string
    main: string
    avatar: string
  }
  root: {
    background: string
    avatar: string
  }
  blog: string
  AFK: string
}

export type Images = DeepPartial<defaultImages>
