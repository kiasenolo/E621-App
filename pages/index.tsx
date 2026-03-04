import { useCallback, useEffect, useRef, useState, useMemo, RefObject, ReactNode, MouseEventHandler, Dispatch, SetStateAction, JSX } from "react";
import style from "./style.module.scss";
import { LABS_E621_API } from "@/pages/api/_LABS/E621-API/_API-LIST";
import { SnapPosition, WindowInstance, WindowManager, WindowSnapshot } from "@/data/components/Window/WindowManager";
import { _app, Kiasole, newInput } from "@/pages/_app";
import { E621 } from "@/pages/api/_LABS/E621-API/types/e621";
import { Button } from "./components/Button";
import useLocalStorage, { SetValue } from "@/data/module/use/LocalStorage";
import { WindowRect } from "@/data/components/Window/Window";
import { makeQuery } from "@/pages/api/_LABS/E621-API/lib/e621-core";
import { cloneDeep, merge } from "lodash";
import functions from "@/data/module/functions";
import Viewer from "@/data/components/Viewer";
import KiloDown from "@/data/components/KiloDown";
import React from "react";

/*
 * 這個 是一個 個人專案
 * 密碼明文存 是十分正常的一件事情
 * 我也知道不安全 只是 現階段 他還在開發
 * 所以 yap 別跟我談加密 別跟我談哈希
 * 別跟我談任何安全性相關的東西 現階段 這個東西不重要
 * 僅個人學習以及使用
 */

const langList = {
  "en-us": {

    "NAME": "English (US)",
    "NOTIC": "Changing the language will restart all windows",

    /* >:System: */

    /* Desktop */
    "Desktop.drag.Cancel": "Cancel",


    /* startMenuSide */
    "startMenuSide.logout": "Logout",
    "startMenuSide.appSetting": "App Setting",
    "startMenuSide.console": "Console",

    /* Taskbar */
    "taskBar.startMenu": "Start Menu",

    /* <:System: */


    /* >:menuButton: */

    /* Window */
    "menuButton.top.Window": "Window",
    "menuButton.RestoreParentWindow": "Restore Parent Window",
    "menuButton.Clone": "Clone Window",
    "menuButton.Restore": "Restore",
    "menuButton.Minimize": "Minimize",
    "menuButton.Close": "Close",

    "menuButton.ResetRect": "Reset Rect $1%",

    /* Data */
    "menuButton.top.Data": "Data",
    "menuButton.Reload": "Reload",
    "menuButton.ClearAll": "CLEAR ALL",

    /* Other */
    "menuButton.top.Other": "Other",
    "menuButton.SaveToTmp": "Save To Tmp",
    "menuButton.CopyRawJson": "Copy Raw Json",
    "menuButton.CopyID": "Copy ID",
    "menuButton.OpenWithBrowser": "Open With Browser",
    "menuButton.OpenWithViewer": "Open With Viewer",
    "menuButton.OpenWithGetByID": "Open With Get By ID",
    "menuButton.SetAsWallpaper": "Set As Wallpaper",
    "menuButton.SetAsAvatar": "Set As Avatar",

    /* Setting */
    "menuButton.top.Category": "Category",
    "menuButton.top.Tab": "Tab",

    /* <:menuButton: */


    /* >:WindowsType: */

    "windowsType.postSearch": "Post Search",
    /* postSearch */

    "windowsType.postSearch.page": "Page $1",

    "windowsType.postSearch.jumpToPage": "Jump To Page",
    "windowsType.postSearch.jumpToPage.Cancel": "<-- Cancel",
    "windowsType.postSearch.jumpToPage.Apply": "Apply -->",

    "windowsType.postSearch.filter": "Filter",

    "windowsType.postSearch.filter.rating": "Rating",

    "windowsType.postSearch.filter.rating.s": "Safe",
    "windowsType.postSearch.filter.rating.q": "Questionable",
    "windowsType.postSearch.filter.rating.e": "Explicit",

    "windowsType.postSearch.filter.type": "Type",

    "windowsType.postSearch.filter.type.vid": "Video",
    "windowsType.postSearch.filter.type.gif": "GIF",
    "windowsType.postSearch.filter.type.pic": "Image",

    "windowsType.postSearch.filter.sortBy": "Sort by",

    "windowsType.postSearch.filter.sortBy.newest": "Newest",
    "windowsType.postSearch.filter.sortBy.score": "Score",
    "windowsType.postSearch.filter.sortBy.favs": "Favs",
    "windowsType.postSearch.filter.sortBy.size": "Size",

    "windowsType.postSearch.filter.sortBy.reverse": "Reverse Sort",

    /* postSearch */


    "windowsType.post": "Post",
    "windowsType.postGetByID": "Post Get By ID",
    "windowsType.pool": "Pool",

    "windowsType.viewer": "Viewer",
    /* viewer */
    "windowsType.viewer.ResetTransform": "Reset Transform",

    "windowsType.viewer.RanderMode": "Rander Mode : ",
    "windowsType.viewer.RanderMode.Auto": "Auto",
    "windowsType.viewer.RanderMode.Pixelated": "Pixelated",
    /* viewer */


    "windowsType.setting": "Setting",
    "windowsType.tmpList": "Temp List",

    /* <:WindowsType: */


    /* >:components.post: */

    "components.post.Artists": "Artists",
    "components.post.Copyrights": "Copyrights",
    "components.post.Character": "Character",
    "components.post.Species": "Species",
    "components.post.General": "General",
    "components.post.Meta": "Meta",
    "components.post.Lore": "Lore",
    "components.post.Source": "Source",
    "components.post.Information": "Information",

    "components.post.info.Size": "Size",
    "components.post.info.Type": "Type",
    "components.post.info.Rating": "Rating",
    "components.post.info.Score": "Score",
    "components.post.info.Favs": "Favs",
    "components.post.info.Posted": "Posted",

    "components.post.parent": "Parent : ",
    "components.post.children": "Child : ",
    "components.post.pool": "Pool : ",
    "components.post.moreThenOne": "More then one, total $1",

    /* <:components.post: */


    /* >:setting: */

    "setting.Back": "<- Back",
    "setting.Home": "Home",

    /* Search */
    "setting.Search": "Search",
    "setting.Search.general": "General",
    "setting.Search.tags": "Tags",
    "setting.Search.history": "History",
    "setting.Search.export/import": "Export/Import",

    /* Account */
    "setting.Account": "Account",

    /* .local */
    "setting.Account.local": "Local",
    "setting.Account.local.changePassword": "If you want, you can change your password",
    "setting.Account.local.changePassword.current": "Current Password",
    "setting.Account.local.changePassword.new": "New Password",
    "setting.Account.local.changePassword.newAgain": "New Password Again",
    "setting.Account.local.changePassword.update": "Update Password",
    "setting.Account.local.changePassword.remove": "Remove Password",
    "setting.Account.local.changePassword.notic.noMatch": "Doesn't match your current password .w.",
    "setting.Account.local.changePassword.notic.newNoMatch": "The new passwords don't match .w.",
    "setting.Account.local.changePassword.pop.areYouSure": "Are you sure you want to remove your password?",
    "setting.Account.local.changePassword.pop.yes": "Remove it",
    "setting.Account.local.changePassword.pop.no": "Cancel",
    "setting.Account.local.changePassword.pop.hasGone": "Alright, your password is gone",
    "setting.Account.local.changePassword.pop.hasChange": "Alright, your password has been changed",

    "setting.Account.local.setPassword": "I recommend you can set a password",
    "setting.Account.local.setPassword.new": "New Password",
    "setting.Account.local.setPassword.setPass": "Set Password",
    "setting.Account.local.setPassword.pop.success": "You successfully set a password for your account. Great!",

    "setting.Account.local.deleteAccount": "Delete Account",
    "setting.Account.local.deleteAccount.1": "Are you sure you want to delete this account?",
    "setting.Account.local.deleteAccount.1.yes": "Yes, I am",
    "setting.Account.local.deleteAccount.1.no": "Not now",
    "setting.Account.local.deleteAccount.2": "Everything will be gone.\nYour downloads, temp list, and history will all be deleted.",
    "setting.Account.local.deleteAccount.2.yes": "Yes, delete it",
    "setting.Account.local.deleteAccount.2.no": "Wait, never mind",
    "setting.Account.local.deleteAccount.3": "Do you really not care if all this disappears?",
    "setting.Account.local.deleteAccount.3.yes": "Just delete it",
    "setting.Account.local.deleteAccount.3.no": "I actually do care, cancel",
    /* .local */

    /* .avatar */
    "setting.Account.avatar": "Avatar",
    "setting.Account.avatar.set": "Set as Avatar",
    "setting.Account.avatar.apply": "Apply",
    "setting.Account.avatar.source": "Picture Source",
    /* .avatar */

    "setting.Account.e621": "E621",
    "setting.Account.language": "Language",
    "setting.Account.export/import": "Export/Import",

    /* Download */
    "setting.Download": "Download",
    "setting.Download.general": "General",
    "setting.Download.history": "History",
    "setting.Download.export/import": "Export/Import",


    /* Appearance */
    "setting.Appearance": "Appearance",
    "setting.Appearance.general": "General",
    "setting.Appearance.theme": "Theme",

    /* .wallpaper */
    "setting.Appearance.wallpaper": "Wallpaper",
    "setting.Appearance.wallpaper.set": "Set as Wallpaper",
    "setting.Appearance.wallpaper.apply": "Apply",
    "setting.Appearance.wallpaper.source": "Picture Source",
    /* .wallpaper */


    /* Information */
    "setting.Information": "Information",

    /* .general */
    "setting.Information.general": "General",
    "setting.Information.general.line.1": [
      "Experience E621 in a windowed, OS-style interface.",
      "It was a blast. Let's never do it again.",
    ],
    "setting.Information.general.line.2": [
      "Building this was actually a lot of fun,",
      "Even though it was honestly a pain to code.",
      "But at least, I made it happen.",
      "Intuitive interactions, intuitive logic,",
      "And performance-heavy animations—yeah, peak design.",
      "Anyway, I guess this finally fulfills my 'KILO OS' dream.",
      "I don't know. It is what it is.",
      "Oh right, a friend said this to me, but I have to share it:",
      "I seem to be coding an E621 client as if it were professional-grade software.",
    ],
    "setting.Information.general.repoLink": "Repo Link",
    /* .general */


    /* <:setting: */
  },
  "zh-tw": {

    "NAME": "繁體中文",
    "NOTIC": "切語言的時候會重開所有視窗",

    /* >:System: */

    /* Desktop */
    "Desktop.drag.Cancel": "取消",

    /* startMenuSide */
    "startMenuSide.logout": "登出",
    "startMenuSide.appSetting": "設定",
    "startMenuSide.console": "控制臺",

    /* Taskbar */
    "taskBar.startMenu": "開始選單",

    /* <:System: */


    /* >:menuButton: */

    /* Window */
    "menuButton.top.Window": "視窗",
    "menuButton.RestoreParentWindow": "把老爸叫回來",
    "menuButton.Clone": "複製視窗",
    "menuButton.Restore": "還原",
    "menuButton.Minimize": "最小化",
    "menuButton.Close": "關閉",

    "menuButton.ResetRect": "重設位置和大小 $1%",


    /* Data */
    "menuButton.top.Data": "資料",
    "menuButton.Reload": "重新獲取",
    "menuButton.ClearAll": "全部清空",

    /* Other */
    "menuButton.top.Other": "其他",
    "menuButton.SaveToTmp": "存到暫存區",
    "menuButton.CopyRawJson": "複製原始JSON",
    "menuButton.CopyID": "複製ID",
    "menuButton.OpenWithBrowser": "在瀏覽器中開啓",
    "menuButton.OpenWithViewer": "在圖片檢視器中開啓",
    "menuButton.OpenWithGetByID": "在從ID抓作品中開啓",
    "menuButton.SetAsWallpaper": "設成桌布",
    "menuButton.SetAsAvatar": "設成頭貼",

    /* Setting */
    "menuButton.top.Category": "類別",
    "menuButton.top.Tab": "分頁",

    /* <:menuButton: */

    /* >:WindowsType: */

    "windowsType.postSearch": "作品搜尋",

    /* postSearch */
    "windowsType.postSearch.page": "第 $1 頁",

    "windowsType.postSearch.jumpToPage": "跳轉至頁",
    "windowsType.postSearch.jumpToPage.Cancel": "<-- 算了",
    "windowsType.postSearch.jumpToPage.Apply": "套用 -->",

    "windowsType.postSearch.filter": "篩選器",

    "windowsType.postSearch.filter.rating": "分級",
    "windowsType.postSearch.filter.rating.s": "安全",
    "windowsType.postSearch.filter.rating.q": "可疑",
    "windowsType.postSearch.filter.rating.e": "限制級",

    "windowsType.postSearch.filter.type": "類型",

    "windowsType.postSearch.filter.type.vid": "影片",
    "windowsType.postSearch.filter.type.gif": "動圖",
    "windowsType.postSearch.filter.type.pic": "圖片",

    "windowsType.postSearch.filter.sortBy": "排序方式",

    "windowsType.postSearch.filter.sortBy.newest": "最新",
    "windowsType.postSearch.filter.sortBy.score": "分數",
    "windowsType.postSearch.filter.sortBy.favs": "喜歡數",
    "windowsType.postSearch.filter.sortBy.size": "大小",

    "windowsType.postSearch.filter.sortBy.reverse": "反轉排序",
    /* postSearch */

    "windowsType.post": "作品",
    "windowsType.postGetByID": "從ID抓作品",
    "windowsType.pool": "圖池",

    "windowsType.viewer": "檢視器",
    /* viewer */
    "windowsType.viewer.ResetTransform": "重置縮放和位置",

    "windowsType.viewer.RanderMode": "渲染模式 : ",
    "windowsType.viewer.RanderMode.Auto": "自動",
    "windowsType.viewer.RanderMode.Pixelated": "像素化",
    /* viewer */

    "windowsType.setting": "設定",
    "windowsType.tmpList": "暫存區",

    /* <:WindowsType: */

    /* >:components.post: */

    "components.post.Artists": "繪師",
    "components.post.Copyrights": "版權",
    "components.post.Character": "角色",
    "components.post.Species": "物種",
    "components.post.General": "主要",
    "components.post.Meta": "其他",
    "components.post.Lore": "世界觀",
    "components.post.Source": "來源",
    "components.post.Information": "詳細資料",

    "components.post.info.Size": "大小",
    "components.post.info.Type": "類型",
    "components.post.info.Rating": "分級",
    "components.post.info.Score": "分數",
    "components.post.info.Favs": "喜歡數",
    "components.post.info.Posted": "日期",

    /* 補齊部分 */

    "components.post.parent": "母作品 : ",
    "components.post.children": "子作品 : ",
    "components.post.pool": "圖池 : ",
    "components.post.moreThenOne": "超過一個 總計 $1 個",

    /* <:components.post: */


    /* >:setting: */

    "setting.Back": "<- 返回",
    "setting.Home": "主頁",

    /* Search */
    "setting.Search": "搜尋",
    "setting.Search.general": "主要",
    "setting.Search.tags": "標簽",
    "setting.Search.history": "歷史",
    "setting.Search.export/import": "導入/導出",

    /* Account */
    "setting.Account": "賬號",

    "setting.Account.local": "本機",
    "setting.Account.local.changePassword": "如果你想的話 你可以改掉你的密碼",
    "setting.Account.local.changePassword.current": "你目前的密碼",
    "setting.Account.local.changePassword.new": "新的密碼",
    "setting.Account.local.changePassword.newAgain": "再打一次新的",
    "setting.Account.local.changePassword.update": "更新密碼",
    "setting.Account.local.changePassword.remove": "移除密碼",
    "setting.Account.local.changePassword.notic.noMatch": "跟你現在的密碼對不上.w.",
    "setting.Account.local.changePassword.notic.newNoMatch": "你下面兩個密碼對不上.w.",
    "setting.Account.local.changePassword.pop.areYouSure": "你確定你要把密碼解掉？",
    "setting.Account.local.changePassword.pop.yes": "解掉",
    "setting.Account.local.changePassword.pop.no": "算了",
    "setting.Account.local.changePassword.pop.hasGone": "好你密碼沒了",
    "setting.Account.local.changePassword.pop.hasChange": "好你密碼改了",
    "setting.Account.local.setPassword": "建議你可以設定個密碼",
    "setting.Account.local.setPassword.new": "你的新密碼",
    "setting.Account.local.setPassword.setPass": "設定密碼",
    "setting.Account.local.setPassword.pop.success": "你成功給你賬號設了個密碼 真好",
    "setting.Account.local.deleteAccount": "刪賬號",
    "setting.Account.local.deleteAccount.1": "你確定你要砍掉這個賬號？",
    "setting.Account.local.deleteAccount.1.yes": "是沒錯",
    "setting.Account.local.deleteAccount.1.no": "先不要",
    "setting.Account.local.deleteAccount.2": "你現在的所有東西都會直接無\n你的下載 你的暫存 你的歷史 都會無",
    "setting.Account.local.deleteAccount.2.yes": "啊對 就是要刪",
    "setting.Account.local.deleteAccount.2.no": "啊？那算了",
    "setting.Account.local.deleteAccount.3": "你真的不在乎這些東西會消失？",
    "setting.Account.local.deleteAccount.3.yes": "刪掉吧",
    "setting.Account.local.deleteAccount.3.no": "還是會care的 那算了",

    "setting.Account.avatar": "頭貼",
    "setting.Account.avatar.set": "設成頭貼",
    "setting.Account.avatar.apply": "套用",
    "setting.Account.avatar.source": "頭貼來源",


    "setting.Account.e621": "E621",


    "setting.Account.language": "語言",


    "setting.Account.export/import": "導入/導出",



    /* Download */
    "setting.Download": "下載",
    "setting.Download.general": "主要",
    "setting.Download.history": "歷史",
    "setting.Download.export/import": "導入/導出",


    /* Appearance */
    "setting.Appearance": "外觀",
    "setting.Appearance.general": "主要",
    "setting.Appearance.theme": "主題",

    /* .wallpaper */
    "setting.Appearance.wallpaper": "桌布",
    "setting.Appearance.wallpaper.set": "設成桌布",
    "setting.Appearance.wallpaper.apply": "討厭",
    "setting.Appearance.wallpaper.source": "桌布來源",
    /* .wallpaper */


    /* Information */
    "setting.Information": "關於",
    "setting.Information.general": "主要",
    "setting.Information.general.line.1": [
      "用視窗化的方式 來用你的E621",
      "十分好玩 下次別玩了",
    ],
    "setting.Information.general.line.2": [
      "寫這個東西 還是很開心的",
      "雖然 真的有夠難寫",
      "但是起碼 我做到了",
      "直覺的交互 直覺的邏輯",
      "還有吃效能的動畫 欸十分好",
      "反正 就 也算是圓了一個KILO OS的夢吧",
      "我不知道 反正 就這樣",
      "哦對了 雖然 這句是我朋友講的 但我還是要講",
      "就 額 就 我好像真的把E621當專業軟體在寫欸",
    ],
    "setting.Information.general.repoLink": "倉庫鏈接",


    /* <:setting: */

  },
}

let usrIndx = 0

let wmRef: RefObject<WindowManager<e621Type.defaul> | null>;

const StopEvent = (e: any) => {
  e.preventDefault()
  e.stopPropagation()
}

namespace e621Type {

  export namespace DragItemType {

    export const appname = "application/e621"

    export type tag = {
      type: "tag"
      data: {
        action: "+" | "-" | "="
        tag: string
      }
    }

    export type postSearch = {
      type: "postSearch"
      thisWindow?: WindowInstance<e621Type.defaul>
      data: e621Type.window.dataType.postSearch
    }

    export type post = {
      type: "post"
      data: E621.Post
    }

    export type postId = {
      type: "postId"
      data: number
    }

    export type postImage = {
      type: "postImg"
      data: E621.Post
    }


    export type pool = {
      type: "pool"
      thisWindow?: WindowInstance<e621Type.defaul>
      data: e621Type.window.dataType.pool
    }

    export type poolId = {
      type: "poolId"
      data: number
    }


    export type setting = {
      type: "setting",
      data: window.dataType.setting
    }

    export type temp = {
      type: "temp",
      data: undefined
    }

    export type text = {
      type: "text",
      data: string
    }

    export type defaul =
      | tag
      | postSearch
      | post
      | postId
      | postImage
      | pool
      | poolId
      | setting
      | temp
      | text

  }

  export namespace window {

    export namespace dataType {

      export type searchFilter = {
        rating?: {
          s: boolean,
          q: boolean,
          e: boolean,
        },
        sortBy?: "newest" | "score" | "favs" | "size",
        reverse?: boolean,
        type?: {
          vid: boolean,
          gif: boolean,
          pic: boolean,
        }
      }

      export type postSearch = {
        nowPage: number,
        pageCache: { [x: number]: E621.Post[] },
        searchTags: string[],
        searchFilter?: searchFilter
      }

      export type pool = {
        poolId: number,
        poolInfo?: E621.Pool,
        nowPage: number,
        pageCache: { [x: number]: E621.Post[] },
      }

      export namespace settingTabs {

        export const categorieList: ("search" | "account" | "download" | "appearance" | "information")[] = [
          "search",
          "account",
          "download",
          "appearance",
          "information",
        ]

        export const pageList = {
          search: [
            "general",
            "tags",
            "history",
            "export/import",
          ],
          account: [
            "local",
            "avatar",
            "e621",
            "language",
            "export/import",
          ],
          download: [
            "general",
            "history",
            "export/import",
          ],
          appearance: [
            "general",
            "theme",
            "wallpaper",
          ],
          information: [
            "general",
          ],
        }

        export type Search = {
          categorie: "search",
          pages:
          | "general"
          | "tags"
          | "history"
          | "export/import"
        }

        export type Account = {
          categorie: "account",
          pages:
          | "local"
          | "avatar"
          | "e621"
          | "language"
          | "export/import"
        }

        export type Download = {
          categorie: "download",
          pages:
          | "general"
          | "history"
          | "export/import"
        }

        export type Appearance = {
          categorie: "appearance",
          pages:
          | "general"
          | "theme"
          | "wallpaper"
        }

        export type Information = {
          categorie: "information",
          pages:
          | "general"
        }

        export type _All =
          | "NONE"
          | Search
          | Account
          | Download
          | Appearance
          | Information
      }

      export type setting = settingTabs._All

    }

    export type postSearch = {
      type: "postSearch",
      note?: string,
      data: dataType.postSearch
    }

    export type setting = {
      type: "setting",
      data: dataType.setting
    }

    export type post = {
      type: "post",
      note?: string,
      data: {
        postId: number,
        cachedPost?: E621.Post,
        parentData?: {
          windowID: string
          rect: WindowRect
          title: string
          componentType: "postSearch"
          customData: postSearch
        } | {
          windowID: string
          rect: WindowRect
          title: string
          componentType: "pool"
          customData: pool
        }
      }
    }

    export type viewer = {
      type: "viewer",
      note?: string,
      data: E621.Post
    }

    export type postGetByID = {
      type: "postGetByID",
      note?: string,
      data: {
        currentId: number | string,
        fetchedPost?: E621.Post | null,
        status: "idle" | "loading" | "error" | "success"
      }
    }

    export type pool = {
      type: "pool",
      note?: string,
      data: dataType.pool
    }

    export type tmp = {
      type: "tmp",
    }
  }

  export type defaul =
    | window.setting
    | window.postSearch
    | window.post
    | window.postGetByID
    | window.pool
    | window.tmp
    | window.viewer

}

export namespace SettingEditor {

  export type ListOperations<T> = {
    moveUp: (index: number) => void;
    moveDown: (index: number) => void;
    moveToTop: (index: number) => void;
    removeItem: (index: number) => void;
    addItem: (newItem: T) => void;
    duplicateItem: (index: number) => void;
    canMoveUp: (index: number) => boolean;
    canMoveDown: (index: number) => boolean;
    isMaxReached: boolean;
    isMinReached: boolean;
  };

  export type ItemOperations<T> = {
    moveUp: () => void;
    moveDown: () => void;
    moveToTop: () => void;
    remove: () => void;
    duplicate: () => void;
    update: (newValue: T) => void;
    isFirst: boolean;
    isLast: boolean;
  };

  export type WrappedItem<T> = {
    data: T;
    index: number;
    ops: ItemOperations<T>;
  };

  export type ListControl<T> = {
    items: WrappedItem<T>[];
    addItem: (newItem: T) => void;
    isMaxReached: boolean;
  };

  export namespace Inputs {
    export type String = {
      width?: number;
      value: string;
      onChange: (e: string) => void;
    };

    export type Number = {
      width?: number;
      value: number;
      float?: boolean;
      onChange: (e: number) => void;
    };
  }

  export type List<T> = {
    max?: number;
    min?: number;
    list: T[];
    onChange: (e: T[]) => void;
    children: (control: ListControl<T>) => React.ReactNode;
  };

  export function useListController<T>(props: List<T>): ListOperations<T> {
    const { list, onChange, max = Infinity, min = 0 } = props;

    const moveUp = (index: number) => {
      if (index <= 0) return;
      const clone = [...list];
      [clone[index - 1], clone[index]] = [clone[index], clone[index - 1]];
      onChange(clone);
    };

    const moveDown = (index: number) => {
      if (index >= list.length - 1) return;
      const clone = [...list];
      [clone[index + 1], clone[index]] = [clone[index], clone[index + 1]];
      onChange(clone);
    };

    const moveToTop = (index: number) => {
      if (index === 0) return;
      const clone = [...list];
      const [item] = clone.splice(index, 1);
      clone.unshift(item);
      onChange(clone);
    };

    const removeItem = (index: number) => {
      if (list.length <= min) {
        console.warn('Reached minimum limit');
        return;
      }
      const clone = [...list];
      clone.splice(index, 1);
      onChange(clone);
    };

    const addItem = (newItem: T) => {
      if (isMaxReached) {
        console.warn('Reached maximum limit');
        return;
      }
      const clone = [...list, newItem];
      onChange(clone);
    };

    const duplicateItem = (index: number) => {
      if (isMaxReached) {
        console.warn('Reached maximum limit');
        return;
      }

      const itemClone = JSON.parse(JSON.stringify(list[index]));

      const newList = [...list];
      newList.splice(index + 1, 0, itemClone);

      onChange(newList);
    };

    const isMaxReached = list.length >= max;
    const isMinReached = list.length <= min;


    return {
      moveUp,
      moveDown,
      moveToTop,
      removeItem,
      addItem,
      duplicateItem,
      canMoveUp: (i) => i > 0,
      canMoveDown: (i) => i < list.length - 1,
      isMaxReached,
      isMinReached
    };
  }

  export const ListEditor = <T extends any>(props: List<T>) => {
    const { list, onChange, max = Infinity, min = 0, children } = props;

    const addItem = (newItem: T) => {
      if (list.length >= max) return;
      onChange([...list, newItem]);
    };

    const itemsWithOps: WrappedItem<T>[] = list.map((item, index) => {

      const moveUp = () => {
        if (index === 0) return;
        const clone = [...list];
        [clone[index - 1], clone[index]] = [clone[index], clone[index - 1]];
        onChange(clone);
      };

      const moveDown = () => {
        if (index === list.length - 1) return;
        const clone = [...list];
        [clone[index + 1], clone[index]] = [clone[index], clone[index + 1]];
        onChange(clone);
      };

      const moveToTop = () => {
        if (index === 0) return;
        const clone = [...list];
        const [target] = clone.splice(index, 1);
        clone.unshift(target);
        onChange(clone);
      };

      const remove = () => {
        if (list.length <= min) return;
        const clone = [...list];
        clone.splice(index, 1);
        onChange(clone);
      };

      const duplicate = () => {
        if (list.length >= max) return;
        const cloneItem = JSON.parse(JSON.stringify(item));
        const cloneList = [...list];
        cloneList.splice(index + 1, 0, cloneItem);
        onChange(cloneList);
      };

      const update = (newValue: T) => {
        const clone = [...list];
        clone[index] = newValue;
        onChange(clone);
      };


      return {
        data: item,
        index,
        ops: {
          moveUp,
          moveDown,
          moveToTop,
          remove,
          duplicate,
          update,
          isFirst: index === 0,
          isLast: index === list.length - 1
        }
      };
    });

    return (
      <>
        {children({
          items: itemsWithOps,
          addItem,
          isMaxReached: list.length >= max
        })}
      </>
    );
  };

}

namespace workSpaceType {
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
        windowTitle: string,
        data: e621Type.defaul
      }
    }

    export type SaveInfo = {
      id: string;
      user: {
        name: string;
        avatar: BaseItem.Image;
        passKey?: string;
        e621?: {
          name?: string;
          key?: string;
        };
      };
      loginStatus?: {
        lastLogin: number
      }
    }

    export type Setting = {
      lang: string
      search: {
        ratingLimit: {
          s: boolean,
          q: boolean,
          e: boolean,
        },
        blackList: string[],
        quickTag: string[],
      },
      download: {
        format: string,
        maxConcurrentDownloads: number,
      },
      appearance: {
        scale: number,
        color: string,
        transparens: boolean;

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
    saveInfo: Unit.SaveInfo,
    setting: Unit.Setting,
    saves: Unit.Saves,
    history: Unit.History
    windowsStatus: Unit.windowsStatus
  }

  export type defaul = {
    lastUser?: number,
    rememberPassword?: string
    autoLogin: boolean
    userList: User[]
  }
}

namespace MenuAction {

  export type Item =
    | [string, () => void]
    | [string, () => void, undefined]
    | [string, () => void, e621Type.DragItemType.defaul]

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

const MenuAction: MenuAction.ActionType = {
  showMenu: () => { },
  closeMenu: () => { }
}

type PostsCache = Record<number, E621.Post[]>;

const someActions = {
  setAsWallpaper: (userIndex: number, url: string, post?: E621.Post,) => {

    setWorkSpaceStatus(prev => {
      const _ = cloneDeep(prev)

      _.userList[userIndex].setting.appearance.wallpaper = {
        url,
        positionX: 50,
        positionY: 50,
        fromPost: post
      }

      return _
    })

  },
  setAvatar: (userIndex: number, url: string, post?: E621.Post,) => {

    setWorkSpaceStatus(prev => {
      const _ = cloneDeep(prev)

      _.userList[userIndex].saveInfo.user.avatar = {
        url,
        positionX: 50,
        positionY: 50,
        fromPost: post
      }

      return _
    })

  },
  saveToTmp: (userIndex: number, item: e621Type.defaul, title: string, windowId: string) => {

    setWorkSpaceStatus(prev => {
      const _ = cloneDeep(prev)

      _.userList[userIndex].saves.tmpList.push({
        createAt: new Date().getTime(),
        windowTitle: title,
        windowId,
        data: cloneDeep(item),
      })

      return _
    })

  },
  writeToClipboard: (data: string) => {
    navigator.clipboard.writeText(data)
  },
  openWithGetByID: (post: E621.Post) => { },
  openWithViewer: (post: E621.Post) => { },
}

const cnvFormat = {
  downloads: (post: E621.Post, addDate: number, format: string) => {
    /* 
     * 
     * 基本上 能加的東西 都比照 The Wolf's Stash 當然 會有一些額外的東西
     * 所以一樣的 能打斜綫來區分路徑 就是 不同資料夾
     * 
     * %id%                       - 作品ID
     *    
     * %artist%                   - 作者名 預設用“_”來分割
     * %artist(,)%                - 作者名 可以自定分割符 括號裏面指定分隔符
     * %artist--tag1,tag2%        - 作者名 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %artist(,)--tag1,tag2%     - 作者名 既自定了分割符 又自定了要排掉的東西
     * 
     * %character%                - 角色名稱 預設用“_”來分割
     * %character(,)%             - 角色名稱 可以自定分割符 括號裏面指定分隔符
     * %character--tag1,tag2%     - 角色名稱 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %character(,)--tag1,tag2%  - 角色名稱 既自定了分割符 又自定了要排掉的東西
     * 
     * %copyright%                - 版權 預設用“_”來分割
     * %copyright(,)%             - 版權 可以自定分割符 括號裏面指定分隔符
     * %copyright--tag1,tag2%     - 版權 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %copyright(,)--tag1,tag2%  - 版權 既自定了分割符 又自定了要排掉的東西
     * 
     * %general%                  - 主要 預設用“_”來分割
     * %general(,)%               - 主要 可以自定分割符 括號裏面指定分隔符
     * %general--tag1,tag2%       - 主要 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %general(,)--tag1,tag2%    - 主要 既自定了分割符 又自定了要排掉的東西
     * 
     * %species%                  - 物種 預設用“_”來分割
     * %species(,)%               - 物種 可以自定分割符 括號裏面指定分隔符
     * %species--tag1,tag2%       - 物種 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %species(,)--tag1,tag2%    - 物種 既自定了分割符 又自定了要排掉的東西
     * 
     * %tags%                     - 所有標簽 預設用“_”來分割
     * %tags(,)%                  - 所有標簽 可以自定分割符 括號裏面指定分隔符
     * %tags--tag1,tag2%          - 所有標簽 可以自定要排除掉的不想出現在檔案名稱的標簽
     * %tags(,)--tag1,tag2%       - 所有標簽 既自定了分割符 又自定了要排掉的東西
     * 
     * %rating%                   - 評級
     * %rating(S|Q|E)%            - 評級 但用你自己定義的詞
     * 
     * %score%                    - 作品評分
     * %favs%                     - 收藏數
     * 
     * :HH:                       - 加入到下載隊列的時間 24小時制的小時
     * :mm:                       - 加入到下載隊列的時間 分鐘
     * :ss:                       - 加入到下載隊列的時間 秒
     * :ms:                       - 加入到下載隊列的時間 毫秒 (我相信沒人用到)
     *                       
     * -YY-                       - 加入到下載隊列的時間 四位數的年份
     * -yy-                       - 加入到下載隊列的時間 兩位數的年份
     * -mm-                       - 加入到下載隊列的時間 數字的月
     * -dd-                       - 加入到下載隊列的時間 日
     * 
     * 
     * 反正 下面先列出幾個範例
     * 
     * KIASE.PIC_DB的標準格式 平臺_評級_作品ID_日期_時間
     * 笑死 這個東西其實就是從pixiv存圖用的格式改出來的
     * E621_%rating(NOR|NOR|SEX)%_%id%_-YY--mm--dd-_:HH::mm::ss:
     * 這個是沒有前綴的版本
     * %rating(NOR|NOR|SEX)%_%id%_-YY--mm--dd-_:HH::mm::ss:
     * 
     * 很經典的 作者加上ID
     * 然後每次存某些東西的時候 都有個sound_warning 所以索性拔掉
     * %artist--sound_warning% - %id%
     * 
     */
    const date = new Date(addDate);

    const pad = (num: number, pad?: number) => {
      return num.toString().padStart(pad ?? 2, "0");
    };

    const str = (num: number) => {
      return num.toString()
    };

    const tagReplase = (source: string, name: string, array: string[]) => {
      return source
        .replaceAll(`%${name}%`, array.join("_"))

        .replaceAll(new RegExp(`%${name}\\((.*)\\)%`, "g"), (_, join: string) => array.join(join))

        .replaceAll(new RegExp(`%${name}--(.*)%`, "g"), (
          _,
          exclude: string
        ) => {
          return array.filter(e =>
            !exclude.split(",")
              .some(x => e === x)
          ).join("_")
        })

        .replaceAll(new RegExp(`%${name}\\((.*)\\)--(.*)%`, "g"), (
          _,
          join: string,
          exclude: string
        ) => {
          return array.filter(e =>
            !exclude
              .split(",")
              .some(x => e === x)
          ).join(join)
        })
    };

    const rep01 = format
      .replaceAll(":HH:", pad(date.getHours()))
      .replaceAll(":mm:", pad(date.getMinutes()))
      .replaceAll(":ss:", pad(date.getSeconds()))
      .replaceAll(":ms:", pad(date.getSeconds(), 3))
      .replaceAll("-YY-", str(date.getFullYear()))
      .replaceAll("-yy-", str(date.getFullYear()).slice(-2))
      .replaceAll("-mm-", pad(date.getMonth() + 1))
      .replaceAll("-dd-", pad(date.getDate()))


      .replaceAll("%id%", str(post.id))
      .replaceAll("%artist%", post.tags.artist.join("_"))
      .replaceAll("%character%", post.tags.character.join("_"))
      .replaceAll("%copyright%", post.tags.character.join("_"))
      .replaceAll("%general%", post.tags.character.join("_"))
      .replaceAll("%species%", post.tags.character.join("_"))

      .replaceAll("%rating%", post.rating.toUpperCase())
      .replaceAll("%score%", str(post.score.total))
      .replaceAll("%favs%", str(post.fav_count))

      .replaceAll("%tags%", [
        ...post.tags.artist,
        ...post.tags.character,
        ...post.tags.copyright,
        ...post.tags.general,
        ...post.tags.invalid,
        ...post.tags.lore,
        ...post.tags.meta,
        ...post.tags.species,
      ].join("_"))

      .replaceAll(/%rating\((.*)\|(.*)\|(.*)\)%/g, (_, s, q, e) => {
        switch (post.rating) {
          case "s":
            return s
          case "q":
            return q
          case "e":
            return e
        }
      })

    const rep02 = tagReplase(rep01, "artist", post.tags.artist);
    const rep03 = tagReplase(rep02, "character", post.tags.artist);
    const rep04 = tagReplase(rep03, "copyright", post.tags.artist);
    const rep05 = tagReplase(rep04, "general", post.tags.artist);
    const rep06 = tagReplase(rep05, "species", post.tags.artist);
    const rep07 = tagReplase(rep06, "tags", post.tags.artist);

    return rep07
  },
  clock: (_date: number, format: string) => {
    /* 
     * :hh: - 12小時制的小時
     * :HH: - 24小時制的小時
     * :mm: - 分鐘
     * :ss: - 秒
     * 
     * -YY- - 四位數的年份
     * -yy- - 兩位數的年份
     * -MM- - 月
     * -mm- - 數字的月
     * -dd- - 日
     */
    const date = new Date(_date);

    const pad = (num: number) => {
      return num.toString().padStart(2, "0");
    };

    const str = (num: number) => {
      return num.toString()
    };

    const rep01 = format
      .replaceAll(":HH:", pad(date.getHours()))
      .replaceAll(":mm:", pad(date.getMinutes()))
      .replaceAll(":ss:", pad(date.getSeconds()))
      .replaceAll("-YY-", str(date.getFullYear()))
      .replaceAll("-yy-", str(date.getFullYear()).slice(-2))
      .replaceAll("-MM-", [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
      ][date.getMonth()])
      .replaceAll("-mm-", pad(date.getMonth() + 1))
      .replaceAll("-dd-", pad(date.getDate()))

    return rep01
  },
}

const dragItem = (e: React.DragEvent, item: e621Type.DragItemType.defaul, ext?: object) => {
  if (item.type === "text") { e.dataTransfer.setData("text/plain", item.data); return; };
  e.dataTransfer.setData(e621Type.DragItemType.appname, JSON.stringify(item));

  let url = "";
  switch (item.type) {
    case "tag": {
      let q = makeQuery({ tags: item.data.tag })
      if (item.data.action === "-") q = makeQuery({ tags: "-" + item.data.tag });
      url = "https://e621.net/posts?" + q;

      break;
    };
    case "post": {
      url = "https://e621.net/posts/" + item.data.id;
      break;
    };
    case "postId": {
      url = "https://e621.net/posts/" + item.data;
      break;
    };
    case "postImg": {
      url = item.data.file.url!;
      break;
    };
    case "pool": {
      url = "https://e621.net/pools/" + item.data.poolId;
      break;
    };
    case "postId": {
      url = "https://e926.net/pools/" + item.data;
      break;
    };
    case "postSearch": {
      url = "https://e621.net/posts?" + makeQuery({ tags: item.data.searchTags.join(" ") });
      break;
    };
  };

  e.dataTransfer.setData("text/uri-list", url + makeQuery(ext ?? {}))
  e.dataTransfer.setData("text/plain", url + makeQuery(ext ?? {}));
}

const menuBtn = {
  copyJSON: (data?: object) => {
    return data ? [[
      t("menuButton.CopyRawJson", usrIndx),
      () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      },
      {
        type: "text",
        data: JSON.stringify(data, null, 2),
      },
    ] as MenuAction.Item] : []
  },
  post: (post: E621.Post, urlQue?: object, mode?: "id" | "viewer") => {
    return [
      [

        t("menuButton.OpenWithBrowser", usrIndx),
        () => {
          open(`https://e621.net/posts/${post.id}?${makeQuery(urlQue ?? {})}`)
        },
        {
          type: "post",
          data: post
        }
      ],
      ...(mode !== "viewer" ? [[
        t("menuButton.OpenWithViewer", usrIndx),
        () => {
          someActions.openWithViewer(post)
        },
        {
          type: "postImg",
          data: post
        }
      ]] : []),
      ...(mode !== "id" ? [[
        t("menuButton.OpenWithGetByID", usrIndx),
        () => {
          someActions.openWithGetByID(post)
        },
        {
          type: "post",
          data: post
        }
      ]] : []),
      [
        t("menuButton.SaveToTmp", usrIndx),
        () => {
          someActions.saveToTmp(usrIndx, {
            type: "postGetByID",
            data: {
              currentId: post.id,
              status: "success",
              fetchedPost: post
            }
          }, `Post Get By ID [ ${post.id} ]`, `post_get_by_id-${post.id}`)
        },
        {
          type: "post",
          data: post
        }
      ],
      [
        t("menuButton.CopyID", usrIndx),
        () => {
          navigator.clipboard.writeText(post.id.toString())
        },
        {
          type: "text",
          data: post.id.toString()
        }
      ],
      [
        t("menuButton.SetAsWallpaper", usrIndx),
        () => {
          someActions.setAsWallpaper(usrIndx, post.file.url!, post)
        }
      ],
      [
        t("menuButton.SetAsAvatar", usrIndx),
        () => {
          someActions.setAvatar(usrIndx, post.file.url!, post)
        }
      ],
      ...menuBtn.copyJSON(post),
    ] as MenuAction.Item[]
  }
}

type createWindow = (
  wmRef: RefObject<WindowManager<e621Type.defaul> | null>,
  customData: e621Type.defaul,
  other?: {
    id?: string,
    left?: number;
    top?: number;
  }
) => string | undefined;

let createWindow: createWindow = () => "none";

type EmptyAccountOption = {
  name: string,
  id: string,
  password?: string,
  color?: string,
  avatar?: workSpaceType.Unit.BaseItem.Image,
  wallpaper?: workSpaceType.Unit.BaseItem.Image,
  e621?: {
    name: string;
    key: string;
  }
}

const EmptyAccount: ((option: EmptyAccountOption) => workSpaceType.User) = (opt: EmptyAccountOption) => {
  return {
    saveInfo: {
      user: {
        name: opt.name,
        avatar: opt.avatar ?? {
          url: "/_SYSTEM/Images/root/avatar.png"
        },
        passKey: opt.password, // 這東西只有我自己一個人用 絕對不會泄漏 忽略這一段
        e621: opt.e621
      },
      id: opt.id,

    },
    setting: {
      lang: "en-us",
      search: {
        ratingLimit: {
          s: true,
          q: false,
          e: false,
        },
        blackList: ["gore", "scat"],
        quickTag: [],
      },
      download: {
        format: "%artist% - %id%",
        maxConcurrentDownloads: 2,
      },
      appearance: {
        scale: 100,
        color: opt.color ?? "#ffffff",
        wallpaper: opt.wallpaper ?? {
          url: "/_SYSTEM/Images/root/background.png"
        },
        clockFormat: [
          ":HH:::mm:::ss:",
          "-dd- -MM- -YY-",
        ],
        transparens: false,
      }
    },
    saves: {
      download: [],
      wallpapers: [],
      tmpList: [],
    },
    history: {
      search: [],
      wallpaper: [],
      color: [],
      download: [],
    },
    windowsStatus: []
  }
}

const DefaultCfg: workSpaceType.defaul = {
  lastUser: 1,
  autoLogin: true,
  userList: []
}

const defaultStatus: workSpaceType.defaul = DefaultCfg

let [workSpaceStatus, setWorkSpaceStatus]: [workSpaceType.defaul, SetValue<workSpaceType.defaul>] = [defaultStatus, () => { }]
let [isLogin, setIsLogin]: [boolean, Dispatch<SetStateAction<boolean>>] = [false, () => { }]

const t = (key: keyof typeof langList['en-us'], userIndex: number) => {
  const list = (langList as any)[workSpaceStatus.userList[userIndex].setting.lang]

  if (list) {
    const tt = list[key] ?? key;

    return tt
  } else {
    return key.match(/\.([^.]+$)/)![1]
  }
};

const e621Info = (workSpaceStatus: workSpaceType.defaul, usrIndx: number) => {
  const { saveInfo } = workSpaceStatus.userList[usrIndx]
  return (saveInfo.user.e621 && saveInfo.user.e621.name && saveInfo.user.e621.key ? {
    name: saveInfo.user.e621.name,
    key: saveInfo.user.e621.key,
  } : undefined)
}

type MenuButtonType = [string, MenuAction.Item[]];

type dragEvent = (event: React.DragEvent<HTMLDivElement>) => void

interface WindowFrameProps {
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

const Components = {
  Card: ({ post, onClick, actionMenu, delay, q }: {
    post: E621.Post,
    onClick?: MouseEventHandler<HTMLButtonElement>,
    actionMenu: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => void,
    delay?: number,
    q?: object
  }) => {
    const [start, setStart] = useState<boolean>(false)

    const eRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    const totalScore = post.score.total
    const favIsNav = totalScore === 0 ? null : totalScore < 0 ? "--" : "++"

    const hoverTips = [
      `Rating ${post.rating}`,
      `ID ${post.id}`,
      `Create at ${post.created_at}`,
      `Score ${post.score.total}`,
    ].join("<br/>")

    return <button
      ref={eRef} className={[style["Card"], start ? style["START"] : ""].join(" ")}
      key={post.id}
      onClick={onClick}
      // hover-tips={hoverTips}
      draggable
      onDragStart={(e) => {
        dragItem(e, {
          type: "post",
          data: post
        }, q)
      }}
      style={{
        transitionDelay: delay + "s"
      }}
    >
      <div className={style["previewImage"]}>
        <div className={style["vid"]}>
          <video
            poster={post.preview?.url?.replace(/(.*)\..*/, "$1.jpg")}
          />
        </div>
      </div>

      <div className={style["Info"]}>
        <div className={style["baseInfo"]}>
          {["background", "text"].map(e => <div className={style[e]} key={e}>
            <div className={style["score"]}>
              <div className={[style["up"], favIsNav === "++" ? style["here"] : ""].join(" ")}>
                <div className={style["icon"]}>{"+"}</div>
                <div>{post.score.up}</div>
              </div>

              <div className={[style["down"], favIsNav === "--" ? style["here"] : ""].join(" ")}>
                <div className={style["icon"]}>{"-"}</div>
                <div>{Math.abs(post.score.down)}</div>
              </div>

              <div className={style["fav"]}>
                <div className={style["icon"]}>{"<3"}</div>
                <div>{post.fav_count}</div>
              </div>
            </div>

            <div className={style["rating"]}>
              <div>
                {post.rating.toUpperCase()}
              </div>
            </div>
          </div>)}

        </div>

      </div>

      <div className={style["Action"]}>
        <div className={style["button"]}>
          <button
            kiase-style=""
            onClick={(event) => actionMenu(event, post)}
            onMouseDown={(event) => actionMenu(event, post)}
          >···</button>
        </div>
      </div>

      <div className={style["Ext"]}>
        <div>{post.file.ext.toLocaleUpperCase()}</div>
      </div>
    </button>
  },
  Post: ({ postData, thisWindow }: {
    postData: E621.Post,
    thisWindow?: WindowInstance<e621Type.defaul>
  }) => {
    const [start, setStart] = useState<boolean>(false)

    const eRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    const dateToString = (date: string) => {
      const dat = new Date(date)
      const pad = (num: number) => {
        return num.toString().padStart(2, "0")
      }
      return `${dat.getFullYear()}/${pad(dat.getMonth() + 1)}/${pad(dat.getDate())} ${pad(dat.getHours())}:${pad(dat.getMinutes())}`
    }

    const postBtn = (id: number) => [
      id.toString(),
      () => createWindow(wmRef, { type: "postGetByID", data: { status: "loading", currentId: id } }),
      { type: "postId", data: id }
    ] as MenuAction.Item;

    const poolBtn = (id: number) => [
      id.toString(),
      () => createWindow(wmRef, { type: "pool", data: { poolId: id, nowPage: 1, pageCache: [], } }),
      { type: "poolId", data: id }
    ] as MenuAction.Item;

    const childsMenu = (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      child: number[],
      map: (e: number) => MenuAction.Item
    ) => {
      event.stopPropagation()
      event.preventDefault()
      const btn = event.currentTarget
      const btnRect = btn.getBoundingClientRect()
      const x = btnRect.top
      const y = btnRect.left
      MenuAction.showMenu(child.map(map), [x, y], "bl")
    }

    return (<div
      ref={eRef}
      className={[style["Post"], start ? style["START"] : ""].join(" ")}
    >
      <div className={style["Tags"]} >
        {
          ([
            [t("components.post.Artists", usrIndx), postData?.tags.artist],
            [t("components.post.Copyrights", usrIndx), postData?.tags.copyright],
            [t("components.post.Character", usrIndx), postData?.tags.character],
            [t("components.post.Species", usrIndx), postData?.tags.species],
            [t("components.post.General", usrIndx), postData?.tags.general],
            [t("components.post.Meta", usrIndx), postData?.tags.meta],
            [t("components.post.Lore", usrIndx), postData?.tags.lore],
            ["Source", undefined],
            ["Information", undefined],
          ] as [string, (string[] | undefined)][])
            .filter(e => e[1]?.length || (e[0] === "Source" && postData.sources.length > 0) || e[0] === "Information")
            .map((list, indx) => {
              let dely = indx * .15
              if (list[0] === "Source")
                return (
                  <div
                    className={[style["Source"], style["list"]].join(" ")}
                    style={{
                      transitionDelay: `${dely}s`
                    }}
                  >
                    <span className={style["title"]}>{t("components.post.Source", usrIndx)}</span>
                    <div className={style["src"]}>
                      {
                        postData.sources.map((e, indx) => <a
                          kilo-style=""
                          key={indx}
                          href={e}
                          target="_blank"
                          style={{
                            transitionDelay: `${dely + (indx * .1)}s`
                          }}
                        >{e}</a>)
                      }
                    </div>
                  </div>
                )
              if (list[0] === "Information")
                return <div
                  className={[style["Information"], style["list"]].join(" ")}
                  style={{
                    transitionDelay: `${dely + (indx * .01)}s`
                  }}
                >
                  <span className={style["title"]}>{t("components.post.Information", usrIndx)}</span>
                  <div className={style["info"]}>
                    {
                      ([
                        ["ID", postData.id],
                        ["MD5", postData.file.md5],
                        [t("components.post.info.Size", usrIndx), `${postData.file.width}x${postData.file.height} (${(postData.file.size / 1024 / 1024).toFixed(2) + " MB"})`],
                        [t("components.post.info.Type", usrIndx), postData.file.ext.toLocaleUpperCase()],
                        "CLIP",
                        [t("components.post.info.Rating", usrIndx), postData.rating.toLocaleUpperCase()],
                        [t("components.post.info.Score", usrIndx), postData.score.total],
                        [t("components.post.info.Favs", usrIndx), postData.fav_count],
                        "CLIP",
                        [t("components.post.info.Posted", usrIndx), dateToString(postData.created_at)],
                      ] as ([string, string] | "CLIP")[]).map((e, indx) => {
                        if (e === "CLIP") {
                          return <>
                            <div className={style["Clip"]} key={`Clip_${indx}`} />
                            <div className={style["Clip"]} key={`Clip2_${indx}`} />
                          </>
                        } else {
                          return <>
                            <div
                              className={style["key"]}
                              key={`key_${indx}`}
                              style={{
                                transitionDelay: `${dely + (indx * .05)}s`
                              }}
                            >{e[0]}</div>
                            <div
                              className={style["value"]}
                              key={`value_${indx}`}
                              style={{
                                transitionDelay: `${dely + (indx * .05)}s`
                              }}
                            >{e[1]}</div>
                          </>
                        }
                      })
                    }
                  </div>
                </div>
              else
                return <div
                  key={`Tags_${list[0]}`}
                  className={[style[list[0]], style["list"]].join(" ")}
                  style={{
                    transitionDelay: `${dely}s`
                  }}
                >
                  <span className={style["title"]}>{list[0]}</span>
                  <div className={style["tags"]}>
                    {list[1]!.map((tag, indx) => <>
                      <div className={style["tag"]}
                        style={{
                          transitionDelay: `${dely + (indx * .01)}s`
                        }}
                      >
                        <div
                          className={[
                            style["action"],
                            style["add"]
                          ].join(" ")}
                          draggable
                          onDragStart={(e) => {
                            dragItem(e, {
                              type: "tag",
                              data: {
                                action: "+",
                                tag: tag
                              }
                            })
                          }}
                        >{"+"}</div>

                        <div className={[
                          style["action"],
                          style["not"]
                        ].join(" ")}
                          draggable
                          onDragStart={(e) => {
                            dragItem(e, {
                              type: "tag",
                              data: {
                                action: "-",
                                tag: tag
                              }
                            })
                          }}
                        >{"-"}</div>


                        <div
                          className={style["name"]}
                          onClick={() => {
                            const createAt = new Date().getTime()
                            wmRef.current?.createWindow({
                              id: `post_search-${createAt}`,
                              title: `Post Search [ ${createAt} ]`,
                              children: <windowsType.postSearch id={`${createAt}`} />,
                              customData: {
                                type: "postSearch",
                                data: {
                                  nowPage: 1,
                                  pageCache: [],
                                  searchTags: [tag],
                                }
                              }
                            })
                          }}
                          draggable
                          onDragStart={(e) => {
                            dragItem(e, {
                              type: "tag",
                              data: {
                                action: "=",
                                tag: tag
                              }
                            })
                          }}
                        >{tag}</div>
                      </div>
                    </>)}
                  </div>
                </div>
            })}
      </div>
      <div className={style["Preview"]}>

        {(() => {
          switch (postData?.file.ext) {
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "webp":
              return <div className={style["Image"]}>
                <Viewer
                  className={style["Viewer"]}
                  tTranslate={{
                    "resetTransform": t("windowsType.viewer.ResetTransform", usrIndx),
                    "randerMode": t("windowsType.viewer.RanderMode", usrIndx),
                    "randerMode.auto": t("windowsType.viewer.RanderMode.Auto", usrIndx),
                    "randerMode.pixelated": t("windowsType.viewer.RanderMode.Pixelated", usrIndx),
                  }}
                >
                  <img src={postData?.file.url!} />
                </Viewer>
              </div>

            case "webm":
            case "mp4":
              return <div className={style["Video"]}>
                <video src={postData?.file.url!} controls loop muted />
              </div>

          }
        })()}

        <div className={style["Action"]}>

          <button
            kiase-style=""
            onClick={() => {
              someActions.openWithViewer(postData)
            }}
            draggable
            onDragStart={(e) => {
              dragItem(e, { type: "postImg", data: postData })
            }}
          >{t("menuButton.OpenWithViewer", usrIndx)}</button>

          <button
            kiase-style=""
            onClick={(e) => {
              someActions.setAsWallpaper(usrIndx, postData?.file.url!, postData)
            }}
            style={{ marginLeft: "auto" }}
          >{t("menuButton.SetAsWallpaper", usrIndx)}</button>

          <button
            kiase-style=""
            draggable
            onDragStart={(e) => {
              if (thisWindow?.customData?.type === "post") {
                const { parentData } = thisWindow?.customData?.data
                if (parentData) {
                  let q = ""
                  if (parentData.componentType === "postSearch") {
                    q = parentData.customData.data.searchTags.join(" ")
                  } else if (parentData.componentType === "pool") {
                    q = `pool:${parentData.customData.data.poolId}`
                  }
                  dragItem(e, { type: "post", data: postData }, { q })
                }
              } else {
                dragItem(e, { type: "post", data: postData })
              }
            }}
            onClick={() => {
              if (thisWindow?.customData?.type === "post") {
                const { parentData } = thisWindow?.customData?.data
                if (parentData) {
                  let q = ""
                  if (parentData.componentType === "postSearch") {
                    q = parentData.customData.data.searchTags.join(" ")
                  } else if (parentData.componentType === "pool") {
                    q = `pool:${parentData.customData.data.poolId}`
                  }
                  open(`https://e621.net/posts/${postData?.id}?${makeQuery({ q })}`)
                }
              } else if (thisWindow?.customData?.type === "postGetByID") {
                open(`https://e621.net/posts/${postData?.id}`)
              }
            }}
          >{t("menuButton.OpenWithBrowser", usrIndx)}</button>
        </div>

        <div className={style["SubPost"]}>

          <div>
            {postData.relationships.parent_id ? ((prnt: number) => {
              return <button
                kiase-style=""
                onClick={() => createWindow(wmRef, { type: "postGetByID", data: { status: "loading", currentId: prnt } })}
                draggable
                onDragStart={(e) => dragItem(e, { type: "postId", data: prnt })}
              >{t("components.post.parent", usrIndx) + prnt}</button>
            })(postData.relationships.parent_id)
              : <div />}
          </div>

          <div>

            {postData.relationships.children.length > 0 ? ((child: number[]) => {
              const moreThenOne = child.length > 1
              return <button
                kiase-style=""
                onClick={(e) => {
                  if (moreThenOne) {
                    childsMenu(e, child, postBtn)
                  } else {
                    createWindow(wmRef, { type: "postGetByID", data: { status: "loading", currentId: child[0] } })
                  }
                }}
                onMouseDown={(e) => {
                  if (moreThenOne) {
                    childsMenu(e, child, postBtn)
                  }
                }}
                draggable={!moreThenOne}
                onDragStart={(e) => dragItem(e, { type: "postId", data: child[0] })}
              >{
                  t("components.post.children", usrIndx)
                  +
                  (moreThenOne ? t("components.post.moreThenOne", usrIndx).replace("$1", child.length) : child[0])}</button>
            })(postData.relationships.children)
              : <div />}
          </div>

          <div>
            {postData.pools.length > 0 ? ((pool: number[]) => {
              const moreThenOne = pool.length > 1
              return <button
                kiase-style=""
                onClick={(e) => {
                  if (moreThenOne) {
                    childsMenu(e, pool, poolBtn)
                  } else {
                    createWindow(wmRef, { type: "pool", data: { poolId: pool[0], pageCache: [], nowPage: 1 } })
                  }
                }}
                onMouseDown={(e) => {
                  if (moreThenOne) {
                    childsMenu(e, pool, poolBtn)
                  }
                }}
                draggable={!moreThenOne}
                onDragStart={(e) => dragItem(e, { type: "poolId", data: pool[0] })}
              >{
                  t("components.post.pool", usrIndx)
                  +
                  (moreThenOne ? t("components.post.moreThenOne", usrIndx).replace("$1", pool.length) : pool[0])}</button>
            })(postData.pools)
              : <div />}
          </div>

        </div>

        <div className={style["Description"]}>
          {postData?.description.split("\n").map(e => <>{e}<br /></>)}
        </div>

      </div>
    </div>)
  }
}

const NODATA = {
  Fetching: function () {
    const [start, setStart] = useState<boolean>(false)

    const eRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    const Cers = (<div className={style["Cers"]}>
      {
        [
          [400, 15, 6],
          [250, 12, 4],
          [100, 10, 2],
        ].map((e, i) => <div className={style["cer"]}>
          <div className={style["Scale"]}
            style={{
              transitionDelay: `${i * .2}s`
            }}>
            <div className={style["Mri"]}>
              <div className={style["C"]} style={{
                width: `${e[0]}px`,
                borderWidth: `${e[1]}px`,
                animationDuration: `${e[2]}s`
              }} />
            </div>
          </div>
        </div>)}

    </div>)

    return (<div ref={eRef} className={[style["Fetching"], start ? style["START"] : ""].join(" ")}>
      {Cers}
      <div className={style["Line"]}>
        {Cers}
        <div className={style["Fill"]}>
          {Cers}
        </div>
      </div>
    </div>)
  },
  None: function () {
    const [start, setStart] = useState<boolean>(false)

    const eRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    return (<div ref={eRef} className={[style["None"], start ? style["START"] : ""].join(" ")}>
      <div className={style["Text"]}>
        {functions.htmlElement.splitToElement("NO DATA", (e, i) => <div key={i} className={style["case"]}>{e}</div>)}
      </div>
    </div>)
  },
}

const WINDOW_FRAME = ({
  menulist,
  className,
  children,
  onDrop,
  onDrag,
  onDragCapture,
  onDragEnd,
  onDragEndCapture,
  onDragEnter,
  onDragEnterCapture,
  onDragExit,
  onDragExitCapture,
  onDragLeave,
  onDragLeaveCapture,
  onDragOver,
  onDragOverCapture,
  onDragStart,
  onDragStartCapture,

}: WindowFrameProps) => {
  const [hasClick, setHasClick] = useState<boolean>(false)

  useEffect(() => {
    if (!hasClick) return

    const clickEvent = () => {
      setHasClick(false)
    }

    document.addEventListener("click", clickEvent)
    return () => {
      document.removeEventListener("click", clickEvent)
    }
  }, [hasClick])


  const onClickEvent = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, menu: MenuAction.Item[], frs?: boolean) => {
    event.stopPropagation()
    event.preventDefault()
    const btn = (event.target as HTMLButtonElement)
    const btnRect = btn.getBoundingClientRect()
    const x = btnRect.bottom
    const y = btnRect.left + (frs ? 20 : 0)
    MenuAction.showMenu(menu, [x, y], undefined, () => { setHasClick(false) })
  }

  return <>
    <div className={style["WindowFrame"]} >
      <div className={style["ButtonList"]}>
        <div className={style["text"]}>
          {menulist.map((btns, i) =>
            <button
              key={"btn_" + i}
              kiase-style=""

              onMouseEnter={(event) => {
                if (!hasClick) return
                onClickEvent(event, btns[1], i === 0)
              }}
              onMouseDown={(event) => {
                if (hasClick) { setHasClick(false); return; }
                event.stopPropagation();
                onClickEvent(event, btns[1], i === 0)
                setHasClick(true)
              }}
              onClick={(event) => {
                if (!hasClick) { setHasClick(false); return; }
                onClickEvent(event, btns[1], i === 0)
                setHasClick(true)
              }}

              style={{ zIndex: menulist.length - i }}
            >
              <div>{btns[0]}</div>
            </button>
          )}
        </div>
        <div className={style["background"]}>
          {menulist.map((btns, i) =>
            <button
              key={i}
              kiase-style=""
              style={{ zIndex: menulist.length - i }}
            >
              <div>{btns[0]}</div>
            </button>
          )}
        </div>
      </div>

      <div
        className={[style["MainContent"], className].join(" ")}
        onDrop={onDrop}
        onDrag={onDrag}
        onDragCapture={onDragCapture}
        onDragEnd={onDragEnd}
        onDragEndCapture={onDragEndCapture}
        onDragEnter={onDragEnter}
        onDragEnterCapture={onDragEnterCapture}
        onDragExit={onDragExit}
        onDragExitCapture={onDragExitCapture}
        onDragLeave={onDragLeave}
        onDragLeaveCapture={onDragLeaveCapture}
        onDragOver={onDragOver}
        onDragOverCapture={onDragOverCapture}
        onDragStart={onDragStart}
        onDragStartCapture={onDragStartCapture}
      >
        {children}
      </div>
    </div>
  </>
}

type windowProp = { id: string }

const windowAction: (windowID: string, other?: MenuAction.Item[]) => MenuButtonType = (windowID, other) => [
  t("menuButton.top.Window", usrIndx),
  [
    ...other ?? [],
    [
      t("menuButton.Minimize", usrIndx),
      () => { wmRef.current?.minimizeWindow(windowID) }
    ],
    [
      t("menuButton.Close", usrIndx),
      () => { wmRef.current?.closeWindow(windowID) }
    ]
  ],
]

const windowsType = {
  postSearch: function ({ id }: windowProp) {

    const windowID = `post_search-${id}`
    const thisWindow = wmRef.current?.getWindow(windowID)!

    const savedData = thisWindow?.customData?.type === "postSearch"
      ? thisWindow.customData.data
      : undefined;

    const [page, setPage] = useState<number>(savedData?.nowPage ?? 1);
    const [searchTags, setSearchTags] = useState<string[]>(savedData?.searchTags ?? ["yonkagor", "webm"]);
    const [searchTagsInput, setSearchTagsInput] = useState<string[]>(searchTags);

    const [postsCache, setPostsCache] = useState<PostsCache>(savedData?.pageCache ?? {});
    const [jupToPage, setJupToPage] = useState<boolean>(false);
    const [jupPage, setJupPage] = useState<number>(1);
    const [searchFilter, setSearchFilter] = useState<e621Type.window.dataType.searchFilter>({});
    const [filterPanel, setFilterPanel] = useState<boolean>(false);

    const [isFocuOnIt, setFocuOnIt] = useState<boolean>(false);

    const currentPosts = useMemo(() => postsCache[page] || [], [postsCache, page]);

    const processedPosts = useMemo(() => {
      let result = [...currentPosts];

      const { s, q, e } = searchFilter.rating ?? {};
      if (s || q || e) {
        result = result.filter(post => {
          if (post.rating === "s") return s;
          if (post.rating === "q") return q;
          if (post.rating === "e") return e;
          return false;
        });
      }

      const { vid, gif, pic } = searchFilter.type ?? {};
      if (vid || gif || pic) {
        result = result.filter(post => {
          const ext = post.file.ext;
          if (vid && (ext === "webm" || ext === "mp4")) return true;
          if (gif && ext === "gif") return true;
          if (pic && (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp")) return true;
          return false;
        });
      }

      if (searchFilter.sortBy) {
        result.sort((a, b) => {
          switch (searchFilter.sortBy) {
            case "score":
              return b.score.total - a.score.total;
            case "favs":
              return b.fav_count - a.fav_count;
            case "size":
              return b.file.size - a.file.size;
            case "newest":
            default:
              return b.id - a.id;
          }
        });
      }

      if (searchFilter.reverse) {
        result.reverse();
      }

      return result;
    }, [currentPosts, searchFilter]);

    const [fetchId, setFetchId] = useState<number>(0);
    const fetchIdRef = useRef<number>(0);
    fetchIdRef.current = fetchId;

    const postsCacheRef = useRef<PostsCache>(postsCache);
    postsCacheRef.current = postsCache;

    const fetchingPages = useRef<Set<string>>(new Set());
    const fetchQueueRef = useRef<Promise<void>>(Promise.resolve());

    const scrollPage = useRef<HTMLDivElement>(null);

    const fetchPageData = useCallback(async (targetPage: number, currentTags: string[], currentFetchId: number) => {
      const pageKey = `${currentFetchId}-${targetPage}`;

      if (postsCacheRef.current[targetPage] || fetchingPages.current.has(pageKey)) {
        return false;
      }

      fetchingPages.current.add(pageKey);

      const task = async () => {
        try {
          if (currentFetchId !== fetchIdRef.current) {
            Kiasole.log(`[背景預取] 丟棄過期請求 API (未發送): 第 ${targetPage} 頁`);
            return;
          }

          Kiasole.log(`[背景預取] 正在請求 API: 第 ${targetPage} 頁 (FetchID: ${currentFetchId})`);
          const newPosts = await LABS_E621_API.posts.search({
            tags: currentTags,
            page: targetPage,
            limit: 75,
            user: e621Info(workSpaceStatus, usrIndx)
          });

          if (currentFetchId !== fetchIdRef.current) {
            Kiasole.log(`[背景預取] 丟棄過期請求 API: 第 ${targetPage} 頁`);
            return;
          }

          setPostsCache((prev) => ({
            ...prev,
            [targetPage]: newPosts
          }));

        } catch (err) {
          Kiasole.error(`第 ${targetPage} 頁抓取失敗 :` + err);
        } finally {
          fetchingPages.current.delete(pageKey);
        }
      };

      fetchQueueRef.current = fetchQueueRef.current.then(task);
      await fetchQueueRef.current;
      return true;
    }, []);

    useEffect(() => {
      let isCancelled = false;
      const currentFetchId = fetchId;
      const currentTags = searchTags;

      const loadData = async () => {
        const targetPages = [page, page + 1, page - 1, page + 2, page - 2]
          .filter(p => p > 0);

        for (const p of targetPages) {
          if (isCancelled) break;
          const fetched = await fetchPageData(p, currentTags, currentFetchId);
          if (isCancelled) break;
          if (fetched) {
            await functions.timeSleep(1000);
          }
        }
      };

      loadData();

      return () => {
        isCancelled = true;
      };
    }, [page, searchTags, fetchId, fetchPageData]);

    useEffect(() => {
      const { current: scpg } = scrollPage
      if (scpg) {
        scpg.scrollTo({ top: 0 })
      }
    }, [page])

    const refreshSearch = useCallback((newTags?: string[]) => {
      setPostsCache({});
      setPage(1);

      if (newTags) {
        setSearchTags(newTags);
      }

      fetchingPages.current.clear();
      setFetchId(id => id + 1);
    }, []);

    useEffect(() => {
      if (thisWindow.customData?.type === "postSearch") {
        thisWindow?.setData({
          type: "postSearch",
          data: {
            nowPage: page,
            pageCache: postsCache,
            searchTags,
            searchFilter
          }
        });
      }
    }, [page, postsCache, searchTags, searchFilter]);

    const handleNextPage = () => setPage(p => p + 1);
    const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

    useEffect(() => {
      const keydown = (e: KeyboardEvent) => {
        if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
        if (e.altKey) return;

        switch (e.code) {
          case "Escape": {
            if (jupToPage) {
              setJupToPage(false)
            } else {
              setFilterPanel(false)
            }
            break
          }
        }

        if (jupToPage || isFocuOnIt) return;

        switch (e.code) {
          case "ArrowLeft": {
            e.preventDefault()
            setPage(e => e > 1 ? e - 1 : 1)
            break
          }
          case "ArrowRight": {
            e.preventDefault()
            setPage(e => e + 1)
            break
          }
        }
        if (e.shiftKey) {
          switch (e.code) {
            case "KeyF": {
              setFilterPanel(e => !e)
              break
            }

            case "KeyJ": {
              setJupToPage(e => !e)
              break
            }
          }
        }
      }
      document.addEventListener("keydown", keydown)

      return () => {
        document.removeEventListener("keydown", keydown)
      }

    }, [jupToPage, jupToPage, isFocuOnIt])

    const actionMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => {
      event.stopPropagation()
      event.preventDefault()
      const btn = event.currentTarget
      const btnRect = btn.getBoundingClientRect()
      const x = btnRect.bottom
      const y = btnRect.left
      MenuAction.showMenu(menuBtn.post(post, { q: searchTags.join(" ") }), [x, y])
    }

    const showLoading = !postsCache[page];

    useEffect(() => {
      const statusOffset = 50
      const offset = 200

      let startPointX = 0
      let startPointY = 0

      let status: "NONE" | "X" | "Y" = "NONE"

      let x = 0
      let y = 0

      const touchArea = scrollPage.current

      if (jupToPage) return;

      const onTouchStart = (e: TouchEvent) => {
        if (!touchArea) return;

        startPointX = e.touches[0].clientX
        startPointY = e.touches[0].clientY
      }

      const onTouchMove = (e: TouchEvent) => {
        if (!touchArea) return;

        x = startPointX - e.touches[0].clientX
        y = startPointY - e.touches[0].clientY

        if (status === "X") e.preventDefault();

        if (status === "Y") { x = 0; return; }

        const transform = () => {
          touchArea.style.transform = `translateX(${-1 * (x / 10)}px)`
        }

        if (x > offset) {
          touchArea.style.opacity = ".5"
          transform()
        } else if (x < -offset) {
          if (page === 1) return;
          touchArea.style.opacity = ".5"
          transform()
        } else {
          touchArea.style.opacity = ""
          transform()
        }

        if (status !== "NONE") return;
        if (x > statusOffset || x < -statusOffset) status = "X";
        if (y > statusOffset || y < -statusOffset) status = "Y";
      }

      const onTouchEnd = () => {
        if (!touchArea) return;

        startPointX = 0;

        if (x > offset) {
          setPage(e => e + 1)
          void touchArea.clientHeight
        } else if (x < -offset) {
          setPage(e => e > 1 ? e - 1 : 1)
          void touchArea.clientHeight
        }
        touchArea.style.transform = ""
        touchArea.style.opacity = ""

        status = "NONE"
      }

      touchArea?.addEventListener("touchstart", onTouchStart)
      touchArea?.addEventListener("touchmove", onTouchMove)
      touchArea?.addEventListener("touchend", onTouchEnd)

      return () => {
        touchArea?.removeEventListener("touchstart", onTouchStart)
        touchArea?.removeEventListener("touchmove", onTouchMove)
        touchArea?.removeEventListener("touchend", onTouchEnd)
      }

    }, [jupToPage, page, scrollPage.current])

    const JumpToPageOverlay = useMemo(() => {
      const _ = ({
        jupToPage,
        jupPage,
        setJupPage,
        setJupToPage,
        setPage
      }: {
        jupToPage: boolean,
        jupPage: number,
        setJupPage: (p: number) => void,
        setJupToPage: (b: boolean) => void,
        setPage: (p: number | ((prev: number) => number)) => void
      }) => {
        const touchAreaRef = useRef<HTMLDivElement>(null);
        const backButtonRef = useRef<HTMLButtonElement>(null);
        const backLineRef = useRef<HTMLDivElement>(null);
        const applyButtonRef = useRef<HTMLButtonElement>(null);
        const applyLineRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          const offset = 200

          let startPointX = 0
          let x = 0

          const touchArea = touchAreaRef.current
          const backButton = backButtonRef.current
          const backLine = backLineRef.current
          const applyButton = applyButtonRef.current
          const applyLine = applyLineRef.current

          const isLoad = touchArea && backButton && backLine && applyButton && applyLine

          if (!isLoad) return;
          if (!jupToPage) return;

          const onTouchStart = (e: TouchEvent) => {
            startPointX = e.touches[0].clientX
          }

          const onTouchMove = (e: TouchEvent) => {
            x = startPointX - e.touches[0].clientX

            const _x = x / 7

            if (x > 0) {
              applyButton.style.transform = ""
              applyLine.style.transform = ""

              backButton.style.transform = `translateX(-${_x}px)`
              backLine.style.transform = `translateX(-${_x}px)`
            } else {
              backButton.style.transform = ""
              backLine.style.transform = ""

              applyButton.style.transform = `translateX(${Math.abs(_x)}px)`
              applyLine.style.transform = `translateX(${_x}px)`
            }

            if (x > offset) {
              applyButton.style.opacity = ""
              applyLine.style.opacity = ""
              backButton.style.opacity = ".5"
              backLine.style.opacity = ".5"
            } else if (x < -offset) {
              backButton.style.opacity = ""
              backLine.style.opacity = ""
              applyButton.style.opacity = ".5"
              applyLine.style.opacity = ".5"
            } else {
              backButton.style.opacity = ""
              backLine.style.opacity = ""
              applyButton.style.opacity = ""
              applyLine.style.opacity = ""
            }

          }

          const onTouchEnd = (e: TouchEvent) => {
            startPointX = 0

            if (x > offset) {
              setJupToPage(false)
              backButton.click()
            } else if (x < -offset) {
              setJupToPage(false)
              applyButton.click()
            }

            backButton.style.transform = ""
            backLine.style.transform = ""
            applyButton.style.transform = ""
            applyLine.style.transform = ""
            backButton.style.opacity = ""
            backLine.style.opacity = ""
            applyButton.style.opacity = ""
            applyLine.style.opacity = ""
          }

          touchArea.addEventListener("touchstart", onTouchStart)
          touchArea.addEventListener("touchmove", onTouchMove)
          touchArea.addEventListener("touchend", onTouchEnd)

          return () => {
            touchArea.removeEventListener("touchstart", onTouchStart)
            touchArea.removeEventListener("touchmove", onTouchMove)
            touchArea.removeEventListener("touchend", onTouchEnd)
          }

        }, [jupToPage, jupPage, setJupToPage, setPage]);

        useEffect(() => {
          const input = inputRef.current
          if (!input) return;
          if (jupToPage) input.focus();
          else input.blur()
        }, [jupToPage]);

        return (
          <div ref={touchAreaRef} className={[style["JumpToPage"], jupToPage && style["show"]].join(" ")}>
            <div className={style["Inner"]}>
              <div className={style["Back"]}>
                <button ref={backButtonRef} onClick={() => setJupToPage(false)}>{t("windowsType.postSearch.jumpToPage.Cancel", usrIndx)}</button>
              </div>
              <div className={[style["line"], style["top"]].join(" ")}><div ref={backLineRef} /></div>
              <div className={style["Input"]}>
                {t("windowsType.postSearch.jumpToPage", usrIndx)}
                <input
                  ref={inputRef}
                  type="number"
                  value={jupPage}
                  onChange={(e) => setJupPage(+e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(~~(jupPage < 0 ? 1 : jupPage));
                      setJupToPage(false);
                    }
                  }}
                />
              </div>
              <div className={[style["line"], style["bottom"]].join(" ")}><div ref={applyLineRef} /></div>
              <div className={style["Apply"]}>
                <button ref={applyButtonRef} onClick={() => {
                  setPage(~~(jupPage < 0 ? 1 : jupPage));
                  setJupToPage(false);
                }}>{t("windowsType.postSearch.jumpToPage.Apply", usrIndx)}</button>
              </div>
            </div>
          </div>
        );
      };

      return _
    }, [])

    return (
      <>
        <WINDOW_FRAME
          className={style["postSearch"]}
          menulist={[
            windowAction(windowID, [[
              t("menuButton.Clone", usrIndx),
              () => {
                createWindow(wmRef, thisWindow?.customData!)
              },
              thisWindow.customData?.type === "postSearch" ? {
                type: "postSearch",
                thisWindow,
                data: thisWindow.customData.data
              } : undefined
            ]
            ]), [
              t("menuButton.top.Data", usrIndx),
              [[
                t("menuButton.Reload", usrIndx),
                () => refreshSearch()
              ],
              ],
            ], [
              t("menuButton.top.Other", usrIndx),
              [[
                t("menuButton.SaveToTmp", usrIndx),
                () => {
                  someActions.saveToTmp(usrIndx, cloneDeep(wmRef.current!.getWindow(thisWindow.id!)!.customData!), thisWindow.title, windowID)
                },
                thisWindow.customData?.type === "postSearch" ? {
                  type: "postSearch",
                  thisWindow,
                  data: thisWindow.customData.data
                } : undefined
              ],
              ...menuBtn.copyJSON(currentPosts),
              ],
            ],
          ]}

          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            if (!e.dataTransfer) return;

            const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

            if (itemdata) {
              const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
              const { data, type } = item
              if (type === "tag") {
                let newTags = [...searchTagsInput];
                switch (data.action) {
                  case "+": {
                    if (newTags.some(e => e === "-" + data.tag)) {
                      newTags = newTags.filter(e => e !== "-" + data.tag)
                    } else if (!newTags.some(e => e === data.tag)) {
                      newTags.push(data.tag)
                    }
                    StopEvent(e)
                    break;
                  }
                  case "-": {
                    if (newTags.some(e => e === data.tag)) {
                      newTags = newTags.filter(e => e !== data.tag)
                    } else if (!newTags.some(e => e === "-" + data.tag)) {
                      newTags.push("-" + data.tag)
                    }
                    StopEvent(e)
                    break;
                  }
                }
                setSearchTagsInput(newTags)
              }
            }
          }}
        >

          <div className={style["PaginationControls"]} >
            <div />
            <div className={style["InnerFrame"]}>
              <button kiase-style="" onClick={handlePrevPage} disabled={page === 1}>{"<"}</button>
              <button kiase-style="" onClick={() => { setJupToPage(true); setJupPage(page) }} >{t("windowsType.postSearch.page", usrIndx).replace("$1", page)}</button>
              <button kiase-style="" onClick={handleNextPage}>{">"}</button>
            </div>
          </div>

          <div className={style["TagEditor"]} >
            <div className={style["InnerFrame"]}>
              <input
                type="text"
                value={searchTagsInput.join(" ")}
                onInput={(e) => setSearchTagsInput(e.currentTarget.value.split(" "))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.code === "NumpadEnter") {
                    if (searchTagsInput.join(" ") === searchTags.join(" ")) return;
                    refreshSearch(searchTagsInput);
                  }
                }}
                onFocus={() => { setFocuOnIt(true) }}
                onBlur={() => { setFocuOnIt(false) }}
              />
              <button className={[filterPanel && style["activ"]].join(" ")} onClick={() => setFilterPanel(e => !e)}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" /></svg>
              </button>
            </div>
            <div />
          </div>

          <JumpToPageOverlay
            jupToPage={jupToPage}
            jupPage={jupPage}
            setJupPage={setJupPage}
            setJupToPage={setJupToPage}
            setPage={setPage}
          />

          <div className={[style["Filter"], filterPanel && style["display"]].join(" ")}>
            <div className={style["InnerFrame"]}>
              <div>
                <h1>{t("windowsType.postSearch.filter", usrIndx)}</h1>
                <h2>{t("windowsType.postSearch.filter.rating", usrIndx)}</h2>
                <div className={style["btns"]}>
                  {
                    ([
                      [searchFilter.rating?.s, "s"], [searchFilter.rating?.q, "q"],
                      [searchFilter.rating?.e, "e"],
                    ] as [boolean, ("s" | "q" | "e")][]).map(rat => {
                      return <button
                        key={rat[1]}
                        className={[rat[0] && style["activ"]].join(" ")}
                        onClick={() => {
                          setSearchFilter(prev => ({
                            ...prev,
                            rating: {
                              s: false, q: false, e: false,
                              ...prev.rating,
                              [rat[1]]: !prev.rating?.[rat[1]]
                            }
                          }))
                        }}
                      >{t("windowsType.postSearch.filter.rating." + rat[1] as any, usrIndx)}</button>
                    })
                  }
                </div>
                <br />
                <h2>{t("windowsType.postSearch.filter.type", usrIndx)}</h2>
                <div className={style["btns"]}>
                  {
                    ([[searchFilter.type?.vid, "vid"], [searchFilter.type?.gif, "gif"], [searchFilter.type?.pic, "pic"],
                    ] as [boolean, ("vid" | "gif" | "pic")][]).map(tType => (
                      <button
                        key={tType[1]}
                        className={[tType[0] && style["activ"]].join(" ")}
                        onClick={() => {
                          setSearchFilter(prev => ({
                            ...prev,
                            type: {
                              vid: false, gif: false, pic: false,
                              ...prev.type,
                              [tType[1]]: !prev.type?.[tType[1]]
                            }
                          }))
                        }}
                      >{t("windowsType.postSearch.filter.type." + tType[1] as any, usrIndx)}</button>
                    ))
                  }
                </div>
                <h2>{t("windowsType.postSearch.filter.sortBy", usrIndx)}</h2>
                <div className={style["btns"]}>
                  {
                    ([
                      "newest", "score", "favs", "size"
                    ] as ("newest" | "score" | "favs" | "size")[]).map(sort => {
                      return <button
                        key={sort}
                        className={[sort === "newest" ? "" : sort === searchFilter.sortBy && style["activ"]].join(" ")}
                        onClick={() => {
                          setSearchFilter(prev => ({
                            ...prev,
                            sortBy: sort
                          }))
                        }}
                      >{t("windowsType.postSearch.filter.sortBy." + sort as any, usrIndx)}</button>
                    })
                  }
                </div>
                <br />
                <div className={style["btns"]}>
                  <button
                    className={[searchFilter.reverse && style["activ"]].join(" ")}
                    onClick={() => {
                      setSearchFilter(prev => ({
                        ...prev,
                        reverse: !prev.reverse
                      }))
                    }}
                  >{t("windowsType.postSearch.filter.sortBy.reverse", usrIndx)}</button>
                </div>
              </div>
            </div>
          </div>

          <div className={style["List"]}>
            {showLoading && <NODATA.Fetching />}
            {!showLoading &&
              <div className={style["InnerFrame"]} ref={scrollPage}>

                {processedPosts.map((post, indx) => <Components.Card
                  actionMenu={actionMenu}
                  key={post.id}
                  post={post}
                  delay={indx * .005}
                  q={{ q: searchTags.join(" ") }}
                  onClick={() => {
                    const winID = `post-${id}`
                    const children = <windowsType.post key={post.id} id={id} />;
                    const customData: e621Type.window.post = {
                      type: "post",
                      data: {
                        postId: post.id,
                        cachedPost: post,
                        parentData: {
                          windowID,
                          title: thisWindow?.title!,
                          componentType: "postSearch",
                          rect: thisWindow?.rect!,
                          customData: {
                            type: "postSearch",
                            data: {
                              nowPage: page,
                              pageCache: postsCache,
                              searchTags,
                            }
                          }
                        }
                      }
                    }
                    if (!wmRef.current?.hasWindowID(winID)) {
                      wmRef.current?.createWindow({
                        id: winID,
                        children,
                        customData,
                      })
                    } else {
                      wmRef.current.updateWindow(winID, {
                        children,
                        customData,
                      })
                      wmRef.current.bringToFront(winID)
                    }
                  }}
                />)}

              </div>
            }
            {!showLoading && processedPosts.length === 0 && <NODATA.None />}
          </div>

        </WINDOW_FRAME>
      </>
    );
  },
  post: function ({ id }: windowProp) {
    const windowID = `post-${id}`
    const thisWindow = wmRef.current?.getWindow(windowID)

    const savedData = thisWindow?.customData?.type === "post"
      ? thisWindow.customData.data
      : undefined;

    const [postId] = useState<number>(savedData?.postId ?? 0);
    const [postData, setPostData] = useState<E621.Post | undefined>(savedData?.cachedPost);
    const [isLoading, setIsLoading] = useState<boolean>(!savedData?.cachedPost);

    const fetchPost = useCallback(async () => {
      if (!postId) return;
      setIsLoading(true);
      setPostData(undefined)
      try {
        const result = await LABS_E621_API.posts.get({
          id: postId,
          user: e621Info(workSpaceStatus, usrIndx)
        });
        if (result) {
          setPostData(result);
        }
      } catch (e) {
        Kiasole.error(`Post ${postId} load failed: ${e}`);
      } finally {
        setIsLoading(false);
      }
    }, [postId]);

    useEffect(() => {
      if (!postData && postId !== 0) {
        fetchPost();
      }
    }, [postId]);

    useEffect(() => {
      thisWindow?.setData({
        type: "post",
        data: {
          postId,
          cachedPost: postData,
          parentData: savedData?.parentData
        }
      });
      if (postData)
        thisWindow?.setTitle(`${t("windowsType.post", usrIndx)} / ${postData.tags.artist.join(",")} - ${postData.id}`)
      else
        thisWindow?.setTitle(`${t("windowsType.post", usrIndx)} / ${postId}`)
    }, [postData, postId]);

    return (
      <>
        <WINDOW_FRAME
          menulist={[
            windowAction(windowID, [
              [
                t("menuButton.RestoreParentWindow", usrIndx),
                () => {
                  if (thisWindow?.customData?.type === "post") {
                    const { parentData } = thisWindow?.customData?.data
                    if (parentData) {
                      const { rect, windowID, customData, componentType } = parentData

                      let reconstructedChildren: ReactNode = null;

                      if (componentType === "postSearch") {
                        const parentId = windowID.replace("post_search-", "");
                        reconstructedChildren = <windowsType.postSearch id={parentId} />;
                      } else if (componentType === "pool") {
                        const parentId = windowID.replace("pool-", "");
                        reconstructedChildren = <windowsType.pool id={parentId} />;
                      }

                      if (wmRef.current?.getWindow(windowID)) {
                        wmRef.current.bringToFront(windowID)
                      } else {
                        wmRef.current?.createWindow({
                          id: windowID,
                          title: parentData.title,
                          rect,
                          children: reconstructedChildren,
                          customData: customData
                        })
                      }
                    }
                  }
                }
              ],
            ]),
            [
              t("menuButton.top.Data", usrIndx),
              [
                [
                  t("menuButton.Reload", usrIndx),
                  () => {
                    fetchPost()
                  }
                ],
              ],
            ],
            ...postData ? [[
              t("menuButton.top.Other", usrIndx),
              menuBtn.post(postData,
                thisWindow?.customData?.type === "post" ?
                  {
                    q: (() => {
                      const { parentData } = thisWindow?.customData?.data
                      if (parentData) {
                        if (parentData.componentType === "postSearch") {
                          return parentData.customData.data.searchTags.join(" ")
                        } else if (parentData.componentType === "pool") {
                          return `pool:${parentData.customData.data.poolId}`
                        }
                      }
                    })()
                  }
                  : {}),
            ] as MenuButtonType] : [],
          ]}
        >
          {postData &&
            <Components.Post postData={postData} thisWindow={thisWindow} />
          }
          {!postData && <NODATA.Fetching />}
        </WINDOW_FRAME >
      </>
    );
  },
  postGetByID: function ({ id }: windowProp) {
    const windowID = `post_get_by_id-${id}`;
    const thisWindow = wmRef.current?.getWindow(windowID);

    const savedData = thisWindow?.customData?.type === "postGetByID"
      ? thisWindow.customData.data
      : undefined;

    const [inputId, setInputId] = useState<string | number>(savedData?.currentId ?? "");
    const [fetchedPost, setFetchedPost] = useState<E621.Post | null | undefined>(savedData?.fetchedPost);
    const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(savedData?.status ?? "idle");

    const handleSearch = async (nextId: string | number) => {
      const targetId = Number(nextId);
      if (isNaN(targetId) || targetId <= 0) {
        Kiasole.error("Invalid ID");
        return;
      }

      const targetWindowID = `post_get_by_id-${targetId}`;

      if (targetWindowID !== windowID && wmRef.current?.hasWindowID(targetWindowID)) {
        Kiasole.log(`Window ${targetWindowID} already exists. Focusing...`);
        wmRef.current.bringToFront(targetWindowID);
        return;
      }

      setStatus("loading");
      setFetchedPost(undefined);

      try {
        const result = await LABS_E621_API.posts.get({
          id: targetId,
          user: e621Info(workSpaceStatus, usrIndx)
        });

        if (result) {
          setFetchedPost(result);
          setStatus("success");
          if (targetWindowID !== windowID) {
            thisWindow?.setData({
              type: "postGetByID",
              data: {
                currentId: targetId,
                fetchedPost: result,
                status: "success"
              }
            });

            const success = wmRef.current?.updateWindowID(windowID, targetWindowID);

            if (success) {
              wmRef.current?.updateWindow(targetWindowID, {
                children: <windowsType.postGetByID id={targetId.toString()} />
              });
            }
          }

        } else {
          setFetchedPost(null);
          setStatus("error");
        }
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    };

    useEffect(() => {
      thisWindow?.setData({
        type: "postGetByID",
        data: {
          currentId: inputId,
          fetchedPost: fetchedPost,
          status: status
        }
      });
      thisWindow?.setTitle(`${t("windowsType.postGetByID", usrIndx)} [ ${inputId} ]`);
    }, [inputId, fetchedPost, status]);

    useEffect(() => {
      if (status === "loading" && !fetchedPost) {
        handleSearch(inputId);
      }
    }, []);

    return (
      <WINDOW_FRAME
        menulist={[
          windowAction(windowID),
          [
            t("menuButton.top.Data", usrIndx),
            [
              [
                t("menuButton.Reload", usrIndx),
                () => {
                  handleSearch(inputId)
                }
              ],
            ],
          ],
          ...fetchedPost ? [[
            t("menuButton.top.Other", usrIndx),
            menuBtn.post(fetchedPost, {}, "id"),
          ] as MenuButtonType] : [],
        ]}
      >
        <div className={style["postGetByID"]}>
          <div className={style["Input"]}>
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.code === "NumpadEnter") {
                  handleSearch(e.currentTarget.value);
                }
              }}
              placeholder="Input Post ID..."
            />
          </div>
          {fetchedPost &&
            <Components.Post key={fetchedPost.id} postData={fetchedPost} thisWindow={thisWindow} />
          }
          {!fetchedPost && <NODATA.Fetching />}
        </div>
      </WINDOW_FRAME >
    );
  },
  pool: function ({ id }: windowProp) {
    const windowID = `pool-${id}`;
    const thisWindow = wmRef.current?.getWindow(windowID);

    const savedData = thisWindow?.customData?.type === "pool"
      ? thisWindow.customData.data
      : undefined;

    const [poolIdInput, setPoolIdInput] = useState<string | number>(savedData?.poolId || id || "");
    const [poolId, setPoolId] = useState<number>(savedData?.poolId || Number(id) || 0);
    const [poolInfo, setPoolInfo] = useState<E621.Pool | undefined>(savedData?.poolInfo);

    const [page, setPage] = useState<number>(savedData?.nowPage ?? 1);
    const [postsCache, setPostsCache] = useState<PostsCache>(savedData?.pageCache ?? {});
    const [jupToPage, setJupToPage] = useState<boolean>(false);
    const [jupPage, setJupPage] = useState<number>(1);

    const [isFocuOnIt, setFocuOnIt] = useState<boolean>(false);

    const currentPosts = useMemo(() => postsCache[page] || [], [postsCache, page]);

    const fetchingPages = useRef<Set<number>>(new Set());
    const scrollPage = useRef<HTMLDivElement>(null);

    const fetchPageData = useCallback(async (targetPage: number) => {
      if (postsCache[targetPage] || fetchingPages.current.has(targetPage) || !poolId) {
        return;
      }

      fetchingPages.current.add(targetPage);

      try {
        Kiasole.log(`[背景預取] 正在請求 API: Pool ${poolId} 第 ${targetPage} 頁`);
        const newPosts = await LABS_E621_API.posts.search({
          tags: [`pool:${poolId}`],
          page: targetPage,
          limit: 75,
          user: e621Info(workSpaceStatus, usrIndx)
        });

        setPostsCache((prev) => ({
          ...prev,
          [targetPage]: newPosts
        }));
      } catch (err) {
        Kiasole.error(`Pool page ${targetPage} fetch failed: ${err}`);
      } finally {
        fetchingPages.current.delete(targetPage);
      }
    }, [poolId, postsCache]);

    useEffect(() => {
      const savedCache = thisWindow?.customData?.type === "pool"
        ? thisWindow.customData.data?.pageCache
        : null;

      if (savedCache && Object.keys(savedCache).length > 0) {
        setPostsCache(savedCache);
      }
    }, []);

    useEffect(() => {
      if (thisWindow?.customData?.type === "pool") {
        thisWindow?.setData({
          type: "pool",
          data: {
            poolId,
            poolInfo,
            nowPage: page,
            pageCache: postsCache,
          }
        });
      }
    }, [page, postsCache, poolId, poolInfo]);

    useEffect(() => {
      if (poolInfo) {
        thisWindow?.setTitle(`${t("windowsType.pool", usrIndx)} : ${poolInfo.name.replace(/_/g, " ")} [Page ${page}]`);
      } else if (poolId) {
        thisWindow?.setTitle(`${t("windowsType.pool", usrIndx)} : ${poolId} [Page ${page}]`);
      } else {
        thisWindow?.setTitle(`${t("windowsType.pool", usrIndx)}`);
      }
    }, [poolInfo, poolId, page]);

    useEffect(() => {
      if (poolId !== 0 && (!poolInfo || poolInfo.id !== poolId)) {
        LABS_E621_API.pools.get({ id: poolId }).then(info => {
          if (info) setPoolInfo(info as any);
        }).catch(err => Kiasole.error(`Pool Info Fetch Error: ${err}`));
      }
    }, [poolId]);

    useEffect(() => {
      if (!poolId) return;
      const loadData = async () => {
        const targetPages = [page, page + 1, page - 1, page + 2, page - 2]
          .filter(p => p > 0);

        for (const p of targetPages) {
          await fetchPageData(p);
          await functions.timeSleep(500);
        }
      };

      loadData();
    }, [page, poolId]);

    useEffect(() => {
      const { current: scpg } = scrollPage;
      if (scpg) {
        scpg.scrollTo({ top: 0 });
      }
    }, [page]);

    const refreshSearch = useCallback((newId?: string | number) => {
      setPostsCache({});
      setPage(1);

      if (newId !== undefined) {
        const parsedId = Number(newId) || 0;
        setPoolId(parsedId);
        if (parsedId !== poolId) {
          setPoolInfo(undefined);
        }
      }
    }, [poolId]);

    const handleNextPage = () => setPage(p => p + 1);
    const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

    useEffect(() => {
      const keydown = (e: KeyboardEvent) => {
        if (!wmRef.current?.getWindow(thisWindow!.id)?.isFocused) return;

        switch (e.code) {
          case "Escape": {
            setJupToPage(false)
            break
          }
        }

        if (jupToPage || isFocuOnIt) return;

        switch (e.code) {
          case "ArrowLeft": {
            e.preventDefault()
            setPage(e => e > 1 ? e - 1 : 1)
            break
          }
          case "ArrowRight": {
            e.preventDefault()
            setPage(e => e + 1)
            break
          }
        }
      }
      document.addEventListener("keydown", keydown)

      return () => {
        document.removeEventListener("keydown", keydown)
      }

    }, [jupToPage, isFocuOnIt])

    const actionMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => {
      event.stopPropagation()
      event.preventDefault()
      const btn = event.currentTarget
      const btnRect = btn.getBoundingClientRect()
      const x = btnRect.bottom
      const y = btnRect.left
      MenuAction.showMenu(menuBtn.post(post, { q: `pool:${poolId}` }), [x, y])
    }

    const showLoading = poolId !== 0 && !postsCache[page];

    useEffect(() => {
      const statusOffset = 50
      const offset = 200

      let startPointX = 0
      let startPointY = 0

      let status: "NONE" | "X" | "Y" = "NONE"

      let x = 0
      let y = 0

      const touchArea = scrollPage.current

      if (jupToPage) return;

      const onTouchStart = (e: TouchEvent) => {
        if (!touchArea) return;

        startPointX = e.touches[0].clientX
        startPointY = e.touches[0].clientY
      }

      const onTouchMove = (e: TouchEvent) => {
        if (!touchArea) return;

        x = startPointX - e.touches[0].clientX
        y = startPointY - e.touches[0].clientY

        if (status === "X") e.preventDefault();

        if (status === "Y") { x = 0; return; }

        const transform = () => {
          touchArea.style.transform = `translateX(${-1 * (x / 10)}px)`
        }

        if (x > offset) {
          touchArea.style.opacity = ".5"
          transform()
        } else if (x < -offset) {
          if (page === 1) return;
          touchArea.style.opacity = ".5"
          transform()
        } else {
          touchArea.style.opacity = ""
          transform()
        }

        if (status !== "NONE") return;
        if (x > statusOffset || x < -statusOffset) status = "X";
        if (y > statusOffset || y < -statusOffset) status = "Y";
      }

      const onTouchEnd = () => {
        if (!touchArea) return;

        startPointX = 0;

        if (x > offset) {
          setPage(e => e + 1)
          void touchArea.clientHeight
        } else if (x < -offset) {
          setPage(e => e > 1 ? e - 1 : 1)
          void touchArea.clientHeight
        }
        touchArea.style.transform = ""
        touchArea.style.opacity = ""

        status = "NONE"
      }

      touchArea?.addEventListener("touchstart", onTouchStart)
      touchArea?.addEventListener("touchmove", onTouchMove)
      touchArea?.addEventListener("touchend", onTouchEnd)

      return () => {
        touchArea?.removeEventListener("touchstart", onTouchStart)
        touchArea?.removeEventListener("touchmove", onTouchMove)
        touchArea?.removeEventListener("touchend", onTouchEnd)
      }

    }, [jupToPage, page, scrollPage.current])

    const Layer = {
      PaginationControls: <div className={style["PaginationControls"]} >
        <div />
        <div className={style["InnerFrame"]}>
          <button kiase-style="" onClick={handlePrevPage} disabled={page === 1}>{"<"}</button>
          <button kiase-style="" onClick={() => { setJupToPage(true); setJupPage(page) }} >Page {page}</button>
          <button kiase-style="" onClick={handleNextPage}>{">"}</button>
        </div>
      </div>,

      TagEditor: <div className={style["TagEditor"]} >
        <div className={style["InnerFrame"]}>
          <input
            type="text"
            value={poolIdInput}
            onInput={(e) => setPoolIdInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.code === "NumpadEnter") {
                const targetId = Number(poolIdInput);
                if (targetId && targetId !== poolId) {
                  refreshSearch(targetId);
                }
              }
            }}
            onFocus={() => { setFocuOnIt(true) }}
            onBlur={() => { setFocuOnIt(false) }}
            placeholder="Input Pool ID..."
          />
        </div>
        <div />
      </div>,
    }

    const JumpToPageOverlay = useMemo(() => {
      const _ = ({
        jupToPage,
        jupPage,
        setJupPage,
        setJupToPage,
        setPage
      }: {
        jupToPage: boolean,
        jupPage: number,
        setJupPage: (p: number) => void,
        setJupToPage: (b: boolean) => void,
        setPage: (p: number | ((prev: number) => number)) => void
      }) => {
        const touchAreaRef = useRef<HTMLDivElement>(null);
        const backButtonRef = useRef<HTMLButtonElement>(null);
        const backLineRef = useRef<HTMLDivElement>(null);
        const applyButtonRef = useRef<HTMLButtonElement>(null);
        const applyLineRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          const offset = 200

          let startPointX = 0
          let x = 0

          const touchArea = touchAreaRef.current
          const backButton = backButtonRef.current
          const backLine = backLineRef.current
          const applyButton = applyButtonRef.current
          const applyLine = applyLineRef.current

          const isLoad = touchArea && backButton && backLine && applyButton && applyLine

          if (!isLoad) return;
          if (!jupToPage) return;

          const onTouchStart = (e: TouchEvent) => {
            startPointX = e.touches[0].clientX
          }

          const onTouchMove = (e: TouchEvent) => {
            x = startPointX - e.touches[0].clientX

            const _x = x / 7

            if (x > 0) {
              applyButton.style.transform = ""
              applyLine.style.transform = ""

              backButton.style.transform = `translateX(-${_x}px)`
              backLine.style.transform = `translateX(-${_x}px)`
            } else {
              backButton.style.transform = ""
              backLine.style.transform = ""

              applyButton.style.transform = `translateX(${Math.abs(_x)}px)`
              applyLine.style.transform = `translateX(${_x}px)`
            }

            if (x > offset) {
              applyButton.style.opacity = ""
              applyLine.style.opacity = ""
              backButton.style.opacity = ".5"
              backLine.style.opacity = ".5"
            } else if (x < -offset) {
              backButton.style.opacity = ""
              backLine.style.opacity = ""
              applyButton.style.opacity = ".5"
              applyLine.style.opacity = ".5"
            } else {
              backButton.style.opacity = ""
              backLine.style.opacity = ""
              applyButton.style.opacity = ""
              applyLine.style.opacity = ""
            }

          }

          const onTouchEnd = (e: TouchEvent) => {
            startPointX = 0

            if (x > offset) {
              setJupToPage(false)
              backButton.click()
            } else if (x < -offset) {
              setJupToPage(false)
              applyButton.click()
            }

            backButton.style.transform = ""
            backLine.style.transform = ""
            applyButton.style.transform = ""
            applyLine.style.transform = ""
            backButton.style.opacity = ""
            backLine.style.opacity = ""
            applyButton.style.opacity = ""
            applyLine.style.opacity = ""
          }

          touchArea.addEventListener("touchstart", onTouchStart)
          touchArea.addEventListener("touchmove", onTouchMove)
          touchArea.addEventListener("touchend", onTouchEnd)

          return () => {
            touchArea.removeEventListener("touchstart", onTouchStart)
            touchArea.removeEventListener("touchmove", onTouchMove)
            touchArea.removeEventListener("touchend", onTouchEnd)
          }

        }, [jupToPage, jupPage, setJupToPage, setPage]);

        useEffect(() => {
          const input = inputRef.current
          if (!input) return;
          if (jupToPage) input.focus();
          else input.blur()
        }, [jupToPage]);

        return (
          <div ref={touchAreaRef} className={[style["JumpToPage"], jupToPage && style["show"]].join(" ")}>
            <div className={style["Inner"]}>
              <div className={style["Back"]}>
                <button ref={backButtonRef} onClick={() => setJupToPage(false)}>{"<-- Cancel"}</button>
              </div>
              <div className={[style["line"], style["top"]].join(" ")}><div ref={backLineRef} /></div>
              <div className={style["Input"]}>
                Jump To Page
                <input
                  ref={inputRef}
                  type="number"
                  value={jupPage}
                  onChange={(e) => setJupPage(+e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(~~(jupPage || 1));
                      setJupToPage(false);
                    }
                  }}
                />
              </div>
              <div className={[style["line"], style["bottom"]].join(" ")}><div ref={applyLineRef} /></div>
              <div className={style["Apply"]}>
                <button ref={applyButtonRef} onClick={() => {
                  setPage(~~(jupPage || 1));
                  setJupToPage(false);
                }}>{"Apply -->"}</button>
              </div>
            </div>
          </div>
        );
      };

      return _
    }, [])

    return (
      <>
        <WINDOW_FRAME
          className={style["pool"]}
          menulist={[
            windowAction(windowID),
            [
              t("menuButton.top.Data", usrIndx),
              [
                [
                  t("menuButton.Reload", usrIndx),
                  () => refreshSearch(poolId)
                ],
              ],
            ],
            [
              t("menuButton.top.Other", usrIndx),
              [
                [
                  t("menuButton.SaveToTmp", usrIndx),
                  () => {
                    someActions.saveToTmp(usrIndx, cloneDeep(wmRef.current!.getWindow(thisWindow!.id!)!.customData!), thisWindow!.title, windowID)
                  },
                  thisWindow?.customData?.type === "pool" ? {
                    type: "pool",
                    thisWindow,
                    data: thisWindow.customData.data
                  } : undefined
                ],
                ...menuBtn.copyJSON(poolInfo),
              ],
            ],
          ]}

          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            if (!e.dataTransfer) return;

            const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

            if (itemdata) {
              const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
              const { data, type } = item
              if (type === "poolId") {
                setPoolIdInput(data);
                refreshSearch(data);
                StopEvent(e);
              } else if (type === "pool") {
                setPoolIdInput(data.poolId);
                refreshSearch(data.poolId);
                StopEvent(e);
              }
            }
          }}
        >
          {Layer.PaginationControls}
          {Layer.TagEditor}

          <JumpToPageOverlay
            jupToPage={jupToPage}
            jupPage={jupPage}
            setJupPage={setJupPage}
            setJupToPage={setJupToPage}
            setPage={setPage}
          />

          <div className={style["List"]}>
            {!poolId ? (
              <NODATA.None />
            ) : showLoading ? (
              <NODATA.Fetching />
            ) : currentPosts.length === 0 ? (
              <NODATA.None />
            ) : (
              <div className={style["InnerFrame"]} ref={scrollPage}>
                {currentPosts.map((post, indx) => <Components.Card
                  actionMenu={actionMenu}
                  key={post.id}
                  post={post}
                  delay={indx * .005}
                  q={{ q: `pool:${poolId}` }}
                  onClick={() => {
                    const winID = `post-${post.id}`
                    const title = `Post / ${post.tags.artist.join(",")} - ${post.id}`;
                    const children = <windowsType.post key={post.id} id={`${post.id}`} />;
                    const customData: e621Type.window.post = {
                      type: "post",
                      data: {
                        postId: post.id,
                        cachedPost: post,
                        parentData: {
                          windowID,
                          title: thisWindow?.title!,
                          componentType: "pool",
                          rect: thisWindow?.rect!,
                          customData: {
                            type: "pool",
                            data: {
                              poolId,
                              poolInfo,
                              nowPage: page,
                              pageCache: postsCache,
                            }
                          }
                        }
                      }
                    }
                    if (!wmRef.current?.hasWindowID(winID)) {
                      wmRef.current?.createWindow({ id: winID, title, children, customData })
                    } else {
                      wmRef.current.updateWindow(winID, { title, children, customData })
                      wmRef.current.bringToFront(winID)
                    }
                  }}
                />)}
              </div>
            )}
          </div>

        </WINDOW_FRAME>
      </>
    );
  },
  viewer: function ({ id }: windowProp) {
    const windowID = `viewer-${id}`;
    const thisWindow = wmRef.current?.getWindow(windowID);

    const savedData = thisWindow?.customData?.type === "viewer"
      ? thisWindow.customData.data
      : undefined;

    const [fetchedPost] = useState<E621.Post>(savedData!);

    useEffect(() => {
      thisWindow?.setTitle(`${t("windowsType.viewer", usrIndx)} [ ${fetchedPost.id} ]`)
    }, [])

    return (
      <WINDOW_FRAME
        menulist={[
          windowAction(windowID, [
            [
              "View Post",
              () => {
                createWindow(wmRef, {
                  type: "postGetByID",
                  data: {
                    status: "success",
                    currentId: fetchedPost.id,
                    fetchedPost,
                  },
                })
              },
              {
                type: "post",
                data: fetchedPost,
              }
            ],
          ]),
          ...fetchedPost ? [[
            t("menuButton.top.Other", usrIndx),
            menuBtn.post(fetchedPost, {}, "viewer"),
          ] as MenuButtonType] : [],
        ]}
      >
        <Viewer
          className={style["Viewer"]}
          tTranslate={{
            "resetTransform": t("windowsType.viewer.ResetTransform", usrIndx),
            "randerMode": t("windowsType.viewer.RanderMode", usrIndx),
            "randerMode.auto": t("windowsType.viewer.RanderMode.Auto", usrIndx),
            "randerMode.pixelated": t("windowsType.viewer.RanderMode.Pixelated", usrIndx),
          }}
        >
          <img src={fetchedPost.file.url!} alt="" />
        </Viewer>
      </WINDOW_FRAME >
    );
  },
  setting: function () {
    const windowID = `app-setting`;
    const thisWindow = wmRef.current?.getWindow(windowID)!;

    const { settingTabs } = e621Type.window.dataType
    const [nowPage, setNowPage] = useState<e621Type.window.dataType.settingTabs._All>("NONE")
    const [showIndex, setShowIndex] = useState<boolean>(false)
    const [showTabs, setShowTabs] = useState<boolean>(false)

    const tCategory = (cat: string) => {
      const capCat = functions.str.capitalizeWords(cat);
      return t(`setting.${capCat}` as any, usrIndx);
    };

    const tPage = (cat: string, page: string) => {
      const capCat = functions.str.capitalizeWords(cat);
      let p = page;
      return t(`setting.${capCat}.${p}` as any, usrIndx);
    };

    useEffect(() => {
      if (thisWindow.customData?.type === "setting")
        setNowPage(thisWindow.customData.data)
    }, []);

    useEffect(() => {
      thisWindow?.setData({
        type: "setting",
        data: nowPage
      });

      thisWindow?.setTitle(nowPage === "NONE"
        ? t("windowsType.setting", usrIndx)
        : `${t("windowsType.setting", usrIndx)} / ${tCategory(nowPage.categorie)} > ${tPage(nowPage.categorie, nowPage.pages)}`);
    }, [nowPage]);

    type PageBtn = {
      nowPage: e621Type.window.dataType.settingTabs._All;
    };

    type Page = {
      children?: JSX.Element,
    };

    const Page = useCallback(({ children }: Page) => {
      const [start, setStart] = useState<boolean>(false)

      const eRef = useRef<HTMLDivElement>(null)

      useEffect(() => {
        void eRef.current!.clientHeight
        setStart(true)
      }, [])

      return <div ref={eRef} className={[style["page"], start && style["START"]].join(" ")}>
        <div>
          {children}
        </div>
      </div>
    }, []);

    const PageButtonsList = useCallback(({ nowPage }: PageBtn) => {
      const [start, setStart] = useState<boolean>(false)
      const [backing, setBacking] = useState<boolean>(false)

      const eRef = useRef<HTMLDivElement>(null)

      useEffect(() => {
        void eRef.current!.clientHeight
        setStart(true)
      }, [])

      useEffect(() => {
        let animationId: NodeJS.Timeout
        let keyispress = false

        const isFocus = () => !wmRef.current?.getWindow(thisWindow.id)?.isFocused;

        const keydown = (e: KeyboardEvent) => {
          setShowTabs(e.shiftKey && e.ctrlKey)
          if (isFocus()) return;
          if (keyispress) return;

          if (e.shiftKey) {
            if (e.ctrlKey) {

              const changePage = (offset: number) => {
                e.preventDefault();
                setNowPage(e => {
                  const _ = cloneDeep(e)
                  if (_ === "NONE") return _;

                  const list = settingTabs.categorieList;

                  let nowtar = list.indexOf(_.categorie);
                  let count = list.length;

                  nowtar += offset; nowtar = (nowtar % count + count) % count;

                  _.categorie = list[nowtar];
                  _.pages = settingTabs.pageList[_.categorie][0] as any

                  return _
                })
              }

              const changeTab = (offset: number) => {
                e.preventDefault();
                setNowPage(e => {
                  const _ = cloneDeep(e)
                  if (_ === "NONE") return _;

                  const list = settingTabs.pageList[_.categorie];

                  let nowtar = list.indexOf(_.pages);
                  let count = list.length;

                  nowtar += offset; nowtar = (nowtar % count + count) % count;

                  _.pages = list[nowtar] as any;

                  return _
                })
              }

              switch (e.code) {
                case "ArrowLeft": {
                  changePage(-1)
                  break;
                }
                case "ArrowRight": {
                  changePage(1)
                  break;
                }
                case "ArrowUp": {
                  changeTab(-1)
                  break;
                }
                case "ArrowDown": {
                  changeTab(1)
                  break;
                }
              }

              return;
            }
            return;
          }

          keyispress = true

          switch (e.code) {
            case "Escape": {
              setBacking(true)
              animationId = setTimeout(() => {
                setNowPage("NONE")
                setBacking(false)
              }, .5e3)
              break
            }
          }

        }

        const keyup = (e: KeyboardEvent) => {
          setShowTabs(e.shiftKey && e.ctrlKey)
          if (isFocus()) return;
          keyispress = false
          switch (e.code) {
            case "Escape": {
              clearTimeout(animationId);
              setBacking(false)
            }
          }
        }

        document.addEventListener("keydown", keydown)
        document.addEventListener("keyup", keyup)

        return () => {
          document.removeEventListener("keydown", keydown)
          document.removeEventListener("keyup", keyup)
        }

      }, [])

      if (nowPage === "NONE") return;

      return <div className={[style["list"], start && style["START"]].join(" ")} ref={eRef}>
        <div
          className={[style["buttonFrame"], style["frist"], backing && style["backing"]].join(" ")}
        >
          <button onClick={() => setNowPage("NONE")}>
            {t("setting.Back", usrIndx)}
          </button>
          <div className={style["backMask"]}>
            {t("setting.Back", usrIndx)}
          </div>
        </div>

        {settingTabs.pageList[nowPage.categorie].map((e, i) =>
          <div
            className={style["buttonFrame"]}
            style={{
              transitionDelay: `${i * .05 + .05}s`
            }}
          >
            <button
              className={[nowPage.pages === e && style["activ"]].join(" ")}
              key={i}
              onClick={() => setNowPage({ categorie: nowPage.categorie, pages: e as any })}
            >
              {tPage(nowPage.categorie, e as string)}
            </button>
          </div>
        )}
      </div>
    }, []);

    const Pages = useCallback(({ nowPage }: PageBtn) => {
      if (nowPage === "NONE") return "none :p"

      const NowPage = () => {
        switch (nowPage.categorie) {
          case "search": {
            switch (nowPage.pages) {
              case "general": {

                return <></>
              }
              case "tags": {

                return <></>
              }
              case "history": {

                return <></>
              }
              case "export/import": {

                return <></>
              }
            }
          }
          case "account": {
            switch (nowPage.pages) {
              case "local": {

                const [accMsg, setAccMsg] = useState<string>("")

                const [currentPass, setCurrentPass] = useState<string>("")
                const [newPass, setNewPass] = useState<string>("")
                const [newPassAgain, setNewPassAgain] = useState<string>("")

                const nowPass = workSpaceStatus.userList[usrIndx].saveInfo.user.passKey

                const setPass = useCallback((pass?: string) => {
                  setWorkSpaceStatus(e => {
                    const _ = cloneDeep(e)
                    _.userList[usrIndx].saveInfo.user.passKey = pass
                    return _
                  })
                }, [])

                const clearInput = useCallback(() => {
                  setCurrentPass("")
                  setNewPass("")
                  setNewPassAgain("")
                }, [])

                const setPassKey = useCallback((del?: boolean) => {

                  if (nowPass) {
                    if (nowPass !== currentPass) { setAccMsg(t("setting.Account.local.changePassword.notic.noMatch", usrIndx)); return; };
                    if (del) {
                      setAccMsg("")
                      newInput.message("你確定你要把密碼解掉？", [
                        { name: t("setting.Account.local.changePassword.pop.yes", usrIndx), value: "yes", key: "Delete" },
                        { name: t("setting.Account.local.changePassword.pop.no", usrIndx), value: "" },
                      ], (e) => {
                        if (e === "yes") {
                          setTimeout(() => {
                            newInput.message(t("setting.Account.local.changePassword.pop.hasGone", usrIndx))
                          }, .5e3);
                          setPass()
                          clearInput()
                        }
                      })
                    } else {
                      if (newPass !== newPassAgain) { setAccMsg(t("setting.Account.local.changePassword.notic.newNoMatch", usrIndx)); return; }
                      setAccMsg("")
                      setPass(newPass)
                      newInput.message(t("setting.Account.local.changePassword.pop.hasChange", usrIndx))
                      clearInput()
                    }
                  } else {
                    setPass(currentPass)
                    newInput.message(t("setting.Account.local.setPassword.pop.success", usrIndx))
                    clearInput()
                  }
                }, [
                  currentPass,
                  newPass,
                  newPassAgain,
                  workSpaceStatus.userList[usrIndx].saveInfo.user.passKey
                ])

                return <div className={style["Account"]}>
                  {nowPass ?
                    <>
                      <KiloDown.Subtitle>{t("setting.Account.local.changePassword", usrIndx)}</KiloDown.Subtitle>
                      <br />
                      {accMsg ? <>
                        <span>{accMsg}</span>
                        <br />
                        <br />
                      </> : ""}
                      <input
                        kiase-sty=""
                        placeholder={t("setting.Account.local.changePassword.current", usrIndx)}
                        type="password"
                        onChange={e => setCurrentPass(e.currentTarget.value)}
                        value={currentPass}
                      />
                      <br />
                      <br />
                      <input
                        kiase-sty=""
                        placeholder={t("setting.Account.local.changePassword.new", usrIndx)}
                        type="password"
                        onChange={e => setNewPass(e.currentTarget.value)}
                        value={newPass}
                      />
                      <br />
                      <br />
                      <input
                        kiase-sty=""
                        placeholder={t("setting.Account.local.changePassword.newAgain", usrIndx)}
                        type="password"
                        onChange={e => setNewPassAgain(e.currentTarget.value)}
                        value={newPassAgain}
                      />
                      <br />
                      <br />
                      <div className={style["buttonList"]}>
                        <button kiase-sty="" onClick={() => setPassKey()}>{t("setting.Account.local.changePassword.update", usrIndx)}</button>
                        <button kiase-sty="" onClick={() => setPassKey(true)}>{t("setting.Account.local.changePassword.remove", usrIndx)}</button>
                      </div>
                    </>
                    :
                    <>
                      <KiloDown.Subtitle>{t("setting.Account.local.setPassword", usrIndx)}</KiloDown.Subtitle>
                      <br />
                      <input
                        kiase-sty=""
                        placeholder={t("setting.Account.local.setPassword.new", usrIndx)}
                        type="password"
                        onChange={e => setCurrentPass(e.currentTarget.value)}
                        value={currentPass}
                      />
                      <br />
                      <br />
                      <button kiase-sty="" onClick={() => setPassKey()}>{t("setting.Account.local.setPassword.setPass", usrIndx)}</button>
                    </>}

                  <br />
                  <br />
                  <br />
                  <button kiase-sty="" onClick={() => {
                    newInput.message(t("setting.Account.local.deleteAccount.1", usrIndx), [
                      { name: t("setting.Account.local.deleteAccount.1.yes", usrIndx), value: "yes", key: "Enter" },
                      { name: t("setting.Account.local.deleteAccount.1.no", usrIndx), value: "" },
                    ], (e) => {
                      if (e === "yes") {
                        setTimeout(() => {

                          newInput.message(t("setting.Account.local.deleteAccount.2", usrIndx), [
                            { name: t("setting.Account.local.deleteAccount.2.yes", usrIndx), value: "yes", key: "Enter" },
                            { name: t("setting.Account.local.deleteAccount.2.no", usrIndx), value: "" },
                          ], (e) => {
                            if (e === "yes") {
                              setTimeout(() => {

                                newInput.message(t("setting.Account.local.deleteAccount.3", usrIndx), [
                                  { name: t("setting.Account.local.deleteAccount.3.yes", usrIndx), value: "yes", key: "Delete" },
                                  { name: t("setting.Account.local.deleteAccount.3.no", usrIndx), value: "" },
                                ], (e) => {
                                  if (e === "yes") {
                                    setWorkSpaceStatus(prev => {
                                      const _ = cloneDeep(prev)
                                      _.autoLogin = false
                                      _.rememberPassword = ""
                                      _.lastUser = 0
                                      _.userList = _.userList.filter((_, i) => i !== usrIndx)

                                      return _
                                    })
                                    setIsLogin(false)
                                  }
                                })

                              }, .5e3);
                            }
                          })

                        }, .5e3);
                      }
                    })
                  }}>{t("setting.Account.local.deleteAccount", usrIndx)}</button>
                </div>
              }
              case "avatar": {
                const [avaCfg, setAvaCfg] = useState<workSpaceType.Unit.BaseItem.Image>({
                  url: ""
                })

                useEffect(() => {
                  setAvaCfg(workSpaceStatus.userList[usrIndx].saveInfo.user.avatar)
                }, [workSpaceStatus])

                const updateVal = (key: keyof workSpaceType.Unit.BaseItem.Image, val: number) => {
                  setAvaCfg(prev => ({
                    ...prev,
                    [key]: val
                  }))
                }
                return <div className={style["Avatar"]}>
                  <div className={style["positionSet"]}>
                    <div className={style["frame"]}>
                      <div
                        className={style["image"]}
                        onDragOver={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add(style["ondrag"])
                        }}

                        onDragLeave={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove(style["ondrag"])
                        }}

                        onDrop={e => {
                          if (!e.dataTransfer) return;
                          e.preventDefault();
                          e.stopPropagation();

                          const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

                          if (itemdata) {
                            const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
                            const { data, type } = item
                            if (type === "post" || type === "postImg") {
                              someActions.setAvatar(usrIndx, data.file.url!, data)
                              setAvaCfg({
                                url: data.file.url!,
                                positionX: 50,
                                positionY: 50,
                                fromPost: data
                              })
                            }
                          }

                          e.currentTarget.classList.remove(style["ondrag"])
                        }}
                      >
                        <Background bg={avaCfg} />
                        <div className={style["dragOverlay"]}>
                          <span>{t("setting.Account.avatar.set", usrIndx)}</span>
                        </div>
                      </div>
                      <div className={style["position"]}>
                        <div>
                          <span>{"X:"}</span>
                          <div>
                            <input
                              kilo-style=""
                              type="range"
                              step={.5}
                              max={100}
                              min={0}
                              kiase-sty=""
                              value={avaCfg.positionX ?? 50}
                              onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                            />
                          </div>
                          <input
                            type="number"
                            kiase-sty=""
                            step={.5}
                            max={100}
                            min={0}
                            value={avaCfg.positionX ?? 50}
                            onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                          />
                        </div>

                        <div>
                          <span>{"Y:"}</span>
                          <div>
                            <input
                              kilo-style=""
                              type="range"
                              step={.5}
                              max={100}
                              min={0}
                              kiase-sty=""
                              value={avaCfg.positionY ?? 50}
                              onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                            />
                          </div>
                          <input
                            type="number"
                            kiase-sty=""
                            step={.5}
                            max={100}
                            min={0}
                            value={avaCfg.positionY ?? 50}
                            onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                          />
                        </div>

                        <div>
                          <span>{"S:"}</span>
                          <div>
                            <input
                              kilo-style=""
                              type="range"
                              step={.5}
                              max={500}
                              min={100}
                              kiase-sty=""
                              value={avaCfg.scale ?? 100}
                              onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                            />
                          </div>
                          <input
                            type="number"
                            kiase-sty=""
                            step={.5}
                            max={500}
                            min={100}
                            value={avaCfg.scale ?? 100}
                            onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                          />
                        </div>
                      </div>

                      <button kiase-sty="" onClick={() => setWorkSpaceStatus(e => {
                        const _ = cloneDeep(e);
                        _.userList[usrIndx].saveInfo.user.avatar = avaCfg
                        return _
                      })}>{t("setting.Account.avatar.apply", usrIndx)}</button>
                      <button
                        kiase-sty=""
                        onClick={() => someActions.openWithGetByID(avaCfg.fromPost!)}
                        draggable={true}
                        onDragStart={(e) => {
                          dragItem(e, {
                            type: "post",
                            data: avaCfg.fromPost!
                          });
                        }}
                      >{t("setting.Account.avatar.source", usrIndx)}</button>
                    </div>
                  </div>
                </div>
              }
              case "e621": {

                return <></>
              }
              case "language": {

                const [notic, setNotic] = useState<string>("...")

                const list = Object.entries(langList).map(e => ({
                  name: e[1].NAME,
                  notic: e[1].NOTIC,
                  id: e[0],
                }))

                return <div className={style["Language"]}>
                  <div className={style["notic"]}>
                    <div><span>{notic}</span></div>
                  </div>
                  <div className={style["btns"]}>
                    {list.map(l => <button
                      className={workSpaceStatus.userList[usrIndx].setting.lang === l.id ? style["activ"] : ""}
                      onMouseMove={() => setNotic(l.notic)}
                      onMouseLeave={() => setNotic("...")}
                      onClick={() => setWorkSpaceStatus(e => {
                        const _ = cloneDeep(e)
                        _.userList[usrIndx].setting.lang = l.id
                        return _
                      })}
                      key={l.id}
                    >
                      <span>{l.name}</span>
                      <span>{l.id}</span>
                    </button>)}
                  </div>
                </div>
              }
              case "export/import": {

                return <></>
              }
            }
          }
          case "download": {
            switch (nowPage.pages) {
              case "general": {

                return <></>
              }
              case "history": {

                return <></>
              }
              case "export/import": {

                return <></>
              }
            }
          }
          case "appearance": {
            switch (nowPage.pages) {
              case "general": {
                const scaleGear = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]

                return <>
                  <KiloDown.Title>{"整體的縮放"}</KiloDown.Title>
                  <KiloDown.Thirdtitle>{"除非有特殊需求 不然不要縮太小 對眼睛不好"}</KiloDown.Thirdtitle>
                  <div className={style["buttonList"]}>
                    {scaleGear.map((scale, i) => <button
                      kiase-sty=""
                      onClick={() => setWorkSpaceStatus(e => {
                        const _ = cloneDeep(e)

                        _.userList[usrIndx].setting.appearance.scale = scale

                        return _
                      })}
                    >
                      {scale}%
                    </button>)}
                  </div>

                  <br />
                  <br />

                  <KiloDown.Title>{"右下角時鐘的格式"}</KiloDown.Title>
                  <KiloDown.Thirdtitle>{"除非特殊需求 啊不然建議還是隨便寫個"}</KiloDown.Thirdtitle>
                  <KiloDown.SmallText>{"除非....額 你跟我一樣失去了時間觀念"}<br />{"欸那不是更應該放時鐘嗎"}</KiloDown.SmallText>
                  <br />
                  <br />
                  <div small-txt="">{
                    [
                      ":HH:  - 24小時制的小時",
                      ":mm:  - 分鐘",
                      ":ss:  - 秒",
                      "",
                      "-YY-  - 四位數的年份",
                      "-yy-  - 兩位數的年份",
                      "-mm-  - 數字的月",
                      "-dd-  - 日",
                    ].map((e, i) => e ? <div pre-text="" key={i}>{e}</div> : <br />)
                  }</div >
                  <br />
                  {(() => {
                    const count = workSpaceStatus.userList[usrIndx].setting.appearance.clockFormat.length;
                    let txt = "";

                    if (count > 2) txt = "啊 下面這個....不要放太多....會破版....除非你喜歡破版的感覺.....";
                    else if (count <= 0) txt = "啊你的....時鐘呢?";

                    if (txt)
                      return <> <KiloDown.SmallText>{txt}</KiloDown.SmallText><br /><br /></>;
                  })()}
                  <SettingEditor.ListEditor
                    list={workSpaceStatus.userList[usrIndx].setting.appearance.clockFormat}
                    onChange={(e) => {
                      setWorkSpaceStatus(prev => {
                        const _ = cloneDeep(prev);
                        _.userList[usrIndx].setting.appearance.clockFormat = e;
                        return _
                      })
                    }}
                    children={(child) => <div className={style["ListEditor"]}>
                      <div className={style["list"]}>
                        {child.items.map((e, i) => <div className={style["item"]}>
                          <input type="text" kiase-sty="" value={e.data} onChange={t => e.ops.update(t.currentTarget.value)} />

                          <button kiase-sty="" non-pad="" onClick={() => e.ops.moveUp()}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M331-384q-8.1 0-13.05-5.4Q313-394.8 313-402q0-1 5.88-12.77L461-557q4-4 9-6t10-2q5 0 10 2t9 6l142.12 142.19q2.94 2.95 4.41 6.38Q647-405 647-401.5q0 7-4.95 12.25T629-384H331Z" /></svg>
                          </button>

                          <button kiase-sty="" non-pad="" onClick={() => e.ops.moveDown()}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M461-403 318.88-545.19q-2.94-2.95-4.41-6.38Q313-555 313-558.5q0-7 4.95-12.25T331-576h298q8.1 0 13.05 5.4Q647-565.2 647-558q0 1-5.88 12.77L499-403q-4 4-9 6t-10 2q-5 0-10-2t-9-6Z" /></svg>
                          </button>

                          <button kiase-sty="" non-pad="" onClick={() => e.ops.duplicate()}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M360-240q-29.7 0-50.85-21.15Q288-282.3 288-312v-480q0-29.7 21.15-50.85Q330.3-864 360-864h384q29.7 0 50.85 21.15Q816-821.7 816-792v480q0 29.7-21.15 50.85Q773.7-240 744-240H360Zm0-72h384v-480H360v480ZM216-96q-29.7 0-50.85-21.15Q144-138.3 144-168v-516q0-15.3 10.29-25.65Q164.58-720 179.79-720t25.71 10.35Q216-699.3 216-684v516h420q15.3 0 25.65 10.29Q672-147.42 672-132.21t-10.35 25.71Q651.3-96 636-96H216Zm144-216v-480 480Z" /></svg>
                          </button>

                          <button kiase-sty="" non-pad="" onClick={() => e.ops.remove()}>
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M480-429 316-265q-11 11-25 10.5T266-266q-11-11-11-25.5t11-25.5l163-163-164-164q-11-11-10.5-25.5T266-695q11-11 25.5-11t25.5 11l163 164 164-164q11-11 25.5-11t25.5 11q11 11 11 25.5T695-644L531-480l164 164q11 11 11 25t-11 25q-11 11-25.5 11T644-266L480-429Z" /></svg>
                          </button>
                        </div>)}
                      </div >
                      <button kiase-sty="" non-pad="" onClick={() => child.addItem("-mm-")}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M444-444H276q-15.3 0-25.65-10.29Q240-464.58 240-479.79t10.35-25.71Q260.7-516 276-516h168v-168q0-15.3 10.29-25.65Q464.58-720 479.79-720t25.71 10.35Q516-699.3 516-684v168h168q15.3 0 25.65 10.29Q720-495.42 720-480.21t-10.35 25.71Q699.3-444 684-444H516v168q0 15.3-10.29 25.65Q495.42-240 480.21-240t-25.71-10.35Q444-260.7 444-276v-168Z" /></svg>
                      </button>
                    </div >}
                  />


                </>
              }
              case "theme": {
                const [newColor, setNewColor] = useState<string>("#ffffff")
                const [colorList, setColorList] = useState<string[]>([])

                useEffect(() => {
                  (async () => {

                    const wallpaperUrl = workSpaceStatus.userList[usrIndx].setting.appearance.wallpaper.url!;

                    const out = await LABS_E621_API.other.proxy({ url: wallpaperUrl });

                    setColorList(out)
                  })()

                }, [workSpaceStatus.userList[usrIndx].setting.appearance.wallpaper])

                useEffect(() => {
                  setNewColor(workSpaceStatus.userList[usrIndx].setting.appearance.color)
                }, [])

                return <>
                  <div>懶惰寫界面 先這樣吧 凑合著用</div>
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.currentTarget.value)} />
                  <button kiase-sty="" onClick={() => setWorkSpaceStatus((e) => {
                    const _ = cloneDeep(e)

                    _.userList[usrIndx].setting.appearance.color = newColor;
                    _app.setColor(newColor)

                    return _
                  })}>{"apply"}</button>
                  <br />
                  {colorList}

                </>
              }
              case "wallpaper": {
                const [bgCfg, setBgCfg] = useState<workSpaceType.Unit.BaseItem.Image>({
                  url: ""
                })

                useEffect(() => {
                  setBgCfg(workSpaceStatus.userList[usrIndx].setting.appearance.wallpaper)
                }, [workSpaceStatus])

                const updateVal = (key: keyof workSpaceType.Unit.BaseItem.Image, val: number) => {
                  setBgCfg(prev => ({
                    ...prev,
                    [key]: val
                  }))
                }

                return <div className={style["Wallpaper"]}>
                  <div className={style["positionSet"]}>
                    <div className={style["frame"]}>
                      <div
                        className={style["image"]}
                        onDragOver={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add(style["ondrag"])
                        }}

                        onDragLeave={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove(style["ondrag"])
                        }}

                        onDrop={e => {
                          if (!e.dataTransfer) return;
                          e.preventDefault();
                          e.stopPropagation();

                          const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

                          if (itemdata) {
                            const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
                            const { data, type } = item
                            if (type === "post" || type === "postImg") {
                              someActions.setAsWallpaper(usrIndx, data.file.url!, data)
                              setBgCfg({
                                url: data.file.url!,
                                positionX: 50,
                                positionY: 50,
                                fromPost: data
                              })
                            }
                          }

                          e.currentTarget.classList.remove(style["ondrag"])
                        }}
                      >
                        <Background bg={bgCfg} />
                        <div className={style["dragOverlay"]}>
                          <span>{t("setting.Appearance.wallpaper.set", usrIndx)}</span>
                        </div>
                      </div>
                      <div className={style["position"]}>
                        <div>
                          <span>{"X:"}</span>
                          <div>
                            <input
                              kilo-style=""
                              type="range"
                              step={.5}
                              max={100}
                              min={0}
                              kiase-sty=""
                              value={bgCfg.positionX ?? 50}
                              onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                            />
                          </div>
                          <input
                            type="number"
                            kiase-sty=""
                            step={.5}
                            max={100}
                            min={0}
                            value={bgCfg.positionX ?? 50}
                            onChange={(e) => updateVal("positionX", +e.currentTarget.value)}
                          />
                        </div>

                        <div>
                          <span>{"Y:"}</span>
                          <div>
                            <input
                              kilo-style=""
                              type="range"
                              step={.5}
                              max={100}
                              min={0}
                              kiase-sty=""
                              value={bgCfg.positionY ?? 50}
                              onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                            />
                          </div>
                          <input
                            type="number"
                            kiase-sty=""
                            step={.5}
                            max={100}
                            min={0}
                            value={bgCfg.positionY ?? 50}
                            onChange={(e) => updateVal("positionY", +e.currentTarget.value)}
                          />
                        </div>

                        <div>
                          <span>{"S:"}</span>
                          <div>
                            <input
                              kilo-style=""
                              type="range"
                              step={.5}
                              max={500}
                              min={100}
                              kiase-sty=""
                              value={bgCfg.scale ?? 100}
                              onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                            />
                          </div>
                          <input
                            type="number"
                            kiase-sty=""
                            step={.5}
                            max={500}
                            min={100}
                            value={bgCfg.scale ?? 100}
                            onChange={(e) => updateVal("scale", +e.currentTarget.value)}
                          />
                        </div>
                      </div>

                      <button kiase-sty="" onClick={() => setWorkSpaceStatus(e => {
                        const _ = cloneDeep(e);
                        _.userList[usrIndx].setting.appearance.wallpaper = bgCfg
                        return _
                      })}>{t("setting.Appearance.wallpaper.apply", usrIndx)}</button>
                      <button
                        kiase-sty=""
                        onClick={() => someActions.openWithGetByID(bgCfg.fromPost!)}
                        draggable={true}
                        onDragStart={(e) => {
                          dragItem(e, {
                            type: "post",
                            data: bgCfg.fromPost!
                          });
                        }}
                      >{t("setting.Appearance.wallpaper.source", usrIndx)}</button>
                    </div>
                  </div>
                </div>
              }
            }
          }
          case "information": {
            switch (nowPage.pages) {
              case "general": {

                return <div className={style["Information"]}>
                  <div className={style["Background"]}>
                    <NODATA.Fetching />
                  </div>
                  <div className={style["Text"]}>
                    <div className={style["Frame"]}>
                      <h1>E621 App</h1>
                      <h2>inDev 0.0.2</h2>
                      <h3>{navigator.appVersion}</h3>

                      <br />

                      <h2>
                        {t("setting.Information.general.line.1", usrIndx).map((e: string) => <>{e}<br /></>)}
                      </h2>

                      <br />

                      <h4>
                        {t("setting.Information.general.line.2", usrIndx).map((e: string) => <>{e}<br /></>)}
                        <br />
                        <br />
                        <a href="https://github.com/kiasenolo/E621-App/" kilo-style="" target="_blank">{t("setting.Information.general.repoLink", usrIndx)}</a>
                      </h4>
                    </div>
                    <br />
                    <button kiase-sty="" onClick={() => functions.download(functions.toBase64(JSON.stringify(workSpaceStatus)), "Default.wss")}>Save</button>
                    <button kiase-sty="" onClick={() => {
                      newInput.message(
                        "會覆蓋掉你的所有東西",
                        [{ name: "先不要", value: "" }, { name: "行", value: "ok", key: "Enter" }],
                        async (e) => {
                          if (e !== "ok") return;
                          const inp = document.createElement("input")
                          inp.type = "file"; inp.accept = ".wss"; inp.click();
                          inp.onchange = (ev) => {
                            const files = (ev.target as HTMLInputElement).files;
                            if (files && files[0]) {
                              const reader = new FileReader();
                              reader.onload = (loadEv) => {
                                try {
                                  setWorkSpaceStatus(JSON.parse(functions.fromBase64(loadEv.target?.result?.toString() ?? "{}")));
                                } catch (err) { console.error("Import failed", err); newInput.message("Import Failed"); }
                              };
                              reader.readAsText(files[0]);
                            }
                          }
                        }
                      )
                    }}>Inmport</button>
                  </div>
                </div>
              }
            }
          }
        }
      }

      return <Page>
        {NowPage()}
      </Page>
    }, []);

    const SettingAndList = useCallback(({ nowPage }: PageBtn) => {
      if (nowPage === "NONE") return "none :p"
      return <div className={style["frame"]}>
        <PageButtonsList nowPage={nowPage} />
        <Pages nowPage={nowPage} key={nowPage.pages} />
      </div>
    }, [Pages, PageButtonsList])

    return (
      <WINDOW_FRAME className={
        [
          style["Setting"],
          nowPage !== "NONE" && style["inSetting"]
        ].join(" ")
      } menulist={
        [
          windowAction(windowID),
          [
            t("menuButton.top.Category", usrIndx),
            [[
              t("setting.Home", usrIndx),
              () => setNowPage("NONE")
            ],
            ...settingTabs.categorieList.map(e => [tCategory(e), () => {
              setNowPage({
                categorie: e,
                pages: settingTabs.pageList[e]![0] as any
              })
            }]) as MenuAction.Item[]
            ]
          ],
          ...(nowPage !== "NONE" ?
            [[
              t("menuButton.top.Tab", usrIndx),
              settingTabs.pageList[nowPage.categorie].map(e => [tPage(nowPage.categorie, e), () => {
                setNowPage({
                  categorie: nowPage.categorie,
                  pages: e as any
                })
              }])
            ]]
            : []) as MenuButtonType[]
        ]}>
        <div className={style["home"]}>
          {(
            [
              [
                "search",
                <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>
              ],
              [
                "account",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M222-255q63-44 125-67.5T480-346q71 0 133.5 23.5T739-255q44-54 62.5-109T820-480q0-145-97.5-242.5T480-820q-145 0-242.5 97.5T140-480q0 61 19 116t63 109Zm257.81-195q-57.81 0-97.31-39.69-39.5-39.68-39.5-97.5 0-57.81 39.69-97.31 39.68-39.5 97.5-39.5 57.81 0 97.31 39.69 39.5 39.68 39.5 97.5 0 57.81-39.69 97.31-39.68 39.5-97.5 39.5Zm.66 370Q398-80 325-111.5t-127.5-86q-54.5-54.5-86-127.27Q80-397.53 80-480.27 80-563 111.5-635.5q31.5-72.5 86-127t127.27-86q72.76-31.5 155.5-31.5 82.73 0 155.23 31.5 72.5 31.5 127 86t86 127.03q31.5 72.53 31.5 155T848.5-325q-31.5 73-86 127.5t-127.03 86Q562.94-80 480.47-80Zm-.47-60q55 0 107.5-16T691-212q-51-36-104-55t-107-19q-54 0-107 19t-104 55q51 40 103.5 56T480-140Zm0-370q34 0 55.5-21.5T557-587q0-34-21.5-55.5T480-664q-34 0-55.5 21.5T403-587q0 34 21.5 55.5T480-510Zm0-77Zm0 374Z" /></svg>
              ],
              [
                "download",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M479.87-325q-5.87 0-10.87-2-5-2-10-7L308-485q-9-9.27-8.5-21.64.5-12.36 9.11-21.36 9.39-9 21.89-9t21.5 9l98 99v-341q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v341l99-99q8.8-9 20.9-8.5 12.1.5 21.49 9.5 8.61 9 8.61 21.5t-9 21.5L501-334q-5 5-10.13 7-5.14 2-11 2ZM220-160q-24 0-42-18t-18-42v-113q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v113h520v-113q0-12.75 8.68-21.38 8.67-8.62 21.5-8.62 12.82 0 21.32 8.62 8.5 8.63 8.5 21.38v113q0 24-18 42t-42 18H220Z" /></svg>
              ],
              [
                "appearance",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M583-40H440q-14.45 0-24.23-9.78Q406-59.55 406-74v-250q0-14.45 9.77-24.23Q425.55-358 440-358h41v-133H140q-24.75 0-42.37-17.63Q80-526.25 80-551v-193q0-24.75 17.63-42.38Q115.25-804 140-804h83v-42q0-14.45 9.77-24.22Q242.55-880 257-880h509q14.45 0 24.22 9.78Q800-860.45 800-846v152q0 14.45-9.78 24.22Q780.45-660 766-660H257q-14.45 0-24.23-9.78Q223-679.55 223-694v-50h-83v193h341q24.75 0 42.38 17.62Q541-515.75 541-491v133h42q14.45 0 24.22 9.77Q617-338.45 617-324v250q0 14.45-9.78 24.22Q597.45-40 583-40Zm-117-60h91v-198h-91v198ZM283-720h457v-100H283v100Zm183 620h91-91ZM283-720v-100 100Z" /></svg>
              ],
              [
                "information",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M483.18-280q12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-180q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v180q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63Zm-3.2-314q14.02 0 23.52-9.2T513-626q0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2Zm.29 514q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z" /></svg>
              ],
            ] as [("search" | "account" | "download" | "appearance" | "information"), JSX.Element][]).map((e, i) =>
              <button
                key={i}
                className={[showIndex && style["displayIndex"]].join(" ")}
                onClick={() => {
                  setNowPage({
                    categorie: e[0],
                    pages: settingTabs.pageList[e[0]][0] as any
                  })
                }}>
                <div className={style["icon"]}>{e[1]}</div>
                <div className={style["index"]}>{i + 1}</div>
                <div className={style["name"]}>{tCategory(e[0])}</div>
              </button>)
          }

        </div>
        <div className={style["setting"]}>
          {nowPage === "NONE" ? "none :p" : <SettingAndList nowPage={nowPage} key={nowPage.categorie} />}
          <div className={[style["tabs"], showTabs && style["display"]].join(" ")}>
            <div className={style["list"]}>
              {settingTabs.categorieList.map((e, i) => <span
                className={[
                  style["cart"],
                  nowPage === "NONE" ? "" : e === nowPage.categorie ? style["activ"] : ""
                ].join(" ")}
                onMouseEnter={() => { setNowPage({ categorie: e, pages: settingTabs.pageList[e][0] as any }) }}
                key={i}
              >
                {tCategory(e)}
              </span>)}
            </div>
          </div>
        </div>
      </WINDOW_FRAME >
    )
  },
  tmpList: function () {
    const windowID = "tmp-list"
    const thisWindow = wmRef.current?.getWindow(windowID);

    const [start, setStart] = useState<boolean>(false)

    const eRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      thisWindow?.setTitle(t("windowsType.tmpList", usrIndx))
    }, [])

    useEffect(() => {
      void eRef.current!.clientHeight
      setStart(true)
    }, [])

    return (
      <WINDOW_FRAME className={style["tmpList"]} menulist={[
        windowAction(windowID),
        [
          t("menuButton.top.Data", usrIndx),
          [
            [
              t("menuButton.ClearAll", usrIndx),
              () => {
                newInput.message("確定清空暫存列表？？", [
                  { name: "確定", value: "yes", key: "Enter" },
                  { name: "先等等", value: "" },
                ], (e) => {
                  if (e === "yes") {
                    setTimeout(() => {

                      newInput.message("你裏面存的東西都會無欸", [
                        { name: "那就無吧", value: "yes", key: "Delete" },
                        { name: "啊？那算了", value: "" },
                      ], (e) => {
                        if (e === "yes") {
                          setWorkSpaceStatus(prev => {
                            const _ = cloneDeep(prev)
                            _.userList[usrIndx].saves.tmpList = []
                            return _
                          })
                        }
                      })

                    }, .5e3);
                  }
                })
              }
            ]
          ]
        ]
      ]}>
        <div
          className={[style["list"], start ? style["START"] : ""].join(" ")}
          ref={eRef}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => {
            if (!e.dataTransfer) return;
            e.preventDefault();
            e.stopPropagation();

            const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

            if (itemdata) {
              const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
              const { data, type } = item
              if (type === "post") {
                const id = data.id;
                someActions.saveToTmp(usrIndx, {
                  type: "postGetByID",
                  data: {
                    currentId: data.id,
                    status: "success",
                    fetchedPost: data
                  }
                }, `Post Get By ID [ ${data.id} ]`, `post_get_by_id-${data.id}`)
              } else if (type === "postSearch") {
                someActions.saveToTmp(usrIndx, { type: "postSearch", data: item.data }, item.thisWindow!.title, item.thisWindow!.id)
              } else if (type === "pool") {
                someActions.saveToTmp(usrIndx, { type: "pool", data: item.data }, item.thisWindow!.title, item.thisWindow!.id)
              } else if (type === "tag") {
                if (data.action === "=") {
                  const createAt = new Date().getTime()
                  someActions.saveToTmp(usrIndx,
                    {
                      type: "postSearch",
                      data: {
                        nowPage: 1,
                        pageCache: [],
                        searchTags: [data.tag]
                      }
                    }
                    , `Post Search [ ${data.tag} ]`, `post_search-${createAt}`)
                }
              }
            }
          }}
        >
          {workSpaceStatus.userList[usrIndx].saves.tmpList.map((item, index) => {
            const baseDely = index * .05
            return <div
              key={item.createAt}
              className={style["item"]}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              style={{
                transitionDelay: `${baseDely}s`
              }}
              onDrop={e => {
                if (!e.dataTransfer) return;
                if (item.data.type !== "postSearch") return;
                e.preventDefault();
                e.stopPropagation();

                const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

                if (itemdata) {
                  const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
                  const { data, type } = item
                  if (type === "tag") {
                    if (data.action === "+") {
                      setWorkSpaceStatus(prev => {
                        const _ = cloneDeep(prev)

                        _.userList[usrIndx].saves.tmpList = _.userList[usrIndx].saves.tmpList
                          .map((item, i) => {
                            if (i !== index) return item;
                            if (item.data.type !== "postSearch") return item;
                            let searchTags = [...item.data.data.searchTags]
                            if (searchTags.some(e => e === "-" + data.tag)) {
                              searchTags = searchTags.filter(e => e !== "-" + data.tag)
                            } else if (searchTags.some(e => e === data.tag)) {
                              return item
                            } else {
                              searchTags.push(data.tag)
                            };

                            return {
                              createAt: item.createAt,
                              windowId: item.windowId,
                              windowTitle: `Post Search [ ${searchTags.join(",")} ]`,
                              data: {
                                type: "postSearch",
                                data: {
                                  nowPage: 1,
                                  pageCache: [],
                                  searchTags: searchTags
                                },
                                note: item.data.note
                              }
                            }
                          })

                        return _
                      })
                    } else if (data.action === "-") {
                      setWorkSpaceStatus(prev => {
                        const _ = cloneDeep(prev)

                        _.userList[usrIndx].saves.tmpList = _.userList[usrIndx].saves.tmpList
                          .map((item, i) => {
                            if (i !== index) return item;
                            if (item.data.type !== "postSearch") return item;
                            let searchTags = [...item.data.data.searchTags]
                            if (searchTags.some(e => e === data.tag)) {
                              searchTags = searchTags.filter(e => e !== data.tag)
                            } else if (searchTags.some(e => e === "-" + data.tag)) {
                              return item
                            } else {
                              searchTags.push("-" + data.tag)
                            };

                            return {
                              createAt: item.createAt,
                              windowId: item.windowId,
                              windowTitle: `Post Search [ ${searchTags.join(",")} ]`,
                              data: {
                                type: "postSearch",
                                data: {
                                  nowPage: 1,
                                  pageCache: [],
                                  searchTags: searchTags
                                },
                                note: item.data.note
                              }
                            }
                          })

                        return _
                      })
                    }
                  }
                }
              }}
            >
              <div className={style["main"]}>
                <div className={style["info"]}>
                  <div className={style["title"]}>
                    {item.windowTitle}
                  </div>
                  <div className={style["createAt"]}>
                    {`Create at // ${cnvFormat.clock(item.createAt, "-YY- -MM- -dd- :HH:::mm:::ss:")}`}
                    <br />
                    <span style={{ fontSize: "0.8em", opacity: 0.7 }}>ID: {item.windowId}</span>
                  </div>
                </div>
                <div className={style["buttons"]}>
                  {
                    ([
                      [
                        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px"><path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740h-7.34q-14.16 0-23.75-9.62-9.58-9.61-9.58-23.83 0-14.22 9.58-23.72 9.59-9.5 23.75-9.5H352q0-14.33 9.58-23.83 9.59-9.5 23.75-9.5h189.34q14.16 0 23.75 9.58 9.58 9.59 9.58 23.75h158.67q14.16 0 23.75 9.62 9.58 9.62 9.58 23.83 0 14.22-9.58 23.72-9.59 9.5-23.75 9.5h-7.34v553.33q0 27.5-19.58 47.09Q720.17-120 692.67-120H267.33Zm425.34-620H267.33v553.33h425.34V-740Zm-425.34 0v553.33V-740ZM480-414.67l89.33 90q10.34 10.34 25.34 10.67 15 .33 25.33-10.33 10.33-10.67 10.33-25.34 0-14.66-10.33-25l-89.33-90.66L620-556q10.33-10.33 10.33-25T620-606q-10.33-10.33-25.33-10.33-15 0-25.34 10.33L480-516l-88.67-90Q381-616.33 366-616.33q-15 0-25.33 10.33-10.34 10.33-10.34 25.33 0 15 10.34 25.34l89.33 90-89.33 90Q330.33-365 330.33-350q0 15 10.34 25.33Q351-314.33 366-314.33q15 0 25.33-10.34l88.67-90Z" /></svg>,
                        () => {
                          setWorkSpaceStatus(prev => {
                            const _ = cloneDeep(prev)
                            const list = cloneDeep(_.userList[usrIndx].saves.tmpList)
                            _.userList[usrIndx].saves.tmpList = list.filter(_item => {
                              return _item.createAt !== item.createAt
                            })
                            return _
                          })
                        }
                      ],
                      [
                        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px"><path d="M378-524q16.33-21.33 44.67-34.67Q451-572 481.33-572q58 0 96 38t38 96q0 58-38 96.33-38 38.34-96 38.34-39.33 0-71.16-19-31.84-19-49.5-50-5.34-9-15.5-12.5-10.17-3.5-19.17 1.5-10.67 5-13.83 15.83-3.17 10.83 2.5 20.5 24.66 44.67 68.33 70.5t98.33 25.83q78 0 132.67-54.66Q668.67-360 668.67-438q0-78-54.67-132.67-54.67-54.66-132.67-54.66-42.66 0-78.33 17.33t-60.33 42.67v-42q0-10.34-7.17-17.5Q328.33-632 318-632t-17.83 7.17q-7.5 7.16-7.5 17.5v108q0 10.33 7.5 17.83 7.5 7.5 17.83 7.5h109.33q10.34 0 17.5-7.5Q452-489 452-499.33q0-10.34-7.17-17.5-7.16-7.17-17.5-7.17H378ZM226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H533q13.33 0 25.83 5.33 12.5 5.34 21.5 14.34l200 200q9 9 14.34 21.5Q800-626.33 800-613v466.33q0 27-19.83 46.84Q760.33-80 733.33-80H226.67Zm0-66.67h506.66v-464.66l-202-202H226.67v666.66Zm0 0v-666.66V-146.67Z" /></svg>,
                        () => {
                          const targetID = item.windowId || `${item.createAt}`; // 相容舊資料，如果有 windowId 則用它

                          const pureId = targetID.replace(/^(post_search-|post-|post_get_by_id-|pool-)/, "");

                          const getChild = () => {
                            const remountKey = Date.now();

                            switch (item.data.type) {
                              case "postSearch":
                                return <windowsType.postSearch key={remountKey} id={pureId} />;

                              case "post":
                                return <windowsType.post key={remountKey} id={pureId} />;

                              case "postGetByID":
                                return <windowsType.postGetByID key={remountKey} id={pureId} />;

                              case "pool":
                                return <windowsType.pool key={remountKey} id={pureId} />;

                              default:
                                return <></>;
                            }
                          };

                          const wm = wmRef.current;
                          if (!wm) return;

                          if (wm.hasWindowID(targetID)) {
                            wm.updateWindow(targetID, {
                              title: item.windowTitle,
                              customData: item.data,
                              children: getChild()
                            });
                            wm.bringToFront(targetID);
                            Kiasole.log(`Restore Window: ${targetID}`);
                          } else {
                            wm.createWindow({
                              title: item.windowTitle,
                              id: targetID,
                              customData: item.data,
                              children: getChild(),
                            });
                          }
                        }
                      ],
                    ] as [JSX.Element, (() => void)][]).map((e, i) => <button key={i} onClick={e[1]}>{e[0]}</button>)
                  }
                </div>
              </div>
              <div className={style["flash"]}>

                <div
                  className={style["frist"]}
                  style={{
                    transitionDelay: `${baseDely + .05}s`
                  }}
                />

                <div className={style["add"]} />

              </div>
            </div>
          })}
        </div>
      </WINDOW_FRAME >
    )
  }
}

someActions.openWithGetByID = (post) => {
  const windowID = `post_get_by_id-${post.id}`
  const postID = post.id
  if (wmRef.current?.getWindow(windowID))
    wmRef.current.bringToFront(windowID)
  else
    createWindow(wmRef, {
      type: "postGetByID",
      data: {
        currentId: postID,
        status: "success",
        fetchedPost: post
      }
    })
}

someActions.openWithViewer = (post) => {
  const windowID = `viewer-${post.id}`
  if (wmRef.current?.getWindow(windowID))
    wmRef.current.bringToFront(windowID)
  else
    createWindow(wmRef, {
      type: "viewer",
      data: post
    })
}

createWindow = (wmRef, customData, other) => {
  const wm = wmRef.current
  const createAt = new Date().getTime()

  const hasId = (winID: string) => {
    if (wm?.getWindow(winID)) {
      wm?.bringToFront(winID)
      const win = wm?.getWindow(winID)
      win?.setRect({ top: other?.top, left: other?.left }, "px")
      return true
    } else {
      return false
    }
  }

  switch (customData.type) {
    case "setting": {
      const id = `app-setting`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: t("windowsType.setting", usrIndx),
        children: <windowsType.setting />,
        ...other,
        customData,
      });
    }

    case "tmp": {
      const id = `tmp-list`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: t("windowsType.tmpList", usrIndx),
        children: <windowsType.tmpList />,
        ...other,
        customData,
      })
    }
  }


  switch (customData.type) {

    case "postSearch": {
      const id = `post_search-${createAt}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: `${t("windowsType.postSearch", usrIndx)} [ ${createAt} ]`,
        children: <windowsType.postSearch id={`${createAt}`} />,
        ...other,
        customData,
      })
    }

    case "postGetByID": {
      const { data } = customData
      const cId = data.currentId;
      const id = `post_get_by_id-${cId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: `${t("windowsType.postGetByID", usrIndx)} [ ${cId} ]`,
        children: <windowsType.postGetByID id={`${cId}`} />,
        ...other,
        customData,
      })
    }

    case "pool": {
      const { data } = customData
      const pId = data.poolId;
      const id = `pool-${pId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: `${t("windowsType.pool", usrIndx)} [ ${pId} ]`,
        children: <windowsType.pool id={`${pId}`} />,
        ...other,
        customData,
      })
    }

    case "viewer": {
      const { data } = customData;
      const pId = data.id;
      const id = `viewer-${pId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: `${t("windowsType.viewer", usrIndx)} [ ${pId} ]`,
        children: <windowsType.viewer id={`${pId}`} />,
        ...other,
        customData,
      })
    }
  }
};

const Menu = () => {
  const [menuDisplay, setMenuDisplay] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenuAction.Item[]>([]);
  const [menuPosition, setMenuPosition] = useState<[number, number]>([0, 0]);
  const [menuCenter, setMenuCenter] = useState<MenuAction.CenterPoint>("tl");
  const [dragEvent, setDragEvent] = useState<(e?: dragEvent) => void>(() => { });
  const [hoverd, setHoverd] = useState<boolean>(false);

  MenuAction.showMenu = (items: MenuAction.Item[], [top, left], center, onDrag) => {
    setMenuCenter(center ?? "tl")
    setMenuItems(items);
    setMenuPosition([top, left]);
    setMenuDisplay(true);
    setDragEvent(() => (onDrag ?? (() => { })))
  };

  MenuAction.closeMenu = () => {
    setMenuDisplay(false);
    setMenuItems([]);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuDisplay(false);
  };

  useEffect(() => {
    if (hoverd) return

    const clickEvent = () => {
      setMenuDisplay(false)
    }

    const keyEvent = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setMenuDisplay(false)

      }
    }

    window.addEventListener("click", clickEvent)
    window.addEventListener("keydown", keyEvent)
    return () => {
      window.removeEventListener("click", clickEvent)
      window.removeEventListener("keydown", keyEvent)
    }
  }, [hoverd])

  return (
    <div
      className={[style["Menu"], menuDisplay ? "" : style["hide"]].join(" ")}
      onClick={handleBackgroundClick}
      onContextMenu={handleBackgroundClick}
    >
      <div
        className={[style["Buttons"], style[menuCenter]].join(" ")}
        style={{
          top: `${menuPosition[0]}px`,
          left: `${menuPosition[1]}px`,
        }}

        onMouseUp={(e) => {
          e.stopPropagation()
          setMenuDisplay(false)
        }}

        onMouseMove={() => setHoverd(true)}
        onMouseLeave={() => setHoverd(false)}
      >
        {menuItems.map((item, index) => (
          <button
            key={`${index}-${item[0]}`}
            kiase-style=""
            onMouseUp={() => {
              if (item[1]) item[1]();
              setMenuDisplay(false);
            }}
            draggable={item.length === 3}
            onDragStart={(e) => {
              item[2] ? dragItem(e, item[2]) : "";
              setMenuDisplay(false);
              dragEvent();
            }}
          >
            {item[0]}
          </button>
        ))}
      </div>
    </div>
  )
}

const Background = ({ bg }: { bg: workSpaceType.Unit.BaseItem.Image }) => {
  return (
    <div className={style["Background"]}>
      <div className={style["Background"]}>
        <div className={style["Image"]} style={{
          backgroundImage: `url(${bg.url ?? ""})`,
          backgroundPositionX: `${bg.positionX ?? 50}%`,
          backgroundPositionY: `${bg.positionY ?? 50}%`,
          backgroundSize: bg.scale ? bg.scale + "%" : "cover",
          backgroundRepeat: "no-repeat"
        }} />
      </div>
    </div>
  )
}

const Desktop = () => {
  const [background, setBackground] = useState<workSpaceType.Unit.BaseItem.Image>({ url: "" })
  const [mouseIsPress, setMouseIsPress] = useState<boolean>(false)
  const [windowsList, setWindowsList] = useState<{
    id: string;
    title: string;
    customData?: e621Type.defaul | undefined;
  }[]>([])

  const [clock, setClock] = useState<number>(0)

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);
  const originalStatesRef = useRef<Map<string, { isMinimized: boolean, isFocused: boolean }>>(new Map());

  wmRef = useRef<WindowManager<e621Type.defaul> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCancelAreaRef = useRef<HTMLDivElement>(null);

  const [startMenu, setStartMenu] = useState<boolean>(false)

  const [snap, setSnap] = useState<SnapPosition | null>(null)
  const snapElementRef = useRef<HTMLDivElement>(null);

  const applySnapshot = useCallback((snapshot: WindowSnapshot<e621Type.defaul>[]) => {
    const wm = wmRef.current
    if (wm) {
      wm.applySnapshot(
        snapshot,
        (windowId, customData) => {

          if (!customData) return <div>Error: No Data</div>;

          switch (customData.type) {
            case "postSearch":
              const pureId = windowId.replace("post_search-", "");

              return <windowsType.postSearch id={pureId} />;

            case "post":
              return <windowsType.post id={windowId.replace("post-", "")} />;

            case "postGetByID":
              return <windowsType.postGetByID id={windowId.replace("post_get_by_id-", "")} />;

            case "pool":
              return <windowsType.pool id={windowId.replace("pool-", "")} />;

            case "viewer":
              return <windowsType.viewer id={windowId.replace("viewer-", "")} />;

            case "setting":
              return <windowsType.setting />;

            case "tmp":
              return <windowsType.tmpList />;

            default:
              return <div>Unknown Window Type</div>;
          }
        }
      );
    }
  }, [])

  const saveWinStatus = useCallback(() => {
    const wm = wmRef.current
    if (!wm) return;
    _app.clearNotic()
    _app.throwNotic("Windows Status Saved!")
    setWorkSpaceStatus((e) => {
      e.userList[usrIndx].windowsStatus = wm.captureSnapshot()
      return e
    })
  }, [])


  /* 時鐘更新 */
  useEffect(() => {

    const interval = setInterval(() => {
      setClock(new Date().getTime())
    }, 100);

    return () => {
      clearInterval(interval)
    }
  }, [])

  /* 很爛的 Shift Tab */
  useEffect(() => {
    const wm = wmRef.current;
    if (!wm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 觸發條件：Shift + Tab
      if (e.shiftKey && e.code === "Tab") {
        e.preventDefault();

        if (!switcherOpen) {
          // --- 第一次按下：初始化切換器 ---
          const allWindows = wm.getWindows();
          if (allWindows.length === 0) return;

          // 1. 儲存目前的狀態
          const snapshot = new Map();
          allWindows.forEach(win => {
            const instance = wm.getWindow(win.id);
            snapshot.set(win.id, {
              isMinimized: instance?.isMinimized,
              isFocused: instance?.isFocused
            });
            // 2. 全部最小化
            instance?.minimize();
          });
          originalStatesRef.current = snapshot;

          // 3. 設定初始索引 (通常切換到下一個視窗)
          const nextIdx = (switcherIndex + 1) % allWindows.length;
          setSwitcherIndex(nextIdx);
          setSwitcherOpen(true);

          // 4. 聚焦第一個選中的視窗
          wm.getWindow(allWindows[nextIdx].id)?.focus();
        } else {
          // --- 已經在切換中：循環視窗 ---
          const allWindows = wm.getWindows();
          allWindows.forEach(win => {
            const instance = wm.getWindow(win.id);
            instance?.minimize();
          });
          const nextIdx = (switcherIndex + 1) % allWindows.length;

          // 保持其他視窗最小化，聚焦當前選擇的
          wm.getWindow(allWindows[nextIdx].id)?.focus();
          setSwitcherIndex(nextIdx);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 當放開 Shift 鍵時，結束切換
      if (e.key === "Shift" && switcherOpen) {
        const allWindows = wm.getWindows();
        const selectedWinId = allWindows[switcherIndex]?.id;
        const snapshot = originalStatesRef.current;

        // 恢復所有視窗之前的狀態
        allWindows.forEach(win => {
          const prevState = snapshot.get(win.id);
          const instance = wm.getWindow(win.id);

          if (win.id === selectedWinId) {
            // 被選中的視窗：確保它是打開且聚焦的
            instance?.focus();
          } else {
            // 其他視窗：恢復之前的縮放狀態
            if (prevState?.isMinimized) {
              instance?.minimize();
            } else {
              // 如果之前不是縮小的，但現在不是焦點，我們只需要確保它不縮小
              // 但不呼叫 focus() 以免搶走選中視窗的焦點
              // 這裡假設 WindowManager 有 restore 方法或類似邏輯
              // 如果只有 focus 能取消 minimize，那就依賴 snapshot
              if (!prevState?.isMinimized) {
                instance?.focus();
              }
            }
          }
        });

        setSwitcherOpen(false);
        originalStatesRef.current.clear();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [switcherOpen, switcherIndex, windowsList]);

  /* 給Menu用的滑鼠按下去 */
  useEffect(() => {
    if (!mouseIsPress) return

    const clickEvent = () => {
      setMouseIsPress(false)
    }

    document.addEventListener("click", clickEvent)
    return () => {
      document.removeEventListener("click", clickEvent)
    }
  }, [mouseIsPress])

  /* 一些全域的快速鍵 */
  useEffect(() => {
    let keyispress = false

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      if (keyispress) return;

      switch (e.code) {
        case "Escape": {
          keyispress = true
          setStartMenu(false)
        }
      }

      if (e.metaKey && e.ctrlKey) {
        keyispress = true
        setStartMenu(e => !e)
      }
    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [])

  /* 二些全域的快速鍵 */
  useEffect(() => {
    let keyispress = false

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      if (keyispress) return;

      if (e.ctrlKey && (e.code === "KeyQ")) {
        keyispress = true
        windowsList
          .map(e => wmRef.current?.getWindow(e.id)!)
          .filter(e => e.isFocused)[0]?.close();
      }

      if (e.altKey) {
        const win = windowsList
          .map(e => wmRef.current?.getWindow(e.id)!)
          .filter(e => e.isFocused)[0];

        const ev = (e: KeyboardEvent) => {
          keyispress = true
          e.preventDefault()
        }

        switch (e.code) {
          case "ArrowDown": {
            ev(e)
            if (win.isMaximized) {
              win.toggleMaximize();
            } else {
              win.minimize();
            }
            break;
          }

          case "ArrowUp": {
            ev(e)
            if (!win.isMaximized) {
              win.toggleMaximize();
            }
            break;
          }

          case "Comma": {
            ev(e)
            win.minimize();
            break;
          }

          case "ArrowLeft": {
            ev(e)
            if (!win.isMaximized) {
              win.setRect({
                height: 100,
                width: 50,
                left: 0,
                top: 0,
              }, "%");
            }
            break;
          }

          case "ArrowRight": {
            ev(e)
            if (!win.isMaximized) {
              win.setRect({
                height: 100,
                width: 50,
                left: 50,
                top: 0,
              }, "%");
            }
            break;
          }
        }
      }

    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [windowsList])

  /* 桌布更新 */
  useEffect(() => {
    const { setting, saves } = workSpaceStatus.userList[usrIndx]
    const wallpaper = setting.appearance.wallpaper
    setBackground(typeof wallpaper === "number" ? saves.wallpapers[wallpaper] : wallpaper)
    _app.setColor(setting.appearance.color)
  }, [workSpaceStatus]);

  /* 初始化wm */
  useEffect(() => {
    if (containerRef.current && !wmRef.current) {
      wmRef.current = new WindowManager(containerRef.current);
    }
  }, []);

  /* 初始化狀態 */
  useEffect(() => {
    const wm = wmRef.current
    if (wm) {
      if (workSpaceStatus.userList[usrIndx].windowsStatus) {
        applySnapshot(workSpaceStatus.userList[usrIndx].windowsStatus)
        setWindowsList(wm.getWindows())
      }
    }
  }, []);

  /* 語言改了 重開視窗 */
  useEffect(() => {
    const wm = wmRef.current
    if (wm) {
      const wins = wm.captureSnapshot()
      wm.getWindows().forEach(e => wm.getWindow(e.id)?.close())
      setTimeout(() => {
        applySnapshot(wins)
      }, .3e3)
    }
  }, [workSpaceStatus.userList[usrIndx].setting.lang]);

  /* 關是窗前先問你個問題 */
  useEffect(() => {
    const awa = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      saveWinStatus()
    }

    window.addEventListener('beforeunload', awa)

    return () => {
      window.removeEventListener('beforeunload', awa)
    }
  }, [])

  /* 工作列更新 */
  useEffect(() => {
    const wm = wmRef.current
    if (!wm) return;

    const update = () => {
      setWindowsList(wm.getWindows())
    }

    wm.addEventListener("create", update)
    wm.addEventListener("close", update)
    wm.addEventListener("focus", update)
    wm.addEventListener("moveEnd", update)
    wm.addEventListener("resizeEnd", update)
    wm.addEventListener("idupdate", update)

    return () => {
      if (wm) {
        wm.removeEventListener("create", update)
        wm.removeEventListener("close", update)
        wm.removeEventListener("focus", update)
        wm.removeEventListener("moveEnd", update)
        wm.removeEventListener("resizeEnd", update)
        wm.removeEventListener("idupdate", update)
      }
    }
  })

  useEffect(() => {
    const wm = wmRef.current
    if (!wm) return;

    const end = () => setSnap(null);

    const prev = (data: {
      id: string;
      snapPosition: SnapPosition | null;
    }) => {
      setSnap(data.snapPosition)
    };

    wm.addEventListener("snapPreview", prev)
    wm.addEventListener("snapEnd", end)


    return () => {
      if (wm) {
        wm.removeEventListener("snapPreview", prev)
        wm.removeEventListener("snapEnd", end)
      }
    }
  }, [])

  useEffect(() => {
    const wm = wmRef.current
    const snEle = snapElementRef.current
    if (!wm) return;
    if (!snEle) return;
    const { style: sty } = snEle

    const prev = (data: {
      id: string;
      rect?: WindowRect;
    }) => {
      if (snap) return;
      sty.width = data.rect?.width + "%"
      sty.height = data.rect?.height + "%"
      sty.top = data.rect?.top + "%"
      sty.left = data.rect?.left + "%"
    };

    wm.addEventListener("move", prev)

    return () => {
      if (wm) {
        wm.removeEventListener("move", prev)
      }
    }
  }, [snap])

  /* 手動存工作區狀態 啊他會自動幫你存 放心 */
  useEffect(() => {
    const wm = wmRef.current
    let isPress = false

    if (!wm) return;

    const intr = setInterval(saveWinStatus, 300e3)

    const event = (e: KeyboardEvent) => {
      if (isPress) return;
      if (e.ctrlKey && (e.code === "KeyS")) {
        isPress = true
        if (!wm) return;
        e.preventDefault();
        saveWinStatus()
      }
    }
    const up = () => {
      isPress = false
    }

    document.addEventListener("keydown", event)
    document.addEventListener("keyup", up)
    return () => {
      document.removeEventListener("keydown", event)
      document.removeEventListener("keyup", up)
      clearInterval(intr)
    }
  }, [])

  /* TmpList的更新 */
  useEffect(() => {
    const winID = "tmp-list"

    if (wmRef.current?.hasWindowID(winID)) {
      wmRef.current.updateWindow(winID, {
        children: <windowsType.tmpList />
      })
    }
  }, [workSpaceStatus.userList[usrIndx].saves.tmpList])

  /* 全局的拖放 */
  useEffect(() => {
    const dragoverEvent = (e: DragEvent) => e.preventDefault();
    const dropEvent = (e: DragEvent) => {

      if (!e.dataTransfer) return;

      const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)
      const item = e.dataTransfer.items[0]

      if (itemdata) {
        const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
        const { data, type } = item

        const position = {
          left: e.clientX - 400,
          top: e.clientY - 300,
        }

        switch (type) {
          case "post": {
            createWindow(wmRef,
              {
                type: "postGetByID",
                data: {
                  currentId: data.id,
                  status: "success",
                  fetchedPost: data
                }
              }, position)
            break;
          };
          case "postId": {
            createWindow(wmRef,
              {
                type: "postGetByID",
                data: {
                  currentId: data,
                  status: "loading",
                }
              }, position)
            break;
          };
          case "pool": {
            createWindow(wmRef,
              {
                type: "pool",
                data
              }, position)
            break;
          }
          case "poolId": {
            createWindow(wmRef,
              {
                type: "pool",
                data: {
                  poolId: data,
                  nowPage: 1,
                  pageCache: {},
                }
              }, position)
            break;
          }
          case "postSearch": {
            createWindow(wmRef,
              {
                type: "postSearch",
                data
              }, position)
            break;
          };
          case "tag": {
            if (data.action === "=") {
              createWindow(wmRef,
                {
                  type: "postSearch",
                  data: {
                    nowPage: 1,
                    pageCache: [],
                    searchTags: [data.tag],
                  }
                }, position)
            }
            break;
          };
          case "postImg": {
            createWindow(wmRef,
              {
                type: "viewer",
                data: data
              }, position)
            break;
          };
          case "temp": {
            createWindow(wmRef,
              {
                type: "tmp",
              }, position)
            break;
          };
        };
      } else if (item) {
        if (item.kind !== "string") return;

      }
    }
    document.addEventListener("dragover", dragoverEvent)
    document.addEventListener("drop", dropEvent)

    return () => {
      document.removeEventListener("dragover", dragoverEvent)
      document.removeEventListener("drop", dropEvent)
    };
  }, [])

  /* 全局的拖放 but 上面那條 cancel */
  useEffect(() => {
    const area = dragCancelAreaRef.current
    if (!area) return;
    const dragstart = () => area.classList.add(style["activ"]);
    const dragend = () => area.classList.remove(style["activ"]);

    document.addEventListener("dragstart", dragstart);
    document.addEventListener("dragend", dragend);

    return () => {
      document.removeEventListener("dragstart", dragstart);
      document.removeEventListener("dragend", dragend);
    };
  }, [])

  /* AppSetting的更新 */
  useEffect(() => {
    const winID = "app-setting"

    if (wmRef.current?.hasWindowID(winID)) {
      wmRef.current.updateWindow(winID, {
        children: <windowsType.setting />
      })
    }
  },
    [
      workSpaceStatus.userList[usrIndx].setting,
      workSpaceStatus.userList[usrIndx].history,
      workSpaceStatus.userList[usrIndx].saveInfo.user,
    ]
  )

  type menuButtonType = [string, () => void][]

  const onClickEvent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, menu: menuButtonType) => {
    event.stopPropagation()
    event.preventDefault()
    const btn = (event.target as HTMLButtonElement)
    const btnRect = btn.getBoundingClientRect()
    const x = btnRect.top
    const y = btnRect.left + (btnRect.width / 2)
    MenuAction.showMenu(menu, [x, y], "bc")
  }

  const windowAction: (id: string) => menuButtonType = (id) => {
    const win = wmRef.current?.getWindow(id)

    return [
      [t("menuButton.ResetRect", usrIndx).replace("$1", 95), () => { win?.setRect({ width: 95, height: 95, left: 2.5, top: 2.5 }) }],
      [t("menuButton.ResetRect", usrIndx).replace("$1", 90), () => { win?.setRect({ width: 90, height: 90, left: 5, top: 5 }) }],
      [t("menuButton.ResetRect", usrIndx).replace("$1", 85), () => { win?.setRect({ width: 85, height: 85, left: 7.5, top: 7.5 }) }],
      [t("menuButton.ResetRect", usrIndx).replace("$1", 80), () => { win?.setRect({ width: 80, height: 80, left: 10, top: 10 }) }],
      [t("menuButton.Restore", usrIndx), () => { win?.focus() }],
      [t("menuButton.Close", usrIndx), () => { win?.close() }],
    ]
  }

  /* 寫這坨注解的時候 就是爲了找這個 */
  /* 這個是他媽的 初始化動畫 */
  useEffect(() => {
    (async () => {
      await functions.timeSleep(.5e3)
      document.getElementById(style["Desktop"])?.classList.remove(style["hide"])
    })()
  }, [])

  return (
    <div id={style["Desktop"]} className={style["hide"]} style={{ zoom: `${workSpaceStatus.userList[usrIndx].setting.appearance.scale}%` }}>

      <Menu />

      <div className={style["Buttons"]}>
        <div className={[style["MainArea"], startMenu ? style["startMenu"] : ""].join(" ")}>

          <div className={style["StartMenu"]}>
            <div className={style["Side"]}>
              <div>
                {
                  ([
                    [
                      t("startMenuSide.logout", usrIndx),
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" /></svg>,
                      () => {
                        saveWinStatus()
                        setWorkSpaceStatus(prev => {
                          const _ = cloneDeep(prev)
                          _.autoLogin = false
                          _.rememberPassword = ""
                          return _
                        })
                        setIsLogin(false)
                      }
                    ],
                    [
                      t("startMenuSide.appSetting", usrIndx),
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M433-80q-27 0-46.5-18T363-142l-9-66q-13-5-24.5-12T307-235l-62 26q-25 11-50 2t-39-32l-47-82q-14-23-8-49t27-43l53-40q-1-7-1-13.5v-27q0-6.5 1-13.5l-53-40q-21-17-27-43t8-49l47-82q14-23 39-32t50 2l62 26q11-8 23-15t24-12l9-66q4-26 23.5-44t46.5-18h94q27 0 46.5 18t23.5 44l9 66q13 5 24.5 12t22.5 15l62-26q25-11 50-2t39 32l47 82q14 23 8 49t-27 43l-53 40q1 7 1 13.5v27q0 6.5-2 13.5l53 40q21 17 27 43t-8 49l-48 82q-14 23-39 32t-50-2l-60-26q-11 8-23 15t-24 12l-9 66q-4 26-23.5 44T527-80h-94Zm7-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>,
                      () => createWindow(wmRef, {
                        type: "setting",
                        data: "NONE"
                      })
                    ],
                    [
                      t("startMenuSide.console", usrIndx),
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm187-200-76-76q-12-12-11.5-28t12.5-28q12-11 28-11.5t28 11.5l104 104q12 12 12 28t-12 28L328-308q-11 11-27.5 11.5T272-308q-11-11-11-28t11-28l75-76Zm173 160q-17 0-28.5-11.5T480-320q0-17 11.5-28.5T520-360h160q17 0 28.5 11.5T720-320q0 17-11.5 28.5T680-280H520Z" /></svg>,
                      () => Kiasole.toggle(),
                      true,
                    ],
                  ] as ([string, JSX.Element, () => {}] | [string, JSX.Element, () => {}, boolean])[]).map((e, i) => <button key={i} hover-tips={e[0]} onClick={() => { e[2](); setStartMenu(false) }} style={{ marginTop: e[3] ? "auto" : "" }}>{e[1]}</button>)
                }
              </div>
            </div>

            <div className={style["Buttons"]}>
              {
                ([
                  [
                    t("windowsType.postSearch", usrIndx),
                    <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                    () => {
                      createWindow(wmRef, {
                        type: "postSearch",
                        data: {
                          nowPage: 1,
                          pageCache: [],
                          searchTags: [],
                        }
                      })
                    },
                    {
                      type: "postSearch",
                      data: {
                        nowPage: 1,
                        pageCache: [],
                        searchTags: [],
                      }
                    }
                  ],
                  [
                    t("windowsType.postGetByID", usrIndx),
                    <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                    () => {
                      createWindow(wmRef, {
                        type: "postGetByID",
                        data: {
                          currentId: 5613429,
                          status: "loading",
                        }
                      })
                    },
                    {
                      type: "postId",
                      data: 5613429,
                    }
                  ],
                  [
                    t("windowsType.pool", usrIndx),
                    <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                    () => {
                      createWindow(wmRef, {
                        type: "pool",
                        data: {
                          poolId: 44182,
                          nowPage: 1,
                          pageCache: {},
                        }
                      })
                    },
                    {
                      type: "poolId",
                      data: 44182
                    }
                  ],
                  [
                    t("windowsType.tmpList", usrIndx),
                    <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>,
                    () => {
                      createWindow(wmRef, {
                        type: "tmp"
                      })
                    },
                    {
                      type: "temp",
                    }
                  ],
                ] as ([string, JSX.Element, () => {}, e621Type.DragItemType.defaul] | [string, JSX.Element, () => {}])[]).map((e, i) => <div key={i}
                  style={{
                    transitionDelay: startMenu ? `${(i * .05) + .2}s` : ""
                  }}
                  draggable={e.length === 4}
                  onDragStart={ev => { e[3] ? dragItem(ev, e[3]) : ""; }}
                  onDrag={() => setStartMenu(false)}
                >
                  <button onClick={() => {
                    e[2]()
                    setStartMenu(false)
                  }}>
                    <div className={style["icon"]}>{e[1]}</div>
                    <div className={style["name"]}>
                      <span>
                        {e[0]}
                      </span>
                    </div>
                  </button>
                </div>
                )
              }
            </div>
          </div>

          <div className={style["SnapPreview"]}>
            <div
              ref={snapElementRef}
              style={(() => {
                switch (snap) {

                  case "top": return {
                    width: "100%",
                    height: "100%",
                    left: "0",
                    top: "0",
                  }

                  case "left": return {
                    width: "50%",
                    height: "100%",
                    left: "0",
                    top: "0",
                  }

                  case "right": return {
                    width: "50%",
                    height: "100%",
                    left: "50%",
                    top: "0",
                  }

                  case "top-left": return {
                    width: "50%",
                    height: "50%",
                    left: "0",
                    top: "0",
                  }

                  case "top-right": return {
                    width: "50%",
                    height: "50%",
                    left: "50%",
                    top: "0",
                  }

                  case "bottom-left": return {
                    width: "50%",
                    height: "50%",
                    left: "0",
                    top: "50%",
                  }

                  case "bottom-right": return {
                    width: "50%",
                    height: "50%",
                    left: "50%",
                    top: "50%",
                  }

                  case null: return {
                    opacity: 0
                  }

                }
              })()}
            />
          </div>

          <div className={style["Windows"]} ref={containerRef}></div>

          <div className={style["CancelDrag"]}>
            <div className={style["main"]} ref={dragCancelAreaRef}>
              <div className={style["bg"]} />

              <div className={style["btn"]}>
                <div
                  className={style["area"]}
                  onDragEnter={e => { e.currentTarget.classList.add(style["activ"]) }}
                  onDragLeave={e => { e.currentTarget.classList.remove(style["activ"]) }}
                  onDrop={e => { e.currentTarget.classList.remove(style["activ"]); StopEvent(e) }}
                >
                  <span>{t("Desktop.drag.Cancel", usrIndx)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
        <div className={style["Bar"]}>
          <div className={style["Left"]}>
            <Button onDrop={e => { e.preventDefault(); e.stopPropagation(); }} status={startMenu ? "isOpen" : "icon"} title={t("taskBar.startMenu", usrIndx)} onClick={() => setStartMenu(e => !e)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z" /></svg>
            </Button>
          </div>
          <div className={style["List"]} overflow-bar-none="">
            {windowsList.map((win) => {
              const thisWindow = wmRef.current?.getWindow(win.id);
              return <Button
                key={win.id}
                status={thisWindow?.isMinimized ? "mini" : thisWindow?.isFocused ? "focus" : "blur"}
                title={win.title}

                onDragEnter={(e) => {
                  if (!e.dataTransfer) return;
                  wmRef.current?.bringToFront(win.id)
                }}

                onMouseEnter={(event) => {
                  if (!mouseIsPress) return
                  onClickEvent(event, windowAction(win.id))
                }}

                onMouseDown={() => {
                  setMouseIsPress(true)
                }}

                onClick={event => {
                  switch (event?.button) {
                    case 0: {
                      if (startMenu) {
                        setStartMenu(false);
                        thisWindow?.focus()
                        return;
                      }

                      if (thisWindow?.isTop) {
                        thisWindow?.minimize()
                      } else {
                        thisWindow?.focus()
                      }

                      return;
                    };
                  };
                }}

                onMouseUp={(event) => {
                  switch (event?.button) {
                    case 1: {
                      thisWindow?.close();
                      setMouseIsPress(false)
                      MenuAction.closeMenu()
                      return;
                    };

                    case 2: {
                      onClickEvent(event, windowAction(win.id))
                      return;
                    };
                  };
                }}

                onMouseMove={(event) => {
                  if (!mouseIsPress) return
                  event.stopPropagation();
                  onClickEvent(event, windowAction(win.id))
                }}

                onContextMenu={e => e.preventDefault()}
              >
                {(() => {
                  const owo = wmRef.current?.getWindow(win.id)

                  switch (owo?.customData?.type) {
                    case "postSearch":
                      return <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M378-329q-108.16 0-183.08-75Q120-479 120-585t75-181q75-75 181.5-75t181 75Q632-691 632-584.85 632-542 618-502q-14 40-42 75l242 240q9 8.56 9 21.78T818-143q-9 9-22.22 9-13.22 0-21.78-9L533-384q-30 26-69.96 40.5Q423.08-329 378-329Zm-1-60q81.25 0 138.13-57.5Q572-504 572-585t-56.87-138.5Q458.25-781 377-781q-82.08 0-139.54 57.5Q180-666 180-585t57.46 138.5Q294.92-389 377-389Z" /></svg>
                    case "post":
                    case "postGetByID":
                      return <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M780-120H180q-24.75 0-42.37-17.63Q120-155.25 120-180v-600q0-24.75 17.63-42.38Q155.25-840 180-840h600q24.75 0 42.38 17.62Q840-804.75 840-780v600q0 24.75-17.62 42.37Q804.75-120 780-120Zm-20-143H200v78h560v-78Zm-560-41h560v-78H200v78Zm0-129h560v-327H200v327Zm0 170v78-78Zm0-41v-78 78Zm0-129v-327 327Zm0 51v-51 51Zm0 119v-41 41Z" /></svg>
                    case "setting":
                      return <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M421-80q-14 0-25-9t-13-23l-15-94q-19-7-40-19t-37-25l-86 40q-14 6-28 1.5T155-226L97-330q-8-13-4.5-27t15.5-23l80-59q-2-9-2.5-20.5T185-480q0-9 .5-20.5T188-521l-80-59q-12-9-15.5-23t4.5-27l58-104q8-13 22-17.5t28 1.5l86 40q16-13 37-25t40-18l15-95q2-14 13-23t25-9h118q14 0 25 9t13 23l15 94q19 7 40.5 18.5T669-710l86-40q14-6 27.5-1.5T804-734l59 104q8 13 4.5 27.5T852-580l-80 57q2 10 2.5 21.5t.5 21.5q0 10-.5 21t-2.5 21l80 58q12 8 15.5 22.5T863-330l-58 104q-8 13-22 17.5t-28-1.5l-86-40q-16 13-36.5 25.5T592-206l-15 94q-2 14-13 23t-25 9H421Zm15-60h88l14-112q33-8 62.5-25t53.5-41l106 46 40-72-94-69q4-17 6.5-33.5T715-480q0-17-2-33.5t-7-33.5l94-69-40-72-106 46q-23-26-52-43.5T538-708l-14-112h-88l-14 112q-34 7-63.5 24T306-642l-106-46-40 72 94 69q-4 17-6.5 33.5T245-480q0 17 2.5 33.5T254-413l-94 69 40 72 106-46q24 24 53.5 41t62.5 25l14 112Zm44-210q54 0 92-38t38-92q0-54-38-92t-92-38q-54 0-92 38t-38 92q0 54 38 92t92 38Zm0-130Z" /></svg>

                  }
                })()}
              </Button>
            })}


          </div>
          <div className={style["Right"]}>
            {workSpaceStatus.userList[usrIndx].setting.appearance.clockFormat.map((e, i) => <div>{cnvFormat.clock(clock, e)}</div>)}
          </div>
        </div>
      </div>

      <Background bg={background} />

    </div >
  )
}

const Login = () => {
  const [selectUser, setSelectUser] = useState<number>(0)
  const [newAccount, setNewAccount] = useState<boolean>(false)
  const [pendingLoginIndex, setPendingLoginIndex] = useState<number | null>(null);

  const cfmPassRef = useRef<string>("")
  const newAccInfoRef = useRef<EmptyAccountOption>({
    name: "",
    id: ""
  })

  useEffect(() => {
    if (workSpaceStatus.userList.length === 0) {
      setSelectUser(-1)
      setNewAccount(true)
      return;
    }

    setSelectUser(workSpaceStatus.lastUser ?? 0)
  }, [])

  const login = useCallback((passKey: string, usr?: number) => {
    const targetIndex = usr ?? selectUser;
    const user = workSpaceStatus.userList[targetIndex];
    const psKy = user.saveInfo.user.passKey;

    const isPassCorrect = psKy ? (psKy === passKey) : true;

    if (isPassCorrect) {
      setIsLogin(true)

      usrIndx = targetIndex

      setWorkSpaceStatus(e => {
        const _ = cloneDeep(e)

        _.lastUser = targetIndex
        _.autoLogin = true

        if (_.autoLogin) {
          _.rememberPassword = passKey
        } else {
          _.rememberPassword = ""
        }

        return _
      })
    } else {
    }
  }, [selectUser, workSpaceStatus])

  useEffect(() => {
    if (pendingLoginIndex !== null && workSpaceStatus.userList[pendingLoginIndex]) {

      cfmPassRef.current = "";
      newAccInfoRef.current = {
        name: "",
        id: ""
      };

      login(cfmPassRef.current, pendingLoginIndex);

      setPendingLoginIndex(null);
    }
  }, [workSpaceStatus.userList, pendingLoginIndex, login])

  const createAccount = useCallback(() => {
    const newAcc = newAccInfoRef.current;
    const cfmPass = cfmPassRef.current;

    if (!newAcc.id) {
      Kiasole.error("您的ID是跟您的良心一樣 被吃了是嗎？")
      return;
    }

    if (workSpaceStatus.userList.some(e => newAcc.id === e.saveInfo.id)) {
      Kiasole.error("有人用過這個ID了")
      return;
    }

    if (!newAcc.password && !cfmPass) {
      Kiasole.error("哦行 空密碼賬號")
    } else if (newAcc.password !== cfmPass) {
      Kiasole.error("你的密碼錯的 兩邊不一樣啊")
      return;
    }

    const newIndex = workSpaceStatus.userList.length;

    setWorkSpaceStatus(prev => {
      const _ = cloneDeep(prev)
      _.userList.push(EmptyAccount(newAcc))
      return _
    })

    setPendingLoginIndex(newIndex);

  }, [newAccInfoRef, cfmPassRef, workSpaceStatus.userList])

  useEffect(() => {
    if (workSpaceStatus.userList.length === 0) return;
    const { lastUser = 0, autoLogin: auto, rememberPassword: pass, userList } = workSpaceStatus
    const user = userList[lastUser];
    const psKy = user.saveInfo.user.passKey;
    if (auto) {
      if (!psKy || (psKy && psKy === pass)) {

        usrIndx = lastUser

        setSelectUser(lastUser)

        setIsLogin(true)
      }
    }
  }, [])

  useEffect(() => {
    const { lastUser = 0, userList } = workSpaceStatus
    if (!isLogin) {
      _app.setColor("#ffffff")
    } else {
      _app.setColor(userList[lastUser].setting.appearance.color)
    }
  }, [isLogin])

  useEffect(() => {
    (async () => {
      if (!isLogin) {
        await functions.timeSleep(.5e3)
      }
      document.getElementById(style["Login"])?.classList.toggle(style["hide"], isLogin)
    })()
  }, [isLogin])

  useEffect(() => {
    const owo = Array.from(document.getElementsByClassName("passwordInput")) as HTMLInputElement[]
    owo.forEach(e => e.value = "")
  }, [selectUser, isLogin])

  const EmptyUser = useMemo(() => EmptyAccount({ name: "New Account", id: ".w." }), [])

  return (<div id={style["Login"]} className={style["hide"]} >

    <div className={style["UserList"]}>
      <div>
        {
          workSpaceStatus.userList.map((_user, i) => {
            const { user, id } = _user.saveInfo;

            return <button
              key={`${i}_${id}`}
              className={[
                style["User"],
              ].join(" ")}
              style={{ outlineColor: i === selectUser ? _user.setting.appearance.color + "50" : "" }}
              onClick={() => { setSelectUser(i); setNewAccount(false); }}
            >
              <div className={style["Main"]}>

                <div
                  className={style["avatar"]}
                  style={{
                    backgroundImage: `url(${user.avatar.url})`,
                    backgroundPositionX: `${user.avatar.positionX ?? 50}%`,
                    backgroundPositionY: `${user.avatar.positionY ?? 50}%`,
                    backgroundSize: user.avatar.scale ? user.avatar.scale + "%" : "cover",
                    backgroundRepeat: "no-repeat"
                  }}
                />

                <div className={style["name"]} >
                  <span style={{ color: _user.setting.appearance.color }}>{user.name}</span>
                </div>

              </div>

              <div className={style["Background"]} style={{ backgroundColor: _user.setting.appearance.color }} />
            </button>
          })
        }
        <button
          key={`add_acc`}
          className={[
            style["User"],
          ].join(" ")}
          style={{
            outlineColor: -1 === selectUser ? EmptyUser.setting.appearance.color + "50" : "",
            marginTop: "50px",
          }}
          onClick={() => { setSelectUser(-1); setNewAccount(true); }}
        >
          <div className={style["Main"]}>

            <div
              className={style["avatar"]}
              style={{
                backgroundImage: `url(${EmptyUser.saveInfo.user.avatar.url})`,
                backgroundPositionX: `${EmptyUser.saveInfo.user.avatar.positionX ?? 50}%`,
                backgroundPositionY: `${EmptyUser.saveInfo.user.avatar.positionY ?? 50}%`,
                backgroundSize: EmptyUser.saveInfo.user.avatar.scale ? EmptyUser.saveInfo.user.avatar.scale + "%" : "cover",
                backgroundRepeat: "no-repeat"
              }}
            />

            <div className={style["name"]} >
              <span style={{ color: EmptyUser.setting.appearance.color }}>{EmptyUser.saveInfo.user.name}</span>
            </div>

          </div>

          <div className={style["Background"]} style={{ backgroundColor: EmptyUser.setting.appearance.color }} />
        </button>
      </div>
    </div>

    <div className={style["LoginBoard"]}>
      {
        workSpaceStatus.userList.map((_user, i) => {
          const saveInfo = _user.saveInfo
          const user = saveInfo.user
          const { avatar, name } = user
          return <div key={saveInfo.id} className={selectUser === i ? style["show"] : (selectUser > i ? style["up"] : style["down"])}>
            <div
              className={style["avatar"]}
              style={{
                backgroundImage: `url(${avatar.url ?? ""})`,
                backgroundPositionX: `${avatar.positionX ?? 50}%`,
                backgroundPositionY: `${avatar.positionY ?? 50}%`,
                backgroundSize: avatar.scale ? avatar.scale + "%" : "cover",
                backgroundRepeat: "no-repeat"
              }} />

            <div className={style["name"]}>{name}</div>

            {
              user.passKey ?
                <div className={style["input"]}>
                  <input
                    type="password"
                    name={`_LABS/E621-API/ACCOUNT/${saveInfo.id}`}
                    placeholder="Password"
                    className={"passwordInput"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.code === "NumpadEnter") {
                        if (e.currentTarget.value) {
                          login(e.currentTarget.value)
                        }
                      }
                    }}
                  />
                </div>
                :
                <div className={style["button"]}>
                  <button
                    onClick={() => {
                      login("")
                    }}
                  >{"Login"}</button>
                </div>
            }
          </div>
        })
      }
      <div key={"new_account"} className={[selectUser === -1 ? style["show"] : style["hide"], style["createAccount"]].join(" ")}>

        <h1>{"Create Account"}</h1>
        <div className={style["input"]}>
          <input
            type="text"
            placeholder="User Name"
            onInput={(e) => newAccInfoRef.current.name = e.currentTarget.value}
          />
        </div>

        <div className={style["input"]}>
          <input
            type="text"
            placeholder="User ID"
            onInput={(e) => newAccInfoRef.current.id = e.currentTarget.value}
          />
        </div>

        <div className={style["CLIP"]} />

        <div className={style["input"]}>
          <input
            type="password"
            placeholder="Password"
            onInput={(e) => newAccInfoRef.current.password = e.currentTarget.value}
          />
        </div>

        <div className={style["input"]}>
          <input
            type="password"
            placeholder="Password Again"
            onInput={(e) => cfmPassRef.current = e.currentTarget.value}
          />
        </div>

        <div className={style["CLIP"]} />

        <div className={style["input"]}>
          <span>{"Theme Color"}</span>
          <input
            type="color"
            defaultValue="#ffffff"
            onInput={(e) => newAccInfoRef.current.color = e.currentTarget.value}
          />
        </div>

        <div className={style["CLIP"]} />

        <div className={style["button"]}>
          <button
            onClick={() => {
              createAccount()
            }}
          >{"Create"}</button>
        </div>

      </div>

    </div>

    <div className={[style["Backdrop"], newAccount && style["newAccount"]].join(" ")} />

    <div className={style["Backgrounds"]}>
      {workSpaceStatus.userList.map((user, i) => <div
        key={i}
        style={{ opacity: i === selectUser ? "1" : "0" }}
        className={[style["img"],
        selectUser === i ? style["show"] : (selectUser > i ? style["up"] : style["down"])
        ].join(" ")}
      >
        <Background bg={(() => {
          const { setting, saves } = user
          const wallpaper = setting.appearance.wallpaper
          return typeof wallpaper === "number" ? saves.wallpapers[wallpaper] : wallpaper
        })()} />
      </div>)}

      <div
        key={-1}
        style={{ opacity: -1 === selectUser ? "1" : "0" }}
        className={[style["img"],
        selectUser === -1 ? style["show"] : style["hide"],
        ].join(" ")}
      >
        <Background bg={(() => {
          const { setting, saves } = EmptyUser
          const wallpaper = setting.appearance.wallpaper
          return typeof wallpaper === "number" ? saves.wallpapers[wallpaper] : wallpaper
        })()} />
      </div>
    </div>

  </div >)
}

export default function () {
  [workSpaceStatus, setWorkSpaceStatus] = useLocalStorage<workSpaceType.defaul>("_LABS/E621-API/workSpaceStatus", defaultStatus);
  [isLogin, setIsLogin] = useState<boolean>(false);

  useEffect(() => {
    setWorkSpaceStatus(e => {
      const _ = cloneDeep(e)

      const empt = EmptyAccount({ id: "", name: "" })
      _.userList = _.userList.map(e => merge({}, empt, e))

      return _
    })
  }, [])

  return (
    <>
      <div id={style["Frame"]} >

        {!isLogin ? <Login key={usrIndx} /> : <></>}
        {isLogin ? <Desktop key={usrIndx} /> : <></>}

      </div >
    </>
  );
}