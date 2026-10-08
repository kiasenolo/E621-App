import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import * as e621Type from "./appTypes"
import { WindowSnapshot, WMSettings } from "@/data/components/Window/WindowManager"

export namespace Unit {
  export namespace BaseItem {
    export type Image = {
      url: string
      positionX?: number
      positionY?: number
      scale?: number
      fromPost?: E621.Post
    }

    export type DownloadItems = {
      id: number
      url: string
      at: number
    }

    export type TmpItem = {
      name?: string,
      createAt: number,
      windowId: string,
      data: e621Type.defaul
    }
  }

  export type E621Auth = {
    name?: string;
    key?: string;
  };

  export type SaveInfo = {
    id: string;
    user: {
      name: string;
      avatar: BaseItem.Image;
      passKey?: string;
      e621?: E621Auth;
    };
    loginStatus?: {
      lastLogin: number
    }
  }

  export type Performance = {
    All: boolean
    cssAnimation: boolean
    transition: boolean
    transitionDelay: boolean
    cssFilter: boolean
    backdropFilter: boolean
    transparenWinodw: boolean
  }

  export type Setting = {
    wmSettings: WMSettings,
    performance: Performance
    lang: string,
    search: {
      defaultSearchFilter: e621Type.window.dataType.searchFilter,
    },
    download: {
      format: string,
      maxConcurrentDownloads: number,
    },
    appearance: {
      scale: number,
      color: string,
      transparens: boolean;
      KIASTALA: boolean,
      clockFormat: string[];
      wallpaper: Unit.BaseItem.Image,
    },
  }

  export type Saves = {
    download: BaseItem.DownloadItems[]
    tmpList: BaseItem.TmpItem[]
    wallpapers: Unit.BaseItem.Image[],
  }

  export type History = {
    search: string[],
    color: string[],
    wallpaper: Unit.BaseItem.Image[],
    download: BaseItem.DownloadItems[],
  }

  export type windowsStatus = WindowSnapshot<e621Type.defaul>[]
}

export type User = {
  nowWorkSpace: number
  saveInfo: Unit.SaveInfo,
  setting: Unit.Setting,
  saves: Unit.Saves,
  history: Unit.History
  windowsStatus?: Unit.windowsStatus
  workSpaces: {
    name: string
    note?: string
    setting: {
      wallpaper: Unit.BaseItem.Image,
      color: string
    }
    status: Unit.windowsStatus
  }[]
}

export type App = {
  lastUser?: number,
  rememberPassword?: string
  autoLogin: boolean
}

export type defaul = {
  userList: User[]
} & App