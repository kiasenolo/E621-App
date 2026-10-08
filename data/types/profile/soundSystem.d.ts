import { DeepPartial } from "@/data/someType"

export type LoopMusic =
  | [string, number, number] // [ url, loopstart, loopend ]
  | [string, string] // [ startUrl, loopUrl ]

export type Music = {
  "ARKTESE FELOTA KIATAKSE": string | LoopMusic
  "Love Story": string | LoopMusic
}

export type SFX = {
  root: {
    back: string
    change: string
    enter: string
    in: string
  }
  owos: {
    logout: string
    login: string
    notcorrect: string
    correct: string
    grouphover: string
    button: {
      hover: string
      press: string
      release: string
    },
    powerOptions: {
      open: string
      close: string
    }
    preview: {
      open: string
      close: string
      zoomin: string
      zoomout: string
      board: {
        open: string
        close: string
      }
      apply: {
        lock: {
          hover: string
          press: string
          release: string
        },
        main: {
          hover: string
          press: string
          release: string
        },
      }
    }
  }
}

export type defaultSoundSystem = {
  Music: Music
  SFX: SFX
}

export type SoundSystem = DeepPartial<defaultSoundSystem>