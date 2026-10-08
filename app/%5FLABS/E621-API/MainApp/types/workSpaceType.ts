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
      baseUrl?: string
      passKey?: string;
      e621?: E621Auth;
    };
    loginStatus?: {
      lastLogin: number
    }
  }

  export namespace SettingUnit {
    export type Performance = {
      All: boolean
      cssAnimation: boolean
      transition: boolean
      transitionDelay: boolean
      cssFilter: boolean
      backdropFilter: boolean
      transparenWinodw: boolean
    }

    export type Cache = {
      enable: {
        global: boolean;
        post: {
          data: boolean;
          image: boolean;
          thumb: boolean;
        };
        pool: boolean;
        tags: boolean;
      };
      isManualLimit: boolean
      limit: {
        _all: number;
        post: {
          data: number;
          image: number;
          thumb: number;
        };
        pool: number;
        tags: number;
      };
      isManualMaxDownload: boolean
      maxConcurrentDownload: {
        _all: number;
        post: {
          image: number;
          thumb: number;
        };
      }
      downloadFromCache: boolean;
    };

    export type Download = {
      format: string,
      maxConcurrentDownloads: number,
    }

    export type Appearance = {
      scale: number,
      color: string,
      transparens: boolean;
      KIASTALA: boolean,
      clockFormat: string[];
      wallpaper: Unit.BaseItem.Image,
    };
  }

  export type Setting = {
    wmSettings: WMSettings,
    performance: SettingUnit.Performance
    lang: string,
    search: {
      defaultSearchFilter: e621Type.window.dataType.searchFilter,
    },
    download: SettingUnit.Download
    appearance: SettingUnit.Appearance
    cache: SettingUnit.Cache
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

export namespace WorkSpaces {

  export type Note = {
    name: string
    note?: string
  }

  export type Preview = {
    x: number
    y: number
    w: number
    h: number
    z: number
  }

  export type Setting = {
    wallpaper: Unit.BaseItem.Image,
    color: string
  }

  export type WorkSpaces = {
    id: string
    note: Note
    preview: Preview[]
    setting: Setting
    status: Unit.windowsStatus
  }
}

export type State = {
  nowWorkSpace: string
}

export type User = {
  saveInfo: Unit.SaveInfo,
  setting: Unit.Setting,
  saves: Unit.Saves,
  history: Unit.History
  workSpaces: WorkSpaces.WorkSpaces[]
  state: State
}

export type App = {
  lastUser?: number,
  rememberPassword?: string
  autoLogin: boolean
}

export type defaul = {
  userList: User[]
} & App