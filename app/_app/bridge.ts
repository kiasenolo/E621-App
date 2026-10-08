import type { Dispatch, SetStateAction } from 'react'

export let _powerSaveingMode = true
export let _setPowerSaveingMode: Dispatch<SetStateAction<boolean>> = () => { }

export let _appScale = 100
export let _setAppScale: Dispatch<SetStateAction<number>> = () => { }

export type AppApi = {
  disableColor: () => boolean;
  enableColor: () => boolean;
  toggleColor: (sta?: boolean) => boolean;
  hideColorPanel: (sta?: boolean) => boolean;
  setColor: (color: string) => Object;
  setColor2: (color: string) => Object;
  informalFunction: {
    CursorEffects: (mode: "TOG" | "SET", status?: boolean) => boolean;
  };
  color: string;
  color2: string;
  throwNotic: (message: string, time?: number) => void;
  throwNewNotic: (message: string, time?: number) => void;
  clearNotic: () => void;
  Effects: {
    FLASH: (color?: string) => boolean;
  };
}

export let _app: AppApi = {
  disableColor: () => false,
  enableColor: () => false,
  toggleColor: () => false,
  hideColorPanel: () => false,
  setColor: () => ({ R: 0, G: 0, B: 0 }),
  setColor2: () => ({ R: 0, G: 0, B: 0 }),
  color: "#000",
  color2: "#000",
  informalFunction: {
    CursorEffects: () => false,
  },
  throwNotic: () => { },
  throwNewNotic: () => { },
  clearNotic: () => { },
  Effects: {
    FLASH: () => false,
  },
}

export const bindPowerSaveingMode = (value: boolean, setter: Dispatch<SetStateAction<boolean>>) => {
  _powerSaveingMode = value
  _setPowerSaveingMode = setter
}

export const bindAppScale = (value: number, setter: Dispatch<SetStateAction<number>>) => {
  _appScale = value
  _setAppScale = setter
}

export const bindApp = (api: AppApi) => {
  _app = api
}
