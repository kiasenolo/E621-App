import { RefObject, ReactNode, Dispatch, SetStateAction } from "react"
import { WindowAnchor, WindowManager } from "@/data/components/Window/WindowManager"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import { E621_API_CORE } from "./apiUse"
import React from "react"
import { SetValue } from "@/data/module/use/LocalStorage"
import { ElectrApiType } from "../../type"
import * as e621Type from "../types/appTypes"
import * as workSpaceType from "../types/workSpaceType"
import { newEmptyAccount } from "../core/appStorage"
import * as WSAction from "../core/appStorage"
import * as e621DatabaseCache from "./cacheSystem"
import { MenuAction } from "./menuAction"

import opfs from "@/data/module/functions/module/opfs"
export const fs = opfs.promises

export const defaultE926 = "https://e926.net"

export const apiCore = new E621_API_CORE()

export const devopts = {
  askYouBeforeYouLeave: !false,
  blurNSFWContent: !true,
  blurAnyContent: !true,
}

export function canBlurContent(post: E621.Post, size: number) {
  const blur = (size: number) => `blur(${size}px)`;
  if (devopts.blurAnyContent) return blur(size);
  if (devopts.blurNSFWContent) {
    if (post.rating === "e" || post.rating === "q")
      return blur(size)
  } else {
    return undefined;
  }
}

/*
 * 這個 是一個 個人專案
 * 密碼明文存 是十分正常的一件事情
 * 我也知道不安全 只是 現階段 他還在開發
 * 所以 yap 別跟我談加密 別跟我談哈希
 * 別跟我談任何安全性相關的東西 現階段 這個東西不重要
 * 僅個人學習以及使用
 */

export let storage = "Main"

export let forseUseProxy = false;
export let canCors = false
export const nonePrxy = () => canCors ? false : false;

/* 我已經受夠了手動換源的日子了 我需要這個神奇東西 */
export namespace iNeedThis {
  export const STATIC_HOST = /https:\/\/static(\d*)\.e621\.net\//;

  export function toE926Static<T extends string | null | undefined>(url: T, enabled = true): T {
    if (!enabled) return url;
    if (!url) return url;
    return url.replace(STATIC_HOST, "https://static$1.e926.net/") as T;
  }

  export function normalizePost(post: E621.Post, enabled = true): E621.Post {
    if (!enabled) return post;
    return {
      ...post,
      file: { ...post.file, url: toE926Static(post.file.url) },
      preview: { ...post.preview, url: toE926Static(post.preview.url) },
      sample: { ...post.sample, url: toE926Static(post.sample.url) },
    };
  }
}

export const baseUrlList: [string, string][] = [
  [defaultE926, "E926"],
  ["https://e621.net", "E621"],
]

export const iconList = {
  "taskBar.postSearch": <></>,
  "taskBar.post": <></>,
  "taskBar.postGetByID": <></>,
  "taskBar.pool": <></>,
  "taskBar.viewer": <></>,
  "taskBar.peekPreview": <></>,
  "taskBar.setting": <></>,
  "taskBar.tmpList": <></>,
  "startMenu.postSearch": <></>,
  "startMenu.postGetByID": <></>,
  "startMenu.pool": <></>,
  "startMenu.tmpList": <></>,
  "setting.search": <></>,
  "setting.account": <></>,
  "setting.download": <></>,
  "setting.storage": <></>,
  "setting.appearance": <></>,
  "setting.information": <></>,
}

export type ELECTRON_APP_INFO_TYPE = {
  id: number;
  isFocused: boolean;
  isFullScreen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
}

export const ELECTRON_APP_INFO_NOREADY: ELECTRON_APP_INFO_TYPE = {
  id: 0,
  isFocused: true,
  isFullScreen: false,
  isMinimized: false,
  isMaximized: false,
}

export const electronAppIsReady = () => window.electronAPI.appReady();
export const electronWinAction = (act: ElectrApiType.WindowAction) => window.electronAPI.windowAction(act);
export const electronSetTitle = (name: string) => window.electronAPI.setTitle(name);
export let [ELECTRON_WIN_STATE, SET_ELECTRON_WIN_STATE]: [ELECTRON_APP_INFO_TYPE, Dispatch<SetStateAction<ELECTRON_APP_INFO_TYPE>>] = [ELECTRON_APP_INFO_NOREADY, () => { }]

export let electronMode = false;
export const appName = "E621 App / inDev 0.2.0"

export type SetStateType<T> = Dispatch<SetStateAction<T>>;
export type DispType<T> = [T, SetStateType<T>];
export type LocalDispType<T> = [T, SetValue<T>];

export let [READY, SET_READY]: DispType<boolean> = [false, () => { }]
export let [E621_BASE_URL, SET_E621_BASE_URL]: DispType<string> = [defaultE926, () => { }]
export let [APP_READY, SET_APP_READY]: DispType<boolean> = [false, () => { }]
export let [OFFLINE_MODE, SET_OFFLINE_MODE]: LocalDispType<boolean> = [false, () => { }]
export let [STORAGE_SELECT_MODE, SET_STORAGE_SELECT_MODE]: LocalDispType<boolean> = [false, () => { }]
export let [NOW_STORAGE, SET_NOW_STORAGE]: LocalDispType<string> = ["Main", () => { }]

export let usrIndx = ""
export let baseUrlLoaded = false

export let disableWindowKeyEvent = true

export let wmRef: RefObject<WindowManager<e621Type.defaul> | null>;

export const StopEvent = (e: any) => {
  e.preventDefault()
  e.stopPropagation()
}

export type PostsCache = Record<number, E621.Post[]>;
export type Resolution = [number, number]

export type createWindow = (
  wmRef: RefObject<WindowManager<e621Type.defaul> | null>,
  customData: e621Type.defaul,
  other?: {
    id?: string,
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    anchor?: WindowAnchor
  },
  setData?: boolean
) => string | undefined;

export type MenuButtonType = [string, MenuAction.Item[]];

export type dragEvent = (event: React.DragEvent<HTMLDivElement>) => void

export interface WindowFrameProps {
  menulist: MenuButtonType[];
  className?: string;
  children: ReactNode;
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
// #endregion

export let WSA: WSAction.WorkSpaceActions
export let E621_DB: e621DatabaseCache.E621Database
/* ========================================================================================= */

export let createWindow: createWindow = () => "none";

/* ========================================================================================= */

export let [isLogin, setIsLogin]: DispType<boolean> = [false, () => { }]
export let [displayDesktop, setDisplayDesktop]: DispType<boolean> = [false, () => { }]
export let [appTitle, setAppTitle]: DispType<string> = [appName, () => { }]
export let [importing, setImporting]: DispType<boolean> = [false, () => { }]
export let [nowSetting, _setNowSetting]: DispType<workSpaceType.Unit.Setting> = [newEmptyAccount.setting, () => { }]
export let [nowSaveInfo, setNowSaveInfo]: DispType<workSpaceType.Unit.SaveInfo> = [newEmptyAccount.saveInfo, () => { }]


/* 跨模組不能直接對 import 進來的變數賦值，統一透過這些 setter 修改 */
export const setStorage = (v: string) => { storage = v }
export const setForseUseProxy = (v: boolean) => { forseUseProxy = v }
export const setCanCors = (v: boolean) => { canCors = v }
export const setElectronMode = (v: boolean) => { electronMode = v }
export const setUsrIndx = (v: string) => { usrIndx = v }
export const setBaseUrlLoaded = (v: boolean) => { baseUrlLoaded = v }
export const setDisableWindowKeyEvent = (v: boolean) => { disableWindowKeyEvent = v }
export const setWmRef = (v: RefObject<WindowManager<e621Type.defaul> | null>) => { wmRef = v }
export const setWSA = (v: WSAction.WorkSpaceActions) => { WSA = v }
export const setE621DB = (v: e621DatabaseCache.E621Database) => { E621_DB = v }
export const setCreateWindow = (v: createWindow) => { createWindow = v }

export const bindState = {
  ready: (v: DispType<boolean>) => { [READY, SET_READY] = v },
  appReady: (v: DispType<boolean>) => { [APP_READY, SET_APP_READY] = v },
  baseUrl: (v: DispType<string>) => { [E621_BASE_URL, SET_E621_BASE_URL] = v },
  nowStorage: (v: LocalDispType<string>) => { [NOW_STORAGE, SET_NOW_STORAGE] = v },
  storageSelectMode: (v: LocalDispType<boolean>) => { [STORAGE_SELECT_MODE, SET_STORAGE_SELECT_MODE] = v },
  offlineMode: (v: LocalDispType<boolean>) => { [OFFLINE_MODE, SET_OFFLINE_MODE] = v },
  electronWin: (v: DispType<ELECTRON_APP_INFO_TYPE>) => { [ELECTRON_WIN_STATE, SET_ELECTRON_WIN_STATE] = v },
  isLogin: (v: DispType<boolean>) => { [isLogin, setIsLogin] = v },
  displayDesktop: (v: DispType<boolean>) => { [displayDesktop, setDisplayDesktop] = v },
  appTitle: (v: DispType<string>) => { [appTitle, setAppTitle] = v },
  importing: (v: DispType<boolean>) => { [importing, setImporting] = v },
  nowSetting: (v: DispType<workSpaceType.Unit.Setting>) => { [nowSetting, _setNowSetting] = v },
  nowSaveInfo: (v: DispType<workSpaceType.Unit.SaveInfo>) => { [nowSaveInfo, setNowSaveInfo] = v },
}
