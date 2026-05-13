import { useCallback, useEffect, useRef, useState, useMemo, RefObject, ReactNode, MouseEventHandler, Dispatch, SetStateAction, JSX } from "react";
import style from "./style.module.scss";
import winStyle from "@/data/components/Window/style.module.scss";
import { LABS_E621_API } from "@/pages/api/_LABS/E621-API/_API-LIST";
import { defaultWMSettings, SnapPosition, WindowAnchor, WindowInstance, WindowManager, WindowSnapshot, WMSettings } from "@/data/components/Window/WindowManager";
import { _app, Kiasole, newInput } from "@/pages/_app";
import { E621 } from "@/pages/api/_LABS/E621-API/types/e621";
import { Button } from "./components/Button";
import { WindowRect } from "@/data/components/Window/Window";
import { makeQuery } from "@/pages/api/_LABS/E621-API/lib/e621-core";
import { cloneDeep, merge } from "lodash";
import functions from "@/data/module/functions";
import Viewer from "@/data/components/Viewer";
import KiloDown from "@/data/components/KiloDown";
import React from "react";
import Fuse from "fuse.js";
import JSZip from "jszip";
import color from "@/data/module/color";
import * as mathjs from "mathjs";
import BACKGROUND_IMAGE from "./background.png"
import HeadSetting from "@/data/components/HeadSetting";
import PACKAGE_LIST from "@/package.json";
import opfs, { Dirent } from "@/data/module/functions/module/opfs";
import clsx from "clsx";
import useLocalStorage, { SetValue } from "@/data/module/use/LocalStorage";
import Dexie, { Table } from 'dexie';
const fs = opfs.promises

/*
 * 這個 是一個 個人專案
 * 密碼明文存 是十分正常的一件事情
 * 我也知道不安全 只是 現階段 他還在開發
 * 所以 yap 別跟我談加密 別跟我談哈希
 * 別跟我談任何安全性相關的東西 現階段 這個東西不重要
 * 僅個人學習以及使用
 */

let storage = "Main"

const GetNowTime = () => {
  return new Date().getTime()
}
const MakeID = () => {
  return GetNowTime().toString()
}

const langList = {
  "en-us": {

    "IN_DEV.tips": [
      "This project is currently in the development phase.",
      "So I've added a feature to export your entire LocalStorage.",
      "This will stay here until we reach the Stable stage.",
    ],
    "IN_DEV.downloadAgain": "Download Save Again",
    "IN_DEV.save": "Export",
    "IN_DEV.import": "Import",
    "IN_DEV.saveToFolder": "Export to Folder",
    "IN_DEV.importFromFolder": "Import from Folder",
    "IN_DEV.importOld": "Import inDev 0.0.3 Saves",
    "IN_DEV.import.msg": "it will overwrite any thing",
    "IN_DEV.import.yes": "okei",
    "IN_DEV.import.no": "nuh",
    "IN_DEV.exporting": "Exporting",
    "IN_DEV.exportDone": "Export complete",

    "NAME": "English (US)",
    "NOTIC": "Changing the language will restart all windows",

    "ELECTRON.beforeUnload.msg": "Before you quit, wanna save?",
    "ELECTRON.beforeUnload.yes": "Yap",
    "ELECTRON.beforeUnload.no": "Nope",
    "ELECTRON.beforeUnload.cancel": "Cancel",

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
    "menuButton.ViewPost": "View Post",
    "menuButton.SaveToTmp": "Save To Tmp",
    "menuButton.CopyRawJson": "Copy Raw Json",
    "menuButton.CopyFullJSON": "Copy FULL Json",
    "menuButton.CopyID": "Copy ID",
    "menuButton.CopyTagName": "Copy Tag Name",
    "menuButton.CopyURL": "Copy URL",
    "menuButton.CopyImage": "Copy Image",
    "menuButton.DownloadImage": "Download Image",
    "menuButton.DownloadVideo": "Download Video",
    "menuButton.Download": "Download",
    "menuButton.OpenWithPostSearch": "Open With Post Search",
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

    "windowsType.postSearch.title.noTags": "NO TAGS",
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
    "windowsType.preview": "Preview",
    /* viewer */
    "windowsType.viewer.ResetTransform": "Reset Transform",

    "windowsType.viewer.RenderMode": "Render Mode : ",
    "windowsType.viewer.RenderMode.Auto": "Auto",
    "windowsType.viewer.RenderMode.Pixelated": "Pixelated",
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
    "components.post.moreThanOne": "More than one, total $1",

    /* <:components.post: */


    /* >:setting: */

    "setting.Back": "<- Back",
    "setting.Home": "Home",

    /* Search */
    "setting.Search": "Search",

    "setting.Search.general": "General",
    "setting.Search.defaultSearchFilter": "Default Search Filter",


    "setting.Search.tags": "Tags",

    "setting.Search.history": "History",

    "setting.Search.export/import": "Export/Import",


    /* Account */
    "setting.Account": "Account",

    "setting.Account.local": "Local",
    "setting.Account.local.changeUserName": "Your User Name",
    "setting.Account.local.changeUserName.name": "Name",
    "setting.Account.local.changeUserName.nameIsEmpty": "just....give yourself a name....",
    "setting.Account.local.changeUserName.update": "Update",
    "setting.Account.local.changeUserName.restore": "Restore",
    "setting.Account.local.changeUserName.confirm": "your new name is $1 , does that look good?",
    "setting.Account.local.changeUserName.nice": "Nice!",
    "setting.Account.local.changeUserName.no": "wait...let me think again",
    "setting.Account.local.changePassword": "If you want, you can change your password",
    "setting.Account.local.changePassword.current": "Current Password",
    "setting.Account.local.changePassword.new": "New Password",
    "setting.Account.local.changePassword.newAgain": "New Password Again",
    "setting.Account.local.changePassword.update": "Update Password",
    "setting.Account.local.changePassword.remove": "Remove Password",
    "setting.Account.local.changePassword.notic.noMatch": "It doesn't match your current password .w.",
    "setting.Account.local.changePassword.notic.newNoMatch": "The new passwords don't match .w.",
    "setting.Account.local.changePassword.pop.areYouSure": "Are you sure you want to remove your password?",
    "setting.Account.local.changePassword.pop.yes": "Remove it",
    "setting.Account.local.changePassword.pop.no": "Cancel",
    "setting.Account.local.changePassword.pop.hasGone": "Alright, your password is gone",
    "setting.Account.local.changePassword.pop.hasChange": "Alright, has been changed",
    "setting.Account.local.setPassword": "I recommend setting a password",
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

    "setting.Account.avatar": "Avatar",
    "setting.Account.avatar.set": "Set as Avatar",
    "setting.Account.avatar.apply": "Apply",
    "setting.Account.avatar.source": "Picture Source",

    "setting.Account.e621": "E621",
    "setting.Account.e621.title": "E621 Authorization",
    "setting.Account.e621.info": "Leaving it blank might work, but entering the wrong info definitely won't.",
    "setting.Account.e621.inp.name": "Username",
    "setting.Account.e621.inp.key": "API Key",
    "setting.Account.e621.btn.update": "Update",
    "setting.Account.e621.btn.restore": "Restore",
    "setting.Account.e621.msg": "Are you sure this username and token are correct? Remember to double-check.",
    "setting.Account.e621.msg.yes": "It's correct",
    "setting.Account.e621.msg.no": "Let me check again",

    "setting.Account.language": "Language",
    "setting.Account.export/import": "Export/Import",

    /* Download */
    "setting.Download": "Download",
    "setting.Download.general": "General",
    "setting.Download.history": "History",
    "setting.Download.export/import": "Export/Import",

    /* Storage */
    "setting.Storage": "Storage",
    "setting.Storage.general": "General",

    "setting.Storage.cache": "Cache",
    "setting.Storage.cache.title": "Enable Cache?",
    "setting.Storage.cache.enable.off": "Disabled",
    "setting.Storage.cache.enable.on": "Enabled",
    "setting.Storage.cache.downloadFromCache": "Prioritize downloading from cache",

    "setting.Storage.cache.section.parts": "Which parts to enable?",
    "setting.Storage.cache.section.limits": "Quantity Limits",
    "setting.Storage.cache.section.post": "Posts",
    "setting.Storage.cache.section.others": "Others",

    "setting.Storage.cache.item.data": "Data",
    "setting.Storage.cache.item.image": "Original Files",
    "setting.Storage.cache.item.thumb": "Thumbnails",
    "setting.Storage.cache.item.pool": "Pool Data",
    "setting.Storage.cache.item.tags": "Tags",

    "setting.Storage.cache.limit.manual": "Manually set limits for each part",
    "setting.Storage.cache.limit.hint": "0 = No limit",
    "setting.Storage.cache.limit.all": "Global Limit",

    "setting.Storage.export/import": "Export/Import",

    /* Appearance */
    "setting.Appearance": "Appearance",

    "setting.Appearance.general": "General",
    "setting.Appearance.general.scale": "UI Scale",
    "setting.Appearance.general.scale.info": "Unless you have a specific need, don't make it too small. It's bad for your eyes.",
    "setting.Appearance.general.clockFormat": "Clock Format",
    "setting.Appearance.general.clockFormat.preview": "Preview",
    "setting.Appearance.general.clockFormat.info": "Unless you have a special need, it's recommended to just set something.",
    "setting.Appearance.general.clockFormat.info.fun": [
      "Unless... uh, you've lost track of time like I have.",
      "Wait, isn't that even more reason to have a clock?",
    ],
    "setting.Appearance.general.clockFormat.formatInfo": [
      ":HH:  - 24-hour format hours",
      ":mm:  - Minutes",
      ":ss:  - Seconds",
      "",
      "-YY-  - 4-digit year",
      "-yy-  - 2-digit year",
      "-mm-  - Month number",
      "-dd-  - Day",
    ],
    "setting.Appearance.general.clockFormat.overFlow": "Uh, the one below... don't put too much... it'll break the layout... unless you like that 'broken' look...",
    "setting.Appearance.general.clockFormat.none": "Uh... where is your clock?",
    "setting.Appearance.general.clockFormat.apply": "Apply",
    "setting.Appearance.general.clockFormat.restore": "Restore",
    "setting.Appearance.general.clockFormat.restoreDefault": "Restore to Default",

    "setting.Appearance.performance": "Performance",
    "setting.Appearance.performance.info": "Disable effects to save resources.",
    "setting.Appearance.performance.dec": "Reduces CPU/GPU load in certain scenarios.",
    "setting.Appearance.performance.btn.enb": "Enable",
    "setting.Appearance.performance.btn.deb": "Disable",
    "setting.Appearance.performance.opt.All": "All Animations / Visual Effect",
    "setting.Appearance.performance.opt.All.dec": "Toggle all system animations and visual effect",
    "setting.Appearance.performance.opt.cssAnimation": "CSS Keyframes",
    "setting.Appearance.performance.opt.cssAnimation.dec": "CSS animations",
    "setting.Appearance.performance.opt.transition": "Transitions",
    "setting.Appearance.performance.opt.transition.dec": "State change animations (A -> B)",
    "setting.Appearance.performance.opt.transitionDelay": "Transition Delay",
    "setting.Appearance.performance.opt.transitionDelay.dec": "Delays before animations start",
    "setting.Appearance.performance.opt.cssFilter": "CSS Filters",
    "setting.Appearance.performance.opt.cssFilter.dec": "Disabling this might cause visual glitches",
    "setting.Appearance.performance.opt.backdropFilter": "Backdrop Blur",
    "setting.Appearance.performance.opt.backdropFilter.dec": "Frosted glass effect (High GPU usage)",
    "setting.Appearance.performance.opt.transparenWinodw": "Transparen Winodw",
    "setting.Appearance.performance.opt.transparenWinodw.dec": "just....transparen winodw",

    "setting.Appearance.theme": "Theme",

    "setting.Appearance.wallpaper": "Wallpaper",
    "setting.Appearance.wallpaper.set": "Set as Wallpaper",
    "setting.Appearance.wallpaper.apply": "Apply",
    "setting.Appearance.wallpaper.source": "Picture Source",


    /* Information */
    "setting.Information": "Information",


    "setting.Information.general": "General",
    "setting.Information.general.repoLink": "Repo Link",

    "setting.Information.license": "LICENSE",
    "setting.Information.package": "Package",


    /* <:setting: */

    /* >:runBox: */

    "runBox": "Run",
    "runBox.placeholder": "Type anything you want to search",
    "runBox.NONE": "Nothing",

    "runBox.intro.mathCalc": "Math Calculate",
    "runBox.intro.mathCalc.calc": "Calc",

    "runBox.intro.searchPost": "Search Post",
    "runBox.intro.searchPost.search": "Search",
    "runBox.intro.searchPost.noTag": "Open Search With Out Any Tags",

    "runBox.intro.poolOrPostID": "Pool or Post ID",
    "runBox.intro.poolOrPostID.NaN": "is Not A Number",

    "runBox.intro.toggleWindows": "Toggle Windows",
    "runBox.intro.toggleWindows.moreAction": "More Action",
    "runBox.intro.toggleWindows.moreAction.closeAllWindow": "Close All Window",
    "runBox.intro.toggleWindows.moreAction.minimizeAllWindow": "Minimize All Window",
    "runBox.intro.toggleWindows.moreAction.restoreAllWindow": "Restore All Window",

    "runBox.intro.appOrOtherAction": "Open App or Some Action",

    "runBox.actions.saveWorkSpaceStatus": "Save WorkSpace Status",
    "runBox.actions.logout.withoutSaveStatus": "Without Saving Status",

    /* <:runBox: */

    /* >:workSpaceManager: */

    "workSpaceManager": "WorkSpace Manager",
    "workSpaceManager.note.placeholder": "Note...",
    "workSpaceManager.name.placeholder": "Name...",
    "workSpaceManager.newDesktop": "New Desktop",

    /* <:workSpaceManager: */

  },
  "zh-tw": {

    "IN_DEV.tips": [
      "這東西目前還在開發階段",
      "所以我寫了個可以匯出整個LocalStorage的東西",
      "這個東西會帶在這邊 直到進入Stable階段",
    ],
    "IN_DEV.downloadAgain": "重新下載存檔",
    "IN_DEV.save": "存檔",
    "IN_DEV.import": "讀檔",
    "IN_DEV.saveToFolder": "匯出存檔到資料夾",
    "IN_DEV.importFromFolder": "從資料夾讀取存檔",
    "IN_DEV.importOld": "讀 inDev 0.0.3 的檔 ",
    "IN_DEV.import.msg": "會覆蓋掉你的所有東西",
    "IN_DEV.import.yes": "行",
    "IN_DEV.import.no": "先不要",
    "IN_DEV.exporting": "正在匯出",
    "IN_DEV.exportDone": "匯出完成",

    "NAME": "繁體中文",
    "NOTIC": "切語言的時候會重開所有視窗",

    "ELECTRON.beforeUnload.msg": "你人要走了 那要存檔嗎？",
    "ELECTRON.beforeUnload.yes": "存",
    "ELECTRON.beforeUnload.no": "不存",
    "ELECTRON.beforeUnload.cancel": "算了沒事",

    /* >:System: */

    /* Desktop */
    "Desktop.drag.Cancel": "取消",

    /* startMenuSide */
    "startMenuSide.logout": "登出",
    "startMenuSide.appSetting": "設定",
    "startMenuSide.console": "控制台",

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
    "menuButton.ViewPost": "查看作品",
    "menuButton.SaveToTmp": "存到暫存區",
    "menuButton.CopyRawJson": "複製原始JSON",
    "menuButton.CopyFullJSON": "複製完整JSON",
    "menuButton.CopyID": "複製ID",
    "menuButton.CopyTagName": "複製標籤名稱",
    "menuButton.CopyURL": "複製連結",
    "menuButton.CopyImage": "複製圖片",
    "menuButton.DownloadImage": "下載圖片",
    "menuButton.DownloadVideo": "下載影片",
    "menuButton.Download": "下載",
    "menuButton.OpenWithPostSearch": "在作品搜尋裏開啓",
    "menuButton.OpenWithBrowser": "在瀏覽器中開啟",
    "menuButton.OpenWithViewer": "在圖片檢視器中開啟",
    "menuButton.OpenWithGetByID": "用 ID 抓作品並開啟",
    "menuButton.SetAsWallpaper": "設成桌布",
    "menuButton.SetAsAvatar": "設成頭貼",

    /* Setting */
    "menuButton.top.Category": "類別",
    "menuButton.top.Tab": "分頁",

    /* <:menuButton: */

    /* >:WindowsType: */

    "windowsType.postSearch": "作品搜尋",

    /* postSearch */
    "windowsType.postSearch.title.noTags": "沒有標籤",
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
    "windowsType.preview": "預覽",
    /* viewer */
    "windowsType.viewer.ResetTransform": "重置縮放和位置",

    "windowsType.viewer.RenderMode": "渲染模式 : ",
    "windowsType.viewer.RenderMode.Auto": "自動",
    "windowsType.viewer.RenderMode.Pixelated": "像素化",
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
    "components.post.moreThanOne": "不只一個 總計 $1 個",

    /* <:components.post: */


    /* >:setting: */

    "setting.Back": "<- 返回",
    "setting.Home": "主頁",

    /* Search */
    "setting.Search": "搜尋",

    "setting.Search.general": "主要",
    "setting.Search.defaultSearchFilter": "預設搜尋篩選器",


    "setting.Search.tags": "標籤",

    "setting.Search.history": "歷史",

    "setting.Search.export/import": "匯入/匯出",


    /* Account */
    "setting.Account": "帳號",

    "setting.Account.local": "本機",
    "setting.Account.local.changeUserName": "你の使用者名稱",
    "setting.Account.local.changeUserName.name": "君の名字",
    "setting.Account.local.changeUserName.nameIsEmpty": "你還是....給自己取個名吧拜托....",
    "setting.Account.local.changeUserName.update": "更新",
    "setting.Account.local.changeUserName.restore": "還原",
    "setting.Account.local.changeUserName.confirm": "你的新名字是 $1 , 你覺得如何？",
    "setting.Account.local.changeUserName.nice": "欸挺好 就它了！",
    "setting.Account.local.changeUserName.no": "欸....我再想想",
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
    "setting.Account.local.deleteAccount.2": "你現在的所有東西都會直接沒\n你的下載 你的暫存 你的歷史 都會無",
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
    "setting.Account.e621.title": "E621的憑證",
    "setting.Account.e621.info": "不打不一定查不到東西 但亂打一定會查不到東西",
    "setting.Account.e621.inp.name": "使用者名稱",
    "setting.Account.e621.inp.key": "密鑰",
    "setting.Account.e621.btn.update": "更新",
    "setting.Account.e621.btn.restore": "還原",
    "setting.Account.e621.msg": "確定這密碼和token是對的？記得檢查一下",
    "setting.Account.e621.msg.yes": "這對的",
    "setting.Account.e621.msg.no": "我還是再檢查一下好了",

    "setting.Account.language": "語言",


    "setting.Account.export/import": "匯入/匯出",


    /* Download */
    "setting.Download": "下載",
    "setting.Download.general": "主要",
    "setting.Download.history": "歷史",
    "setting.Download.export/import": "匯入/匯出",

    /* Storage */
    "setting.Storage": "存儲",
    "setting.Storage.general": "主要",

    "setting.Storage.cache": "快取",
    "setting.Storage.cache.title": "啓用緩存？",
    "setting.Storage.cache.enable.off": "禁用",
    "setting.Storage.cache.enable.on": "啓用",
    "setting.Storage.cache.downloadFromCache": "下載時優先從暫存區拿檔案",

    "setting.Storage.cache.section.parts": "啓用哪些部分？",
    "setting.Storage.cache.section.limits": "數量限制",
    "setting.Storage.cache.section.post": "作品",
    "setting.Storage.cache.section.others": "其他東西",

    "setting.Storage.cache.item.data": "資料",
    "setting.Storage.cache.item.image": "原始檔案",
    "setting.Storage.cache.item.thumb": "縮圖",
    "setting.Storage.cache.item.pool": "圖池資料",
    "setting.Storage.cache.item.tags": "標簽",

    "setting.Storage.cache.limit.manual": "手動設定每個部分的數量限制",
    "setting.Storage.cache.limit.hint": "0 = 無上限",
    "setting.Storage.cache.limit.all": "整體限制",

    "setting.Storage.export/import": "匯入/匯出",

    /* Appearance */
    "setting.Appearance": "外觀",
    "setting.Appearance.general": "主要",
    "setting.Appearance.general.scale": "整體的縮放",
    "setting.Appearance.general.scale.info": "除非有特殊需求 不然不要縮太小 對眼睛不好",
    "setting.Appearance.general.clockFormat": "時鐘格式",
    "setting.Appearance.general.clockFormat.info": "除非特殊需求 啊不然建議還是隨便寫個",
    "setting.Appearance.general.clockFormat.info.fun": [
      "除非....額 你跟我一樣失去了時間觀念",
      "欸那不是更應該放時鐘嗎",
    ],
    "setting.Appearance.general.clockFormat.preview": "預覽",
    "setting.Appearance.general.clockFormat.formatInfo": [
      ":HH:  - 24小時制的小時",
      ":mm:  - 分鐘",
      ":ss:  - 秒",
      "",
      "-YY-  - 四位數的年份",
      "-yy-  - 兩位數的年份",
      "-mm-  - 數字的月",
      "-dd-  - 日",
    ],
    "setting.Appearance.general.clockFormat.overFlow": "啊 下面這個....不要放太多....會破版....除非你喜歡破版的感覺.....",
    "setting.Appearance.general.clockFormat.none": "啊你的....時鐘呢?",
    "setting.Appearance.general.clockFormat.apply": "套用",
    "setting.Appearance.general.clockFormat.restore": "還原",
    "setting.Appearance.general.clockFormat.restoreDefault": "還原至預設",

    "setting.Appearance.performance": "性能",
    "setting.Appearance.performance.info": "在這裡可以關掉一些視覺效果 啊 就不會很吃效能了",
    "setting.Appearance.performance.dec": "關掉動畫/效果可以在某些情況下 節省一些性能開銷",
    "setting.Appearance.performance.btn.enb": "啟用",
    "setting.Appearance.performance.btn.deb": "禁用",
    "setting.Appearance.performance.opt.All": "所有動畫/效果",
    "setting.Appearance.performance.opt.All.dec": "開關所有動畫和效果 （ 有些地方會覆蓋不到 ）",
    "setting.Appearance.performance.opt.cssAnimation": "CSS 動畫 (Keyframes)",
    "setting.Appearance.performance.opt.cssAnimation.dec": "停用一個叫做Animation的東西",
    "setting.Appearance.performance.opt.transition": "過渡動畫 (Transitions)",
    "setting.Appearance.performance.opt.transition.dec": "狀態從 A 到 B 的過渡效果",
    "setting.Appearance.performance.opt.transitionDelay": "動畫延遲",
    "setting.Appearance.performance.opt.transitionDelay.dec": "動畫開始前的緩衝等待",
    "setting.Appearance.performance.opt.cssFilter": "CSS 濾鏡",
    "setting.Appearance.performance.opt.cssFilter.dec": "不推薦關掉 某些東西看起來會怪怪的",
    "setting.Appearance.performance.opt.backdropFilter": "背景模糊 (毛玻璃效果)",
    "setting.Appearance.performance.opt.backdropFilter.dec": "這東西會比較吃顯卡 可以關 但需要能夠接受有些界面會抽象",
    "setting.Appearance.performance.opt.transparenWinodw": "透明視窗",
    "setting.Appearance.performance.opt.transparenWinodw.dec": "如其名 透明的視窗",
    "setting.Appearance.theme": "主題",

    "setting.Appearance.wallpaper": "桌布",
    "setting.Appearance.wallpaper.set": "設成桌布",
    "setting.Appearance.wallpaper.apply": "套用",
    "setting.Appearance.wallpaper.source": "桌布來源",

    /* Information */
    "setting.Information": "關於",
    "setting.Information.general": "主要",
    "setting.Information.general.repoLink": "倉庫連結",

    "setting.Information.license": "授權資訊",
    "setting.Information.package": "套件",

    /* <:setting: */


    /* >:runBox: */

    "runBox": "執行",
    "runBox.placeholder": "輸入任何你想查的東西",
    "runBox.NONE": "沒東西",

    "runBox.intro.mathCalc": "數學計算",
    "runBox.intro.mathCalc.calc": "計算",

    "runBox.intro.searchPost": "搜尋貼文",
    "runBox.intro.searchPost.search": "搜尋",
    "runBox.intro.searchPost.noTag": "在沒有任何標籤的情況下搜尋",

    "runBox.intro.poolOrPostID": "圖池或圖的ID",
    "runBox.intro.poolOrPostID.NaN": "這不是數字",

    "runBox.intro.toggleWindows": "切換視窗",
    "runBox.intro.toggleWindows.moreAction": "更多選項",
    "runBox.intro.toggleWindows.moreAction.closeAllWindow": "關閉所有視窗",
    "runBox.intro.toggleWindows.moreAction.minimizeAllWindow": "最小化所有視窗",
    "runBox.intro.toggleWindows.moreAction.restoreAllWindow": "還原所有視窗",

    "runBox.intro.appOrOtherAction": "開啟某些東西或者執行某些操作",
    "runBox.actions.saveWorkSpaceStatus": "儲存工作區狀態",
    "runBox.actions.logout.withoutSaveStatus": "不存狀態 直接離開",

    /* <:runBox: */

    /* >:workSpaceManager: */

    "workSpaceManager": "工作區管理器",
    "workSpaceManager.note.placeholder": "筆記...",
    "workSpaceManager.name.placeholder": "給你的工作區賜個名",
    "workSpaceManager.newDesktop": "新增桌面",

    /* <:workSpaceManager: */
  },
}

type ELECTRON_APP_INFO_TYPE = {
  id: number;
  isFocused: boolean;
  isFullScreen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
}

const ELECTRON_APP_INFO_NOREADY: ELECTRON_APP_INFO_TYPE = {
  id: 0,
  isFocused: false,
  isFullScreen: false,
  isMinimized: false,
  isMaximized: false,
}

const ELECTRON_APP_IS_READY = () => document.dispatchEvent(new CustomEvent("APP-IS-READY"));
const ELECTRON_ACT = (act: string) => document.dispatchEvent(new CustomEvent("APP-ACTRON", { detail: { ACT: act } }));
const ELECTRON_SET_TRAY = (name: string) => document.dispatchEvent(new CustomEvent("TRAY-NAME", { detail: { NAME: name } }));
let [ELECTRON_APP_INFO, SET_ELECTRON_APP_INFO]: [ELECTRON_APP_INFO_TYPE, Dispatch<SetStateAction<ELECTRON_APP_INFO_TYPE>>] = [ELECTRON_APP_INFO_NOREADY, () => { }]

let guestMode = false;
let electronMode = false;
const appName = "E621 App / inDev 0.1.0"

type DispType<T> = [T, Dispatch<SetStateAction<T>>]
type LocalDispType<T> = [T, SetValue<T>]

let [READY, SET_READY]: DispType<boolean> = [false, () => { }]
let [APP_READY, SET_APP_READY]: DispType<boolean> = [false, () => { }]
let [OFFLINE_MODE, SET_OFFLINE_MODE]: LocalDispType<boolean> = [false, () => { }]

let usrIndx = ""

let disableWindowKeyEvent = false

let wmRef: RefObject<WindowManager<e621Type.defaul> | null>;

const StopEvent = (e: any) => {
  e.preventDefault()
  e.stopPropagation()
}

// #region 一坨型別定義

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
        searchFilter?: searchFilter
      }

      export namespace settingTabs {

        export type categorieType =
          | "search"
          | "account"
          | "download"
          | "storage"
          | "appearance"
          | "information"

        export const categorieList: categorieType[] = [
          "search",
          "account",
          "download",
          "storage",
          "appearance",
          "information",
        ]

        export const pageList = {
          interface: [
            "general",
            "tags",
            "history",
            "export/import",
          ],
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
          storage: [
            "general",
            "cache",
            "export/import",
          ],
          appearance: [
            "general",
            "performance",
            "theme",
            "wallpaper",
          ],
          information: [
            "general",
            "license",
            "package",
          ],
        }

        export type Interface = {
          categorie: "interface",
          pages:
          | "general"
          | "tags"
          | "history"
          | "export/import"
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

        export type Storage = {
          categorie: "storage",
          pages:
          | "general"
          | "cache"
          | "export/import"
        }

        export type Appearance = {
          categorie: "appearance",
          pages:
          | "general"
          | "performance"
          | "theme"
          | "wallpaper"
        }

        export type Information = {
          categorie: "information",
          pages:
          | "general"
          | "license"
          | "package"
        }

        export type _All =
          | "NONE"
          | Search
          | Account
          | Download
          | Storage
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

    export type preview = {
      type: "preview",
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
    | window.preview

}

namespace SettingEditor {

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

namespace workSpaceTypeOld {
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
}

namespace e621DatabaseCache {
  export type E621Post = E621.Post;
  export type E621Pool = E621.Pool;

  export interface CachedPost extends E621Post {
    all_tags: string[];
  }

  export class E621Database extends Dexie {
    posts!: Table<CachedPost, number>;
    pools!: Table<E621Pool, number>;

    constructor(user: string) {
      super(storage + '/' + user + '/' + 'e621_enhanced_db');

      this.version(1).stores({
        posts: 'id, *all_tags',
        pools: 'id'
      });
    }

    async init() {
      try {
        await this.open();
        console.log('Dexie Database initialized');
      } catch (err) {
        console.error('Failed to initialize Dexie DB', err);
      }
    }

    async savePosts(posts: E621Post[]) {
      const postsToSave: CachedPost[] = posts.map(post => {
        const flattenedTags = Object.values(post.tags).flat();

        return {
          ...post,
          all_tags: flattenedTags
        };
      });

      await this.posts.bulkPut(postsToSave);
    }

    async savePool(pool: E621Pool) {
      await this.pools.put(pool);
    }

    async getPostsInPool(poolId: number): Promise<E621Post[]> {
      const pool = await this.pools.get(poolId);
      if (!pool || !pool.post_ids || pool.post_ids.length === 0) {
        return [];
      }

      const posts = await this.posts.bulkGet(pool.post_ids);
      const validPosts = posts.filter((p): p is CachedPost => p !== undefined);

      const orderMap = new Map(pool.post_ids.map((id, index) => [id, index]));
      validPosts.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 0;
        const orderB = orderMap.get(b.id) ?? 0;
        return orderA - orderB;
      });

      return validPosts;
    }

    async searchPostsLocal(tags: string[], page: number, limit: number): Promise<E621Post[]> {
      const offset = (page - 1) * limit;

      const andTags: string[] = [];
      const excludeTags: string[] = [];
      const orTags: string[] = [];
      const metaTags: { key: string; value: string }[] = [];

      for (const t of tags) {
        if (t.startsWith('-')) {
          const content = t.substring(1);
          if (content.includes(':')) {
            const [key, ...valParts] = content.split(':');
            metaTags.push({ key: '-' + key.toLowerCase(), value: valParts.join(':').toLowerCase() });
          } else {
            excludeTags.push(content);
          }
        } else if (t.startsWith('~')) {
          orTags.push(t.substring(1));
        } else if (t.includes(':')) {
          const [key, ...valParts] = t.split(':');
          metaTags.push({ key: key.toLowerCase(), value: valParts.join(':').toLowerCase() });
        } else {
          andTags.push(t);
        }
      }

      let collection: Dexie.Collection<CachedPost, number>;

      if (andTags.length > 0) {
        collection = this.posts.where('all_tags').equals(andTags[0]);
      } else {
        collection = this.posts.toCollection();
      }

      collection = collection.filter(post => {
        const postTags = post.all_tags || [];

        for (let i = 1; i < andTags.length; i++) {
          if (!postTags.includes(andTags[i])) return false;
        }

        for (const ext of excludeTags) {
          if (postTags.includes(ext)) return false;
        }

        if (orTags.length > 0) {
          const hasOr = orTags.some(ot => postTags.includes(ot));
          if (!hasOr) return false;
        }

        for (const meta of metaTags) {
          const isNegative = meta.key.startsWith('-');
          const actualKey = isNegative ? meta.key.substring(1) : meta.key;

          let matches = false;

          if (actualKey === 'rating') {
            matches = post.rating === meta.value;
          }
          else if (actualKey === 'id') {
            matches = post.id.toString() === meta.value;
          }
          else if (actualKey === 'type') {
            const ext = post.file?.ext;
            if (meta.value === 'webm') matches = ext === 'webm';
            else if (meta.value === 'gif') matches = ext === 'gif';
            else if (meta.value === 'pic' || meta.value === 'image') matches = ['png', 'jpg', 'jpeg'].includes(ext);
            else if (meta.value === 'video') matches = ['webm', 'mp4'].includes(ext);
          }
          else if (actualKey === 'has') {
            const hasWhat = meta.value;
            if (hasWhat === 'source' || hasWhat === 'sources') {
              matches = !!(post.sources && post.sources.length > 0);
            }
            else if (hasWhat === 'description') {
              matches = !!(post.description && post.description.trim() !== '');
            }
            else if (hasWhat === 'parent') {
              matches = !!(post.relationships && post.relationships.parent_id !== null);
            }
            else if (hasWhat === 'children') {
              matches = !!(post.relationships && post.relationships.has_children);
            }
            else if (hasWhat === 'notes') {
              matches = !!post.has_notes;
            }
          }

          if (isNegative ? matches : !matches) {
            return false;
          }
        }

        return true;
      });

      const allMatched = await collection.toArray();

      allMatched.sort((a, b) => b.id - a.id);

      return allMatched.slice(offset, offset + limit);
    }
  }
}

namespace WSAction {

  const jstr = (obj: object) => JSON.stringify(obj);

  export interface UserIOOptions {
    cache?: boolean;
    workspaces?: boolean;
    saves?: boolean;
    tempList?: boolean;
    history?: boolean;
    offlineDB?: boolean;
  }

  export type WorkSpaceEventMap = {
    "app:statusSet": CustomEvent<{ state: workSpaceType.App }>;

    "user:created": CustomEvent<{ user: workSpaceType.User }>;
    "user:deleted": CustomEvent<{ userId: string }>;
    "user:settingSet": CustomEvent<{ userId: string; value: workSpaceType.Unit.Setting }>;
    "user:saveInfoSet": CustomEvent<{ userId: string; value: workSpaceType.Unit.SaveInfo }>;
    "user:stateSet": CustomEvent<{ userId: string; value: workSpaceType.State }>;
    "user:historySet": CustomEvent<{ userId: string; key: keyof workSpaceType.Unit.History; value: unknown }>;
    "user:savesSet": CustomEvent<{ userId: string; key: Exclude<keyof workSpaceType.Unit.Saves, "tmpList">; value: unknown }>;
    "user:langChanged": CustomEvent<{ userId: string; lang: string }>;

    "workspace:added": CustomEvent<{ userId: string; ws: workSpaceType.WorkSpaces.WorkSpaces }>;
    "workspace:updated": CustomEvent<{ userId: string; wsId: string; partial: Partial<Omit<workSpaceType.WorkSpaces.WorkSpaces, "id">> }>;
    "workspace:deleted": CustomEvent<{ userId: string; wsId: string }>;

    "tmpItem:added": CustomEvent<{ userId: string; itemUuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }>;
    "tmpItem:update": CustomEvent<{ userId: string; itemUuid: string; newItem: workSpaceType.Unit.BaseItem.TmpItem }>;
    "tmpItem:removed": CustomEvent<{ userId: string; itemUuid: string }>;
    "tmpItem:cleared": CustomEvent<{ userId: string }>;
  };


  export declare interface WorkSpaceActions {
    addEventListener<K extends keyof WorkSpaceEventMap>(
      type: K,
      listener: (ev: WorkSpaceEventMap[K]) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ): void;

    removeEventListener<K extends keyof WorkSpaceEventMap>(
      type: K,
      listener: (ev: WorkSpaceEventMap[K]) => void,
      options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions
    ): void;
  }


  export class WorkSpaceActions extends EventTarget {
    readonly userIdExcludeReg = /\ |\(|\)|\\|\||\/|!|\?|\:/;

    public rootDir = "";

    // #region ── Constructor ─────────────────────────────────────────────────────────────

    constructor(id?: string, initDone?: () => void, nope?: boolean) {
      super();
      if (nope) return;
      this.rootDir = `/E621-App[${id ?? "Main"}]/`;

      const init = async () => {
        if (!await fs.exists(this.rootDir)) {
          await fs.mkdir(this.rootDir);
        }
        initDone?.();
      };

      init();
    }

    // #endregion


    // #region ── Helper ───────────────────────────────────────────────────────────────────

    private fire<K extends keyof WorkSpaceEventMap>(
      type: K,
      detail: WorkSpaceEventMap[K] extends CustomEvent<infer D> ? D : never
    ) {
      this.dispatchEvent(new CustomEvent(type, { detail }));
    }

    // #endregion


    // #region ── 切換語言 ─────────────────────────────────────────────────────────────────

    public async switchLanguage(userId: string, newLang: string): Promise<void> {
      await this.assertUserExists(userId);

      const settingStore = await this.userSetting(userId);
      const currentSettings = await settingStore.get();

      if (currentSettings.lang === newLang) return;

      await settingStore.set((prev) => {
        prev.lang = newLang;
        return prev;
      });

      this.fire("user:langChanged", { userId, lang: newLang });
    }

    public async getLanguage(userId: string): Promise<string> {
      await this.assertUserExists(userId);
      const settingStore = await this.userSetting(userId);
      const settings = await settingStore.get();
      return settings.lang;
    }

    // #endregion


    // #region ── 路徑 helpers ─────────────────────────────────────────────────────────────

    public usrDir(id: string) {
      return this.rootDir + id + "/";
    }

    public usrSubDir(id: string, sub: "workspaces" | "history" | "saves" | "storage") {
      return this.usrDir(id) + sub + "/";
    }

    public wsDir(userId: string, wsId: string) {
      return this.usrSubDir(userId, "workspaces") + wsId + "/";
    }

    public tmpListDir(userId: string) {
      return this.usrSubDir(userId, "saves") + "tmpList/";
    }

    public async createFolder(id: string): Promise<void> {
      await this.assertUserExists(id);

      const wsBase = this.usrSubDir(id, "workspaces");
      const histBase = this.usrSubDir(id, "history");
      const savesBase = this.usrSubDir(id, "saves");
      const storageBase = this.usrSubDir(id, "storage");
      const tmpBase = this.tmpListDir(id);

      const requiredDirs = [wsBase, histBase, savesBase, storageBase, tmpBase];
      await Promise.all(
        requiredDirs.map(dir => fs.mkdir(dir, { recursive: true }))
      );

      const ensureFile = async (path: string, defaultData: any) => {
        if (!await fs.exists(path)) {
          await fs.writeFile(path, jstr(defaultData));
        }
      };

      await Promise.all([
        ensureFile(savesBase + "download.json", []),
        ensureFile(savesBase + "wallpapers.json", []),
        ensureFile(histBase + "search.json", []),
        ensureFile(histBase + "color.json", []),
        ensureFile(histBase + "wallpaper.json", []),
        ensureFile(histBase + "download.json", [])
      ]);
    }

    // #endregion


    // #region ── 驗證 ─────────────────────────────────────────────────────────────────────

    private async assertValidId(id: string) {
      if (!id || this.userIdExcludeReg.test(id)) throw new Error("ID 格式不規範");
    }

    private async assertUserExists(id: string) {
      await this.assertValidId(id);
      if (!await fs.exists(this.usrDir(id)))
        throw new Error("這個使用者不存在");
    }

    private async assertUserNotExists(id: string) {
      await this.assertValidId(id);
      if (await fs.exists(this.usrDir(id)))
        throw new Error("這個使用者已經存在了");
    }

    public async havThisUser(id: string): Promise<boolean> {
      if (!id || this.userIdExcludeReg.test(id)) return false;
      return fs.exists(this.usrDir(id));
    }

    // #endregion


    // #region ── App 層級 ─────────────────────────────────────────────────────────────────

    public async setAppStatus(state: workSpaceType.App): Promise<void> {
      await fs.writeFile(this.rootDir + "appStatus.json", jstr(state));
      this.fire("app:statusSet", { state });
    }

    public async getAppStatus(): Promise<workSpaceType.App> {
      const raw = await fs.readFile(this.rootDir + "appStatus.json");
      return JSON.parse(raw.toString()) as workSpaceType.App;
    }

    public async exportSaves(): Promise<Uint8Array> {
      const zip = new JSZip();

      const writeRecursive = async (dirPath: string, relPath: string) => {
        const entries = (await fs.readdir(dirPath, { withFileTypes: true })) as Dirent[];
        for (const entry of entries) {
          const isDir = entry.isDirectory();
          const path = dirPath + entry.name + (isDir ? "/" : "");
          const name = relPath + entry.name;

          if (isDir) {
            await writeRecursive(path, `${name}/`);
          } else {
            const data = await fs.readFile(path, null) as Uint8Array;
            zip.file(name, data);
          }
        }
      };

      if (await fs.exists(this.rootDir)) {
        await writeRecursive(this.rootDir, "");
      }

      return await zip.generateAsync({ type: "uint8array", compression: "STORE" });
    }

    public async importSaves(zipSource: Blob | ArrayBuffer | Uint8Array): Promise<void> {
      const rawData = zipSource instanceof Blob
        ? await zipSource.arrayBuffer()
        : zipSource instanceof Uint8Array
          ? (zipSource.buffer as ArrayBuffer)
          : zipSource;

      const zip = await JSZip.loadAsync(rawData as ArrayBuffer | Uint8Array);

      if (await fs.exists(this.rootDir)) {
        const entries = (await fs.readdir(this.rootDir, { withFileTypes: true })) as Dirent[];
        for (const entry of entries) {
          const isDir = entry.isDirectory();
          const path = this.rootDir + entry.name + (isDir ? "/" : "");
          if (isDir) {
            await fs.rmdir(path, { recursive: true });
          } else {
            await fs.unlink(path);
          }
        }
      } else {
        await fs.mkdir(this.rootDir, { recursive: true });
      }

      const ensureDir = async (filePath: string): Promise<void> => {
        const segments = filePath.split("/").slice(0, -1).filter(Boolean);
        if (segments.length === 0) return;
        await fs.mkdir(this.rootDir + segments.join("/") + "/", { recursive: true });
      };

      const files = Object.values(zip.files);
      for (const file of files) {
        if (file.dir) {
          await fs.mkdir(this.rootDir + file.name, { recursive: true });
          continue;
        }
        await ensureDir(file.name);
        const contents = await file.async("uint8array");
        await fs.writeFile(this.rootDir + file.name, contents);
      }
    }

    public async importSavesOld(data: workSpaceTypeOld.defaul): Promise<void> {
      const newID = GetNowTime();
      const emptyOldUserData: workSpaceTypeOld.User = {
        saveInfo: {
          user: {
            name: "",
            avatar: {
              url: "/_SYSTEM/Images/root/avatar.png"
            },
            passKey: "",
          },
          id: "",
        },
        setting: {
          wmSettings: defaultWMSettings,
          performance: {
            All: true,
            cssAnimation: true,
            transition: true,
            transitionDelay: true,
            cssFilter: true,
            backdropFilter: true,
            transparenWinodw: false,
          },
          lang: "en-us",
          search: {
            defaultSearchFilter: {
              rating: {
                s: true,
                e: false,
                q: false,
              }
            },
          },
          download: {
            format: "%artist% - %id%",
            maxConcurrentDownloads: 2,
          },
          appearance: {
            scale: 80,
            color: "#ffffff",
            wallpaper: {
              url: BACKGROUND_IMAGE.src
            },
            clockFormat: [
              ":HH:::mm:::ss:",
              "-dd- -MM- -YY-",
            ],
            KIASTALA: false,
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
        windowsStatus: [],
        nowWorkSpace: 0,
        workSpaces: [
          {
            name: "Main",
            status: [],
            setting: {
              wallpaper: {
                url: BACKGROUND_IMAGE.src
              },
              color: "#ffffff",
            }
          }
        ]
      }
      const nD: workSpaceType.defaul = {
        autoLogin: data.autoLogin,
        lastUser: data.lastUser,
        rememberPassword: data.rememberPassword,
        userList: data.userList.map(usr => merge({}, emptyOldUserData, usr)).map(usr => ({
          history: usr.history,
          saveInfo: {
            ...usr.saveInfo,
            id: usr.saveInfo.id.replaceAll(/\ |\(|\)|\\|\||\/|!|\?|\:/g, "_"),
          },
          saves: usr.saves,
          setting: usr.setting,
          state: {
            nowWorkSpace: (newID + usr.nowWorkSpace).toString()
          },
          workSpaces: usr.workSpaces.map((ws, i) => ({
            id: (newID + i).toString(),
            note: {
              name: ws.name,
              note: ws.note
            },
            preview: ws.status.map(({ rect: r, zIndex }) => ({
              x: r.left,
              y: r.top,
              w: r.width,
              h: r.height,
              z: zIndex,
            })) as workSpaceType.WorkSpaces.Preview[],
            setting: ws.setting,
            status: ws.status,
          })) as workSpaceType.WorkSpaces.WorkSpaces[]
        })) as workSpaceType.User[]
      }

      await fs.rmdir(this.rootDir, { recursive: true });
      await fs.mkdir(this.rootDir);

      await this.setAppStatus({
        autoLogin: nD.autoLogin,
        lastUser: nD.lastUser,
        rememberPassword: nD.rememberPassword,
      })

      const users = nD.userList

      for (let index = 0; index < users.length; index++) {
        const user = users[index];

        await this.overwriteUserData(user)
      }

    }

    private async runTasksWithConcurrency<T>(
      tasks: (() => Promise<T>)[],
      concurrencyLimit: number,
      onTaskCompleted: () => void
    ): Promise<void> {
      const executing: Promise<any>[] = [];

      for (const task of tasks) {
        const promise = task().then(() => {
          onTaskCompleted();
          const index = executing.indexOf(promise);
          if (index !== -1) {
            executing.splice(index, 1);
          }
        });
        executing.push(promise);

        if (executing.length >= concurrencyLimit) {
          await Promise.race(executing);
        }
      }

      await Promise.all(executing);
    }

    readonly CONCURRENCY_LIMIT = 25;

    public async exportToDirectoryHandle(
      dirHandle: any,
      onUpdate?: (max: number, now: number) => void
    ): Promise<void> {
      if (!(await fs.exists(this.rootDir))) {
        console.warn(`Source directory ${this.rootDir} does not exist.`);
        return;
      }

      const fileWriteTasks: (() => Promise<void>)[] = [];

      const collectTasksRecursive = async (vDirPath: string, nDirHandle: any) => {
        const entries = (await fs.readdir(vDirPath, { withFileTypes: true })) as Dirent[];

        await Promise.all(entries.map(async (entry) => {
          const isDir = entry.isDirectory();
          const path = vDirPath + entry.name + (isDir ? "/" : "");

          if (isDir) {
            const newNDirHandle = await nDirHandle.getDirectoryHandle(entry.name, { create: true });
            await collectTasksRecursive(path, newNDirHandle);
          } else {
            const task = async () => {
              const data = await fs.readFile(path, null) as Uint8Array;
              const fileHandle = await nDirHandle.getFileHandle(entry.name, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(data);
              await writable.close();
            };
            fileWriteTasks.push(task);
          }
        }));
      };

      await collectTasksRecursive(this.rootDir, dirHandle);

      const max = fileWriteTasks.length;
      let now = 0;
      let updateInterval: any = null;

      if (onUpdate) {
        onUpdate(max, now);
        updateInterval = setInterval(() => {
          onUpdate(max, now);
        }, 500);
      }

      console.log(`Found ${max} files to export. Starting...`);

      await this.runTasksWithConcurrency(fileWriteTasks, this.CONCURRENCY_LIMIT, () => {
        now++;
      });

      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (onUpdate) {
        onUpdate(max, max);
      }

      console.log("Export completed.");
    }

    public async importFromDirectoryHandle(
      dirHandle: any,
      onUpdate?: (max: number, now: number) => void
    ): Promise<void> {
      console.log(`Cleaning and preparing directory: ${this.rootDir}...`);
      await fs.rm(this.rootDir, { recursive: true, force: true });
      await fs.mkdir(this.rootDir, { recursive: true });

      const fileWriteTasks: (() => Promise<void>)[] = [];

      const collectTasksRecursive = async (nDirHandle: any, vDirPath: string) => {
        for await (const handle of nDirHandle.values()) {
          const newVPath = vDirPath + handle.name;

          if (handle.kind === 'directory') {
            await fs.mkdir(newVPath + "/", { recursive: true });
            await collectTasksRecursive(handle, newVPath + "/");
          } else if (handle.kind === 'file') {
            const task = async () => {
              const file = await handle.getFile();
              const buffer = await file.arrayBuffer();
              await fs.writeFile(newVPath, new Uint8Array(buffer));
            };
            fileWriteTasks.push(task);
          }
        }
      };

      await collectTasksRecursive(dirHandle, this.rootDir);

      const max = fileWriteTasks.length;
      let now = 0;
      let updateInterval: any = null;

      if (onUpdate) {
        onUpdate(max, now);
        updateInterval = setInterval(() => {
          onUpdate(max, now);
        }, 500);
      }

      console.log(`Found ${max} files to import. Starting...`);

      await this.runTasksWithConcurrency(fileWriteTasks, this.CONCURRENCY_LIMIT, () => {
        now++;
      });

      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (onUpdate) {
        onUpdate(max, max);
      }

      console.log("Import completed.");
    }

    public async listUsers(): Promise<string[]> {
      const items = (await fs.readdir(this.rootDir, { withFileTypes: true }))
        .filter(e => e.isDirectory())
        .filter(e => e.name !== ".cache");

      const users: string[] = [];

      for (const item of items) {
        const infoPath = this.usrDir(item.name) + "saveInfo.json";
        if (await fs.exists(infoPath)) {
          users.push(item.name);
          await this.createFolder(item.name);
        }
      }

      return users;
    }

    // #endregion


    // #region ── 使用者 CRUD ───────────────────────────────────────────────────────────────

    public async newUser(opt: EmptyAccountOption): Promise<void> {
      await this.assertUserNotExists(opt.id);

      const newUser = EmptyAccount(opt);

      await this.overwriteUserData(newUser);
      this.fire("user:created", { user: newUser });
    }

    public async getUser(id: string): Promise<workSpaceType.User> {
      await this.assertUserExists(id);
      const dir = this.usrDir(id);

      const read = async <T,>(path: string): Promise<T> => {
        const raw = await fs.readFile(path);
        return JSON.parse(raw.toString()) as T;
      };

      const wsBase = this.usrSubDir(id, "workspaces");
      const wsItems = (await fs.readdir(wsBase)) as string[];
      const workSpaces: workSpaceType.WorkSpaces.WorkSpaces[] = [];

      for (const wsId of wsItems) {
        if (await fs.exists(wsBase + wsId + "/")) {
          const wsDir = wsBase + wsId + "/";
          workSpaces.push({
            id: wsId,
            setting: await read(wsDir + "setting.json"),
            note: await read(wsDir + "note.json"),
            status: await read(wsDir + "status.json"),
          } as workSpaceType.WorkSpaces.WorkSpaces);
        }
      }

      const tmpListDir = this.tmpListDir(id);
      const tmpItems = (await fs.readdir(tmpListDir)) as string[];
      const tmpList: workSpaceType.Unit.BaseItem.TmpItem[] = [];

      for (const f of tmpItems) {
        if (f.endsWith(".json")) {
          tmpList.push(await read(tmpListDir + f));
        }
      }

      const savesBase = this.usrSubDir(id, "saves");
      const histBase = this.usrSubDir(id, "history");

      return {
        saveInfo: await read(dir + "saveInfo.json"),
        setting: await read(dir + "setting.json"),
        state: await read(dir + "state.json"),
        history: {
          search: await read(histBase + "search.json"),
          color: await read(histBase + "color.json"),
          wallpaper: await read(histBase + "wallpaper.json"),
          download: await read(histBase + "download.json"),
        },
        saves: {
          download: await read(savesBase + "download.json"),
          wallpapers: await read(savesBase + "wallpapers.json"),
          tmpList,
        },
        workSpaces,
      };
    }

    public async getSaveInfo(id: string): Promise<workSpaceType.Unit.SaveInfo> {
      await this.assertUserExists(id);
      const dir = this.usrDir(id);

      const read = async <T,>(path: string): Promise<T> => {
        const raw = await fs.readFile(path);
        return JSON.parse(raw.toString()) as T;
      };
      return await read(dir + "saveInfo.json");
    }

    public async deleteUser(id: string): Promise<void> {
      await this.assertUserExists(id);
      await fs.rmdir(this.usrDir(id), { recursive: true });
      this.fire("user:deleted", { userId: id });
    }

    // #endregion


    // #region ── 使用者欄位單獨更新 ────────────────────────────────────────────────────────

    private rs<T extends object>(filePath: string, onSet?: () => void) {
      return {
        async get(): Promise<T> {
          return JSON.parse((await fs.readFile(filePath)).toString()) as T;
        },
        async set(value: T | ((prev: T) => T)): Promise<void> {
          const resolved =
            typeof value === "function"
              ? (value as (e: T) => T)(JSON.parse((await fs.readFile(filePath)).toString()))
              : value;
          await fs.writeFile(filePath, jstr(resolved));
          onSet?.();
        },
      };
    }

    public async userSetting(id: string) {
      await this.assertUserExists(id);
      const filePath = this.usrDir(id) + "setting.json";
      return this.rs<workSpaceType.Unit.Setting>(filePath, async () => {
        const value = JSON.parse((await fs.readFile(filePath)).toString()) as workSpaceType.Unit.Setting;
        this.fire("user:settingSet", { userId: id, value });
      });
    }

    public async userSaveInfo(id: string) {
      await this.assertUserExists(id);
      const filePath = this.usrDir(id) + "saveInfo.json";
      return this.rs<workSpaceType.Unit.SaveInfo>(filePath, async () => {
        const value = JSON.parse((await fs.readFile(filePath)).toString()) as workSpaceType.Unit.SaveInfo;
        this.fire("user:saveInfoSet", { userId: id, value });
      });
    }

    public async userState(id: string) {
      await this.assertUserExists(id);
      const filePath = this.usrDir(id) + "state.json";
      return this.rs<workSpaceType.State>(filePath, async () => {
        const value = JSON.parse((await fs.readFile(filePath)).toString()) as workSpaceType.State;
        this.fire("user:stateSet", { userId: id, value });
      });
    }

    public async userHistory(id: string, key: keyof workSpaceType.Unit.History) {
      await this.assertUserExists(id);
      const filePath = this.usrSubDir(id, "history") + key + ".json";
      return this.rs(filePath, async () => {
        const value = JSON.parse((await fs.readFile(filePath)).toString());
        this.fire("user:historySet", { userId: id, key, value });
      });
    }

    public async userSaves(
      id: string,
      key: Exclude<keyof workSpaceType.Unit.Saves, "tmpList">
    ) {
      await this.assertUserExists(id);
      const filePath = this.usrSubDir(id, "saves") + key + ".json";
      return this.rs(filePath, async () => {
        const value = JSON.parse((await fs.readFile(filePath)).toString());
        this.fire("user:savesSet", { userId: id, key, value });
      });
    }

    // #endregion


    // #region ── Workspace CRUD ───────────────────────────────────────────────────────────

    public async listWorkspaces(userId: string): Promise<string[]> {
      await this.assertUserExists(userId);
      const wsBase = this.usrSubDir(userId, "workspaces");

      const items = (await fs.readdir(wsBase)) as string[];
      const workspaces: string[] = [];

      for (const name of items) {
        if (await fs.exists(wsBase + name + "/")) {
          workspaces.push(name);
        }
      }
      return workspaces.sort((a, b) => parseInt(a) - parseInt(b));;
    }

    public async addWorkspace(
      userId: string,
      ws: workSpaceType.WorkSpaces.WorkSpaces
    ): Promise<void> {
      await this.assertUserExists(userId);
      const dir = this.wsDir(userId, ws.id);
      if (await fs.exists(dir)) throw new Error("這個 Workspace 已存在");
      await fs.mkdir(dir);
      await fs.writeFile(dir + "preview.json", jstr([]));
      await fs.writeFile(dir + "setting.json", jstr(ws.setting));
      await fs.writeFile(dir + "note.json", jstr(ws.note));
      await fs.writeFile(dir + "status.json", jstr(ws.status));
      this.fire("workspace:added", { userId, ws });
    }

    public async getWorkspace(
      userId: string,
      wsId: string
    ): Promise<workSpaceType.WorkSpaces.WorkSpaces> {
      await this.assertUserExists(userId);
      const dir = this.wsDir(userId, wsId);
      if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
      const read = async <T,>(p: string) =>
        JSON.parse((await fs.readFile(p)).toString()) as T;
      return {
        id: wsId,
        preview: await read(dir + "preview.json"),
        setting: await read(dir + "setting.json"),
        note: await read(dir + "note.json"),
        status: await read(dir + "status.json"),
      };
    }

    public async getWorkspaceInfo(
      userId: string,
      wsId: string,
      type: "preview"
    ): Promise<workSpaceType.WorkSpaces.Preview[]>;
    public async getWorkspaceInfo(
      userId: string,
      wsId: string,
      type: "setting"
    ): Promise<workSpaceType.WorkSpaces.Setting>;
    public async getWorkspaceInfo(
      userId: string,
      wsId: string,
      type: "note"
    ): Promise<workSpaceType.WorkSpaces.Note>;
    public async getWorkspaceInfo(
      userId: string,
      wsId: string,
      type: "status"
    ): Promise<workSpaceType.Unit.windowsStatus[]>;
    public async getWorkspaceInfo(
      userId: string,
      wsId: string,
      type:
        | "preview"
        | "setting"
        | "note"
        | "status"
    ): Promise<any> {
      await this.assertUserExists(userId);
      const dir = this.wsDir(userId, wsId);
      if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
      const read = async <T,>(p: string) =>
        JSON.parse((await fs.readFile(p)).toString()) as T;
      switch (type) {
        case "note": return await read(dir + "note.json");
        case "preview": return await read(dir + "preview.json");
        case "setting": return await read(dir + "setting.json");
        case "status": return await read(dir + "status.json");
      }
    }

    public async updateWorkspace(
      userId: string,
      wsId: string,
      partial: Partial<Omit<workSpaceType.WorkSpaces.WorkSpaces, "id">>
    ): Promise<void> {
      await this.assertUserExists(userId);
      const dir = this.wsDir(userId, wsId);
      if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
      if (partial.setting)
        await fs.writeFile(dir + "setting.json", jstr(partial.setting));
      if (partial.note)
        await fs.writeFile(dir + "note.json", jstr(partial.note));
      if (partial.status) {
        await fs.writeFile(dir + "status.json", jstr(partial.status));
        await fs.writeFile(dir + "preview.json", jstr(partial.status?.map(({ rect, zIndex }) => ({
          x: rect.left,
          y: rect.top,
          w: rect.width,
          h: rect.height,
          z: zIndex,
        }))));
      }
      this.fire("workspace:updated", { userId, wsId, partial });
    }

    public async deleteWorkspace(userId: string, wsId: string): Promise<void> {
      await this.assertUserExists(userId);
      const dir = this.wsDir(userId, wsId);
      if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
      await fs.rmdir(dir, { recursive: true });
      this.fire("workspace:deleted", { userId, wsId });
    }

    // #endregion


    // #region ── TmpList CRUD ─────────────────────────────────────────────────────────────

    public async listTmpItems(
      userId: string
    ): Promise<{ uuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }[]> {
      await this.assertUserExists(userId);
      const dir = this.tmpListDir(userId);

      const items = (await fs.readdir(dir)) as string[];
      const files = items.filter((f: string) => f.endsWith(".json"));

      const result = [];
      for (const f of files) {
        const raw = await fs.readFile(dir + f);
        result.push({
          uuid: f.replace(".json", ""),
          item: JSON.parse(raw.toString()),
        });
      }
      return result;
    }

    public async addTmpItem(
      userId: string,
      item: workSpaceType.Unit.BaseItem.TmpItem
    ): Promise<string> {
      await this.assertUserExists(userId);
      const itemUuid = MakeID();
      await fs.writeFile(this.tmpListDir(userId) + itemUuid + ".json", jstr(item));
      this.fire("tmpItem:added", { userId, itemUuid, item });
      return itemUuid;
    }

    public async updateTmpItem(
      userId: string,
      itemUuid: string,
      newItem: workSpaceType.Unit.BaseItem.TmpItem
    ): Promise<string> {
      await this.assertUserExists(userId);
      await fs.writeFile(this.tmpListDir(userId) + itemUuid + ".json", jstr(newItem));
      this.fire("tmpItem:update", { userId, itemUuid, newItem });
      return itemUuid;
    }

    public async getTmpList(
      userId: string
    ): Promise<{ uuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }[]> {
      return this.listTmpItems(userId);
    }

    public async removeTmpItem(userId: string, itemUuid: string): Promise<void> {
      await this.assertUserExists(userId);
      const path = this.tmpListDir(userId) + itemUuid + ".json";
      if (!await fs.exists(path)) throw new Error("這個 TmpItem 不存在");
      await fs.unlink(path);
      this.fire("tmpItem:removed", { userId, itemUuid });
    }

    public async clearTmpList(userId: string): Promise<void> {
      await this.assertUserExists(userId);
      const dir = this.tmpListDir(userId);
      (await fs.readdir(dir) as string[])
        .filter((f: string) => f.endsWith(".json"))
        .forEach((f: string) => fs.unlink(dir + f));
      this.fire("tmpItem:cleared", { userId });
    }

    // #endregion


    // #region ── Private: 完整覆寫使用者目錄 ──────────────────────────────────────────────

    private async overwriteUserData(newUser: workSpaceType.User): Promise<void> {
      const id = newUser.saveInfo.id;
      const dir = this.usrDir(id);

      if (await fs.exists(dir)) {
        await fs.rm(dir, { recursive: true, force: true });
      }

      await fs.mkdir(dir, { recursive: true });

      const wsBase = this.usrSubDir(id, "workspaces");
      const histBase = this.usrSubDir(id, "history");
      const savesBase = this.usrSubDir(id, "saves");
      const storageBase = this.usrSubDir(id, "storage");
      const tmpBase = this.tmpListDir(id);

      await fs.mkdir(wsBase, { recursive: true });
      await fs.mkdir(histBase, { recursive: true });
      await fs.mkdir(savesBase, { recursive: true });
      await fs.mkdir(storageBase, { recursive: true });
      await fs.mkdir(tmpBase, { recursive: true });

      await Promise.all([
        fs.writeFile(dir + "setting.json", jstr(newUser.setting)),
        fs.writeFile(dir + "saveInfo.json", jstr(newUser.saveInfo)),
        fs.writeFile(dir + "state.json", jstr(newUser.state)),
        fs.writeFile(histBase + "search.json", jstr(newUser.history.search)),
        fs.writeFile(histBase + "color.json", jstr(newUser.history.color)),
        fs.writeFile(histBase + "wallpaper.json", jstr(newUser.history.wallpaper)),
        fs.writeFile(histBase + "download.json", jstr(newUser.history.download)),
        fs.writeFile(savesBase + "download.json", jstr(newUser.saves.download)),
        fs.writeFile(savesBase + "wallpapers.json", jstr(newUser.saves.wallpapers))
      ]);

      for (const ws of newUser.workSpaces) {
        const wsDir = wsBase + ws.id + "/";
        await fs.mkdir(wsDir, { recursive: true });
        await Promise.all([
          fs.writeFile(wsDir + "preview.json", jstr(ws.preview)),
          fs.writeFile(wsDir + "setting.json", jstr(ws.setting)),
          fs.writeFile(wsDir + "note.json", jstr(ws.note)),
          fs.writeFile(wsDir + "status.json", jstr(ws.status))
        ]);
      }
    }

    // #endregion


    // #region ──  Export / Import User ───────────────────────────────────────────────────

    public async exportUser(
      userId: string,
      options: UserIOOptions,
      mode: "zip" | "folder",
      dirHandle?: any
    ): Promise<Uint8Array | void> {
      await this.assertUserExists(userId);

      const uDir = this.usrDir(userId);
      const exportFiles = new Map<string, Uint8Array | Blob>();

      const addFile = async (realPath: string, virtualPath: string) => {
        if (await fs.exists(realPath)) {
          exportFiles.set(virtualPath, await fs.readFile(realPath, null) as Uint8Array);
        }
      };

      const addDirRecursive = async (realDir: string, virtualDir: string) => {
        if (!await fs.exists(realDir)) return;
        const entries = (await fs.readdir(realDir, { withFileTypes: true })) as Dirent[];
        for (const entry of entries) {
          const rPath = realDir + entry.name + (entry.isDirectory() ? "/" : "");
          const vPath = virtualDir + entry.name + (entry.isDirectory() ? "/" : "");
          if (entry.isDirectory()) {
            await addDirRecursive(rPath, vPath);
          } else {
            exportFiles.set(vPath, await fs.readFile(rPath, null) as Uint8Array);
          }
        }
      };

      await addFile(uDir + "setting.json", "setting.json");
      await addFile(uDir + "saveInfo.json", "saveInfo.json");
      await addFile(uDir + "state.json", "state.json");

      const stateStore = await this.userState(userId);
      const state = await stateStore.get();
      const nowWs = state.nowWorkSpace;

      const wsBase = this.usrSubDir(userId, "workspaces");
      if (options.workspaces) {
        await addDirRecursive(wsBase, "workspaces/");
      } else {
        if (await fs.exists(wsBase + nowWs + "/")) {
          await addDirRecursive(wsBase + nowWs + "/", `workspaces/${nowWs}/`);
        }
      }

      if (options.history) {
        await addDirRecursive(this.usrSubDir(userId, "history"), "history/");
      }

      if (options.saves) {
        const savesBase = this.usrSubDir(userId, "saves");
        await addFile(savesBase + "download.json", "saves/download.json");
        await addFile(savesBase + "wallpapers.json", "saves/wallpapers.json");
      }

      if (options.tempList) {
        await addDirRecursive(this.tmpListDir(userId), "saves/tmpList/");
      }

      if (options.cache) {
        await addDirRecursive(this.usrSubDir(userId, "storage"), "storage/");
      }

      if (options.offlineDB) {
        try {
          await import("dexie-export-import");

          const db = new e621DatabaseCache.E621Database(userId);
          await db.init();
          const dbBlob = await db.export();
          exportFiles.set("offline.db", dbBlob);
        } catch (e) {
          console.error("Offline DB Export failed", e);
        }
      }

      if (mode === "zip") {
        const zip = new JSZip();
        for (const [vPath, data] of exportFiles.entries()) {
          zip.file(vPath, data);
        }
        return await zip.generateAsync({ type: "uint8array", compression: "STORE" });
      }
      else if (mode === "folder") {
        if (!dirHandle) throw new Error("Folder mode requires dirHandle");
        for (const [vPath, data] of exportFiles.entries()) {
          const segments = vPath.split("/");
          const fileName = segments.pop();
          let currentHandle = dirHandle;

          for (const folder of segments) {
            if (folder) {
              currentHandle = await currentHandle.getDirectoryHandle(folder, { create: true });
            }
          }

          if (fileName) {
            const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
          }
        }
      }
    }

    public async importUser(
      userId: string,
      options: UserIOOptions,
      mode: "zip" | "folder",
      source: Blob | Uint8Array | ArrayBuffer | any
    ): Promise<void> {
      if (!await this.havThisUser(userId)) {
        await fs.mkdir(this.usrDir(userId), { recursive: true });
        await this.createFolder(userId);
      }

      const uDir = this.usrDir(userId);
      const importMap = new Map<string, Uint8Array | ArrayBuffer | Blob>();

      if (mode === "zip") {
        const rawData = source instanceof Blob ? await source.arrayBuffer()
          : source instanceof Uint8Array ? source.buffer
            : source;
        const zip = await JSZip.loadAsync(rawData);

        for (const file of Object.values(zip.files)) {
          if (!file.dir) {
            importMap.set(file.name, await file.async("uint8array"));
          }
        }
      }
      else if (mode === "folder") {
        const readDirRecursive = async (handle: any, currentPath: string) => {
          for await (const entry of handle.values()) {
            const path = currentPath + entry.name;
            if (entry.kind === 'directory') {
              await readDirRecursive(entry, path + '/');
            } else if (entry.kind === 'file') {
              const file = await entry.getFile();
              importMap.set(path, await file.arrayBuffer());
            }
          }
        };
        await readDirRecursive(source, "");
      }

      const writeFileFromMap = async (vPath: string, realPath: string) => {
        const data = importMap.get(vPath);
        if (data) {
          const segments = realPath.split("/").slice(0, -1);
          if (segments.length > 0) {
            await fs.mkdir(segments.join("/") + "/", { recursive: true });
          }
          await fs.writeFile(realPath, new Uint8Array(data as ArrayBuffer));
        }
      };

      await writeFileFromMap("setting.json", uDir + "setting.json");
      await writeFileFromMap("saveInfo.json", uDir + "saveInfo.json");
      await writeFileFromMap("state.json", uDir + "state.json");

      if (options.workspaces) {
        const wsBase = this.usrSubDir(userId, "workspaces");
        await fs.rm(wsBase, { recursive: true, force: true });
        await fs.mkdir(wsBase, { recursive: true });

        for (const vPath of importMap.keys()) {
          if (vPath.startsWith("workspaces/")) {
            await writeFileFromMap(vPath, uDir + vPath);
          }
        }
      }

      if (options.history) {
        const histBase = this.usrSubDir(userId, "history");
        await fs.rm(histBase, { recursive: true, force: true });
        await fs.mkdir(histBase, { recursive: true });
        for (const vPath of importMap.keys()) {
          if (vPath.startsWith("history/")) await writeFileFromMap(vPath, uDir + vPath);
        }
      }

      if (options.saves) {
        await writeFileFromMap("saves/download.json", uDir + "saves/download.json");
        await writeFileFromMap("saves/wallpapers.json", uDir + "saves/wallpapers.json");
      }

      if (options.tempList) {
        const tmpBase = this.tmpListDir(userId);
        await fs.rm(tmpBase, { recursive: true, force: true });
        await fs.mkdir(tmpBase, { recursive: true });
        for (const vPath of importMap.keys()) {
          if (vPath.startsWith("saves/tmpList/")) await writeFileFromMap(vPath, uDir + vPath);
        }
      }

      if (options.cache) {
        const cacheBase = this.usrSubDir(userId, "storage");
        await fs.rm(cacheBase, { recursive: true, force: true });
        await fs.mkdir(cacheBase, { recursive: true });
        for (const vPath of importMap.keys()) {
          if (vPath.startsWith("storage/")) await writeFileFromMap(vPath, uDir + vPath);
        }
      }

      if (options.offlineDB && importMap.has("offline.db")) {
        try {
          await import("dexie-export-import");

          const dbBlobData = importMap.get("offline.db")!;
          const blob = new Blob([dbBlobData as any]);
          const db = new e621DatabaseCache.E621Database(userId);

          await db.delete();
          await db.init();
          await db.import(blob);
        } catch (e) {
          console.error("Offline DB Import failed", e);
        }
      }

      try {
        const stateStore = await this.userState(userId);
        const state = await stateStore.get();
        const wsBase = this.usrSubDir(userId, "workspaces");

        if (!await fs.exists(wsBase + state.nowWorkSpace + "/")) {
          const availableWorkspaces = await this.listWorkspaces(userId);

          if (availableWorkspaces.length > 0) {
            const firstWs = availableWorkspaces[0];
            await stateStore.set(prev => {
              prev.nowWorkSpace = firstWs;
              return prev;
            });
            console.warn(`Workspace [${state.nowWorkSpace}] not found. Fallback to [${firstWs}].`);
          } else {
            const newWsId = "0";
            const defaultWs: workSpaceType.WorkSpaces.WorkSpaces = {
              id: newWsId,
              setting: { wallpaper: { url: BACKGROUND_IMAGE.src }, color: "#ffffff" },
              note: { name: "Main", note: "" },
              status: [],
              preview: []
            };
            await this.addWorkspace(userId, defaultWs);
            await stateStore.set(prev => {
              prev.nowWorkSpace = newWsId;
              return prev;
            });
          }
        }
      } catch (e) {
        console.error("Workspace state validation failed after import", e);
      }
    }

    // #endregion

  }
}

namespace MenuAction {

  export type Item = {
    name: string
    action?: () => void | Promise<void>,
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

type PostsCache = Record<number, E621.Post[]>;
type Resolution = [number, number]

type createWindow = (
  wmRef: RefObject<WindowManager<e621Type.defaul> | null>,
  customData: e621Type.defaul,
  other?: {
    id?: string,
    left?: number;
    top?: number;
    anchor?: WindowAnchor
  },
  setData?: boolean
) => string | undefined;

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
// #endregion

let WSA: WSAction.WorkSpaceActions
let E621_DB: e621DatabaseCache.E621Database

const MenuAction: MenuAction.ActionType = {
  showMenu: () => { },
  closeMenu: () => { }
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
    case "postImg": {
      url = item.data.file.url!;
      break;
    };
    case "pool": {
      url = "https://e621.net/pools/" + item.data.poolId;
      break;
    };
    case "postId": {
      url = "https://e621.net/pools/" + item.data;
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
  copyJSON: (data?: object, active?: boolean, text?: string) => {
    return data ? [{
      name: text ?? t("menuButton.CopyRawJson"),
      action() {
        someActions.copyString(JSON.stringify(data, null, 2))
      },
      dragItem: {
        type: "text",
        data: JSON.stringify(data, null, 2),
      },
      active: active
    }] as MenuAction.Item[] : []
  },
  post: (id: number | string, post?: E621.Post | null, urlQue?: object, mode?: "id" | "viewer") => {

    const _: MenuAction.Item[] = [
      {
        name: t("menuButton.OpenWithBrowser"),
        action() {
          open(`https://e621.net/posts/${id}${urlQue ? "?" : ""}${makeQuery(urlQue ?? {})}`)
        },
        dragItem: {
          type: "post",
          data: post!
        },
        active: !!post
      },
      mode !== "viewer" ? {
        name: t("menuButton.OpenWithViewer"),
        action() {
          if (post)
            someActions.openWithViewer(post)
        },
        dragItem: {
          type: "postImg",
          data: post!
        },
        active: !!post
      } : undefined,
      mode !== "id" ? {
        name: t("menuButton.OpenWithGetByID"),
        action() {
          if (post)
            someActions.openWithGetByID(post)
        },
        dragItem: {
          type: "post",
          data: post!
        },
        active: !!post
      } : undefined,
      {
        name: t("menuButton.SaveToTmp"),
        action() {
          if (post)
            someActions.saveToTmp(usrIndx, {
              type: "postGetByID",
              data: {
                currentId: post.id,
                status: "success",
                fetchedPost: post
              }
            }, `Post Get By ID [ ${post.id} ]`, `post_get_by_id-${post.id}`)
        },
        dragItem: {
          type: "post",
          data: post!
        },
        active: post ? true : false,
      },
      {
        name: (() => {
          switch (post?.file.ext) {
            case "jpg":
            case "jpeg":
            case "png":
            case "webp":
            case "gif":
              return t("menuButton.DownloadImage")
            case "webm":
            case "mp4":
              return t("menuButton.DownloadVideo")
            default:
              return t("menuButton.Download")
          }
        })(),
        action: async () => {
          const url = post?.file.url;
          if (!url) return;

          _app.throwNewNotic("開始下載...");

          const extension = url.split('.').pop() || 'bin';
          const filename = `e621_${post.id}.${extension}`;

          await tools.downloadMedia(url, filename);

          _app.throwNewNotic("下載完成");
        },
        dragItem: {
          type: "postImg",
          data: post!
        },
        active: !!post?.file.url
      },
      {
        name: t("menuButton.CopyURL"),
        action() {
          someActions.copyString(`https://e621.net/posts/${id}${urlQue ? "?" : ""}${makeQuery(urlQue ?? {})}`)
        },
        dragItem: {
          type: "post",
          data: post!
        },
        active: !!post
      },
      ...(() => {
        switch (post?.file.ext) {
          case "jpg":
          case "jpeg":
          case "png":
          case "webp":
            return [{
              name: t("menuButton.CopyImage"),
              action: async () => {
                const url = post?.file.url
                if (!url) return;
                try {
                  _app.throwNewNotic("載圖ing");
                  const proxiedUrl = toProxiedUrl(url);
                  const response = await fetch(proxiedUrl);
                  const originalBlob = await response.blob();

                  const pngBlob = originalBlob.type === "image/png"
                    ? originalBlob
                    : await tools.convertToPng(originalBlob);

                  const data = [new ClipboardItem({ "image/png": pngBlob })];
                  await navigator.clipboard.write(data);

                  _app.throwNewNotic("圖片已成功複製到剪貼簿！");
                } catch (err) {
                  _app.throwNewNotic("複製失敗 檢查一下console");
                  console.error(err)
                }
              },
              dragItem: {
                type: "postImg",
                data: post!
              },
              active: !!post?.file.url
            }] as MenuAction.Item[]

          default:
            return []
        }
      })(),
      {
        name: t("menuButton.CopyID"),
        action() {
          someActions.copyString(id.toString())
        },
        dragItem: {
          type: "text",
          data: id.toString()
        }
      },
      {
        name: t("menuButton.SetAsWallpaper"),
        action() {
          if (post)
            someActions.setAsWallpaper(usrIndx, post.file.url!, post)
        },
        active: post ? true : false,
      },
      {
        name: t("menuButton.SetAsAvatar"),
        action() {
          if (post)
            someActions.setAvatar(usrIndx, post.file.url!, post)
        },
        active: post ? true : false,
      },
      ...menuBtn.copyJSON(post ? post : {}, post ? true : false,),
    ]
    return _
  },
  tag: (tag: string) => {
    const _: MenuAction.Item[] = [
      {
        name: t("menuButton.CopyTagName"),
        action() {
          someActions.copyString(tag)
        },
        dragItem: {
          type: "text",
          data: tag
        }
      },
      {
        name: t("menuButton.OpenWithPostSearch"),
        action() {
          createWindow(wmRef, {
            type: "postSearch",
            data: {
              searchTags: [tag],
              pageCache: [],
              nowPage: 1,
            }
          })
        },
        dragItem: {
          type: "postSearch",
          data: {
            searchTags: [tag],
            pageCache: [],
            nowPage: 1,
          }
        }
      },

    ]

    return _
  }
}

const fuckingState = {
  resolution: () => {
    const [resolution, setResolution] = useState<Resolution>([0, 0]);

    useEffect(() => {
      const onResize = () => {
        setResolution([window.innerWidth, window.innerHeight])
      }
      onResize()
      window.addEventListener("resize", onResize)
      return () => {
        window.removeEventListener("resize", onResize)
      }
    }, [])

    return resolution
  },
  clock: () => {
    const [timeCode, setTimeCode] = useState<number>(GetNowTime())

    useEffect(() => {
      const interv = setInterval(() => {
        setTimeCode(GetNowTime())
      }, .2e3)

      return () => clearInterval(interv)
    }, [])

    return timeCode
  }
}

/* ========================================================================================= */

let createWindow: createWindow = () => "none";

const EmptyAccount: ((option: EmptyAccountOption) => workSpaceType.User) = (opt: EmptyAccountOption) => {
  const _: workSpaceType.User = {
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
      wmSettings: defaultWMSettings,
      performance: {
        All: true,
        cssAnimation: true,
        transition: true,
        transitionDelay: true,
        cssFilter: true,
        backdropFilter: true,
        transparenWinodw: false,
      },
      lang: "en-us",
      search: {
        defaultSearchFilter: {
          rating: {
            s: true,
            e: false,
            q: false,
          }
        },
      },
      download: {
        format: "%artist% - %id%",
        maxConcurrentDownloads: 2,
      },
      appearance: {
        scale: 80,
        color: opt.color ?? "#ffffff",
        wallpaper: opt.wallpaper ?? {
          url: BACKGROUND_IMAGE.src
        },
        clockFormat: [
          ":HH:::mm:::ss:",
          "-dd- -MM- -YY-",
        ],
        KIASTALA: false,
        transparens: false,
      },
      cache: {
        enable: {
          global: false,
          post: {
            data: false,
            image: false,
            thumb: false,
          },
          pool: false,
          tags: false,
        },
        isManualLimit: false,
        limit: {
          _all: 100,
          post: {
            data: 100,
            image: 100,
            thumb: 100,
          },
          pool: 100,
          tags: 100,
        },
        isManualMaxDownload: false,
        maxConcurrentDownload: {
          _all: 100,
          post: {
            image: 100,
            thumb: 100,
          },
        },
        downloadFromCache: false,
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
    state: {
      nowWorkSpace: "main",
    },
    workSpaces: [
      {
        id: "main",
        note: {
          name: "Main",
        },
        preview: [],
        status: [],
        setting: {
          wallpaper: opt.wallpaper ?? {
            url: BACKGROUND_IMAGE.src
          },
          color: opt.color ?? "#ffffff",
        }
      }
    ]
  }

  return _
}

const newEmptyAccount = EmptyAccount({ name: "", id: "" })

/* ========================================================================================= */

let [isLogin, setIsLogin]: DispType<boolean> = [false, () => { }]
let [displayDesktop, setDisplayDesktop]: DispType<boolean> = [false, () => { }]
let [importing, setImporting]: DispType<boolean> = [false, () => { }]
let [nowSetting, _setNowSetting]: DispType<workSpaceType.Unit.Setting> = [newEmptyAccount.setting, () => { }]
let [nowSaveInfo, setNowSaveInfo]: DispType<workSpaceType.Unit.SaveInfo> = [newEmptyAccount.saveInfo, () => { }]

const setNowSetting = (e: workSpaceType.Unit.Setting) => {
  Cache.syncSettings(e.cache)
  return _setNowSetting(merge({}, newEmptyAccount.setting, e));
}

const t = (key: keyof typeof langList['en-us']) => {
  const list = (langList as any)[nowSetting.lang]

  if (list) {
    const tt = list[key] ?? key;

    return tt
  } else {
    return key.match(/\.([^.]+$)/)![1]
  }
};

const ent = (key: keyof typeof langList['en-us']) => {
  const list = (langList as any)["en-us"]

  if (list) {
    const tt = list[key] ?? key;

    return tt
  } else {
    return key.match(/\.([^.]+$)/)![1]
  }
};

/* ========================================================================================= */

const E621_AUTH = () => {
  const saveInfo = nowSaveInfo
  return (saveInfo.user.e621 && saveInfo.user.e621.name && saveInfo.user.e621.key ? {
    name: saveInfo.user.e621.name,
    key: saveInfo.user.e621.key,
  } : undefined)
}

const PERFORMANCE_SET = () => {
  const { performance } = nowSetting;
  return performance
}

const DELAY_EFFECT = (has: any, not?: any) => {
  const performance = PERFORMANCE_SET();
  const { transition, transitionDelay } = performance;
  return (transition && transitionDelay) ? has : not;
}

/* ========================================================================================= */

const someActions = {
  setAppState: async (
    chang: (e: workSpaceType.App) => workSpaceType.App
  ) => {
    await WSA.setAppStatus(chang(await WSA.getAppStatus()))
  },
  setSetting: async (
    id: string,
    chang: (e: workSpaceType.Unit.Setting) => workSpaceType.Unit.Setting
  ) => {
    const set = await WSA.userSetting(id)
    await set.set(chang(await set.get()))
  },
  setUsrInfo: async (
    id: string,
    chang: (e: workSpaceType.Unit.SaveInfo) => workSpaceType.Unit.SaveInfo
  ) => {
    const set = await WSA.userSaveInfo(id)
    await set.set(chang(await set.get()))
  },
  setAsWallpaper: async (id: string, url: string, post?: E621.Post,) => {
    const state = await (await WSA.userState(id)).get()
    const wsInfo = await WSA.getWorkspaceInfo(id, state.nowWorkSpace, "setting")
    await WSA.updateWorkspace(id, state.nowWorkSpace, {
      setting: {
        wallpaper: {
          url,
          positionX: 50,
          positionY: 50,
          fromPost: post
        },
        color: wsInfo.color
      }
    })
  },
  setColor: async (id: string, color: string,) => {
    const state = await (await WSA.userState(id)).get()
    const wsInfo = await WSA.getWorkspaceInfo(id, state.nowWorkSpace, "setting")
    await WSA.updateWorkspace(id, state.nowWorkSpace, {
      setting: {
        wallpaper: wsInfo.wallpaper,
        color: color
      }
    })
  },
  setAvatar: async (id: string, url: string, post?: E621.Post,) => {
    await someActions.setUsrInfo(id, e => {
      e.user.avatar = {
        url,
        positionX: 50,
        positionY: 50,
        fromPost: post
      }
      return e
    })
  },
  saveToTmp: async (id: string, item: e621Type.defaul, title: string, windowId: string) => {
    await WSA.addTmpItem(id, {
      createAt: GetNowTime(),
      windowTitle: title,
      windowId,
      data: cloneDeep(item),
    })
  },
  copyString: (data: string) => {
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
        .replaceAll(new RegExp(`%${name}--(.*)%`, "g"), (_, exclude: string) => {
          return array.filter(e => !exclude.split(",").some(x => e === x)).join("_")
        })
        .replaceAll(new RegExp(`%${name}\\((.*)\\)--(.*)%`, "g"), (_, join: string, exclude: string) => {
          return array.filter(e => !exclude.split(",").some(x => e === x)).join(join)
        })
    };

    const rep01 = format
      .replaceAll(":HH:", pad(date.getHours()))
      .replaceAll(":mm:", pad(date.getMinutes()))
      .replaceAll(":ss:", pad(date.getSeconds()))
      .replaceAll(":ms:", pad(date.getMilliseconds(), 3))
      .replaceAll("-YY-", str(date.getFullYear()))
      .replaceAll("-yy-", str(date.getFullYear()).slice(-2))
      .replaceAll("-mm-", pad(date.getMonth() + 1))
      .replaceAll("-dd-", pad(date.getDate()))
      .replaceAll("%id%", str(post.id))
      .replaceAll("%artist%", post.tags.artist.join("_"))
      .replaceAll("%character%", post.tags.character.join("_"))
      .replaceAll("%copyright%", post.tags.copyright.join("_"))
      .replaceAll("%general%", post.tags.general.join("_"))
      .replaceAll("%species%", post.tags.species.join("_"))
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
          case "s": return s
          case "q": return q
          case "e": return e
        }
      });

    const allTags = [
      ...post.tags.artist,
      ...post.tags.character,
      ...post.tags.copyright,
      ...post.tags.general,
      ...post.tags.invalid,
      ...post.tags.lore,
      ...post.tags.meta,
      ...post.tags.species,
    ];

    const rep02 = tagReplase(rep01, "artist", post.tags.artist);
    const rep03 = tagReplase(rep02, "character", post.tags.character);
    const rep04 = tagReplase(rep03, "copyright", post.tags.copyright);
    const rep05 = tagReplase(rep04, "general", post.tags.general);
    const rep06 = tagReplase(rep05, "species", post.tags.species);
    const rep07 = tagReplase(rep06, "tags", allTags);

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

const tools = {
  applyFiltersAndSort: (currentPosts: E621.Post[], searchFilter?: e621Type.window.dataType.searchFilter) => {
    let result = [...currentPosts];
    if (!searchFilter) return result;

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
          case "score": return b.score.total - a.score.total;
          case "favs": return b.fav_count - a.fav_count;
          case "size": return b.file.size - a.file.size;
          case "newest":
          default: return b.id - a.id;
        }
      });
    }

    if (searchFilter.reverse) {
      result.reverse();
    }

    return result;
  },
  convertToPng: async function (blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context failed"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) resolve(pngBlob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for conversion"));
      };

      img.src = url;
    });
  },
  downloadMedia: async function (url: string, filename: string) {
    try {
      const proxiedUrl = toProxiedUrl(url);
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      _app.throwNewNotic("下載失敗");
    }
  },
}

/* ========================================================================================= */

let CACHE_BASE_ROOT = "/.cache";
let THUMB_ROOT = `${CACHE_BASE_ROOT}/thumbnail`;
let POST_ROOT = `${CACHE_BASE_ROOT}/posts`;

namespace Cache {
  export type CacheID = string;
  export type CacheExt = string;
  export type CacheType = 'thumb' | 'post';

  export type CacheSettings = workSpaceType.Unit.SettingUnit.Cache;

  export let latestSettings: CacheSettings | null = null;

  export function syncSettings(settings: CacheSettings) {
    latestSettings = settings;
    if (!Queues.thumb.running) _pump('thumb');
    if (!Queues.post.running) _pump('post');
  }

  export interface DownloadTask {
    id: CacheID;
    ext: CacheExt;
    url: string;
    type: CacheType;
    onDone: (blob: Blob) => void;
    onError?: (err: unknown) => void;
  }

  const Queues = {
    thumb: {
      queue: [] as DownloadTask[],
      inFlight: new Set<CacheID>(),
      running: false,
    },
    post: {
      queue: [] as DownloadTask[],
      inFlight: new Set<CacheID>(),
      running: false,
    }
  };

  export namespace Cache {
    export function getRootPath(type: CacheType): string {
      return type === 'post' ? POST_ROOT : THUMB_ROOT;
    }

    export function getFilePath(id: CacheID, ext: CacheExt, type: CacheType): string {
      return `${getRootPath(type)}/${id}.${ext}`;
    }

    export async function ensureRoot(): Promise<void> {
      try {
        await fs.mkdir(THUMB_ROOT, { recursive: true });
        await fs.mkdir(POST_ROOT, { recursive: true });
      } catch { }
    }

    export async function pathExists(path: string): Promise<boolean> {
      try {
        await fs.stat(path);
        return true;
      } catch {
        return false;
      }
    }

    export async function isCached(id: CacheID, ext: CacheExt, type: CacheType = 'thumb'): Promise<boolean> {
      return pathExists(getFilePath(id, ext, type));
    }

    export async function readBlob(id: CacheID, ext: CacheExt, type: CacheType = 'thumb'): Promise<Blob | null> {
      const path = getFilePath(id, ext, type);
      if (!(await pathExists(path))) return null;

      const buffer = await fs.readFile(path, null);
      const mime = extToMime(ext);
      return new Blob([buffer as any], { type: mime });
    }

    export async function writeBlob(
      id: CacheID,
      ext: CacheExt,
      data: ArrayBuffer | Blob,
      type: CacheType
    ): Promise<Blob> {
      await ensureRoot();

      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      const path = getFilePath(id, ext, type);
      await fs.writeFile(path, buffer);

      const mime = extToMime(ext);
      const blob = new Blob([buffer], { type: mime });

      if (latestSettings) {
        enforceLimits(type, latestSettings).catch(err => console.error('Cache limit enforcement failed:', err));
      }

      return blob;
    }

    export async function remove(id: CacheID, ext: CacheExt, type: CacheType = 'thumb'): Promise<void> {
      const path = getFilePath(id, ext, type);
      try { await fs.unlink(path); } catch { }
    }

    export async function clear(): Promise<void> {
      try { await fs.rmdir(CACHE_BASE_ROOT, { recursive: true }); } catch { }
      await ensureRoot();
    }

    export function enqueue(task: DownloadTask): void {
      const state = Queues[task.type];
      state.queue.push(task);
      if (!state.running) _pump(task.type);
    }

    export function download(
      id: CacheID,
      ext: CacheExt,
      url: string,
      type: CacheType = 'thumb'
    ): Promise<Blob> {
      return new Promise<Blob>((resolve, reject) => {
        console.log(`Enqueue: ${id} / ${url}`);

        const customTask: DownloadTask = {
          id, ext, url, type,
          onDone: resolve,
          onError: reject
        };

        enqueue(customTask);
      });
    }

    export async function enforceLimits(type: CacheType, settings: CacheSettings): Promise<void> {
      const dirPath = getRootPath(type);
      if (!(await pathExists(dirPath))) return;

      let limitCount = settings.limit._all;

      if (settings.isManualLimit) {
        limitCount = type === 'post' ? settings.limit.post.image : settings.limit.post.thumb;
      }

      if (limitCount === 0) return;

      try {
        const files = await fs.readdir(dirPath);

        if (files.length <= limitCount) return;

        const fileStats = await Promise.all(
          files.map(async (filename) => {
            const filePath = `${dirPath}/${filename}`;
            const stats = await fs.stat(filePath);
            return { filePath, mtime: stats.mtime.getTime() };
          })
        );

        fileStats.sort((a, b) => a.mtime - b.mtime);

        const filesToDeleteCount = fileStats.length - limitCount;

        for (let i = 0; i < filesToDeleteCount; i++) {
          await fs.unlink(fileStats[i].filePath);
        }
      } catch (err) {
        console.error(`Failed to enforce limit for ${type}:`, err);
      }
    }
  }

  async function _pump(type: CacheType): Promise<void> {
    const state = Queues[type];
    state.running = true;

    while (state.queue.length > 0) {
      let maxConcurrent = 3;
      if (latestSettings) {
        maxConcurrent = latestSettings.maxConcurrentDownload._all;
        if (latestSettings.isManualMaxDownload) {
          maxConcurrent = type === 'post'
            ? latestSettings.maxConcurrentDownload.post.image
            : latestSettings.maxConcurrentDownload.post.thumb;
        }
      }

      if (state.inFlight.size >= maxConcurrent) break;

      const taskIndex = state.queue.findIndex(t => !state.inFlight.has(t.id));
      if (taskIndex === -1) break;

      const [task] = state.queue.splice(taskIndex, 1);
      state.inFlight.add(task.id);

      _runTask(task).finally(() => {
        state.inFlight.delete(task.id);
        _pump(type);
      });
    }

    if (state.queue.length === 0 && state.inFlight.size === 0) {
      state.running = false;
    }
  }

  async function _runTask(task: DownloadTask): Promise<void> {
    try {
      const cached = await Cache.readBlob(task.id, task.ext, task.type);
      if (cached) { task.onDone(cached); return; }

      const proxiedUrl = toProxiedUrl(task.url);
      const res = await fetch(proxiedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} – ${task.url}`);

      const buffer = await res.arrayBuffer();
      const blob = await Cache.writeBlob(task.id, task.ext, buffer, task.type);

      task.onDone(blob);
    } catch (err) {
      task.onError?.(err);
    }
  }

  function extToMime(ext: CacheExt): string {
    const map: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", avif: "image/avif",
      webm: "video/webm", mp4: "video/mp4",
    };
    return map[ext.toLowerCase()] ?? "application/octet-stream";
  }

  export function useCachedThumbnail(post: E621.Post) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;
      let currentUrl: string | null = null;

      async function loadImage() {
        const id = String(post.id);
        const urlExt = post.preview?.url?.split('.').pop();
        const ext = urlExt || "jpg";
        const remoteUrl = post.preview?.url || "";

        try {
          let blob = await Cache.readBlob(id, ext, 'thumb');

          if (blob) {
            if (isMounted) {
              currentUrl = URL.createObjectURL(blob);
              setBlobUrl(currentUrl);
            }
          } else {
            const isEnabled = (latestSettings?.enable.post.thumb && latestSettings?.enable.global) ?? false;

            if (isEnabled && remoteUrl) {
              blob = await Cache.download(id, ext, remoteUrl, 'thumb');
              if (isMounted && blob) {
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
              }
            } else {
              if (isMounted) setBlobUrl(remoteUrl || null);
            }
          }
        } catch (err) {
          console.error(`Thumbnail failed: ${id}`, err);
          if (isMounted) setBlobUrl(remoteUrl || null);
        }
      }

      loadImage();
      return () => {
        isMounted = false;
        if (currentUrl) URL.revokeObjectURL(currentUrl);
      };
    }, [post.id, post.preview?.url]);

    return blobUrl;
  }

  export function useCachedPost(post: E621.Post) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;
      let currentUrl: string | null = null;

      async function loadFile() {
        const id = String(post.id);
        const ext = post.file?.ext || "jpg";
        const remoteUrl = post.file?.url || "";

        try {
          let blob = await Cache.readBlob(id, ext, 'post');

          if (blob) {
            if (isMounted) {
              currentUrl = URL.createObjectURL(blob);
              setBlobUrl(currentUrl);
            }
          } else {
            const isEnabled = (latestSettings?.enable.post.image && latestSettings?.enable.global) ?? false;

            if (isEnabled && remoteUrl) {
              blob = await Cache.download(id, ext, remoteUrl, 'post');
              if (isMounted && blob) {
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
              }
            } else {
              if (isMounted) setBlobUrl(remoteUrl || null);
            }
          }
        } catch (err) {
          console.error(`Post failed: ${id}`, err);
          if (isMounted) setBlobUrl(remoteUrl || null);
        }
      }

      loadFile();
      return () => {
        isMounted = false;
        if (currentUrl) URL.revokeObjectURL(currentUrl);
      };
    }, [post.id, post.file?.url]);

    return blobUrl;
  }
}

/* ========================================================================================= */

namespace Components {

  export type Card = {
    event?: {
      mouseLeave?: (p: E621.Post) => void
      mouseMove?: (p: E621.Post) => void
    }
    post: E621.Post,
    onClick?: MouseEventHandler<HTMLButtonElement>,
    actionMenu: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => void,
    delay?: number,
    q?: object
  }

  export type Post = {
    postData: E621.Post,
    thisWindow?: WindowInstance<e621Type.defaul>
  }

  export type PostViewer = {
    post: E621.Post,
    prev?: string,
    main?: string
  }

}

const Components = {
  Card: ({ post, onClick, actionMenu, delay, q, event }: Components.Card) => {
    const totalScore = post.score.total
    const favIsNav = totalScore === 0 ? null : totalScore < 0 ? "--" : "++"
    const cachedSrc = Cache.useCachedThumbnail(post);
    const [suses, setSuses] = useState(false)

    const hoverTips = [
      `Rating ${post.rating}`,
      `ID ${post.id}`,
      `Create at ${post.created_at}`,
      `Score ${post.score.total}`,
    ].join("<br/>")

    return <button
      onMouseLeave={() => event?.mouseLeave?.(post)}
      onMouseMove={() => event?.mouseMove?.(post)}
      className={style["Card"]}
      key={post.id}
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        dragItem(e, {
          type: "post",
          data: post
        }, q)
      }}
      style={{
        transitionDelay: DELAY_EFFECT(delay + "s")
      }}
    >
      <div className={style["previewImage"]}>
        <div className={style["vid"]}>
          {post.file.ext === 'webm' || post.file.ext === 'mp4' ? (
            <video
              key={cachedSrc}
              poster={cachedSrc || ""}
            />
          ) : (
            <img
              src={cachedSrc || ""}
              alt=""
              onLoad={() => setSuses(true)}
              style={{ opacity: suses ? 1 : 0, transition: 'opacity 0.3s' }}
            />
          )}
        </div>
      </div>

      <div className={style["Info"]}>
        <div className={style["baseInfo"]}>
          <div className={style["score"]}>
            <div className={clsx(style["up"], favIsNav === "++" ? style["here"] : "")}>
              <div className={style["icon"]}>{"+"}</div>
              <div>{post.score.up}</div>
            </div>

            <div className={clsx(style["down"], favIsNav === "--" ? style["here"] : "")}>
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
  Post: ({ postData: post, thisWindow }: Components.Post) => {
    const [start, setStart] = useState<boolean>(false)
    const cachedMainSrc = Cache.useCachedPost(post);
    const cachedPrevSrc = Cache.useCachedThumbnail(post);

    const eRef = useRef<HTMLDivElement>(null)

    const actionMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, tag: string) => {
      event.stopPropagation(); event.preventDefault();
      const btnRect = event.currentTarget.getBoundingClientRect();
      MenuAction.showMenu(menuBtn.tag(tag), [btnRect.bottom, btnRect.left]);
    }

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

    const postBtn = (id: number) => ({
      name: id.toString(),
      action() { createWindow(wmRef, { type: "postGetByID", data: { status: "loading", currentId: id } }) },
      dragItem: { type: "postId", data: id }
    }) as MenuAction.Item;

    const poolBtn = (id: number) => ({
      name: id.toString(),
      action() { createWindow(wmRef, { type: "pool", data: { poolId: id, nowPage: 1, pageCache: [], } }) },
      dragItem: { type: "poolId", data: id }
    }) as MenuAction.Item;

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
      className={clsx(style["Post"], start ? style["START"] : "")}
    >
      <div className={style["Tags"]} >
        {
          ([
            [t("components.post.Artists"), post?.tags.artist],
            [t("components.post.Copyrights"), post?.tags.copyright],
            [t("components.post.Character"), post?.tags.character],
            [t("components.post.Species"), post?.tags.species],
            [t("components.post.General"), post?.tags.general],
            [t("components.post.Meta"), post?.tags.meta],
            [t("components.post.Lore"), post?.tags.lore],
            ["Source", undefined],
            ["Information", undefined],
          ] as [string, (string[] | undefined)][])
            .filter(e => e[1]?.length || (e[0] === "Source" && post.sources.length > 0) || e[0] === "Information")
            .map((list, indx) => {
              let dely = indx * .15
              if (list[0] === "Source")
                return (
                  <div
                    className={clsx(style["Source"], style["list"])}
                    style={{
                      transitionDelay: DELAY_EFFECT(`${dely}s`)
                    }}
                    key={dely}
                  >
                    <span className={style["title"]}>{t("components.post.Source")}</span>
                    <div className={style["src"]}>
                      {
                        post.sources.map((e, indx) => <div
                          style={{
                            transitionDelay: DELAY_EFFECT(`${dely + (indx * .1)}s`)
                          }}
                          key={indx}
                        >
                          <a
                            kilo-style=""
                            href={e}
                            target="_blank"
                          >{e}</a>
                        </div>)
                      }
                    </div>
                  </div>
                )
              if (list[0] === "Information")
                return <div
                  className={clsx(style["Information"], style["list"])}
                  style={{
                    transitionDelay: DELAY_EFFECT(`${dely + (indx * .01)}s`)
                  }}
                  key={dely}
                >
                  <span className={style["title"]}>{t("components.post.Information")}</span>
                  <div className={style["info"]}>
                    {
                      ([
                        ["ID", post.id],
                        ["MD5", post.file.md5],
                        [t("components.post.info.Size"), `${post.file.width}x${post.file.height} (${(post.file.size / 1024 / 1024).toFixed(2) + " MB"})`],
                        [t("components.post.info.Type"), post.file.ext.toLocaleUpperCase()],
                        "CLIP",
                        [t("components.post.info.Rating"), post.rating.toLocaleUpperCase()],
                        [t("components.post.info.Score"), post.score.total],
                        [t("components.post.info.Favs"), post.fav_count],
                        "CLIP",
                        [t("components.post.info.Posted"), dateToString(post.created_at)],
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
                                transitionDelay: DELAY_EFFECT(`${dely + (indx * .05)}s`)
                              }}
                            >{e[0]}</div>
                            <div
                              className={style["value"]}
                              key={`value_${indx}`}
                              style={{
                                transitionDelay: DELAY_EFFECT(`${dely + (indx * .05)}s`)
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
                  className={clsx(style[list[0]], style["list"])}
                  style={{
                    transitionDelay: DELAY_EFFECT(`${dely}s`)
                  }}
                >
                  <span className={style["title"]}>{list[0]}</span>
                  <div className={style["tags"]}>
                    {list[1]!.map((tag, indx) => <>
                      <div className={style["tag"]}
                        style={{
                          transitionDelay: DELAY_EFFECT(`${dely + (indx * .01)}s`)
                        }}
                        key={indx}
                      >
                        <div
                          className={clsx(
                            style["action"],
                            style["add"]
                          )}
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

                        <div
                          className={clsx(
                            style["action"],
                            style["not"]
                          )}
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
                            createWindow(wmRef, {
                              type: "postSearch",
                              data: {
                                nowPage: 1,
                                pageCache: [],
                                searchTags: [tag],
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
                        <div
                          className={style["more"]}
                          onClick={(event) => actionMenu(event, tag)}
                          onMouseDown={(event) => actionMenu(event, tag)}
                        >{"..."}</div>
                      </div>
                    </>)}
                  </div>
                </div>
            })}
      </div>
      <div className={style["Preview"]}>
        <Components.PostViewer
          post={post}
          main={cachedMainSrc ?? undefined}
          prev={cachedPrevSrc ?? undefined}
        />

        <div className={style["BaseInfo"]}>
          <div className={style["arts"]}>
            {post.tags.artist.join(",")}
          </div>
          <div className={style["info"]}>
            <span>{post.rating.toLocaleUpperCase()}</span>
            <span>{`#${post.id}`}</span>
            <span>{`+ ${post.score.up}`}</span>
            <span>{`- ${Math.abs(post.score.down)}`}</span>
            <span>{`<3 ${post.fav_count}`}</span>
          </div>
        </div>

        <div className={style["Action"]}>

          <button
            kiase-style=""
            onClick={() => {
              someActions.openWithViewer(post)
            }}
            draggable
            onDragStart={(e) => {
              dragItem(e, { type: "postImg", data: post })
            }}
          >{t("menuButton.OpenWithViewer")}</button>

          <button
            kiase-style=""
            onClick={(e) => {
              someActions.setAsWallpaper(usrIndx, post?.file.url!, post)
            }}
            style={{ marginLeft: "auto" }}
          >{t("menuButton.SetAsWallpaper")}</button>

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
                  dragItem(e, { type: "post", data: post }, { q })
                }
              } else {
                dragItem(e, { type: "post", data: post })
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
                  open(`https://e621.net/posts/${post?.id}?${makeQuery({ q })}`)
                }
              } else if (thisWindow?.customData?.type === "postGetByID") {
                open(`https://e621.net/posts/${post?.id}`)
              }
            }}
          >{t("menuButton.OpenWithBrowser")}</button>
        </div>

        <div className={style["SubPost"]}>

          <div>
            {post.relationships.parent_id ? ((prnt: number) => {
              return <button
                kiase-style=""
                onClick={() => createWindow(wmRef, { type: "postGetByID", data: { status: "loading", currentId: prnt } })}
                draggable
                onDragStart={(e) => dragItem(e, { type: "postId", data: prnt })}
              >{t("components.post.parent") + prnt}</button>
            })(post.relationships.parent_id)
              : <div />}
          </div>

          <div>

            {post.relationships.children.length > 0 ? ((child: number[]) => {
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
                  t("components.post.children")
                  +
                  (moreThenOne ? t("components.post.moreThanOne").replace("$1", child.length) : child[0])}</button>
            })(post.relationships.children)
              : <div />}
          </div>

          <div>
            {post.pools.length > 0 ? ((pool: number[]) => {
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
                  t("components.post.pool")
                  +
                  (moreThenOne ? t("components.post.moreThanOne").replace("$1", pool.length) : pool[0])}</button>
            })(post.pools)
              : <div />}
          </div>

        </div>

        <div className={style["Description"]}>
          {post?.description.split("\n").map((e, i) => <>{e}<br key={i} /></>)}
        </div>

      </div>
    </div>)
  },
  PostViewer: ({ post, prev, main }: Components.PostViewer) => {
    const [isActive, setIsActive] = useState<boolean>(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const INACTIVITY_DELAY = 1500;

    const handleMouseMove = () => {
      if (!isActive) {
        setIsActive(true);
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setIsActive(false);
      }, INACTIVITY_DELAY);
    };

    const handleMouseLeave = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsActive(false);
    };

    return <div className={style["PostViewer"]}>
      {(() => {
        switch (post?.file.ext) {
          case "jpg":
          case "jpeg":
          case "png":
          case "gif":
          case "webp":
            return <div
              className={style["Image"]}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <Viewer
                className={style["Viewer"]}
                tTranslate={{
                  "resetTransform": t("windowsType.viewer.ResetTransform"),
                  "randerMode": t("windowsType.viewer.RenderMode"),
                  "randerMode.auto": t("windowsType.viewer.RenderMode.Auto"),
                  "randerMode.pixelated": t("windowsType.viewer.RenderMode.Pixelated"),
                }}
                contro={isActive}
              >
                <div className={style["main"]}>
                  <img src={main ?? post.file.url ?? ""} loading="lazy" />
                </div>

                <div className={style["prev"]}>
                  <img src={prev ?? post.preview.url ?? ""} loading="lazy" />
                </div>
              </Viewer>
            </div>

          case "webm":
          case "mp4": {
            const videoRef = useRef<HTMLVideoElement>(null);

            const [isPlaying, setIsPlaying] = useState(false);
            const [currentTime, setCurrentTime] = useState(0);
            const [duration, setDuration] = useState(0);
            const [volume, setVolume] = useState(1);
            const [isMuted, setIsMuted] = useState(true);
            const [isLoop, setIsLoop] = useState(true);
            const [isFull, setIsFull] = useState(false);
            const [playbackRate, setPlaybackRate] = useState(1);
            const [isSeeking, setIsSeeking] = useState(false);

            const mainObject = useRef<HTMLDivElement | null>(null);

            const togglePlay = useCallback(() => {
              if (videoRef.current) {
                if (isPlaying) {
                  videoRef.current.pause();
                } else {
                  videoRef.current.play();
                }
                setIsPlaying(!isPlaying);
              }
            }, [isPlaying]);

            const toggleLoop = useCallback(() => {
              if (videoRef.current) {
                if (isLoop) {
                  videoRef.current.loop = false;
                } else {
                  videoRef.current.loop = true;
                }
                setIsLoop(!isLoop);
              }
            }, [isLoop]);

            const toggleFull = useCallback(() => {
              if (mainObject.current) {
                if (isFull) {
                  document.exitFullscreen();
                } else {
                  mainObject.current.requestFullscreen();
                }
                setIsFull(!isFull);
              }
            }, [isFull]);

            const handleSeek = useCallback((time: number) => {
              if (videoRef.current) {
                videoRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }, []);

            const handleVolumeChange = useCallback((val: number) => {
              const newVolume = Math.max(0, Math.min(1, val));
              if (videoRef.current) {
                videoRef.current.volume = newVolume;
                setVolume(newVolume);
                setIsMuted(newVolume === 0);
              }
            }, []);

            const toggleMute = useCallback(() => {
              if (videoRef.current) {
                const nextMuted = !isMuted;
                videoRef.current.muted = nextMuted;
                setIsMuted(nextMuted);
              }
            }, [isMuted]);

            const handlePlaybackRateChange = useCallback((rate: number) => {
              if (videoRef.current) {
                videoRef.current.playbackRate = rate;
                setPlaybackRate(rate);
              }
            }, []);

            const onLoadedMetadata = () => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            };

            const requestRef = useRef(0);

            useEffect(() => {
              const updateProgress = () => {
                if (videoRef.current && !isSeeking) {
                  setCurrentTime(videoRef.current.currentTime);
                }
                requestRef.current = requestAnimationFrame(updateProgress);
              };

              if (isPlaying) {
                requestRef.current = requestAnimationFrame(updateProgress);
              } else {
                cancelAnimationFrame(requestRef.current);
                if (videoRef.current && !isSeeking) {
                  setCurrentTime(videoRef.current.currentTime);
                }
              }

              return () => cancelAnimationFrame(requestRef.current);
            }, [isPlaying, isSeeking]);

            useEffect(() => {
              const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                  setIsFull(false)
                }
              };

              document.addEventListener('fullscreenchange', handleFullscreenChange);

              return () => {
                document.removeEventListener('fullscreenchange', handleFullscreenChange);
              };
            }, []);

            const onPlay = () => setIsPlaying(true);
            const onPause = () => setIsPlaying(false);

            const formatTime = (seconds: number) => {
              const mins = Math.floor(seconds / 60);
              const secs = Math.floor(seconds % 60);
              return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };

            return <div
              className={style["Video"]}
              ref={mainObject}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                backgroundColor: isFull ? "#000" : "",
                cursor: isActive ? "" : "none",
              }}
            >

              <Viewer
                className={style["Viewer"]}
                tTranslate={{
                  "resetTransform": t("windowsType.viewer.ResetTransform"),
                  "randerMode": t("windowsType.viewer.RenderMode"),
                  "randerMode.auto": t("windowsType.viewer.RenderMode.Auto"),
                  "randerMode.pixelated": t("windowsType.viewer.RenderMode.Pixelated"),
                }}
                contro={isActive}
              >
                <div className={style["main"]}>
                  <video
                    src={main ?? post.file.url ?? ""}
                    ref={videoRef}
                    onLoadedMetadata={onLoadedMetadata}
                    onPlay={onPlay}
                    onPause={onPause}
                    loop muted
                  />
                </div>
              </Viewer>

              <div className={style["Contro"]}>
                <div className={clsx(style["Frame"], isActive && style["displayCtrl"])}>

                  <div className={style["play"]}>
                    <button onClick={togglePlay}>
                      {isPlaying ?
                        <svg key={"pause"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" /></svg>
                        :
                        <svg key={"play"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M320-200v-560l440 280-440 280Z" /></svg>
                      }
                    </button>
                    <div>{formatTime(currentTime)}</div>
                    <input
                      type="range"
                      kilo-style=""
                      min={0}
                      max={duration}
                      step={.01}
                      value={currentTime}
                      onChange={e => handleSeek(+e.currentTarget.value)}
                      onMouseDown={_ => setIsSeeking(true)}
                      onMouseUp={_ => setIsSeeking(false)}
                    />
                    <div>{formatTime(duration)}</div>
                    <button onClick={toggleLoop}>
                      {isLoop ?
                        <svg key={"loop"} xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px"><g><rect fill="none" height="24" width="24" /></g><g><path d="M21,1H3C1.9,1,1,1.9,1,3v18c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V3C23,1.9,22.1,1,21,1z M19,19H6.83l1.58,1.58L7,22l-4-4 l4-4l1.41,1.42L6.83,17H17v-4h2V19z M17,10l-1.41-1.42L17.17,7H7v4H5V5h12.17l-1.58-1.58L17,2l4,4L17,10z" /></g></svg>
                        :
                        <svg key={"noloop"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                      }
                    </button>
                  </div>

                  <div className={style["volume"]}>
                    <button onClick={toggleMute}>
                      {isMuted ?
                        <svg key={"mute"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Z" /></svg>
                        :
                        <svg key={"nomute"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320Z" /></svg>
                      }
                    </button>
                    <input
                      type="range"
                      kilo-style=""
                      min={0}
                      max={1}
                      step={.001}
                      value={isMuted ? 0 : volume}
                      onChange={e => handleVolumeChange(+e.currentTarget.value)}
                      onMouseDown={e => { if (isMuted) { handleVolumeChange(+e.currentTarget.value); toggleMute() } }}
                    />
                  </div>

                  <div className={style["full"]}>
                    <button onClick={toggleFull}>
                      {isFull ?
                        <svg key={"nofull"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z" /></svg>
                        :
                        <svg key={"full"} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z" /></svg>
                      }
                    </button>
                  </div>

                </div>
              </div>

            </div>
          }
        }
      })()}
    </div >

  }
}

const NODATA = {
  Fetching: function () {
    const Cers = (<div className={style["Cers"]}>
      {
        [
          [400, 15, 6],
          [250, 12, 4],
          [100, 10, 2],
        ].map((e, i) => <div className={style["cer"]} key={i}>
          <div className={style["Scale"]}
            style={{
              transitionDelay: DELAY_EFFECT(`${i * .2}s`)
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

    return (<div className={style["Fetching"]}>
      {Cers}
      <div className={style["Line"]}>
        {Cers}
        <div className={style["Fill"]}>
          {Cers}
        </div>
      </div>
    </div>)
  },
  None: function ({ WithFilter }: { WithFilter?: boolean }) {
    return (<div className={style["None"]}>
      <div className={style["Text"]}>
        <div className={style["Line"]}>
          {functions.htmlElement.splitToElement("NO DATA", (e, i) => <div key={i} className={style["case"]}>{e}</div>)}
        </div>
        {WithFilter && <div className={style["Line"]}>
          {functions.htmlElement.splitToElement("WITH FILTER", (e, i) => <div key={i} style={{ fontSize: "25px" }} className={style["case"]}>{e}</div>)}
        </div>}
      </div>
    </div>)
  },
  Error: function ({ error, Reload }: { error: string, Reload: () => void }) {
    return (
      <div className={style["Error"]}>
        <div>
          {error}
          <br />
          我懶惰寫界面
          <br />
          <span onClick={Reload}>retry</span>
        </div>
      </div>
    )
  },
}

/* ========================================================================================= */

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
  const [hasClick, setHasClick] = useState(false)
  const [nowButton, setNowButton] = useState(-1)

  useEffect(() => {
    if (!hasClick) return

    const clickEvent = () => {
      setHasClick(false)
      setNowButton(-1)
    }

    document.addEventListener("dragstart", clickEvent)
    document.addEventListener("click", clickEvent)
    return () => {
      document.removeEventListener("dragstart", clickEvent)
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
              className={clsx(nowButton === i && style["activ"])}

              onMouseEnter={(event) => {
                if (!hasClick) return
                onClickEvent(event, btns[1], i === 0)
                setNowButton(i)
              }}
              onMouseDown={(event) => {
                if (hasClick) { setHasClick(false); setNowButton(-1); return; }
                event.stopPropagation();
                onClickEvent(event, btns[1], i === 0)
                setHasClick(true)
                setNowButton(i)
              }}
              onClick={(event) => {
                if (!hasClick) { setHasClick(false); return; }
                onClickEvent(event, btns[1], i === 0)
                setHasClick(true)
                setNowButton(i)
              }}

              style={{ zIndex: menulist.length - i }}
            >
              <div>{btns[0]}</div>
            </button>
          )}
        </div>
      </div>

      <div
        className={clsx(style["MainContent"], className)}
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

const windowActionList: (win?: WindowInstance<e621Type.defaul>) => MenuAction.Item[] = (win) => {
  const setRct = (s: number, p: number) => win?.setRect({ width: s, height: s, left: p, top: p });

  const ReactList: [number, number][] = [
    [95, 2.5],
    [90, 5],
    [85, 7.5],
    [80, 10],
    [75, 12.5],
    [70, 15],
  ]

  return [
    ...ReactList.map(e => ([t("menuButton.ResetRect").replace("$1", e[0]), () => setRct(e[0], e[1])])),
    [t("menuButton.Minimize"), () => win?.minimize()],
    [t("menuButton.Close"), () => win?.close()]
  ].map(e => ({
    name: e[0],
    action: e[1]
  }))
}

const windowAction: (windowID: string, other?: MenuAction.Item[]) => MenuButtonType = (windowID, other) => {
  const win = wmRef.current?.getWindow(windowID)
  return [
    t("menuButton.top.Window"),
    [
      ...other ?? [],
      ...windowActionList(win),
    ],
  ]
}

namespace searchWindow {

  const JumpToPageOverlay = ({
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
      <div ref={touchAreaRef} className={clsx(style["JumpToPage"], jupToPage && style["show"])}>
        <div className={style["Inner"]}>
          <div className={style["Back"]}>
            <button ref={backButtonRef} onClick={() => setJupToPage(false)}>{t("windowsType.postSearch.jumpToPage.Cancel")}</button>
          </div>
          <div className={clsx(style["line"], style["top"])}><div ref={backLineRef} /></div>
          <div className={style["Input"]}>
            {t("windowsType.postSearch.jumpToPage")}
            <input
              ref={inputRef}
              type="number"
              value={jupPage}
              onChange={(e) => setJupPage(+e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(~~(jupPage < 1 ? 1 : jupPage));
                  setJupToPage(false);
                }
              }}
            />
          </div>
          <div className={clsx(style["line"], style["bottom"])}><div ref={applyLineRef} /></div>
          <div className={style["Apply"]}>
            <button ref={applyButtonRef} onClick={() => {
              setPage(~~(jupPage < 0 ? 1 : jupPage));
              setJupToPage(false);
            }}>{t("windowsType.postSearch.jumpToPage.Apply")}</button>
          </div>
        </div>
      </div>
    );
  };

  export const UnifiedPostBrowser = ({ id, mode }: { id: string, mode: "postSearch" | "pool" }) => {
    const POSTS_PER_DISPLAY_PAGE = 75;
    const DISPLAY_PAGES_PER_FETCH = 4;

    const toApiPage = (dp: number) => Math.ceil(dp / DISPLAY_PAGES_PER_FETCH);
    const toSliceIdx = (dp: number) => (dp - 1) % DISPLAY_PAGES_PER_FETCH;

    const windowID = mode === "postSearch" ? `post_search-${id}` : `pool-${id}`;
    const thisWindow = wmRef.current?.getWindow(windowID)!;

    const savedData = thisWindow?.customData?.type === mode ? thisWindow.customData.data : undefined;

    const [page, setPage] = useState<number>(savedData?.nowPage ?? 1);
    const [postsCache, setPostsCache] = useState<PostsCache>(savedData?.pageCache ?? {});
    const postsCacheRef = useRef<PostsCache>(postsCache);
    const [jupToPage, setJupToPage] = useState<boolean>(false);
    const [jupPage, setJupPage] = useState<number>(1);
    const [isFocuOnIt, setFocuOnIt] = useState<boolean>(false);

    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

    const [searchTags, setSearchTags] = useState<string[]>(mode === "postSearch" ? ((savedData as e621Type.window.dataType.postSearch)?.searchTags ?? ["yonkagor", "webm"]) : []);
    const [searchTagsInput, setSearchTagsInput] = useState<string[]>(searchTags);
    const [searchFilter, setSearchFilter] = useState<e621Type.window.dataType.searchFilter>(savedData?.searchFilter ?? nowSetting.search.defaultSearchFilter);
    const [filterPanel, setFilterPanel] = useState<boolean>(false);

    const [poolIdInput, setPoolIdInput] = useState<string | number>(mode === "pool" ? ((savedData as e621Type.window.dataType.pool)?.poolId || id || "") : "");
    const [poolId, setPoolId] = useState<number>(mode === "pool" ? ((savedData as e621Type.window.dataType.pool)?.poolId || Number(id) || 0) : 0);
    const [poolInfo, setPoolInfo] = useState<E621.Pool | undefined>(mode === "pool" ? (savedData as e621Type.window.dataType.pool)?.poolInfo : undefined);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [peekPre, setPeekPre] = useState<E621.Post | undefined>();

    const [fetchId, setFetchId] = useState<number>(0);
    const fetchIdRef = useRef<number>(0);
    fetchIdRef.current = fetchId;
    const fetchingPages = useRef<Set<string>>(new Set());
    const fetchQueueRef = useRef<Promise<void>>(Promise.resolve());
    const scrollPage = useRef<HTMLDivElement>(null);
    const touchAreaRef = useRef<HTMLDivElement>(null);

    const currentPosts = useMemo(() => postsCache[page] || [], [postsCache, page]);
    const processedPosts = useMemo(() => tools.applyFiltersAndSort(currentPosts, searchFilter), [currentPosts, searchFilter]);

    useEffect(() => {
      if (mode === "pool" && poolId !== 0 && (!poolInfo || poolInfo.id !== poolId)) {
        if (OFFLINE_MODE) {
          return;
        }

        LABS_E621_API.pools.get({ id: poolId }).then(info => {
          if (info) {
            setPoolInfo(info as any);
            if (nowSetting.cache.enable.pool && nowSetting.cache.enable.global) {
              E621_DB?.savePool(info as any).catch(err =>
                Kiasole.error(`[E621_DB] savePool 失敗：` + err)
              );
            }
          }
        }).catch(err => Kiasole.error(`Pool Info Fetch Error: ${err}`));
      }
    }, [poolId, mode]);

    useEffect(() => {
      postsCacheRef.current = postsCache;
    }, [postsCache]);

    const fetchPageData = useCallback(async (targetPage: number, currentFetchId: number) => {
      if (mode === "pool" && !poolId) return false;

      const apiPage = toApiPage(targetPage);

      const firstDp = (apiPage - 1) * DISPLAY_PAGES_PER_FETCH + 1;
      const coveredDps = Array.from(
        { length: DISPLAY_PAGES_PER_FETCH },
        (_, i) => firstDp + i
      );

      const allCached = coveredDps.every(dp => !!postsCacheRef.current[dp]);
      if (allCached) return false;

      const pageKey = `${currentFetchId}-api${apiPage}`;
      if (fetchingPages.current.has(pageKey)) return false;
      fetchingPages.current.add(pageKey);

      const task = async () => {
        try {
          if (currentFetchId !== fetchIdRef.current) return;

          const tagsQuery = mode === "postSearch" ? searchTags : [`pool:${poolId}`];
          Kiasole.log(`[預取] API 第 ${apiPage} 頁 → 顯示頁 ${coveredDps.join(",")}`);

          let newPosts: E621.Post[] = [];
          let usedOffline = OFFLINE_MODE;

          try {
            if (OFFLINE_MODE) {
              throw new Error("目前處於 OFFLINE_MODE，跳過 API 請求。");
            }

            newPosts = await LABS_E621_API.posts.search({
              tags: tagsQuery,
              page: apiPage,
              limit: 300,
              user: E621_AUTH()
            });

            if (currentFetchId === fetchIdRef.current) {
              const shouldSaveCache = mode === "pool"
                ? (nowSetting.cache.enable.pool && nowSetting.cache.enable.global)
                : (nowSetting.cache.enable.post.data && nowSetting.cache.enable.global);

              if (shouldSaveCache) {
                E621_DB?.savePosts(newPosts).catch(err => Kiasole.error(`[E621_DB] savePosts 失敗：` + err));
              }
            }
          } catch (apiErr) {
            Kiasole.warn(`API 抓取略過或失敗，嘗試從本地資料庫讀取：${apiErr}`);
            usedOffline = true;

            if (mode === "pool" && poolId) {
              const cachedPosts = await E621_DB?.getPostsInPool(poolId);
              if (cachedPosts) {
                const startIndex = (apiPage - 1) * 300;
                newPosts = cachedPosts.slice(startIndex, startIndex + 300);
              }
            } else {
              newPosts = await E621_DB?.searchPostsLocal(searchTags, apiPage, 300) || [];
            }

            if (newPosts.length === 0) {
              throw new Error(OFFLINE_MODE ? "離線模式且本地資料庫無相關快取。" : "無法連線至 E621，且本地資料庫無相關快取。");
            }
          }

          if (currentFetchId !== fetchIdRef.current) return;

          setIsOfflineMode(usedOffline);

          setPostsCache(prev => {
            const next = { ...prev };
            coveredDps.forEach((dp, i) => {
              next[dp] = newPosts.slice(
                i * POSTS_PER_DISPLAY_PAGE,
                (i + 1) * POSTS_PER_DISPLAY_PAGE
              );
            });
            postsCacheRef.current = next;
            return next;
          });

          setFetchError(null);
        } catch (err) {
          Kiasole.error(`第 ${apiPage} 頁抓取失敗 (線上/離線皆失敗)：` + err);
          setFetchError(String(err));
        } finally {
          fetchingPages.current.delete(pageKey);
        }
      };

      fetchQueueRef.current = fetchQueueRef.current.then(task);
      await fetchQueueRef.current;
      return true;
    }, [mode, poolId, searchTags]);

    useEffect(() => {
      let isCancelled = false;
      const currentFetchId = fetchId;

      const loadData = async () => {
        const targetPages = [page, page + 1, page - 1, page + 2, page - 2].filter(p => p > 0);
        for (const p of targetPages) {
          if (isCancelled) break;
          const fetched = await fetchPageData(p, currentFetchId);
          if (fetched) await functions.timeSleep(mode === "postSearch" ? 1000 : 500);
        }
      };
      loadData();
      return () => { isCancelled = true; };
    }, [page, searchTags, poolId, fetchId, fetchPageData]);

    useEffect(() => {
      const handleSync = (e: Event) => {
        const customEvent = e as CustomEvent;
        const incomingData = customEvent.detail;
        if (incomingData) {
          if (incomingData.nowPage) setPage(incomingData.nowPage);
          if (incomingData.pageCache) {
            setPostsCache(incomingData.pageCache);
            postsCacheRef.current = incomingData.pageCache;
          }
          if (mode === "postSearch") {
            if (incomingData.searchTags) setSearchTags(incomingData.searchTags);
            if (incomingData.searchFilter) setSearchFilter(incomingData.searchFilter);
          } else if (mode === "pool") {
            if (incomingData.poolId) setPoolId(incomingData.poolId);
          }
        }
      };
      const eventName = `SYNC_PARENT_DATA_${windowID}`;
      window.addEventListener(eventName, handleSync);
      return () => window.removeEventListener(eventName, handleSync);
    }, [windowID, mode]);

    useEffect(() => {
      if (thisWindow?.customData?.type !== mode) return;

      let newData: any = { nowPage: page, pageCache: postsCache, searchFilter };

      const offlineSuffix = isOfflineMode ? " { OFFLINE DB }" : "";

      if (mode === "postSearch" && thisWindow.customData.type === "postSearch") {
        newData = { ...newData, searchTags };
        thisWindow.setTitle(`${t("windowsType.postSearch")} [ ${searchTags.length === 0 ? t("windowsType.postSearch.title.noTags") : searchTags.join(",")} ]${offlineSuffix}`);
      } else {
        newData = { ...newData, poolId, poolInfo };
        if (poolInfo) thisWindow.setTitle(`${t("windowsType.pool")} : ${poolInfo.name.replace(/_/g, " ")} [Page ${page}]${offlineSuffix}`);
        else if (poolId) thisWindow.setTitle(`${t("windowsType.pool")} : ${poolId} [ Page : ${page} ]${offlineSuffix}`);
        else thisWindow.setTitle(`${t("windowsType.pool")}${offlineSuffix}${offlineSuffix}`);
      }

      if (JSON.stringify(thisWindow.customData.data) !== JSON.stringify(newData)) {
        thisWindow.setData({ type: mode, data: newData });

        const wm = wmRef.current;
        if (wm) {
          wm.getWindows().forEach(winInfo => {
            const childWin = wm.getWindow(winInfo.id);
            if (childWin?.customData?.type === "post" && childWin.customData.data.parentData?.windowID === thisWindow.id) {
              const childData = childWin.customData.data;
              const newParentData = { ...childData.parentData, customData: { type: mode, data: newData } };
              if (JSON.stringify(childData.parentData) !== JSON.stringify(newParentData)) {
                childWin.setData({ type: "post", data: { ...childData, parentData: newParentData } as any });
                window.dispatchEvent(new CustomEvent(`SYNC_PARENT_DATA_${childWin.id}`, { detail: newParentData }));
              }
            }
          });
        }
      }
    }, [page, postsCache, searchTags, searchFilter, poolId, poolInfo, mode, isOfflineMode]);

    const refreshSearch = useCallback((newVal?: any) => {
      setFetchError(null);
      setIsOfflineMode(false); // 重製時還原線上模式
      setPostsCache({});
      postsCacheRef.current = {};
      setPage(1);
      fetchingPages.current.clear();
      setFetchId(id => id + 1);
      if (mode === "postSearch" && newVal) setSearchTags(newVal);
      if (mode === "pool" && newVal !== undefined) {
        const parsedId = Number(newVal) || 0;
        setPoolId(parsedId);
        if (parsedId !== poolId) setPoolInfo(undefined);
      }
    }, [mode, poolId]);

    const peekPreKeyDown = useRef(false)

    useEffect(() => {
      let isdown = peekPreKeyDown.current

      const display = () => {
        if (!peekPre) return;
        createWindow(wmRef, {
          type: "preview",
          data: peekPre
        })
      }

      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        if (isdown) return;
        if (e.code === "Space") {
          isdown = true
          display()
        }
      }

      const keyup = (e: KeyboardEvent) => {
        if (e.code === "Space") {
          isdown = false
        }
      }

      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);

      return () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
      }
    }, [peekPre])

    useEffect(() => {
      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        if (!wmRef.current?.getWindow(windowID)?.isFocused) return;
        if (e.altKey) return;

        if (e.code === "Escape") {
          if (jupToPage) setJupToPage(false);
          else if (mode === "postSearch") setFilterPanel(false);
          return;
        }

        if (jupToPage || isFocuOnIt) return;

        if (e.code === "ArrowLeft") {
          e.preventDefault();
          setPage(p => (p > 1 ? p - 1 : 1));
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          setPage(p => p + 1);
        }

        if (e.shiftKey) {
          if (e.code === "KeyF") setFilterPanel(v => !v);
          if (e.code === "KeyJ") setJupToPage(v => !v);
        }
      };

      const preventBrowserNav = (e: MouseEvent) => {
        if (e.button === 3 || e.button === 4) StopEvent(e);
      };

      const mousedown = (e: MouseEvent) => {
        if (disableWindowKeyEvent) return;
        if (!wmRef.current?.getWindow(windowID)?.isFocused) return;

        if (e.button === 3 || e.button === 4) {
          if (jupToPage) {
            if (e.button === 3) setJupToPage(false);
            if (e.button === 4) { setJupToPage(false); setPage(Math.max(1, Math.floor(jupPage))); }
          } else {
            if (e.button === 3) setPage(p => (p > 1 ? p - 1 : 1));
            if (e.button === 4) setPage(p => p + 1);
          }
        }
      };

      document.addEventListener("keydown", keydown);
      document.addEventListener("mousedown", mousedown);
      document.addEventListener("mouseup", preventBrowserNav);
      document.addEventListener("click", preventBrowserNav);
      document.addEventListener("auxclick", preventBrowserNav);

      return () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("mousedown", mousedown);
        document.removeEventListener("mouseup", preventBrowserNav);
        document.removeEventListener("click", preventBrowserNav);
        document.removeEventListener("auxclick", preventBrowserNav);
      };
    }, [jupToPage, jupPage, isFocuOnIt, windowID, mode]);

    useEffect(() => {
      const statusOffset = 50;
      const offset = 200;
      let startPointX = 0, startPointY = 0;
      let status: "NONE" | "X" | "Y" = "NONE";
      let x = 0, y = 0;
      const touchArea = touchAreaRef.current;

      if (jupToPage) return;

      const onTouchStart = (e: TouchEvent) => {
        if (!touchArea) return;
        startPointX = e.touches[0].clientX;
        startPointY = e.touches[0].clientY;
      }
      const onTouchMove = (e: TouchEvent) => {
        if (!touchArea) return;
        x = startPointX - e.touches[0].clientX;
        y = startPointY - e.touches[0].clientY;
        if (status === "X") e.preventDefault();
        if (status === "Y") { x = 0; return; }

        const transform = () => { touchArea.style.transform = `translateX(${-1 * (x / 10)}px)` }
        if (x > offset || (x < -offset && page > 1)) {
          touchArea.style.opacity = ".5"; transform();
        } else {
          touchArea.style.opacity = ""; transform();
        }
        if (status !== "NONE") return;
        if (x > statusOffset || x < -statusOffset) status = "X";
        if (y > statusOffset || y < -statusOffset) status = "Y";
      }
      const onTouchEnd = () => {
        if (!touchArea) return;
        startPointX = 0;
        if (x > offset) { setPage(e => e + 1); void touchArea.clientHeight; }
        else if (x < -offset) { setPage(e => e > 1 ? e - 1 : 1); void touchArea.clientHeight; }
        touchArea.style.transform = ""; touchArea.style.opacity = "";
        status = "NONE";
      }

      touchArea?.addEventListener("touchstart", onTouchStart)
      touchArea?.addEventListener("touchmove", onTouchMove)
      touchArea?.addEventListener("touchend", onTouchEnd)
      return () => {
        touchArea?.removeEventListener("touchstart", onTouchStart)
        touchArea?.removeEventListener("touchmove", onTouchMove)
        touchArea?.removeEventListener("touchend", onTouchEnd)
      }
    }, [jupToPage, page, scrollPage.current]);

    useEffect(() => {
      if (scrollPage.current) scrollPage.current.scrollTo({ top: 0 });
    }, [page]);


    const showLoading = mode === "pool" ? (poolId !== 0 && !postsCache[page]) : !postsCache[page];

    const actionMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => {
      event.stopPropagation(); event.preventDefault();
      const btnRect = event.currentTarget.getBoundingClientRect();
      const query = mode === "postSearch" ? searchTags.join(" ") : `pool:${poolId}`;
      MenuAction.showMenu(menuBtn.post(post.id, post, { q: query }), [btnRect.bottom, btnRect.left]);
    }

    const generateMenuList = () => {
      let list: MenuButtonType[] = [
        windowAction(windowID,
          mode === "postSearch" ? [{
            name: t("menuButton.Clone"),
            action() {
              createWindow(wmRef, thisWindow?.customData!),
                thisWindow?.customData?.type === mode ? {
                  type: mode,
                  thisWindow,
                  data: thisWindow.customData.data
                } as any : undefined
            },
            dragItem: thisWindow?.customData?.type === mode ? {
              type: mode,
              thisWindow,
              data: thisWindow.customData.data
            } as any : undefined
          }] : []
        ),
        [
          t("menuButton.top.Data"),
          [
            {
              name: t("menuButton.Reload"),
              action() { refreshSearch(mode === "pool" ? poolId : undefined) },
            },
          ]
        ],
        [
          t("menuButton.top.Other"),
          [
            {
              name: t("menuButton.SaveToTmp"),
              action() {
                someActions.saveToTmp(usrIndx, cloneDeep(wmRef.current!.getWindow(thisWindow!.id!)!.customData!), thisWindow!.title, windowID),
                  thisWindow?.customData?.type === mode ? {
                    type: mode,
                    thisWindow,
                    data: thisWindow.customData.data
                  } : undefined
              },
              dragItem: thisWindow?.customData?.type === mode ? {
                type: mode,
                data: thisWindow.customData.data
              } as any : undefined,
            },
            mode === "pool" ? {
              name: t("menuButton.OpenWithPostSearch"),
              action() {
                createWindow(wmRef, {
                  type: "postSearch",
                  data: {
                    nowPage: page,
                    pageCache: postsCache,
                    searchTags: ["pool:" + poolId],
                    searchFilter,
                  }
                })
              },
              dragItem: {
                type: "postSearch",
                data: {
                  nowPage: page,
                  pageCache: postsCache,
                  searchTags: ["pool:" + poolId],
                  searchFilter,
                }
              }
            } : undefined,
            ...menuBtn.copyJSON(currentPosts),
            ...menuBtn.copyJSON(postsCache, true, t("menuButton.CopyFullJSON"))
          ]
        ]
      ];
      return list;
    };

    return (
      <WINDOW_FRAME
        className={style[mode]}
        menulist={generateMenuList()}
        onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={e => {
          if (!e.dataTransfer) return;
          const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname);
          if (itemdata) {
            const item: e621Type.DragItemType.defaul = JSON.parse(itemdata);
            if (mode === "postSearch" && item.type === "tag") {
              let newTags = [...searchTagsInput];
              const { data } = item
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
            <button kiase-style="" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>{"<"}</button>
            <button kiase-style="" onClick={() => { setJupToPage(true); setJupPage(page) }} >
              {t("windowsType.postSearch.page").replace("$1", page)}
            </button>
            <button kiase-style="" onClick={() => setPage(p => p + 1)}>{">"}</button>
          </div>
        </div>

        <div className={style["TagEditor"]} >
          <div className={style["InnerFrame"]}>
            {mode === "postSearch" ? (
              <input type="text" value={searchTagsInput.join(" ")} onInput={(e) => setSearchTagsInput(e.currentTarget.value.split(" "))}
                onKeyDown={(e) => { if ((e.key === "Enter" || e.code === "NumpadEnter") && searchTagsInput.join(" ") !== searchTags.join(" ")) refreshSearch(searchTagsInput); }}
                onFocus={() => setFocuOnIt(true)} onBlur={() => setFocuOnIt(false)} />
            ) : (
              <input type="text" value={poolIdInput} placeholder="Input Pool ID..." onInput={(e) => setPoolIdInput(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.code === "NumpadEnter") refreshSearch(Number(poolIdInput)); }}
                onFocus={() => setFocuOnIt(true)} onBlur={() => setFocuOnIt(false)} />
            )}
            <button className={clsx(filterPanel && style["activ"])} onClick={() => setFilterPanel(e => !e)}>
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" /></svg>
            </button>
          </div>
        </div>

        <JumpToPageOverlay jupToPage={jupToPage} jupPage={jupPage} setJupPage={setJupPage} setJupToPage={setJupToPage} setPage={setPage} />

        <div className={clsx(style["Filter"], filterPanel && style["display"])}>
          <div className={style["InnerFrame"]}>
            <div>
              <h1>{t("windowsType.postSearch.filter")}</h1>
              <h2>{t("windowsType.postSearch.filter.rating")}</h2>
              <div className={style["btns"]}>
                {
                  ([
                    [searchFilter.rating?.s, "s"],
                    [searchFilter.rating?.q, "q"],
                    [searchFilter.rating?.e, "e"],
                  ] as [boolean, ("s" | "q" | "e")][]).map(rat => {
                    return <button
                      key={rat[1]}
                      className={clsx(rat[0] && style["activ"])}
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
                    >{t("windowsType.postSearch.filter.rating." + rat[1] as any)}</button>
                  })
                }
              </div>
              <br />
              <h2>{t("windowsType.postSearch.filter.type")}</h2>
              <div className={style["btns"]}>
                {
                  ([[searchFilter.type?.vid, "vid"], [searchFilter.type?.gif, "gif"], [searchFilter.type?.pic, "pic"],
                  ] as [boolean, ("vid" | "gif" | "pic")][]).map(tType => (
                    <button
                      key={tType[1]}
                      className={clsx(tType[0] && style["activ"])}
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
                    >{t("windowsType.postSearch.filter.type." + tType[1] as any)}</button>
                  ))
                }
              </div>
              <h2>{t("windowsType.postSearch.filter.sortBy")}</h2>
              <div className={style["btns"]}>
                {
                  ([
                    "newest", "score", "favs", "size"
                  ] as ("newest" | "score" | "favs" | "size")[]).map(sort => {
                    return <button
                      key={sort}
                      className={clsx(sort === "newest" ? "" : sort === searchFilter.sortBy && style["activ"])}
                      onClick={() => {
                        setSearchFilter(prev => ({
                          ...prev,
                          sortBy: sort
                        }))
                      }}
                    >{t("windowsType.postSearch.filter.sortBy." + sort as any)}</button>
                  })
                }
              </div>
              <br />
              <div className={style["btns"]}>
                <button
                  className={clsx(searchFilter.reverse && style["activ"])}
                  onClick={() => {
                    setSearchFilter(prev => ({
                      ...prev,
                      reverse: !prev.reverse
                    }))
                  }}
                >{t("windowsType.postSearch.filter.sortBy.reverse")}</button>
              </div>
            </div>
          </div>
        </div>

        <div className={style["List"]} ref={touchAreaRef} >
          {fetchError ? (
            <NODATA.Error error={fetchError} Reload={refreshSearch} />
          ) : showLoading ? <NODATA.Fetching key={page} /> : (
            mode === "pool" && !poolId ? <NODATA.None key={page} WithFilter={currentPosts.length > 0} /> : (
              processedPosts.length === 0 ? <NODATA.None key={page} WithFilter={currentPosts.length > 0} /> : (
                <div className={style["InnerFrame"]} ref={scrollPage} onKeyDown={e => { if (e.code === "Space") e.preventDefault(); }}>
                  {processedPosts.map((post, indx) => (
                    <Components.Card
                      event={{
                        mouseMove(p) {
                          setPeekPre(p)
                        },
                        mouseLeave() {
                          setPeekPre(undefined)
                        },
                      }}
                      actionMenu={actionMenu}
                      key={post.id}
                      post={post}
                      delay={DELAY_EFFECT(indx * .005)}
                      q={{ q: mode === "postSearch" ? searchTags.join(" ") : `pool:${poolId}` }}
                      onClick={() => {
                        const winID = `post-${id}`;
                        const children = <windowsType.post key={post.id} id={id} />;
                        const customData: e621Type.window.post = {
                          type: "post",
                          data: {
                            postId: post.id, cachedPost: post,
                            parentData: {
                              windowID,
                              title: thisWindow?.title!,
                              componentType: mode,
                              rect: thisWindow?.rect!,
                              customData:
                                mode === "postSearch" ? {
                                  type: mode,
                                  data: {
                                    nowPage: page,
                                    pageCache: postsCache,
                                    searchTags,
                                    searchFilter
                                  }
                                } :
                                  {
                                    type: mode,
                                    data: {
                                      poolId,
                                      poolInfo,
                                      nowPage: page,
                                      pageCache: postsCache
                                    }
                                  } as any
                            }
                          }
                        }
                        if (!wmRef.current?.hasWindowID(winID)) {
                          wmRef.current?.createWindow({ id: winID, children, customData })
                        } else {
                          wmRef.current.updateWindow(winID, { children, customData });
                          wmRef.current.bringToFront(winID);
                        }
                      }}
                    />
                  ))}
                </div>
              )
            )
          )}
        </div>
      </WINDOW_FRAME>
    );
  };

}

type ViewerWindowProps = {
  winID: string,
  post: E621.Post,
  contro?: boolean
}

const ViewerWindow = ({ winID, post, contro }: ViewerWindowProps) => {
  const cachedMainSrc = Cache.useCachedPost(post);
  const cachedPrevSrc = Cache.useCachedThumbnail(post);

  return <WINDOW_FRAME
    menulist={[
      windowAction(winID, [
        {
          name: t("menuButton.ViewPost"),
          action() {
            createWindow(wmRef, {
              type: "postGetByID",
              data: {
                status: "success",
                currentId: post.id,
                fetchedPost: post,
              },
            })
          },
          dragItem: {
            type: "post",
            data: post,
          }
        },
      ]), [
        t("menuButton.top.Other"),
        menuBtn.post(post.id, post, {}, "viewer"),
      ]
    ]}
  >
    <Components.PostViewer
      post={post}
      main={cachedMainSrc ?? undefined}
      prev={cachedPrevSrc ?? undefined}
    />
  </WINDOW_FRAME >
}

type windowProp = { id: string }
const windowsType = {
  postSearch: function ({ id }: windowProp) {
    return <searchWindow.UnifiedPostBrowser id={id} mode="postSearch" />;
  },
  post: function ({ id }: windowProp) {
    const windowID = `post-${id}`
    const thisWindow = wmRef.current?.getWindow(windowID)

    const savedData = thisWindow?.customData?.type === "post"
      ? thisWindow.customData.data
      : undefined;

    const [postId, setPostId] = useState<number>(savedData?.postId ?? 0);
    const [postData, setPostData] = useState<E621.Post | undefined>(savedData?.cachedPost);
    const [isLoading, setIsLoading] = useState<boolean>(!savedData?.cachedPost);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [parentDataState, setParentDataState] = useState(savedData?.parentData);

    const fetchPost = useCallback(async () => {
      if (!postId) return;
      setIsLoading(true);
      setPostData(undefined);
      setFetchError(null);
      try {
        const result = await LABS_E621_API.posts.get({
          id: postId,
          user: E621_AUTH()
        });
        if (result) {
          setPostData(result);
          setFetchError(null);
        }
      } catch (e) {
        Kiasole.error(`Post ${postId} load failed: ${e}`);
        setFetchError(String(e));
      } finally {
        setIsLoading(false);
      }
    }, [postId]);

    useEffect(() => {
      if (!postData && postId !== 0) {
        _app.throwNewNotic("已經沒東西了")
        fetchPost();
      }
    }, [postId]);

    const handleKeyNavigation = useCallback(async (direction: 1 | -1) => {
      if (!parentDataState || (parentDataState.componentType !== "postSearch" && parentDataState.componentType !== "pool")) return;

      const pData = parentDataState.customData.data as any;
      let currentCache = { ...pData.pageCache };
      let currentPage = pData.nowPage;

      let processed = tools.applyFiltersAndSort(currentCache[currentPage] || [], pData.searchFilter);
      let currentIndex = processed.findIndex(p => p.id === postId);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex + direction;

      if (nextIndex >= 0 && nextIndex < processed.length) {
        const nextPost = processed[nextIndex];
        setPostId(nextPost.id);
        setPostData(nextPost);
      } else {
        let targetPage = currentPage + direction;
        if (targetPage < 1) {
          _app.throwNewNotic("已經到頭了")
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
                wmRef.current.updateWindow(windowID, { customData });
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
          return
        };

        setIsLoading(true);
        setPostData(undefined);

        let foundPost: E621.Post | undefined = undefined;
        let attempts = 0;

        const searchTagsQuery = parentDataState.componentType === "postSearch"
          ? pData.searchTags
          : [`pool:${pData.poolId}`];

        while (!foundPost && attempts < 3 && targetPage > 0) {
          let targetPosts = currentCache[targetPage];

          if (!targetPosts) {
            try {
              targetPosts = await LABS_E621_API.posts.search({
                tags: searchTagsQuery,
                page: targetPage,
                limit: 300,
                user: E621_AUTH()
              });
              currentCache[targetPage] = targetPosts;
            } catch (e) {
              Kiasole.error(`第 ${targetPage} 頁抓取失敗: ${e}`);
              break;
            }
          }

          let targetProcessed = tools.applyFiltersAndSort(targetPosts, pData.searchFilter);

          if (targetProcessed.length > 0) {
            foundPost = direction === 1 ? targetProcessed[0] : targetProcessed[targetProcessed.length - 1];
          } else {
            targetPage += direction;
            attempts++;
          }
        }

        if (foundPost) {
          setPostId(foundPost.id);
          setPostData(foundPost);

          setParentDataState((prev: any) => {
            if (!prev || (prev.componentType !== "postSearch" && prev.componentType !== "pool")) return prev;
            return {
              ...prev,
              customData: {
                ...prev.customData,
                data: {
                  ...prev.customData.data,
                  nowPage: targetPage,
                  pageCache: currentCache
                }
              }
            };
          });
        } else {
          fetchPost();
        }
        setIsLoading(false);
      }
    }, [postId, parentDataState, fetchPost]);

    useEffect(() => {
      const handleSync = (e: Event) => {
        const customEvent = e as CustomEvent;
        const newParentData = customEvent.detail;
        if (newParentData && JSON.stringify(parentDataState) !== JSON.stringify(newParentData)) {
          setParentDataState(newParentData);
        }
      };
      const eventName = `SYNC_PARENT_DATA_${thisWindow?.id}`;
      window.addEventListener(eventName, handleSync);
      return () => window.removeEventListener(eventName, handleSync);
    }, [thisWindow?.id, parentDataState]);

    useEffect(() => {
      const wm = wmRef.current
      if (!wm) return;
      if (!parentDataState) return;
      const { windowID, customData, componentType } = parentDataState
      const win = wm.getWindow(windowID);
      if (!win) return;
      if (win.customData?.type !== "postSearch") return;

      const currentParentData = win.customData?.data;

      if (JSON.stringify(currentParentData) !== JSON.stringify(customData.data)) {

        win.update({
          customData,
        });

        window.dispatchEvent(new CustomEvent(`SYNC_PARENT_DATA_${windowID}`, {
          detail: customData.data
        }));
      }

    }, [parentDataState]);

    useEffect(() => {
      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        const win = wmRef.current?.getWindow(thisWindow?.id!);
        if (!win?.isFocused) return;

        if (e.code === "ArrowLeft") {
          e.preventDefault();
          handleKeyNavigation(-1);
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          handleKeyNavigation(1);
        }
      };

      document.addEventListener("keydown", keydown);
      return () => document.removeEventListener("keydown", keydown);
    }, [handleKeyNavigation, thisWindow?.id]);

    useEffect(() => {
      thisWindow?.setData({
        type: "post",
        data: {
          postId,
          cachedPost: postData,
          parentData: parentDataState
        }
      });
      if (postData)
        thisWindow?.setTitle(`${t("windowsType.post")} / ${postData.tags.artist.join(",")} - ${postData.id}`)
      else
        thisWindow?.setTitle(`${t("windowsType.post")} / ${postId}`)
    }, [postData, postId, parentDataState]);

    return (
      <>
        <WINDOW_FRAME
          menulist={[
            windowAction(windowID, [
              {
                name: t("menuButton.RestoreParentWindow"),
                action() {
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
                        wmRef.current.updateWindow(windowID, { customData });
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
                },
              },
            ]),
            [
              t("menuButton.top.Data"),
              [
                {
                  name: t("menuButton.Reload"),
                  action() { fetchPost() },
                },
              ],
            ],
            [
              t("menuButton.top.Other"),
              menuBtn.post(postId, postData,
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
            ]
          ]}
        >
          {(postData && !isLoading) &&
            <Components.Post key={postData.id} postData={postData} thisWindow={thisWindow} />
          }
          {isLoading && <NODATA.Fetching />}
          {!isLoading && !postData && fetchError && (
            <NODATA.Error error={fetchError} Reload={fetchPost} />
          )}
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
    const [fetchError, setFetchError] = useState<string | null>(null);

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
        if (fetchedPost)
          setInputId(fetchedPost.id)
        return;
      }

      setStatus("loading");
      setFetchedPost(undefined);
      setFetchError(null);

      try {
        const result = await LABS_E621_API.posts.get({
          id: targetId,
          user: E621_AUTH()
        });

        if (result) {
          setFetchedPost(result);
          setStatus("success");
          setFetchError(null);
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
        setFetchError(String(e));
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
      thisWindow?.setTitle(`${t("windowsType.postGetByID")} [ ${inputId} ]`);
    }, [inputId, fetchedPost, status]);

    useEffect(() => {
      if (status === "loading") {
        handleSearch(inputId);
      }
    }, []);

    return (
      <WINDOW_FRAME
        menulist={[
          windowAction(windowID),
          [
            t("menuButton.top.Data"),
            [
              {
                name: t("menuButton.Reload"),
                action() { handleSearch(inputId) },
              },
            ],
          ],
          [
            t("menuButton.top.Other"),
            menuBtn.post(inputId, fetchedPost, {}, "id"),
          ]
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
          {!fetchedPost && status !== "error" && <NODATA.Fetching />}
          {status === "error" && fetchError && (
            <NODATA.Error error={fetchError} Reload={() => handleSearch(inputId)} />
          )}
        </div>
      </WINDOW_FRAME >
    );
  },
  pool: function ({ id }: windowProp) {
    return <searchWindow.UnifiedPostBrowser id={id} mode="pool" />;
  },
  viewer: function ({ id }: windowProp) {
    const windowID = `viewer-${id}`;
    const thisWindow = wmRef.current?.getWindow(windowID);

    const savedData = thisWindow?.customData?.type === "viewer"
      ? thisWindow.customData.data
      : undefined;

    const [fetchedPost] = useState<E621.Post>(savedData!);

    useEffect(() => {
      thisWindow?.setTitle(`${t("windowsType.viewer")} [ ${fetchedPost.id} ]`)
    }, [])

    return (<ViewerWindow post={fetchedPost} winID={windowID} />);
  },
  peekPreview: function () {
    const windowID = `peek-preview`;
    const thisWindow = wmRef.current?.getWindow(windowID);

    const savedData = thisWindow?.customData?.type === "preview"
      ? thisWindow.customData.data
      : undefined;

    const [fetchedPost] = useState<E621.Post>(savedData!);

    useEffect(() => {
      thisWindow?.setTitle(`${t("windowsType.preview")} [ ${fetchedPost.id} ]`)
    }, [])

    useEffect(() => {
      const keydown = (e: KeyboardEvent) => {
        if (disableWindowKeyEvent) return;
        if (!thisWindow?.isFocused) return;

        if (e.code === "Escape") thisWindow.close();
      }

      const keyup = (e: KeyboardEvent) => {
        if (!thisWindow?.isFocused) return;

        if (e.code === "Space") thisWindow.close();
      }

      document.addEventListener("keydown", keydown)
      document.addEventListener("keyup", keyup)
      thisWindow?.addEventListener("blur", () => thisWindow.close())

      return () => {
        document.removeEventListener("keydown", keydown)
        document.removeEventListener("keyup", keyup)
      }
    }, [])

    return (<ViewerWindow post={fetchedPost} winID="peek-preview" contro={false} />);

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
      return t(`setting.${capCat}` as any);
    };

    const tPage = (cat: string, page: string) => {
      const capCat = functions.str.capitalizeWords(cat);
      let p = page;
      return t(`setting.${capCat}.${p}` as any);
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
        ? t("windowsType.setting")
        : `${t("windowsType.setting")} / ${tCategory(nowPage.categorie)} > ${tPage(nowPage.categorie, nowPage.pages)}`);
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

      return <div ref={eRef} className={clsx(style["page"], start && style["START"])}>
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

        const changePage = (offset: number) => {
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

        const isFocus = () => !wmRef.current?.getWindow(thisWindow.id)?.isFocused;

        const keydown = (e: KeyboardEvent) => {
          if (disableWindowKeyEvent) return;
          if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
          setShowTabs(e.shiftKey && e.ctrlKey)
          if (isFocus()) return;
          if (keyispress) return;

          if (e.shiftKey) {
            if (e.ctrlKey) {

              switch (e.code) {
                case "ArrowLeft": {
                  changePage(-1)
                  e.preventDefault();
                  break;
                }
                case "ArrowRight": {
                  changePage(1)
                  e.preventDefault();
                  break;
                }
                case "ArrowUp": {
                  changeTab(-1)
                  e.preventDefault();
                  break;
                }
                case "ArrowDown": {
                  changeTab(1)
                  e.preventDefault();
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
          if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
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

        const onwheel = (e: WheelEvent) => {
          if (disableWindowKeyEvent) return;
          if (!wmRef.current?.getWindow(thisWindow.id)?.isFocused) return;
          if (!e.ctrlKey) return;
          e.preventDefault();
          if (e.shiftKey) {
            if (e.deltaY > 0) {
              changePage(1)
            } else if (e.deltaY < 0) {
              changePage(-1)
            }
          } else {
            if (e.deltaY > 0) {
              changeTab(1)
            } else if (e.deltaY < 0) {
              changeTab(-1)
            }
          };
        }

        document.addEventListener("keydown", keydown)
        document.addEventListener("keyup", keyup)
        document.addEventListener("wheel", onwheel, { passive: false })

        return () => {
          document.removeEventListener("keydown", keydown)
          document.removeEventListener("keyup", keyup)
          document.removeEventListener("wheel", onwheel)
        }

      }, [])

      if (nowPage === "NONE") return;

      return <div className={clsx(style["list"], start && style["START"])} ref={eRef}>
        <div
          className={clsx(style["buttonFrame"], style["frist"], backing && style["backing"])}
        >
          <button onClick={() => setNowPage("NONE")}>
            {t("setting.Back")}
          </button>
          <div className={style["backMask"]}>
            {t("setting.Back")}
          </div>
        </div>

        {settingTabs.pageList[nowPage.categorie].map((e, i) =>
          <div
            className={style["buttonFrame"]}
            style={{
              transitionDelay: DELAY_EFFECT(`${i * .05 + .05}s`)
            }}
            key={i}
          >
            <button
              className={clsx(nowPage.pages === e && style["activ"])}
              key={i}
              onClick={() => setNowPage({ categorie: nowPage.categorie, pages: e as any })}
            >
              {tPage(nowPage.categorie, e as string)}
            </button>
          </div>
        )}
      </div>
    }, []);

    const PasswordInput = useCallback((props: React.InputHTMLAttributes<HTMLInputElement>) => {
      const [view, setView] = useState(false)
      const v = (e: any, state: boolean) => { e.preventDefault(); setView(state) }
      return (
        <div className={style["PasswordInput"]}>
          <input
            {...props}
            kiase-sty=""
            type={view ? "text" : "password"}
          />
          <button
            kiase-sty=""
            non-pad=""
            svg-icon=""
            onMouseDown={e => v(e, true)}
            onMouseUp={e => v(e, false)}
            onTouchStart={e => v(e, true)}
            onTouchEnd={e => v(e, false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M599-361q49-49 49-119t-49-119q-49-49-119-49t-119 49q-49 49-49 119t49 119q49 49 119 49t119-49Zm-187-51q-28-28-28-68t28-68q28-28 68-28t68 28q28 28 28 68t-28 68q-28 28-68 28t-68-28ZM220-270.5Q103-349 48-480q55-131 172-209.5T480-768q143 0 260 78.5T912-480q-55 131-172 209.5T480-192q-143 0-260-78.5ZM480-480Zm207 158q95-58 146-158-51-100-146-158t-207-58q-112 0-207 58T127-480q51 100 146 158t207 58q112 0 207-58Z" /></svg>
          </button>
        </div>
      )
    }, [])

    const Pages = useCallback(({ nowPage }: PageBtn) => {
      if (nowPage === "NONE") return "none :p"

      const NowPage = () => {
        switch (nowPage.categorie) {
          case "search": {
            switch (nowPage.pages) {
              case "general": {

                const [defSrchSet, setDefSrchSet] = useState(nowSetting.search.defaultSearchFilter)

                useEffect(() => {
                  (async () => {
                    const _set = await WSA.userSetting(usrIndx);
                    const get = await _set.get();
                    get.search.defaultSearchFilter = defSrchSet;
                    _set.set(get)
                  })()
                }, [defSrchSet])

                return <>
                  <KiloDown.Subtitle>{t("setting.Search.defaultSearchFilter")}</KiloDown.Subtitle>

                  <KiloDown.Thirdtitle>{t("windowsType.postSearch.filter.rating")}</KiloDown.Thirdtitle>
                  <div className={style["buttonList"]}>
                    {
                      ([
                        [defSrchSet.rating?.s, "s"],
                        [defSrchSet.rating?.q, "q"],
                        [defSrchSet.rating?.e, "e"],
                      ] as [boolean, ("s" | "q" | "e")][]).map(rat => {
                        return <button
                          kiase-sty=""
                          key={rat[1]}
                          className={clsx(rat[0] && style["activ"])}
                          onClick={() => {
                            setDefSrchSet(prev => ({
                              ...prev,
                              rating: {
                                s: false, q: false, e: false,
                                ...prev.rating,
                                [rat[1]]: !prev.rating?.[rat[1]]
                              }
                            }))
                          }}
                        >{t("windowsType.postSearch.filter.rating." + rat[1] as any)}</button>
                      })
                    }
                  </div>
                  <KiloDown.Thirdtitle>{t("windowsType.postSearch.filter.type")}</KiloDown.Thirdtitle>
                  <div className={style["buttonList"]}>
                    {
                      ([
                        [defSrchSet.type?.vid, "vid"],
                        [defSrchSet.type?.gif, "gif"],
                        [defSrchSet.type?.pic, "pic"],
                      ] as [boolean, ("vid" | "gif" | "pic")][]).map(tType => (
                        <button
                          kiase-sty=""
                          key={tType[1]}
                          className={clsx(tType[0] && style["activ"])}
                          onClick={() => {
                            setDefSrchSet(prev => ({
                              ...prev,
                              type: {
                                vid: false, gif: false, pic: false,
                                ...prev.type,
                                [tType[1]]: !prev.type?.[tType[1]]
                              }
                            }))
                          }}
                        >{t("windowsType.postSearch.filter.type." + tType[1] as any)}</button>
                      ))
                    }
                  </div>
                  <KiloDown.Thirdtitle>{t("windowsType.postSearch.filter.sortBy")}</KiloDown.Thirdtitle>
                  <div className={style["buttonList"]}>
                    {
                      ([
                        "newest", "score", "favs", "size"
                      ] as ("newest" | "score" | "favs" | "size")[]).map(sort => {
                        return <button
                          kiase-sty=""
                          key={sort}
                          className={clsx(sort === "newest" ? "" : sort === defSrchSet.sortBy && style["activ"])}
                          onClick={() => {
                            setDefSrchSet(prev => ({
                              ...prev,
                              sortBy: sort
                            }))
                          }}
                        >{t("windowsType.postSearch.filter.sortBy." + sort as any)}</button>
                      })
                    }
                  </div>
                  <br />
                  <button
                    kiase-sty=""
                    className={clsx(defSrchSet.reverse && style["activ"])}
                    onClick={() => {
                      setDefSrchSet(prev => ({
                        ...prev,
                        reverse: !prev.reverse
                      }))
                    }}
                  >{t("windowsType.postSearch.filter.sortBy.reverse")}</button>
                </>
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

                const [nameMsg, setNameMsg] = useState<string>("")
                const [passMsg, setPassMsg] = useState<string>("")

                const [currentPass, setCurrentPass] = useState<string>("")
                const [newPass, setNewPass] = useState<string>("")
                const [newPassAgain, setNewPassAgain] = useState<string>("")

                const [nowUserName, setnowUserName] = useState<string>(nowSaveInfo.user.name)
                const [currentName, setCurrentName] = useState<string>(nowUserName)

                const nowPass = nowSaveInfo.user.passKey

                useEffect(() => { setnowUserName(nowSaveInfo.user.name) }, [nowSaveInfo.user.name])

                const setPass = useCallback((pass?: string) => {
                  someActions.setAppState(e => {
                    e.rememberPassword = pass || ""
                    return e
                  })
                  someActions.setUsrInfo(usrIndx, e => {
                    e.user.passKey = pass
                    return e
                  })
                }, [])

                const clearInput = useCallback(() => {
                  setCurrentPass("")
                  setNewPass("")
                  setNewPassAgain("")
                }, [])

                const setPassKey = useCallback((del?: boolean) => {
                  if (nowPass) {
                    if (nowPass !== currentPass) { setPassMsg(t("setting.Account.local.changePassword.notic.noMatch")); return; };
                    if (del) {
                      setPassMsg("")
                      newInput.message(t("setting.Account.local.changePassword.pop.areYouSure"), [
                        { name: t("setting.Account.local.changePassword.pop.yes"), value: "yes", key: "Delete" },
                        { name: t("setting.Account.local.changePassword.pop.no"), value: "" },
                      ], (e) => {
                        if (e === "yes") {
                          setTimeout(() => {
                            newInput.message(t("setting.Account.local.changePassword.pop.hasGone"))
                          }, .5e3);
                          setPass()
                          clearInput()
                        }
                      })
                    } else {
                      if (newPass !== newPassAgain) { setPassMsg(t("setting.Account.local.changePassword.notic.newNoMatch")); return; }
                      setPassMsg("")
                      setPass(newPass)
                      newInput.message(t("setting.Account.local.changePassword.pop.hasChange"))
                      clearInput()
                    }
                  } else {
                    setPass(currentPass)
                    newInput.message(t("setting.Account.local.setPassword.pop.success"))
                    clearInput()
                  }
                }, [
                  currentPass,
                  newPass,
                  newPassAgain,
                  nowSaveInfo.user.passKey
                ])

                const setUserName = useCallback((restore?: boolean) => {
                  if (restore) {
                    setCurrentName(nowUserName)
                    return;
                  }

                  if (currentName) {
                    setNameMsg("")
                    newInput.message(t("setting.Account.local.changeUserName.confirm").replace("$1", currentName), [
                      { name: t("setting.Account.local.changeUserName.nice"), value: "yes", key: "Enter" },
                      { name: t("setting.Account.local.changeUserName.no"), value: "no", key: "Escape" },
                    ], (e) => {
                      if (e === "yes") {
                        someActions.setUsrInfo(usrIndx, e => {
                          e.user.name = currentName
                          return e
                        })
                      }
                    })
                  } else {
                    setNameMsg(t("setting.Account.local.changeUserName.nameIsEmpty"))
                  }
                }, [currentName, nowUserName])

                return <div className={style["Account"]}>
                  <KiloDown.Subtitle>{t("setting.Account.local.changeUserName")}</KiloDown.Subtitle>
                  <br />
                  {nameMsg ? <>
                    <span>{nameMsg}</span>
                    <br />
                    <br />
                  </> : ""}
                  <input
                    kiase-sty=""
                    placeholder={t("setting.Account.local.changeUserName.name")}
                    type="text"
                    onChange={e => setCurrentName(e.currentTarget.value)}
                    value={currentName}
                  />
                  <br />
                  <br />
                  <div className={style["buttonList"]}>
                    <button kiase-sty="" disabled={nowUserName === currentName} onClick={() => setUserName()}>{t("setting.Account.local.changeUserName.update")}</button>
                    <button kiase-sty="" disabled={nowUserName === currentName} onClick={() => setUserName(true)}>{t("setting.Account.local.changeUserName.restore")}</button>
                  </div>

                  <br />
                  <br />

                  {nowPass ?
                    <>
                      <KiloDown.Subtitle>{t("setting.Account.local.changePassword")}</KiloDown.Subtitle>
                      <br />
                      {passMsg ? <>
                        <span>{passMsg}</span>
                        <br />
                        <br />
                      </> : ""}
                      <PasswordInput
                        placeholder={t("setting.Account.local.changePassword.current")}
                        onChange={e => setCurrentPass(e.currentTarget.value)}
                        value={currentPass}
                      />
                      <br />
                      <br />
                      <PasswordInput
                        placeholder={t("setting.Account.local.changePassword.new")}
                        onChange={e => setNewPass(e.currentTarget.value)}
                        value={newPass}
                      />
                      <br />
                      <br />
                      <PasswordInput
                        placeholder={t("setting.Account.local.changePassword.newAgain")}
                        onChange={e => setNewPassAgain(e.currentTarget.value)}
                        value={newPassAgain}
                      />
                      <br />
                      <br />
                      <div className={style["buttonList"]}>
                        <button kiase-sty="" disabled={!(currentPass && newPass && newPassAgain)} onClick={() => setPassKey()}>{t("setting.Account.local.changePassword.update")}</button>
                        <button kiase-sty="" disabled={!(currentPass)} onClick={() => setPassKey(true)}>{t("setting.Account.local.changePassword.remove")}</button>
                      </div>
                    </>
                    :
                    <>
                      <KiloDown.Subtitle>{t("setting.Account.local.setPassword")}</KiloDown.Subtitle>
                      <br />
                      <PasswordInput
                        placeholder={t("setting.Account.local.setPassword.new")}
                        onChange={e => setCurrentPass(e.currentTarget.value)}
                        value={currentPass}
                      />
                      <br />
                      <br />
                      <button kiase-sty="" disabled={!currentPass} onClick={() => setPassKey()}>{t("setting.Account.local.setPassword.setPass")}</button>
                    </>}

                  <br />
                  <br />
                  <br />
                  <button kiase-sty="" onClick={() => {
                    newInput.message(t("setting.Account.local.deleteAccount.1"), [
                      { name: t("setting.Account.local.deleteAccount.1.yes"), value: "yes", key: "Enter" },
                      { name: t("setting.Account.local.deleteAccount.1.no"), value: "" },
                    ], (e) => {
                      if (e === "yes") {
                        setTimeout(() => {

                          newInput.message(t("setting.Account.local.deleteAccount.2"), [
                            { name: t("setting.Account.local.deleteAccount.2.yes"), value: "yes", key: "Enter" },
                            { name: t("setting.Account.local.deleteAccount.2.no"), value: "" },
                          ], (e) => {
                            if (e === "yes") {
                              setTimeout(() => {

                                newInput.message(t("setting.Account.local.deleteAccount.3"), [
                                  { name: t("setting.Account.local.deleteAccount.3.yes"), value: "yes", key: "Delete" },
                                  { name: t("setting.Account.local.deleteAccount.3.no"), value: "" },
                                ], (e) => {
                                  if (e === "yes") {
                                    WSA.deleteUser(usrIndx).then(async () => {
                                      const appState = await WSA.getAppStatus();
                                      await WSA.setAppStatus({ ...appState, autoLogin: false, rememberPassword: "", lastUser: 0 });
                                      setIsLogin(false);
                                    });
                                  }
                                })

                              }, .5e3);
                            }
                          })

                        }, .5e3);
                      }
                    })
                  }}>{t("setting.Account.local.deleteAccount")}</button>
                </div>
              }
              case "avatar": {
                const [avaCfg, setAvaCfg] = useState<workSpaceType.Unit.BaseItem.Image>({
                  url: ""
                })

                useEffect(() => {
                  setAvaCfg(nowSaveInfo.user.avatar);
                }, [nowSaveInfo.user.avatar]);

                const updateVal = (key: keyof workSpaceType.Unit.BaseItem.Image, val: number) => {
                  setAvaCfg(prev => ({ ...prev, [key]: val }));
                };

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
                          <span>{t("setting.Account.avatar.set")}</span>
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

                      <button kiase-sty="" onClick={() => {
                        someActions.setUsrInfo(usrIndx, e => {
                          e.user.avatar = avaCfg;
                          return e;
                        });
                      }}>{t("setting.Account.avatar.apply")}</button>
                      {avaCfg.fromPost && <button
                        kiase-sty=""
                        onClick={() => someActions.openWithGetByID(avaCfg.fromPost!)}
                        draggable={true}
                        onDragStart={(e) => {
                          dragItem(e, {
                            type: "post",
                            data: avaCfg.fromPost!
                          });
                        }}
                      >{t("setting.Account.avatar.source")}</button>}
                    </div>
                  </div>
                </div>
              }
              case "e621": {
                const [nowAuth, setNowAuth] = useState<workSpaceType.Unit.E621Auth>(nowSaveInfo.user.e621 ?? {})
                const [currentKey, setCurrentKey] = useState<string>(nowAuth.key ?? "")
                const [currentName, setCurrentName] = useState<string>(nowAuth.name ?? "")

                const isSame = (nowAuth.key === currentKey) && (nowAuth.name === currentName);

                useEffect(() => {
                  setNowAuth(nowSaveInfo.user.e621 ?? {})
                }, [nowSaveInfo.user.e621])

                const setAuth = useCallback((restore?: boolean) => {
                  if (restore) {
                    setCurrentKey(nowAuth.key ?? "")
                    setCurrentName(nowAuth.name ?? "")
                  } else {
                    newInput.message(t("setting.Account.e621.msg"), [
                      { name: t("setting.Account.e621.msg.yes"), value: "yes", key: "Enter" },
                      { name: t("setting.Account.e621.msg.no"), value: "" },
                    ], (e) => {
                      if (e === "yes") {
                        someActions.setUsrInfo(usrIndx, e => {
                          e.user.e621 = { key: currentKey, name: currentName }
                          return e
                        })
                      }
                    })
                  }
                }, [nowAuth, currentKey, currentName])

                return <>
                  <KiloDown.Subtitle>{t("setting.Account.e621.title")}</KiloDown.Subtitle>
                  <KiloDown.Thirdtitle>{t("setting.Account.e621.info")}</KiloDown.Thirdtitle>
                  <br />
                  <input
                    type="text"
                    kiase-sty=""
                    placeholder={t("setting.Account.e621.inp.name")}
                    onChange={e => setCurrentName(e.currentTarget.value)}
                    value={currentName}
                  />
                  <br />
                  <br />
                  <PasswordInput
                    placeholder={t("setting.Account.e621.inp.key")}
                    onChange={e => setCurrentKey(e.currentTarget.value)}
                    value={currentKey}
                  />
                  <br />
                  <br />
                  <div className={style["buttonList"]}>
                    <button kiase-sty="" disabled={isSame} onClick={() => setAuth()}>{t("setting.Account.e621.btn.update")}</button>
                    <button kiase-sty="" disabled={isSame} onClick={() => setAuth(true)}>{t("setting.Account.e621.btn.restore")}</button>
                  </div>
                </>
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
                      className={nowSetting.lang === l.id ? style["activ"] : ""}
                      onMouseMove={() => setNotic(l.notic)}
                      onMouseLeave={() => setNotic("...")}
                      onClick={() => someActions.setSetting(usrIndx, e => {
                        e.lang = l.id
                        return e
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

          case "storage": {
            switch (nowPage.pages) {
              case "general": {
                return <></>
              }

              case "cache": {
                const [set, setSet] = useState(nowSetting.cache);

                const chcActiv = set.enable.global;

                useEffect(() => {
                  (async () => {
                    const _set = await WSA.userSetting(usrIndx);
                    const get = await _set.get();
                    get.cache = set;
                    _set.set(get)
                  })()
                }, [set])

                return <>
                  <KiloDown.Subtitle>{t("setting.Storage.cache.title")}</KiloDown.Subtitle>
                  <div className={style["buttonList"]}>
                    {
                      ([
                        [t("setting.Storage.cache.enable.off"), !set.enable.global, false],
                        [t("setting.Storage.cache.enable.on"), set.enable.global, true],
                      ] as [string, boolean, boolean][]).map((e, i) =>
                        <button
                          kiase-sty=""
                          className={clsx(e[1] && style["activ"])}
                          onClick={() => setSet(p => {
                            const _ = cloneDeep(p);
                            _.enable.global = e[2];
                            return _
                          })}
                          key={i}
                        >{e[0]}</button>
                      )
                    }
                  </div>
                  <br />
                  {/* 我還沒寫 */}
                  {/* <button
                    kiase-sty=""
                    className={clsx(set.downloadFromCache && style["activ"])}
                    onClick={() => setSet(p => {
                      const _ = cloneDeep(p);
                      _.downloadFromCache = !_.downloadFromCache;
                      return _
                    })}
                  >{"下載時 優先從暫存區拿檔案"}</button> */}
                  {/* <br /> */}
                  {/* <br /> */}

                  <div style={{ opacity: chcActiv ? "1" : ".6", pointerEvents: chcActiv ? "all" : "none" }}>
                    <KiloDown.Subtitle>{t("setting.Storage.cache.section.parts")}</KiloDown.Subtitle>

                    <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.post")}</KiloDown.Thirdtitle>
                    <div className={clsx(style["buttonList"], !chcActiv && style["disable"])}>
                      {
                        ([
                          [t("setting.Storage.cache.item.data"), set.enable.post.data, "data"],
                          [t("setting.Storage.cache.item.image"), set.enable.post.image, "image"],
                          [t("setting.Storage.cache.item.thumb"), set.enable.post.thumb, "thumb"],
                        ] as [string, boolean, keyof typeof set.enable.post][]).map((e, i) =>
                          <button
                            kiase-sty=""
                            className={clsx(e[1] && style["activ"])}
                            onClick={() => setSet(p => {
                              const _ = cloneDeep(p);
                              _.enable.post[e[2]] = !_.enable.post[e[2]];
                              return _
                            })}
                            key={i}
                          >{e[0]}</button>
                        )
                      }
                    </div>

                    <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.others")}</KiloDown.Thirdtitle>
                    <div className={clsx(style["buttonList"], !chcActiv && style["disable"])}>
                      {
                        ([
                          [t("setting.Storage.cache.item.pool"), set.enable.pool, "pool"],
                          [t("setting.Storage.cache.item.tags"), set.enable.tags, "tags"],
                        ] as [string, boolean, keyof typeof set.enable][]).map((e, i) =>
                          <button
                            kiase-sty=""
                            className={clsx(e[1] && style["activ"])}
                            onClick={() => setSet(p => {
                              const _ = cloneDeep(p);
                              (_.enable[e[2]] as boolean) = !_.enable[e[2]];
                              return _
                            })}
                            key={i}
                          >{e[0]}</button>
                        )
                      }
                    </div>

                    <br />

                    <KiloDown.Subtitle>{t("setting.Storage.cache.section.limits")}</KiloDown.Subtitle>
                    <div className={clsx(style["buttonList"], !chcActiv && style["disable"])}>
                      {
                        ([
                          [t("setting.Storage.cache.limit.manual"), set.isManualLimit, "isManualLimit"],
                        ] as [string, boolean, keyof typeof set][]).map((e, i) =>
                          <button
                            kiase-sty=""
                            className={clsx(e[1] && style["activ"])}
                            onClick={() => setSet(p => {
                              const _ = cloneDeep(p);
                              (_[e[2]] as boolean) = !_[e[2]];
                              return _
                            })}
                            key={i}
                          >{e[0]}</button>
                        )
                      }
                    </div>
                    <br />
                    <div small-txt="">{t("setting.Storage.cache.limit.hint")}</div>
                    <br />
                    {
                      ([
                        [t("setting.Storage.cache.limit.all"), set.limit._all, "_all"],
                      ] as [string, number, keyof typeof set.limit][]).map((e, i) =>
                        <div key={i}>
                          {e[0]}<input
                            kiase-sty=""
                            min={0}
                            type="number"
                            style={{ width: "50px", marginLeft: "10px" }}
                            defaultValue={e[1]}
                            disabled={set.isManualLimit || !chcActiv}
                            onChange={(ev) => setSet(p => {
                              const _ = cloneDeep(p);
                              (_.limit[e[2]] as number) = +ev.currentTarget.value;
                              return _
                            })}

                          />
                        </div>
                      )
                    }

                    <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.post")}</KiloDown.Thirdtitle>
                    {
                      ([
                        [t("setting.Storage.cache.item.data"), set.limit.post.data, "data"],
                        [t("setting.Storage.cache.item.image"), set.limit.post.image, "image"],
                        [t("setting.Storage.cache.item.thumb"), set.limit.post.thumb, "thumb"],
                      ] as [string, number, keyof typeof set.limit.post][]).map((e, i) =>
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", marginBottom: "10px" }}>
                          <div>
                            {e[0]}
                          </div>
                          <input
                            kiase-sty=""
                            min={0}
                            type="number"
                            style={{ width: "50px", marginLeft: "10px" }}
                            defaultValue={e[1]}
                            disabled={!set.isManualLimit || !chcActiv}
                            onChange={(ev) => setSet(p => {
                              const _ = cloneDeep(p);
                              (_.limit.post[e[2]] as number) = +ev.currentTarget.value;
                              return _
                            })}

                          />
                        </div>
                      )
                    }
                    <KiloDown.Thirdtitle>{t("setting.Storage.cache.section.others")}</KiloDown.Thirdtitle>
                    {
                      ([
                        [t("setting.Storage.cache.item.pool"), set.limit.pool, "pool"],
                        [t("setting.Storage.cache.item.tags"), set.limit.tags, "tags"],
                      ] as [string, number, keyof typeof set.limit][]).map((e, i) =>
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", marginBottom: "10px" }}>
                          <div>
                            {e[0]}
                          </div>
                          <input
                            kiase-sty=""
                            min={0}
                            type="number"
                            style={{ width: "50px", marginLeft: "10px" }}
                            defaultValue={e[1]}
                            disabled={!set.isManualLimit || !chcActiv}
                            onChange={(ev) => setSet(p => {
                              const _ = cloneDeep(p);
                              (_.limit[e[2]] as number) = +ev.currentTarget.value;
                              return _
                            })}

                          />
                        </div>
                      )
                    }
                  </div>
                </>
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

                const timeCode = fuckingState.clock()
                const [format, setFormat] = useState<string[]>(nowSetting.appearance.clockFormat)

                return <>
                  <KiloDown.Subtitle>{t("setting.Appearance.general.scale")}</KiloDown.Subtitle>
                  <KiloDown.Thirdtitle>{t("setting.Appearance.general.scale.info")}</KiloDown.Thirdtitle>
                  <div className={style["buttonList"]}>
                    {scaleGear.map((scale, i) => <button
                      key={i}
                      kiase-sty=""
                      btn-activ={`${nowSetting.appearance.scale === scale}`}
                      onClick={() => someActions.setSetting(usrIndx, e => {
                        e.appearance.scale = scale
                        return e
                      })}
                    >
                      {scale}%
                    </button>)}
                  </div>

                  <br />
                  <br />

                  <KiloDown.Subtitle>{t("setting.Appearance.general.clockFormat")}</KiloDown.Subtitle>
                  <KiloDown.Thirdtitle>{t("setting.Appearance.general.clockFormat.info")}</KiloDown.Thirdtitle>
                  <KiloDown.SmallText>{t("setting.Appearance.general.clockFormat.info.fun").map((e: string) => <>{e}<br /></>)}</KiloDown.SmallText>
                  <KiloDown.Thirdtitle>{t("setting.Appearance.general.clockFormat.preview")}</KiloDown.Thirdtitle>
                  {format.map((e, i) => <div key={i} mid-txt="">{cnvFormat.clock(timeCode, e)}</div>)}
                  <br />
                  <div small-txt="">{
                    t("setting.Appearance.general.clockFormat.formatInfo").map((e: string, i: number) => e ? <div pre-text="" key={i}>{e}</div> : <br key={i} />)
                  }</div >
                  <br />
                  {(() => {
                    const count = format.length;
                    let txt = "";

                    if (count > 2) txt = t("setting.Appearance.general.clockFormat.overFlow");
                    else if (count <= 0) txt = t("setting.Appearance.general.clockFormat.none");

                    if (txt)
                      return <> <KiloDown.SmallText>{txt}</KiloDown.SmallText><br /><br /></>;
                  })()}
                  <SettingEditor.ListEditor
                    list={format}
                    onChange={setFormat}
                    children={(child) => <div className={style["ListEditor"]}>
                      <div className={style["list"]}>
                        {child.items.map((e, i) => <div className={style["item"]} key={i}>
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
                  <br />
                  <div className={style["buttonList"]}>
                    <button
                      kiase-sty=""
                      disabled={nowSetting.appearance.clockFormat.join("") === format.join("")}
                      onClick={() => someActions.setSetting(usrIndx, e => {
                        e.appearance.clockFormat = format
                        return e
                      })
                      }
                    >{t("setting.Appearance.general.clockFormat.apply")}</button>
                    <button
                      kiase-sty=""
                      disabled={nowSetting.appearance.clockFormat.join("") === format.join("")}
                      onClick={() => {
                        setFormat(nowSetting.appearance.clockFormat)
                      }}
                    >{t("setting.Appearance.general.clockFormat.restore")}</button>
                    <button
                      kiase-sty=""
                      onClick={() => {
                        setFormat(newEmptyAccount.setting.appearance.clockFormat)
                      }}
                    >{t("setting.Appearance.general.clockFormat.restoreDefault")}</button>
                  </div>


                </>
              }
              case "performance": {
                type Performance = workSpaceType.Unit.SettingUnit.Performance
                type key = keyof Performance

                const [PERFSET, SETPERF] = useState<Performance>(nowSetting.performance)

                const setValue = (target: key, value: boolean) => {
                  SETPERF(e => {
                    const _ = cloneDeep(e)
                    _[target] = value
                    return _
                  })
                }

                const Controler = (tar: key, cont?: key[]) => {
                  const btn = (bool: boolean, click: () => void, txt: string) => (
                    <button
                      kiase-sty=""
                      onClick={click}
                      btn-activ={bool && "true"}
                    >
                      {txt}
                    </button>
                  )
                  return <>
                    <KiloDown.Subtitle>{t(`setting.Appearance.performance.opt.${tar}`)}</KiloDown.Subtitle>
                    <KiloDown.Thirdtitle>{t(`setting.Appearance.performance.opt.${tar}.dec`)}</KiloDown.Thirdtitle>
                    <div
                      className={clsx(
                        style["buttonList"],
                        !(cont?.every(e => PERFSET[e]) ?? true) && style["disable"]
                      )}
                    >
                      {btn(PERFSET[tar], () => setValue(tar, true), t(`setting.Appearance.performance.btn.enb`))}
                      {btn(!PERFSET[tar], () => setValue(tar, false), t(`setting.Appearance.performance.btn.deb`))}
                    </div>
                    <br />
                  </>
                }

                useEffect(() => {
                  someActions.setSetting(usrIndx, e => {
                    e.performance = PERFSET
                    return e
                  })
                }, [PERFSET])

                return <>
                  <KiloDown.Title>{t(`setting.Appearance.performance.info`)}</KiloDown.Title>
                  <KiloDown.Subtitle>{t(`setting.Appearance.performance.dec`)}</KiloDown.Subtitle>
                  <br />
                  {Controler("All")}
                  {Controler("cssAnimation", ["All"])}
                  {Controler("transition", ["All"])}
                  {Controler("transitionDelay", ["All", "transition"])}
                  {Controler("cssFilter", ["All"])}
                  {Controler("backdropFilter", ["All"])}
                  {Controler("transparenWinodw", ["All", "backdropFilter"])}
                </>
              }
              case "theme": {
                const [newColor, setNewColor] = useState<string>("#ffffff")
                const [colorList, setColorList] = useState<string[]>([])

                useEffect(() => {
                  (async () => {
                    const state = await (await WSA.userState(usrIndx)).get();
                    const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                    const wallpaperUrl = wsInfo.wallpaper.url!;
                    if (wallpaperUrl) {
                      const out = await LABS_E621_API.other.proxy({ url: wallpaperUrl });
                      setColorList(out);
                    }
                  })();
                }, [nowSetting.appearance.wallpaper])

                useEffect(() => {
                  (async () => {
                    const state = await (await WSA.userState(usrIndx)).get();
                    const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                    setNewColor(wsInfo.color);
                  })();
                }, [])

                return <>
                  <div>懶惰寫界面 先這樣吧 凑合著用</div>
                  <input type="color" value={newColor} onChange={(e) => setNewColor(e.currentTarget.value)} />
                  <button kiase-sty="" onClick={() => someActions.setColor(usrIndx, newColor)}>{"apply"}</button>
                  <br />
                  {colorList}
                </>
              }
              case "wallpaper": {
                const [bgCfg, setBgCfg] = useState<workSpaceType.Unit.BaseItem.Image>({ url: "" });
                const resolution = fuckingState.resolution();

                // 透過 WSA 抓取當前工作區的桌布
                useEffect(() => {
                  (async () => {
                    const state = await (await WSA.userState(usrIndx)).get();
                    const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                    setBgCfg(wsInfo.wallpaper ?? nowSetting.appearance.wallpaper);
                  })();
                }, [nowSetting.appearance.wallpaper]);

                const updateVal = (key: keyof workSpaceType.Unit.BaseItem.Image, val: number) => {
                  setBgCfg(prev => ({ ...prev, [key]: val }));
                };

                return <div className={style["Wallpaper"]}>
                  <div className={style["positionSet"]}>
                    <div className={style["frame"]}>
                      <div
                        className={style["image"]}
                        style={{ aspectRatio: `${resolution[0]} / ${resolution[1]}` }}
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
                          <span>{t("setting.Appearance.wallpaper.set")}</span>
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

                      <button kiase-sty="" onClick={async () => {
                        const state = await (await WSA.userState(usrIndx)).get();
                        const wsInfo = await WSA.getWorkspaceInfo(usrIndx, state.nowWorkSpace, "setting");
                        await WSA.updateWorkspace(usrIndx, state.nowWorkSpace, {
                          setting: { ...wsInfo, wallpaper: bgCfg }
                        });
                      }}>{t("setting.Appearance.wallpaper.apply")}</button>
                      {bgCfg.fromPost && <button
                        kiase-sty=""
                        onClick={() => someActions.openWithGetByID(bgCfg.fromPost!)}
                        draggable={true}
                        onDragStart={(e) => {
                          dragItem(e, {
                            type: "post",
                            data: bgCfg.fromPost!
                          });
                        }}
                      >{t("setting.Appearance.wallpaper.source")}</button>}
                    </div>
                  </div>
                </div>
              }
            }
          }

          case "information": {
            /* 本人因爲覺得 需要保留個性 所以把這裏的i18n砍了 */
            /* KIASENOLO need keep he SOUL, so this area dont hav apply i18n*/
            /* KIASENOLO u kapste nes SOLE, sie noot o i18n aplea nes are*/
            switch (nowPage.pages) {
              case "general": {
                const [status, setStatus] = useState<string>("")
                const [exportUrl, setExportUrl] = useState<string>("")

                const [nowProcess, setNowProcess] = useState<[number, number] | null>(null)


                useEffect(() => {
                  return () => {
                    exportUrl ?? URL.revokeObjectURL(exportUrl);
                  }
                }, [])
                const fileRef = useRef<HTMLInputElement>(null)

                const handleExport = async () => {
                  setStatus(t("IN_DEV.exporting"))
                  try {
                    exportUrl ?? URL.revokeObjectURL(exportUrl);
                    setExportUrl("")
                    const data = await WSA.exportSaves()
                    const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/zip" })
                    const url = URL.createObjectURL(blob)
                    setExportUrl(url)
                    const anchor = document.createElement("a")
                    anchor.href = url
                    anchor.download = `Kilo-Saves-${Date.now()}.zip`
                    anchor.click()
                    setStatus(t("IN_DEV.exportDone"))
                  } catch (error) {
                    setStatus(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
                  }
                }

                const handleImport = () => {
                  newInput.message(
                    t("IN_DEV.import.msg"),
                    [{ name: t("IN_DEV.import.no"), value: "" }, { name: t("IN_DEV.import.yes"), value: "ok", key: "Enter" }],
                    async (e) => {
                      if (e !== "ok") return;
                      const inp = document.createElement("input")
                      inp.type = "file"; inp.accept = ".zip"; inp.click();
                      inp.onchange = async (ev) => {
                        const files = (ev.target as HTMLInputElement).files;
                        if (files && files[0]) {
                          try {
                            setImporting(true)
                            await WSA.importSaves(files[0])
                            SET_READY(false)
                            setTimeout(() => {
                              SET_READY(true)
                              setImporting(false)
                            }, 100);
                          } catch (error) {
                            setImporting(false)
                            setStatus(`Import failed: ${error instanceof Error ? error.message : String(error)}`)
                          }
                        }
                      }
                    }
                  )
                }


                const handleExportIndexedDB = async (): Promise<void> => {
                  return new Promise((resolve, reject) => {
                    const request = indexedDB.open("e621_enhanced_db");

                    request.onerror = () => reject("無法開啟資料庫");

                    request.onsuccess = async (event) => {
                      const db = (event.target as IDBOpenDBRequest).result;
                      const storeNames = Array.from(db.objectStoreNames);

                      if (storeNames.length === 0) {
                        alert("資料庫是空的，無需匯出");
                        db.close();
                        return resolve();
                      }

                      const exportData: Record<string, any[]> = {};

                      try {
                        const transaction = db.transaction(storeNames, "readonly");

                        await Promise.all(
                          storeNames.map((name) => {
                            return new Promise<void>((res, rej) => {
                              const store = transaction.objectStore(name);
                              const req = store.getAll();
                              req.onsuccess = () => {
                                exportData[name] = req.result;
                                res();
                              };
                              req.onerror = () => rej(`讀取 Store ${name} 失敗`);
                            });
                          })
                        );

                        const jsonStr = JSON.stringify(exportData);
                        const blob = new Blob([jsonStr], { type: "application/json" });
                        const url = URL.createObjectURL(blob);

                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `backup_${new Date().toISOString().slice(0, 10)}.indxdb`;
                        a.click();

                        setTimeout(() => URL.revokeObjectURL(url), 1000);

                        db.close();
                        resolve();
                      } catch (err) {
                        db.close();
                        reject(err);
                      }
                    };
                  });
                };

                const handleImportIndexedDB = async (): Promise<void> => {
                  return new Promise((resolve, reject) => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.accept = ".indxdb";

                    inp.onchange = async (ev) => {
                      const file = (ev.target as HTMLInputElement).files?.[0];
                      if (!file) return reject("未選擇檔案");

                      const reader = new FileReader();
                      reader.onload = async (loadEv) => {
                        try {
                          const content = loadEv.target?.result?.toString() ?? "";
                          const decodedData = JSON.parse(content);

                          const dbRequest = indexedDB.open("e621_enhanced_db");
                          dbRequest.onsuccess = (event) => {
                            const db = (event.target as IDBOpenDBRequest).result;
                            const fileStoreNames = Object.keys(decodedData);

                            const validStoreNames = fileStoreNames.filter(name =>
                              db.objectStoreNames.contains(name)
                            );

                            if (validStoreNames.length === 0) {
                              db.close();
                              return reject("匯入檔案中沒有符合的資料表");
                            }

                            const transaction = db.transaction(validStoreNames, "readwrite");

                            transaction.oncomplete = () => {
                              db.close();
                              alert("匯入成功");
                              resolve();
                            };

                            transaction.onerror = (e) => {
                              console.error("Transaction Error:", e);
                              reject("寫入資料失敗");
                            };

                            validStoreNames.forEach((name) => {
                              const store = transaction.objectStore(name);
                              store.clear();
                              decodedData[name].forEach((item: any) => {
                                store.put(item);
                              });
                            });
                          };

                          dbRequest.onerror = () => reject("無法開啟資料庫進行匯入");

                        } catch (err) {
                          reject("解析檔案失敗，格式可能不正確");
                        }
                      };
                      reader.readAsText(file);
                    };

                    inp.click();
                  });
                };


                const handleImportOld = () => {
                  newInput.message(
                    t("IN_DEV.import.msg"),
                    [{ name: t("IN_DEV.import.no"), value: "" }, { name: t("IN_DEV.import.yes"), value: "ok", key: "Enter" }],
                    async (e) => {
                      if (e !== "ok") return;
                      const inp = document.createElement("input")
                      inp.type = "file"; inp.accept = ".wss"; inp.click();
                      inp.onchange = async (ev) => {
                        const files = (ev.target as HTMLInputElement).files;
                        const reader = new FileReader();
                        if (files && files[0]) {
                          reader.onload = async (loadEv) => {
                            await WSA.importSavesOld(JSON.parse(functions.fromBase64(loadEv.target?.result?.toString() ?? "{}")))
                            SET_READY(false)
                            setImporting(true)
                            setTimeout(() => {
                              SET_READY(true)
                              setImporting(false)
                            }, 100);
                          }
                          reader.readAsText(files[0]);
                        }
                      }
                    }
                  )
                }

                const handleExportToFolder = async () => {
                  if (!('showDirectoryPicker' in window)) {
                    setStatus("瀏覽器不支援（請用 Chrome/Edge）");
                    return;
                  }
                  try {
                    const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                    setStatus(t("IN_DEV.exporting"));
                    await WSA.exportToDirectoryHandle(dirHandle, (n1, n2) => setNowProcess([n1, n2]));
                    setStatus(t("IN_DEV.exportDone"));
                  } catch (error: any) {
                    if (error.name !== 'AbortError') {
                      setStatus(`匯出失敗: ${error.message}`);
                    }
                  }
                };

                const handleImportFromFolder = async () => {
                  if (!('showDirectoryPicker' in window)) {
                    setStatus("瀏覽器不支援（請用 Chrome/Edge）");
                    return;
                  }

                  let dirHandle: any;
                  try {
                    dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
                  } catch (error: any) {
                    if (error.name !== 'AbortError') {
                      setStatus(`無法開啟資料夾: ${error.message}`);
                    }
                    return;
                  }

                  newInput.message(
                    t("IN_DEV.import.msg"),
                    [
                      { name: t("IN_DEV.import.no"), value: "" },
                      { name: t("IN_DEV.import.yes"), value: "ok", key: "Enter" }
                    ],
                    async (e) => {
                      if (e !== "ok") return;
                      try {
                        setImporting(true);
                        setStatus("匯入中...");
                        await WSA.importFromDirectoryHandle(dirHandle, (n1, n2) => setNowProcess([n1, n2]));
                        SET_READY(false);
                        setTimeout(() => {
                          SET_READY(true);
                          setImporting(false);
                          setStatus("資料夾匯入完成。");
                        }, 100);
                      } catch (error: any) {
                        setImporting(false);
                        if (error.name !== 'AbortError') {
                          setStatus(`匯入失敗: ${error.message}`);
                        }
                      }
                    }
                  );
                };

                return <div className={style["Information"]}>
                  <div className={style["Background"]}>
                    <NODATA.Fetching />
                  </div>
                  <div className={style["Text"]}>
                    <div className={style["Frame"]}>
                      <h1>E621 App</h1>
                      <h2>inDev 0.1.0</h2>
                      <h3>{navigator.appVersion}</h3>

                      <br />

                      <h2>
                        {[
                          "用視窗化的方式 來用你的E621",
                          "十分好玩 下次別玩了",
                          "",
                          "寫這個東西 還是很開心的",
                          "雖然 真的有夠難寫",
                          "但是起碼 我做到了",
                          "直覺的交互 直覺的邏輯",
                          "還有吃效能的動畫 欸十分好",
                          "反正 就 也算是圓了一個KILO OS的夢吧",
                          "我不知道 反正 就這樣",
                          "哦對了 雖然 這句是我朋友講的 但我還是要講",
                          "就 額 就 我好像真的把E621當專業軟體在寫欸",
                          "",
                          "--20260417",
                          "怎麽説 今天更新的東西 讓我突然覺得這東西可以向直接提升不知道幾倍 幹超爽",
                          "然後你可以透過改存檔的方式 直接把其他的使用者 複製過來 超爽",
                          "當然 改名也可以 因爲我沒有專門的注冊表去注冊使用者列表",
                          "使用者列表是掃路徑 掃出來的",
                        ].map((e, i) => <>{e}<br key={i} /></>)}

                        <br />

                        <a href="https://github.com/kiasenolo/E621-App" kilo-style="" target="_blank">{t("setting.Information.general.repoLink")}</a>
                      </h2>

                    </div>
                    <br />
                    {t("IN_DEV.tips").map((e: string, i: number) => <KiloDown.Thirdtitle key={i}>{e}</KiloDown.Thirdtitle>)}
                    <div className={style["buttonList"]}>
                      <button kiase-sty="" onClick={handleExport}>
                        {t("IN_DEV.save")}
                      </button>
                      <button kiase-sty="" onClick={handleImport}>
                        {t("IN_DEV.import")}
                      </button>
                    </div>
                    <br />
                    <div className={style["buttonList"]}>
                      <button kiase-sty="" onClick={handleExportToFolder}>
                        {t("IN_DEV.saveToFolder")}
                      </button>
                      <button kiase-sty="" onClick={handleImportFromFolder}>
                        {t("IN_DEV.importFromFolder")}
                      </button>
                    </div>
                    <br />
                    <div className={style["buttonList"]}>
                      <button kiase-sty="" onClick={handleImportOld}>
                        {t("IN_DEV.importOld")}
                      </button>
                    </div>
                    <KiloDown.Thirdtitle>{`${status ? status : "..."}` + (nowProcess ? (` [ ${nowProcess[1]} / ${nowProcess[0]} ]`) : "")}</KiloDown.Thirdtitle>
                    <br />
                    <button kiase-sty="" disabled={!!!exportUrl} onClick={() => {
                      const anchor = document.createElement("a")
                      anchor.href = exportUrl
                      anchor.download = `Kilo-Saves-${Date.now()}.zip`
                      anchor.click()
                    }}>{t("IN_DEV.downloadAgain")}</button>
                    <br />
                    <br />
                    <KiloDown.Thirdtitle>{"Indexed DB"}</KiloDown.Thirdtitle>
                    <br />
                    <button kiase-sty="" onClick={handleExportIndexedDB}>
                      {t("IN_DEV.save")}
                    </button>
                    <button kiase-sty="" onClick={handleImportIndexedDB}>
                      {t("IN_DEV.import")}
                    </button>
                  </div>
                </div>
              }

              case "license": {
                return <div className={style["Information"]}>
                  <div className={style["Text"]}>
                    <div className={style["Frame"]}>
                      <h1>MIT license</h1>
                      <br />
                      <h2>
                        Copyright (C) 2026 KIASENOLO
                        <br />
                        <br />
                        Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
                        <br />
                        <br />
                        The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
                        <br />
                        <br />
                        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                      </h2>
                    </div>
                  </div>
                </div>
              }
              case "package": {
                type ITEM_TYPE = {
                  name: string,
                  key: string,
                  info: string,
                  url: string,
                }

                const LIST: ITEM_TYPE[] = [
                  {
                    name: "Next.JS",
                    key: "next",
                    info: "額.....從小用到的大的框架",
                    url: "https://nextjs.org/"
                  },
                  {
                    name: "React",
                    key: "react",
                    info: "額....也是從小用到大的函式庫",
                    url: "https://react.dev/"
                  },
                  {
                    name: "SASS/SCSS",
                    key: "sass",
                    info: "寫樣式表用的",
                    url: "https://sass-lang.com/"
                  },
                  {
                    name: "CLSX",
                    key: "clsx",
                    info: "很好用的 處理className用的",
                    url: "https://www.npmjs.com/package/clsx"
                  },
                  {
                    name: "Node Vibrant",
                    key: "node-vibrant",
                    info: "抓顔色用的（ 我現階段還沒實作相關的東西 ）",
                    url: "https://vibrant.dev/"
                  },
                  {
                    name: "Fuse.JS",
                    key: "fuse.js",
                    info: "模糊搜尋 給RunBox用的",
                    url: "https://www.fusejs.io/"
                  },
                  {
                    name: "JSZip",
                    key: "jszip",
                    info: "把打包成zip的神奇東西 匯出存檔用的",
                    url: "https://stuk.github.io/jszip/"
                  },
                  {
                    name: "Lodash",
                    key: "lodash",
                    info: "一個很帥的工具集 額 我拿來處理物件用的",
                    url: "https://lodash.com/"
                  },
                  {
                    name: "SHA256",
                    key: "js-sha256",
                    info: "一個哈希工具 在我這邊是拿來生快取的檔名用的",
                    url: "https://www.npmjs.com/package/js-sha256"
                  }
                ]

                return <div className={style["Information"]}>
                  <div className={style["Text"]}>
                    <div className={style["Frame"]}>
                      <h1>Package List</h1>
                      {LIST.map((e, i) => <div key={i}>
                        <h2>
                          {"<-\\"} <a href={e.url} kilo-style="" target="_blank">{e.name} - {(PACKAGE_LIST.dependencies as any)[e.key as any]}</a>
                          <br />
                          {"/->"} {e.info}
                        </h2>
                        <br />
                      </div>)}
                    </div>
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
            t("menuButton.top.Category"),
            [
              {
                name: t("setting.Home"),
                action() { setNowPage("NONE") },
              },
              ...settingTabs.categorieList.map(e => ({
                name: tCategory(e),
                action() {
                  setNowPage({
                    categorie: e,
                    pages: settingTabs.pageList[e]![0] as any
                  })
                }
              })) as MenuAction.Item[]
            ]
          ],
          ...(nowPage !== "NONE" ?
            [
              [
                t("menuButton.top.Tab"),
                settingTabs.pageList[nowPage.categorie].map(e => ({
                  name: tPage(nowPage.categorie, e),
                  action() {
                    setNowPage({
                      categorie: nowPage.categorie,
                      pages: e as any
                    })
                  }
                }))
              ]
            ]
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
                "storage",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M120-160v-148h720v148H120Zm60-38h72v-72h-72v72Zm-60-454v-148h720v148H120Zm60-38h72v-72h-72v72Zm-60 284v-148h720v148H120Zm60-38h72v-72h-72v72Z" /></svg>
              ],
              [
                "appearance",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M583-40H440q-14.45 0-24.23-9.78Q406-59.55 406-74v-250q0-14.45 9.77-24.23Q425.55-358 440-358h41v-133H140q-24.75 0-42.37-17.63Q80-526.25 80-551v-193q0-24.75 17.63-42.38Q115.25-804 140-804h83v-42q0-14.45 9.77-24.22Q242.55-880 257-880h509q14.45 0 24.22 9.78Q800-860.45 800-846v152q0 14.45-9.78 24.22Q780.45-660 766-660H257q-14.45 0-24.23-9.78Q223-679.55 223-694v-50h-83v193h341q24.75 0 42.38 17.62Q541-515.75 541-491v133h42q14.45 0 24.22 9.77Q617-338.45 617-324v250q0 14.45-9.78 24.22Q597.45-40 583-40Zm-117-60h91v-198h-91v198ZM283-720h457v-100H283v100Zm183 620h91-91ZM283-720v-100 100Z" /></svg>
              ],
              [
                "information",
                <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px"><path d="M483.18-280q12.82 0 21.32-8.63 8.5-8.62 8.5-21.37v-180q0-12.75-8.68-21.38-8.67-8.62-21.5-8.62-12.82 0-21.32 8.62-8.5 8.63-8.5 21.38v180q0 12.75 8.68 21.37 8.67 8.63 21.5 8.63Zm-3.2-314q14.02 0 23.52-9.2T513-626q0-14.45-9.48-24.22-9.48-9.78-23.5-9.78t-23.52 9.78Q447-640.45 447-626q0 13.6 9.48 22.8 9.48 9.2 23.5 9.2Zm.29 514q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z" /></svg>
              ],
            ] as [e621Type.window.dataType.settingTabs.categorieType, JSX.Element][]).map((e, i) =>
              <button
                key={i}
                className={clsx(showIndex && style["displayIndex"])}
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
          <div className={clsx(style["tabs"], showTabs && style["display"])}>
            <div className={style["list"]}>
              {settingTabs.categorieList.map((e, i) => <span
                className={clsx(
                  style["cart"],
                  nowPage === "NONE" ? "" : e === nowPage.categorie ? style["activ"] : ""
                )}
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

    const [tmpList, setTmpList] = useState<{ uuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }[]>([]);

    useEffect(() => {
      WSA.listTmpItems(usrIndx).then(e => {
        setTmpList(e.reverse())
        setTimeout(() => {
          void eRef.current!.clientHeight
          setStart(true)
        }, 10);
      });
      const onAdd = (e: WSAction.WorkSpaceEventMap["tmpItem:added"]) => e.detail.userId === usrIndx && setTmpList(prev => [...prev, { uuid: e.detail.itemUuid, item: e.detail.item }]);
      const onUpdate = (e: WSAction.WorkSpaceEventMap["tmpItem:update"]) => e.detail.userId === usrIndx && setTmpList(prev => {
        const newList = [...prev];
        newList[newList.findIndex(item => item.uuid === e.detail.itemUuid)].item = e.detail.newItem;
        return newList;
      });
      const onRemove = (e: WSAction.WorkSpaceEventMap["tmpItem:removed"]) => e.detail.userId === usrIndx && setTmpList(prev => prev.filter(i => i.uuid !== e.detail.itemUuid));
      const onClear = (e: WSAction.WorkSpaceEventMap["tmpItem:cleared"]) => e.detail.userId === usrIndx && setTmpList([]);

      WSA.addEventListener("tmpItem:added", onAdd);
      WSA.addEventListener("tmpItem:update", onUpdate);
      WSA.addEventListener("tmpItem:removed", onRemove);
      WSA.addEventListener("tmpItem:cleared", onClear);
      return () => {
        WSA.removeEventListener("tmpItem:added", onAdd);
        WSA.removeEventListener("tmpItem:update", onUpdate);
        WSA.removeEventListener("tmpItem:removed", onRemove);
        WSA.removeEventListener("tmpItem:cleared", onClear);
      };
    }, []);

    useEffect(() => {
      thisWindow?.setTitle(t("windowsType.tmpList"))
    }, [])

    return (
      <WINDOW_FRAME className={style["tmpList"]} menulist={[
        windowAction(windowID),
        [
          t("menuButton.top.Data"),
          [
            {
              name: t("menuButton.ClearAll"),
              action() {
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
                          someActions.setAppState(e => {
                            WSA.clearTmpList(usrIndx);
                            return e
                          })
                        }
                      })

                    }, .5e3);
                  }
                })
              }
            }

          ]
        ]
      ]}>
        <div
          className={clsx(style["list"], start ? style["START"] : "")}
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

              switch (type) {
                case "tag": {
                  if (data.action === "=") {
                    const createAt = GetNowTime()
                    someActions.saveToTmp(usrIndx,
                      {
                        type: "postSearch",
                        data: {
                          nowPage: 1,
                          pageCache: [],
                          searchTags: [data.tag]
                        }
                      }
                      , `${t("windowsType.postSearch")} [ ${data.tag} ]`, `post_search-${createAt}`)
                  }
                  break;
                };
                case "postSearch": {
                  someActions.saveToTmp(usrIndx, { type: "postSearch", data: item.data }, item.thisWindow!.title, item.thisWindow!.id)
                  break;
                };
                case "post": {
                  someActions.saveToTmp(usrIndx, {
                    type: "postGetByID",
                    data: {
                      currentId: data.id,
                      status: "success",
                      fetchedPost: data
                    }
                  }, `${t("windowsType.postGetByID")} [ ${data.id} ]`, `post_get_by_id-${data.id}`)
                  break;
                };
                case "postId": {
                  someActions.saveToTmp(usrIndx, {
                    type: "postGetByID",
                    data: {
                      currentId: data,
                      status: "loading",
                    }
                  }, `${t("windowsType.postGetByID")} [ ${data} ]`, `post_get_by_id-${data}`)
                  break;
                };
                case "postImg": {
                  someActions.saveToTmp(usrIndx, {
                    type: "viewer",
                    data: data
                  }, `${t("windowsType.viewer")} [ ${data.id} ]`, `viewer-${data.id}`)
                  break;
                };
                case "pool": {
                  someActions.saveToTmp(usrIndx, { type: "pool", data: item.data }, item.thisWindow!.title, item.thisWindow!.id)
                  break;
                };
                case "poolId": {
                  someActions.saveToTmp(usrIndx, {
                    type: "pool",
                    data: {
                      nowPage: 1,
                      pageCache: {},
                      poolId: data
                    }
                  },
                    `${t("windowsType.pool")} : ${data} [ Page : 1 ]`,
                    `pool-${data}`
                  )
                  break;
                };
                case "setting": {
                  _app.throwNewNotic("儲存設定檔請去設定裏面自己匯出 這裏不會鳥你");
                  break;
                };
                case "temp": {
                  _app.throwNewNotic("沒打算玩樹狀結構");
                  break;
                };
                case "text": {
                  _app.throwNewNotic("欸....純文字嗎...下次");
                  break;
                };
              }
            }
          }}
        >
          {tmpList.map(({ uuid, item }, index) => {
            const baseDely = DELAY_EFFECT(index * .05, 0)
            const dItem: e621Type.DragItemType.defaul | undefined = (() => {
              const { data } = item
              switch (data.type) {
                case "postSearch":
                  return {
                    type: "postSearch",
                    data: data.data
                  }

                case "postGetByID":
                  if (data.data.fetchedPost) {
                    return {
                      type: "post",
                      data: data.data.fetchedPost
                    }
                  } else {
                    return {
                      type: "postID",
                      data: data.data.currentId
                    }
                  }
                case "pool":
                  return {
                    type: "pool",
                    data: data.data
                  }
                case "viewer":
                  return {
                    type: "postImg",
                    data: data.data
                  }

                default: return undefined
              }
            })() as e621Type.DragItemType.defaul;

            return <div
              key={item.createAt}
              className={style["item"]}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              style={{
                transitionDelay: DELAY_EFFECT(`${baseDely}s`)
              }}
              onDrop={async e => {
                if (!e.dataTransfer) return;
                const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)

                if (itemdata) {
                  const dragItemData: e621Type.DragItemType.defaul = JSON.parse(itemdata)
                  const { data, type } = dragItemData
                  if (type === "tag") {
                    if (data.action === "+" || data.action === "-") {
                      StopEvent(e);

                      if (item.data.type !== "postSearch") return;
                      let searchTags = [...item.data.data.searchTags]

                      if (data.action === "+") {
                        if (searchTags.some(e => e === "-" + data.tag)) {
                          searchTags = searchTags.filter(e => e !== "-" + data.tag)
                        } else if (!searchTags.some(e => e === data.tag)) {
                          searchTags.push(data.tag)
                        } else return;
                      } else if (data.action === "-") {
                        if (searchTags.some(e => e === data.tag)) {
                          searchTags = searchTags.filter(e => e !== data.tag)
                        } else if (!searchTags.some(e => e === "-" + data.tag)) {
                          searchTags.push("-" + data.tag)
                        } else return;
                      }

                      const updatedItem = {
                        ...item,
                        windowTitle: `${t("windowsType.postSearch")} [ ${searchTags.length === 0 ? t("windowsType.postSearch.title.noTags") : searchTags.join(",")} ]`,
                        data: {
                          ...item.data,
                          data: {
                            ...item.data.data,
                            searchTags: searchTags
                          }
                        }
                      };

                      await WSA.updateTmpItem(usrIndx, uuid, updatedItem);
                    }
                  }
                }
              }}
              draggable={dItem ? true : false}
              onDragStart={e => dragItem ? dragItem(e, dItem) : ""}
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
                        async () => {
                          await WSA.removeTmpItem(usrIndx, uuid);
                        }
                      ],
                      [
                        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px"><path d="M378-524q16.33-21.33 44.67-34.67Q451-572 481.33-572q58 0 96 38t38 96q0 58-38 96.33-38 38.34-96 38.34-39.33 0-71.16-19-31.84-19-49.5-50-5.34-9-15.5-12.5-10.17-3.5-19.17 1.5-10.67 5-13.83 15.83-3.17 10.83 2.5 20.5 24.66 44.67 68.33 70.5t98.33 25.83q78 0 132.67-54.66Q668.67-360 668.67-438q0-78-54.67-132.67-54.67-54.66-132.67-54.66-42.66 0-78.33 17.33t-60.33 42.67v-42q0-10.34-7.17-17.5Q328.33-632 318-632t-17.83 7.17q-7.5 7.16-7.5 17.5v108q0 10.33 7.5 17.83 7.5 7.5 17.83 7.5h109.33q10.34 0 17.5-7.5Q452-489 452-499.33q0-10.34-7.17-17.5-7.16-7.17-17.5-7.17H378ZM226.67-80q-27 0-46.84-19.83Q160-119.67 160-146.67v-666.66q0-27 19.83-46.84Q199.67-880 226.67-880H533q13.33 0 25.83 5.33 12.5 5.34 21.5 14.34l200 200q9 9 14.34 21.5Q800-626.33 800-613v466.33q0 27-19.83 46.84Q760.33-80 733.33-80H226.67Zm0-66.67h506.66v-464.66l-202-202H226.67v666.66Zm0 0v-666.66V-146.67Z" /></svg>,
                        () => {
                          const targetID = item.windowId || `${item.createAt}`;

                          const pureId = targetID.replace(/^(post_search-|post-|post_get_by_id-|pool-|viewer-)/, "");

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

                              case "viewer":
                                return <windowsType.viewer key={remountKey} id={pureId} />;

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
                      (() => {
                        const { data } = item
                        switch (data.type) {
                          case "postSearch":
                            return {
                              type: "postSearch",
                              data: data.data
                            }

                          case "postGetByID":
                            if (data.data.fetchedPost) {
                              return {
                                type: "post",
                                data: data.data
                              }
                            } else {
                              return {
                                type: "postID",
                                data: data.data.currentId
                              }
                            }
                          case "pool":
                            return {
                              type: "pool",
                              data: data.data
                            }
                          case "viewer":
                            return {
                              type: "postImg",
                              data: data.data
                            }
                        }
                      })() as e621Type.DragItemType.defaul,
                    ] as ([JSX.Element, (() => void)] | [JSX.Element, (() => void), e621Type.DragItemType.defaul])[])
                      .map((e, i) =>
                        i === 2 ? <></> :
                          <button
                            key={i}
                            onClick={e[1]}
                          >
                            {e[0]}
                          </button>
                      )
                  }
                </div>
              </div>
              <div className={style["flash"]}>

                <div
                  className={style["frist"]}
                  style={{
                    transitionDelay: DELAY_EFFECT(`${baseDely + .05}s`)
                  }}
                />

                <div className={style["add"]} />

              </div>
            </div>
          })}
          <div style={{ marginTop: "100px" }} />
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

createWindow = function (wmRef, customData, other, setData) {
  const wm = wmRef.current
  const createAt = GetNowTime();

  const hasId = (winID: string) => {
    if (wm?.getWindow(winID)) {
      wm?.bringToFront(winID)
      const win = wm?.getWindow(winID)
      win?.setRect({ top: other?.top, left: other?.left }, "px", other?.anchor)
      if (setData) {
        win?.setData(customData)
        switch (customData.type) {
          case "postSearch": {
            return win?.update({
              children: <windowsType.postSearch id={`${createAt}`} />,
            })
          }

          case "postGetByID": {
            const { data } = customData
            const cId = data.currentId;
            return win?.update({
              children: <windowsType.postGetByID id={`${cId}`} key={createAt} />,
            })
          }

          case "pool": {
            const { data } = customData
            const pId = data.poolId;
            return win?.update({
              children: <windowsType.pool id={`${pId}`} key={createAt} />,
            })
          }

          case "viewer": {
            const { data } = customData;
            const pId = data.id;
            return win?.update({
              children: <windowsType.viewer id={`${pId}`} key={createAt} />,
            })
          }

          case "preview": {
            return win?.update({
              children: <windowsType.peekPreview key={createAt} />,
            })
          }
        }
      }
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
        title: t("windowsType.setting"),
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
        title: t("windowsType.tmpList"),
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

      const { defaultSearchFilter } = nowSetting.search

      type dType = e621Type.window.postSearch

      const defaultData: dType = {
        type: "postSearch",
        data: {
          nowPage: 1,
          pageCache: {},
          searchTags: [],
          searchFilter: defaultSearchFilter
        }
      }
      const data: dType = merge({}, defaultData, customData)

      return wm?.createWindow({
        id,
        title: `${t("windowsType.postSearch")} [ ${createAt} ]`,
        children: <windowsType.postSearch id={`${createAt}`} />,
        ...other,
        customData: data
      })
    }

    case "postGetByID": {
      const { data } = customData
      const cId = data.currentId;
      const id = `post_get_by_id-${cId}`;

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: `${t("windowsType.postGetByID")} [ ${cId} ]`,
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
        title: `${t("windowsType.pool")} [ ${pId} ]`,
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
        title: `${t("windowsType.viewer")} [ ${pId} ]`,
        children: <windowsType.viewer id={`${pId}`} />,
        ...other,
        customData,
      })
    }

    case "preview": {
      const { data } = customData;
      const pId = data.id;
      const id = `peek-preview`;
      Kiasole.log(JSON.stringify(customData))

      if (hasId(id)) return id;

      return wm?.createWindow({
        id,
        title: `${t("windowsType.preview")} [ ${pId} ]`,
        children: <windowsType.peekPreview />,
        height: 720,
        width: 1280,
        ...other,
        customData,
        actions: {
          canClose: false,
          canMaximize: false,
          canMinimize: false,
          canResize: false
        }
      })
    }
  }
};

/* ========================================================================================= */

const Menu = () => {
  const [menuDisplay, setMenuDisplay] = useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenuAction.Item[]>([]);
  const [menuPosition, setMenuPosition] = useState<[number, number]>([0, 0]);
  const [menuCenter, setMenuCenter] = useState<MenuAction.CenterPoint>("tl");
  const [dragEvent, setDragEvent] = useState<(e?: dragEvent) => void>(() => { });
  const [hoverd, setHoverd] = useState<boolean>(false);

  MenuAction.showMenu = (items: MenuAction.Item[], [top, left], center, onDrag) => {
    const scale = 100 / nowSetting.appearance.scale
    setMenuCenter(center ?? "tl")
    setMenuItems(items);
    setMenuPosition([(top * scale), (left * scale)]);
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
      className={clsx(style["Menu"], menuDisplay ? "" : style["hide"])}
      onClick={handleBackgroundClick}
      onContextMenu={handleBackgroundClick}
      style={{
        zoom: `${nowSetting.appearance.scale}%`
      }}
    >
      <div
        className={clsx(style["Buttons"], style[menuCenter])}
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
        {menuItems.filter(e => !!e).map((item, index) => (
          <button
            key={`${index}-${item.name}`}
            kiase-style=""
            onMouseUp={() => {
              item.action?.();
              setMenuDisplay(false);
            }}
            disabled={item.dragItem !== undefined ? !item.dragItem : false}
            draggable={!!item.dragItem}
            onDragStart={(e) => {
              item.dragItem ? dragItem(e, item.dragItem) : "";
              setMenuDisplay(false);
              dragEvent();
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ========================================================================================= */

const sharedVideoRegistry = new Map<string, HTMLVideoElement>()

function toProxiedUrl(url: string): string {
  if (!url) return url
  const isMedia = /\.(webm|mp4|jpg|jpeg|png|gif|webp)$/i.test(url)
  if (!isMedia) return url
  return `/api/_LABS/E621-API/media/proxy?url=${encodeURIComponent(url)}`
}

function getOrCreateSharedVideo(url: string): HTMLVideoElement {
  if (sharedVideoRegistry.has(url)) {
    return sharedVideoRegistry.get(url)!
  }
  const video = document.createElement("video")
  video.src = toProxiedUrl(url)
  video.muted = true
  video.autoplay = true
  video.loop = true
  video.playsInline = true
  video.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none"
  document.body.appendChild(video)
  video.play().catch(() => { })
  sharedVideoRegistry.set(url, video)
  return video
}

const VideoMirror = ({ src, style: css }: { src: string; style?: React.CSSProperties }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const master = getOrCreateSharedVideo(src)
    const mirror = videoRef.current!

    if (typeof (master as any).captureStream === "function") {
      mirror.srcObject = (master as any).captureStream() as MediaStream
    } else {
      mirror.src = src
    }
    mirror.play().catch(() => { })

    return () => {
      mirror.srcObject = null
      mirror.src = ""
    }
  }, [src])

  return <video ref={videoRef} style={css} muted autoPlay loop playsInline controls={false} />
}

const Background = ({ bg }: { bg: workSpaceType.Unit.BaseItem.Image }) => {
  const position = `${bg.positionX ?? 50}% ${bg.positionY ?? 50}%`
  const baseCss: React.CSSProperties = {
    objectPosition: position,
    transformOrigin: position,
    transform: `scale(${(bg.scale ?? 100) / 100})`,
  }

  const cachedPost = Cache.useCachedPost(bg.fromPost ?? ({} as E621.Post));
  const cachedSrc = bg.fromPost ? cachedPost : bg.url;

  return (
    <div className={style["Background"]} key={bg.url}>
      {(() => {
        if (functions.str.mulitEndWith([".jpg", ".jpeg", ".png", ".gif", ".webp",], bg.url.toLowerCase())) {
          return <img style={baseCss} src={cachedSrc ?? ""} />
        } else if (functions.str.mulitEndWith([".webm", ".mp4",], bg.url.toLowerCase())) {
          return <VideoMirror src={cachedSrc ?? ""} style={baseCss} />
        }
      })()}

    </div>
  )
}

/* ========================================================================================= */

type windowsList = {
  id: string;
  title: string;
  customData?: e621Type.defaul | undefined;
}[]

type RunBoxArgs = {
  Logout: () => void
  saveWinStatus: (logout?: boolean) => void
  windowsList: windowsList,
  setWorkSpaceEditor: Dispatch<SetStateAction<boolean>>,
}

const RunBox = (arg: RunBoxArgs) => {
  type Option = {
    name: string,
    engName?: string,
    action: () => void,
  }
  const [runBox, setRunBox] = useState<boolean>(false)
  const [runInput, setRunInput] = useState<string>("")
  const [options, setOptions] = useState<Option[]>([])
  const [optionIndex, setOptionIndex] = useState<number>(0)

  const runBoxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRunInput("")
  }, [runBox])

  const selectOpt = useCallback((offset: number) => {
    let nowtar = optionIndex;
    let count = options.length;
    nowtar += offset; nowtar = (nowtar % count + count) % count;
    setOptionIndex(nowtar)
  }, [options, optionIndex])

  useEffect(() => {
    if (!runBox) return;
    const keyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp": {
          selectOpt(-1)
          break;
        }
        case "ArrowDown": {
          selectOpt(1)
          break;
        }
      }
    }

    document.addEventListener("keydown", keyDown)

    return () => {
      document.removeEventListener("keydown", keyDown)
    }
  }, [runBox, selectOpt])

  const optionsList = useMemo(() => {
    const inp = runBoxInputRef.current

    const focusInp = () => inp?.focus();

    const actions: Option[] = [
      {
        name: "> " + t("windowsType.postSearch"),
        engName: "> " + ent("windowsType.postSearch"),
        action() {
          createWindow(wmRef, {
            type: "postSearch",
            data: {
              nowPage: 1,
              pageCache: [],
              searchTags: []
            }
          })
          setRunBox(false);
        },
      },
      {
        name: "> " + t("windowsType.tmpList"),
        engName: "> " + ent("windowsType.tmpList"),
        action() {
          createWindow(wmRef, {
            type: "tmp"
          })
          setRunBox(false);
        },
      },

      {
        name: "> " + t("windowsType.setting"),
        engName: "> " + ent("windowsType.setting"),
        action() {
          createWindow(wmRef, {
            type: "setting",
            data: "NONE",
          })
          setRunBox(false);
        },
      },
      {
        name: "> " + t("workSpaceManager"),
        engName: "> " + ent("workSpaceManager"),
        action() {
          arg.setWorkSpaceEditor(true);
        },
      },
      {
        name: "> " + t("runBox.actions.saveWorkSpaceStatus"),
        engName: "> " + ent("runBox.actions.saveWorkSpaceStatus"),
        action() {
          arg.saveWinStatus()
        },
      },
      {
        name: "> " + t("startMenuSide.logout"),
        engName: "> " + ent("startMenuSide.logout"),
        async action() {
          arg.saveWinStatus(true);
          setRunBox(false);
        },
      },
      {
        name: `> ${t("startMenuSide.logout")} ( ${t("runBox.actions.logout.withoutSaveStatus")} )`,
        engName: `> ${ent("startMenuSide.logout")} ( ${ent("runBox.actions.logout.withoutSaveStatus")} )`,
        action() {
          arg.Logout()
        },
      },
    ]

    const intro: Option[] = [

      {
        name: ": " + t("runBox.intro.searchPost"),
        engName: ": " + ent("runBox.intro.searchPost"),
        action() { setRunInput(":"); focusInp(); },
      },
      {
        name: ". " + t("runBox.intro.poolOrPostID"),
        engName: ". " + ent("runBox.intro.poolOrPostID"),
        action() { setRunInput("."); focusInp(); },
      },
      {
        name: "; " + t("runBox.intro.toggleWindows"),
        engName: "; " + ent("runBox.intro.toggleWindows"),
        action() { setRunInput(";"); focusInp(); },
      },
      {
        name: "> " + t("runBox.intro.appOrOtherAction"),
        engName: "> " + ent("runBox.intro.appOrOtherAction"),
        action() { setRunInput(">"); focusInp(); },
      },
      {
        name: "= " + t("runBox.intro.mathCalc"),
        engName: "= " + ent("runBox.intro.mathCalc"),
        action() { setRunInput("="); focusInp(); },
      },
    ]

    return {
      actions,
      intro,
    }

  }, [nowSetting.lang, arg])

  const opts = useMemo(() => {
    const openSearch = (tags: string) => {
      createWindow(wmRef, {
        type: "postSearch",
        data: {
          nowPage: 1,
          pageCache: [],
          searchTags: tags.split(" ")
        }
      })
      setRunBox(false)
    }


    const calc: (rawInp: string) => Option[] = (rawInp) => {
      try {
        const res = mathjs.evaluate(rawInp)
        return [{
          name: `${t("runBox.intro.mathCalc.calc")} : ${res}`,
          engName: `${ent("runBox.intro.mathCalc.calc")} : ${res}`,
          action() {
            someActions.copyString(res)
            _app.throwNewNotic(`copy ${res} to clipboard`)
            setRunBox(false)
          },
        }]
      } catch {
        return []
      }
    }

    const search: (rawInp: string) => Option[] = (rawInp) => {
      const havCalc = (/[\*\^;]|(\d\s*[\+\=])|([\+\=]\s*\d)/).test(rawInp)
      if (!havCalc) {
        return [{
          name: `${t("runBox.intro.searchPost.search")} : [ ${rawInp.split(" ")} ]`,
          engName: `${ent("runBox.intro.searchPost.search")} : [ ${rawInp.split(" ")} ]`,
          action() {
            openSearch(rawInp)
          },
        }]
      } else return [];
    }

    const openid: (rawInp: string) => Option[] = (rawInp) => {
      const num = Number(rawInp)
      if (!isNaN(num)) {
        return [{
          name: `${t("windowsType.postGetByID")} : [ ${rawInp} ]`,
          engName: `${ent("windowsType.postGetByID")} : [ ${rawInp} ]`,
          action() {
            createWindow(wmRef, {
              type: "postGetByID",
              data: {
                currentId: rawInp,
                status: "loading",
              }
            })
            setRunBox(false)
          }
        },
        {
          name: `${t("windowsType.pool")} : [ ${rawInp} ]`,
          engName: `${ent("windowsType.pool")} : [ ${rawInp} ]`,
          action() {
            createWindow(wmRef, {
              type: "pool",
              data: {
                poolId: +rawInp,
                nowPage: 1,
                pageCache: [],
              }
            })
            setRunBox(false)
          },
        },]
      } else return [];
    }

    return {
      openSearch,
      openid,
      calc,
      search,
    }
  }, [nowSetting.lang])

  useEffect(() => {
    const { calc, openid, search, openSearch } = opts
    setOptionIndex(0)
    if (!runBox) { setOptions([]); return; };
    const rawInp = runInput.trim()
    const inpText = rawInp.slice(1)

    const searchOptions = {
      includeScore: true,
      threshold: 0.3,
      keys: [
        "name",
        "engName",
      ]
    };

    if (rawInp.startsWith(">")) {
      const { actions: apps } = optionsList
      if (inpText) {
        const fuse = new Fuse(apps, searchOptions);

        setOptions(fuse.search(inpText).map(e => e.item))

      } else {
        setOptions(apps)
      }
    } else if (rawInp.startsWith(":")) {
      if (inpText) {
        setOptions([
          ...search(inpText)
        ])
      } else {
        setOptions([
          {
            name: t("runBox.intro.searchPost.noTag"),
            engName: ent("runBox.intro.searchPost.noTag"),
            action() {
              openSearch("")
            },
          }

        ])
      }
    } else if (rawInp.startsWith(".")) {
      if (inpText) {
        const ls = openid(rawInp)
        if (ls.length > 0) {
          setOptions(ls)
        } else {
          setOptions([{
            name: t("runBox.intro.poolOrPostID.NaN"),
            engName: ent("runBox.intro.poolOrPostID.NaN"),
            action() { setRunInput(".") },
          }])
        }
      } else {
        setOptions([])
      }
    } else if (rawInp.startsWith("=")) {
      if (inpText) {
        setOptions(calc(inpText))
      } else {
        setOptions([])
      }
    } else if (rawInp.startsWith(";")) {
      const winList = arg.windowsList.map(e => wmRef.current?.getWindow(e.id))

      const list: Option[] = [
        ...winList.map(e => ({
          name: `; ${e?.title}`,
          action() { e?.focus(); setRunBox(false); },
        })),
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction"),
          action() {
            setRunInput(";;")
          },
        }
      ]

      const actions: Option[] = [
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction.closeAllWindow"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction.closeAllWindow"),
          action() {
            winList.forEach(e => e?.close())
            setRunBox(false)
          },
        },
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction.minimizeAllWindow"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction.minimizeAllWindow"),
          action() {
            winList.forEach(e => e?.minimize())
            setRunBox(false)
          },
        },
        {
          name: ";; " + t("runBox.intro.toggleWindows.moreAction.restoreAllWindow"),
          engName: ";; " + ent("runBox.intro.toggleWindows.moreAction.restoreAllWindow"),
          action() {
            winList.forEach(e => e?.focus())
            setRunBox(false)
          },
        },
      ]

      if (inpText) {
        if (winList.length > 0) {
          if (inpText.startsWith(";")) {
            const inpTxt = inpText.slice(1)
            if (inpTxt) {
              const fuse = new Fuse(actions, searchOptions);
              setOptions(fuse.search(inpTxt).map(e => e.item))
            } else {
              setOptions(actions)
            }
          } else {
            const fuse = new Fuse(list, searchOptions);
            setOptions(fuse.search(inpText).map(e => e.item))
          }
        }
      } else {
        if (winList.length > 0) {
          setOptions(list)
        } else {
          setOptions([])
        }
      }
    } else {
      const { intro: action, actions: apps } = optionsList

      if (rawInp) {
        const all = [...action, ...apps]
        const fuse = new Fuse(all, searchOptions);
        const res = fuse.search(rawInp).map(e => e.item)
        if (res.length > 0) {
          setOptions(fuse.search(rawInp).map(e => e.item))
        } else {
          setOptions([
            ...openid(rawInp),
            ...search(rawInp),
            ...calc(rawInp),
          ])
        }
      } else {
        setOptions(action)
      }
    }
  }, [runInput, runBox, opts])

  return {
    setRunBox,
    runBox,
    setRunInput,
    runBoxInputRef,
    RunboxElement: (<div
      className={clsx(style["Run"], !runBox && style["hide"])}
      onClick={() => setRunBox(false)}
    >
      <input
        className={style["input"]}
        type="text"
        placeholder={t("runBox.placeholder")}
        value={runInput}
        ref={runBoxInputRef}
        onChange={e => setRunInput(e.currentTarget.value)}
        onKeyDown={e => {
          switch (e.code) {
            case "ArrowUp":
            case "ArrowDown": {
              e.preventDefault()
              break
            }
          }
          if (e.key === "Enter") {
            if (options.length > 0) {
              options[optionIndex].action();
            } else {

            }
          }
        }}
        onClick={StopEvent}
      />

      {options.length > 0
        ?
        options.map((e, i) =>
          <div
            key={`${i}_${e.name}`}
            className={style["btf-frm"]}
            style={{
              transitionDelay: DELAY_EFFECT(`${i * .05}s`)
            }}
          >
            <button
              onClick={(ev) => { StopEvent(ev); e.action(); }}
              onMouseMove={() => setOptionIndex(i)}
              className={optionIndex === i ? style["focus"] : ""}
            >{e.name}</button>
          </div>
        )
        : <button key={"NONE"} no-res="">{t("runBox.NONE")}</button>
      }
    </div>)
  }
}

interface WindowSelectorProps {
  eventLock: boolean;
  windowsList: { id: string;[key: string]: any }[];
  onSelectStart?: () => void;
  onSelect?: (selectedId: string) => void;
  onSelectEnd?: (selectedId: string) => void;
}

export const WindowSelector = ({
  eventLock,
  windowsList,
  onSelectStart,
  onSelect,
  onSelectEnd
}: WindowSelectorProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const stateRef = useRef({
    isSelecting,
    selectedIndex,
    windowsList,
    onSelectStart,
    onSelect,
    onSelectEnd,
  });

  useEffect(() => {
    stateRef.current = {
      isSelecting,
      selectedIndex,
      windowsList,
      onSelectStart,
      onSelect,
      onSelectEnd
    };
  }, [isSelecting, selectedIndex, windowsList, onSelectStart, onSelect, onSelectEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (eventLock) return;
      if ((electronMode ? e.ctrlKey : e.shiftKey) && e.code === "Tab") {
        e.preventDefault();

        const {
          isSelecting: currentIsSelecting,
          selectedIndex: currentIndex,
          windowsList: currentList,
          onSelectStart: startCb,
          onSelect: selectCb
        } = stateRef.current;

        if (currentList.length === 0) return;

        if (!currentIsSelecting) {
          setIsSelecting(true);
          const nextIndex = currentList.length > 1 ? 1 : 0;
          setSelectedIndex(nextIndex);

          if (startCb) startCb();
          if (selectCb) selectCb(currentList[nextIndex].id);

        } else {
          const direction = (electronMode ? e.shiftKey : false) ? -1 : 1;
          let nextIndex = (currentIndex + direction) % currentList.length;

          if (nextIndex < 0) {
            nextIndex += currentList.length;
          }
          setSelectedIndex(nextIndex);

          if (selectCb) selectCb(currentList[nextIndex].id);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (eventLock) return;
      if (electronMode ? e.key === "Control" : e.key === "Shift") {
        const {
          isSelecting: currentIsSelecting,
          selectedIndex: currentIndex,
          windowsList: currentList,
          onSelectEnd: endCb
        } = stateRef.current;

        if (currentIsSelecting) {
          setIsSelecting(false);

          if (currentList.length > 0 && endCb) {
            endCb(currentList[currentIndex].id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [eventLock]);

  const setTarget = useCallback((targetId: string) => {
    const index = windowsList.findIndex((w) => w.id === targetId);

    if (index !== -1) {
      setSelectedIndex(index);

      if (onSelect) {
        onSelect(targetId);
      }
    }
  }, [windowsList, onSelect]);

  return {
    isSelecting,
    selectedWindowId: windowsList[selectedIndex]?.id || null,
    setTarget,
  };
};

const Desktop = () => {
  const [ready, setReady] = useState(false);

  wmRef = useRef<WindowManager<e621Type.defaul> | null>(null);

  const clock = fuckingState.clock()
  const resolution = fuckingState.resolution();

  // #region 一坨 State
  const [workSpaces, setWorkSpaces] = useState<workSpaceType.WorkSpaces.WorkSpaces[]>([]);
  const [nowWorkSpace, setNowWorkSpace] = useState<string>("");
  const [background, setBackground] = useState<workSpaceType.Unit.BaseItem.Image>({ url: "" })
  const [mouseIsPress, setMouseIsPress] = useState<boolean>(false)
  const [windowsList, setWindowsList] = useState<windowsList>([])

  const [workSpaceEditor, setWorkSpaceEditor] = useState(false);
  const [startMenu, setStartMenu] = useState<boolean>(false)
  const [snap, setSnap] = useState<SnapPosition | null>(null)
  const [PERF_ClassList, setPERF_ClassList] = useState<string[]>([])
  // #endregion

  // #region 一坨 Ref
  const isInitialMount = useRef(true);
  const originalStatesRef = useRef<Map<string, { isMinimized: boolean, isFocused: boolean }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const dragCancelAreaRef = useRef<HTMLDivElement>(null);
  const snapElementRef = useRef<HTMLDivElement>(null);
  const dragTimeOut = useRef<NodeJS.Timeout>(setTimeout(() => { }, 0));
  const liveSnapshotRef = useRef<{ id: string; snapshot: workSpaceType.Unit.windowsStatus } | null>(null);
  // #endregion

  useEffect(() => {
    CACHE_BASE_ROOT = `${WSA.rootDir}/${usrIndx}/.cache`;
    THUMB_ROOT = `${CACHE_BASE_ROOT}/thumbnail`;
    POST_ROOT = `${CACHE_BASE_ROOT}/posts`;

    E621_DB = new e621DatabaseCache.E621Database(usrIndx);
    E621_DB.init()
  }, [])

  useEffect(() => {
    if (!isLogin || !usrIndx || !nowSetting.lang) return;
    (async () => {

      const names = await WSA.listWorkspaces(usrIndx)
      const workSpaces: workSpaceType.WorkSpaces.WorkSpaces[] = []

      for (let index = 0; index < names.length; index++) {
        const name = names[index];
        workSpaces.push({
          id: name,
          note: await WSA.getWorkspaceInfo(usrIndx, name, "note"),
          preview: await WSA.getWorkspaceInfo(usrIndx, name, "preview"),
          setting: await WSA.getWorkspaceInfo(usrIndx, name, "setting"),
          status: []
        })
      }

      setWorkSpaces(workSpaces);
      const targetWsId = (await (await WSA.userState(usrIndx)).get()).nowWorkSpace;
      const exists = workSpaces.some(ws => ws.id === targetWsId);
      const finalWsId = exists ? targetWsId : (workSpaces[0]?.id || "");
      setNowWorkSpace(finalWsId);

    })()

    const onWsAdded = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) setWorkSpaces(prev => [...prev, e.detail.ws]);
    };
    const onWsUpdated = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) setWorkSpaces(prev => prev.map(ws => ws.id === e.detail.wsId ? { ...ws, ...e.detail.partial } : ws));
    };
    const onWsDeleted = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) {
        const deletedWsId = e.detail.wsId;
        setWorkSpaces(prev => {
          const deletedIndex = prev.findIndex(ws => ws.id === deletedWsId);
          const updated = prev.filter(ws => ws.id !== deletedWsId);

          setNowWorkSpace(current => {
            if (current === deletedWsId) {
              if (updated.length === 0) return "";
              const prevIndex = deletedIndex === 0 ? updated.length - 1 : deletedIndex - 1;
              return updated[prevIndex]?.id || updated[0]?.id || "";
            }
            return current;
          });

          return updated;
        });
      }
    };
    const onStateSet = (e: CustomEvent) => {
      if (e.detail.userId === usrIndx) {
        const targetWsId = e.detail.value.nowWorkSpace;
        setWorkSpaces(workspaces => {
          const exists = workspaces.some(ws => ws.id === targetWsId);
          const finalWsId = exists ? targetWsId : (workspaces[0]?.id || "");
          setNowWorkSpace(finalWsId);
          return workspaces;
        });
      }
    };

    WSA.addEventListener("workspace:added", onWsAdded);
    WSA.addEventListener("workspace:updated", onWsUpdated);
    WSA.addEventListener("workspace:deleted", onWsDeleted);
    WSA.addEventListener("user:stateSet", onStateSet);

    return () => {
      WSA.removeEventListener("workspace:added", onWsAdded);
      WSA.removeEventListener("workspace:updated", onWsUpdated);
      WSA.removeEventListener("workspace:deleted", onWsDeleted);
      WSA.removeEventListener("user:stateSet", onStateSet);
    };
  }, [isLogin, usrIndx, nowSetting.lang]);

  const inputKeyEvent = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter": {
        StopEvent(e);
        e.currentTarget.blur();
        break;
      }
      case "ArrowLeft":
      case "ArrowRight":
      case "ArrowUp":
      case "ArrowDown":
      case "Escape": {
        StopEvent(e);
        break;
      }
    }
  }, [])

  const applySnapshot = useCallback((snapshot: workSpaceType.Unit.windowsStatus) => {
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

            case "preview":
              return <windowsType.peekPreview />;

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

  const Logout = async () => {
    setDisplayDesktop(false);
    setWorkSpaces([]);
    setNowWorkSpace("");
    const appState = await WSA.getAppStatus();
    await WSA.setAppStatus({ ...appState, autoLogin: false, rememberPassword: "" });
    usrIndx = "";
    setIsLogin(false);
  }

  const saveWinStatus = useCallback(async (logout?: boolean) => {
    const wm = wmRef.current;
    if (!wm || !nowWorkSpace) return;

    const currentSnapshot = wm.captureSnapshot();
    await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });

    _app.throwNewNotic("Windows Status Saved!");

    if (logout) Logout();
  }, [nowWorkSpace]);

  const reranderWindowContent = useCallback(() => {
    const wm = wmRef.current;
    if (!wm) return;
    const wins = wm.captureSnapshot();

    wins.forEach(winData => {
      const win = wm.getWindow(winData.id)
      if (!win) return;
      win.update({
        children: (() => {
          const winID = winData.id;

          switch (winData.customData!.type) {
            case "postSearch":
              const pureId = winID.replace("post_search-", "");

              return <windowsType.postSearch id={pureId} />;

            case "post":
              return <windowsType.post key={winData.customData!.data.postId} id={winID.replace("post-", "")} />;

            case "postGetByID":
              return <windowsType.postGetByID id={winID.replace("post_get_by_id-", "")} />;

            case "pool":
              return <windowsType.pool id={winID.replace("pool-", "")} />;

            case "viewer":
              return <windowsType.viewer id={winID.replace("viewer-", "")} />;

            case "preview":
              return <windowsType.peekPreview />;

            case "setting":
              return <windowsType.setting />;

            case "tmp":
              return <windowsType.tmpList />;

            default:
              return <div>Unknown Window Type</div>;
          }
        })()
      })
    })
  }, [])

  const { RunboxElement, setRunBox, runBox, runBoxInputRef } = RunBox(
    {
      saveWinStatus,
      windowsList,
      setWorkSpaceEditor,
      Logout
    }
  )

  const { isSelecting, selectedWindowId, setTarget } = WindowSelector({
    eventLock: (runBox || workSpaceEditor),
    windowsList,
    onSelectStart: () => {
      setStartMenu(false);
      const wm = wmRef.current;
      if (!wm) return;

      originalStatesRef.current.clear();

      windowsList.forEach(winInfo => {
        const win = wm.getWindow(winInfo.id);
        if (!win) return;

        originalStatesRef.current.set(winInfo.id, {
          isMinimized: win.isMinimized,
          isFocused: win.isFocused,
        });

        if (win.isMinimized) {
          win.focus();
        }
      });
    },

    onSelect: (id) => {
      windowsList.map(e => e.id).forEach(e => {
        document.getElementById(e)!.style.opacity = ".5";
        document.getElementById(e)!.style.pointerEvents = "none";
      });
      document.getElementById(id)!.style.opacity = "";
      document.getElementById(id)!.style.zIndex = "1012400";
    },

    onSelectEnd: (selectedId) => {
      windowsList.map(e => e.id).forEach(e => {
        document.getElementById(e)!.style.opacity = "";
        document.getElementById(e)!.style.zIndex = "";
        document.getElementById(e)!.style.pointerEvents = "";
      });

      const wm = wmRef.current;
      if (!wm) return;

      windowsList.forEach(winInfo => {
        const win = wm.getWindow(winInfo.id);
        if (!win) return;

        if (winInfo.id === selectedId) {
          if (win.isMinimized) {
            win.minimize();
          }
          win.focus();
        } else {
          const originalState = originalStatesRef.current.get(winInfo.id);
          if (originalState?.isMinimized && !win.isMinimized) {
            win.minimize();
          }
        }
      });

      originalStatesRef.current.clear();
    },
  });

  // #region 操他媽的工作區

  const handleSwitchWorkspace = async (newWsId: string) => {
    const wm = wmRef.current;
    if (!wm || newWsId === nowWorkSpace) return;

    const currentSnapshot = wm.captureSnapshot();
    await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });

    const stateObj = await WSA.userState(usrIndx);
    await stateObj.set({ nowWorkSpace: newWsId });
  };

  const handleDeleteWorkspace = async (targetId: string) => {
    if (workSpaces.length <= 1) {
      _app.throwNewNotic("總得留下一個桌面吧！");
      return;
    }

    const wm = wmRef.current;
    const currentSnapshot = wm ? wm.captureSnapshot() : [];

    let nextWsId = nowWorkSpace;
    if (targetId === nowWorkSpace) {
      const idx = workSpaces.findIndex(w => w.id === targetId);
      const nextIdx = Math.max(0, idx - 1);
      const fallback = workSpaces.filter(w => w.id !== targetId);
      nextWsId = fallback[nextIdx]?.id || fallback[0].id;
    }

    if (nowWorkSpace !== targetId) {
      await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });
    }

    const stateObj = await WSA.userState(usrIndx);
    await stateObj.set({ nowWorkSpace: nextWsId });
    await WSA.deleteWorkspace(usrIndx, targetId);
  };

  const handleAddWorkspace = async () => {
    const newId = MakeID();
    const wm = wmRef.current;
    const currentSnapshot = wm ? wm.captureSnapshot() : [];

    if (nowWorkSpace) await WSA.updateWorkspace(usrIndx, nowWorkSpace, { status: currentSnapshot });
    const currentWs = await WSA.getWorkspace(usrIndx, nowWorkSpace);

    await WSA.addWorkspace(usrIndx, {
      id: newId,
      note: { name: "New Desktop", note: "" },
      preview: [],
      status: [],
      setting: {
        wallpaper: currentWs.setting.wallpaper,
        color: currentWs.setting.color,
      }
    });

    const stateObj = await WSA.userState(usrIndx);
    await stateObj.set({ nowWorkSpace: newId });
  };

  // #endregion

  // #region 純他媽監聽 State

  /* 我拿來解決效能的東西 啊 就是節能模式 啊 十分好 */
  const perf = PERFORMANCE_SET()
  useEffect(() => {
    const p = PERFORMANCE_SET()
    const list = []

    if (!p.All) {
      list.push("NONE_TRANSITION")
      list.push("NONE_FILTER")
      list.push("NONE_BACKDROP_FILTER")
    } else {
      if (!p.transition) {
        list.push("NONE_TRANSITION")
      }
      if (!p.cssFilter) {
        list.push("NONE_FILTER")
      }
      if (!p.backdropFilter) {
        list.push("NONE_BACKDROP_FILTER")
      }
    }

    someActions.setSetting(usrIndx, e => {
      e.wmSettings.nonTransparens = !p.backdropFilter || !p.All || !p.transparenWinodw
      return e
    })

    setPERF_ClassList(list)

  }, [
    perf.All,
    perf.transition,
    perf.cssFilter,
    perf.backdropFilter,
    perf.transparenWinodw,
  ]);

  /* wm的設定 */
  useEffect(() => {
    if (wmRef.current)
      wmRef.current.setting.set(nowSetting.wmSettings)
  }, [nowSetting.wmSettings])

  /* nowWorkSpace他變化了 他變了 他拉了 */
  useEffect(() => {
    if (isInitialMount.current || !nowWorkSpace) return;

    const loadNewWs = async () => {
      const wm = wmRef.current;
      if (!wm) return;

      wm.getWindows().forEach(winInfo => wm.destroyWindow(winInfo.id));
      const newWorkspace = await WSA.getWorkspaceInfo(usrIndx, nowWorkSpace, "status");
      if (newWorkspace) {
        applySnapshot(newWorkspace as any);
      }
    };
    loadNewWs();
  }, [nowWorkSpace]);

  /* 開工作區管理器 全村的人都要先消失 */
  useEffect(() => {
    if (workSpaceEditor) {
      setRunBox(false);
      setStartMenu(false);
      liveSnapshotRef.current = {
        id: nowWorkSpace,
        snapshot: wmRef.current?.captureSnapshot() ?? []
      };
    }
  }, [workSpaceEditor, nowWorkSpace]);


  /* 某些東西出現後 我們就不要影響其他人了 */
  useEffect(() => {
    disableWindowKeyEvent = startMenu || workSpaceEditor || runBox
  }, [startMenu, workSpaceEditor, runBox])

  /* 桌布更新 */
  useEffect(() => {
    if (!nowWorkSpace || workSpaces.length === 0) return;
    const currentWorkspace = workSpaces.find(w => w.id === nowWorkSpace);
    if (!currentWorkspace) return;

    const wallpaper = currentWorkspace.setting.wallpaper ?? nowSetting.appearance.wallpaper;
    const color = currentWorkspace.setting.color ?? nowSetting.appearance.color;

    setBackground(typeof wallpaper === "number" ? currentWorkspace.setting.wallpaper : wallpaper);
    _app.setColor(color);
  }, [nowWorkSpace, workSpaces, nowSetting]);

  /* 語言改了 重新渲染視窗 */
  useEffect(() => {
    if (isInitialMount.current) return;
    reranderWindowContent()
  }, [nowSetting.lang, reranderWindowContent]);

  /* AppSetting的更新 */
  useEffect(() => {
    const winID = "app-setting"

    if (wmRef.current?.hasWindowID(winID)) {
      wmRef.current.updateWindow(winID, {
        children: <windowsType.setting />
      })
    }
  }, [nowSetting, nowSaveInfo])
  // #endregion

  // #region 按鍵的 Event

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
    const openRunBox = (e: any) => {
      keyispress = true
      const runInp = runBoxInputRef.current
      if (!runInp) return;
      e.preventDefault()
      setStartMenu(false)
      setRunBox(e => {
        if (!e) { runInp.focus() } else { runInp.blur(); };
        return !e
      })
    };

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "Escape": {
          setWorkSpaceEditor(false)
          break
        }
      }

      if (e.altKey && e.code === "KeyW") {
        setWorkSpaceEditor(e => !e)
      }

      if (workSpaceEditor) return
      if (keyispress) return;

      if (e.altKey) {
        switch (e.code) {
          case "KeyO": {
            keyispress = true
            createWindow(wmRef, { type: "setting", data: "NONE" })
            break;
          }

          case "Digit0": {
            wmRef.current?.getWindow(windowsList[9].id)?.focus();
            break;
          }

          case "KeyR": {
            openRunBox(e);
            break;
          }
        }
      }

      switch (e.code) {
        case "Escape": {
          keyispress = true
          setStartMenu(false)
          setRunBox(false)
          const runInp = runBoxInputRef.current
          if (runInp) { runInp.blur(); };
          break;
        }

        case "F1": {
          openRunBox(e);
        }
      }

      if (e.altKey && e.ctrlKey) {
        keyispress = true
        setStartMenu(e => {
          if (!e) setRunBox(false);
          return !e
        })
      }
    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [workSpaceEditor])

  /* 純針對workSpaceEditor */
  useEffect(() => {
    let keyispress = false

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      if (!workSpaceEditor) return;

      // 修正：先找到當前索引位置
      const currentIndex = workSpaces.findIndex(w => w.id === nowWorkSpace);

      switch (e.code) {
        case "ArrowUp":
        case "ArrowLeft": {
          if (currentIndex > 0) {
            handleSwitchWorkspace(workSpaces[currentIndex - 1].id)
          }
          break;
        }

        case "ArrowDown":
        case "ArrowRight": {
          if (currentIndex < workSpaces.length - 1) {
            handleSwitchWorkspace(workSpaces[currentIndex + 1].id)
          }
          break;
        }
      }
    }

    document.addEventListener("keydown", keydown)
    document.addEventListener("keyup", keyup)

    return () => {
      document.removeEventListener("keydown", keydown)
      document.removeEventListener("keyup", keyup)
    }
  }, [workSpaceEditor, nowWorkSpace, workSpaces])

  /* 二些全域的快速鍵 */
  useEffect(() => {
    let keyispress = false

    const keyup = (e: KeyboardEvent) => {
      keyispress = false
    }

    const keydown = (e: KeyboardEvent) => {
      if (workSpaceEditor) return
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


        if (e.code.startsWith("Digit")) {
          const wm = wmRef.current
          if (!wm) return;

          const focusWin = (indx: number) => {
            const win = windowsList[indx];
            if (!win) return;
            const id = win.id;
            id ? wm.getWindow(id)?.focus() : "";
          }

          const number = Number(e.code.slice(5))

          if (number === 0) {
            focusWin(10)
          } else {
            focusWin(number - 1)
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
  }, [windowsList, workSpaceEditor])

  // #endregion

  // #region 初始化

  /* 取消首次渲染標記 */
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  /* 初始化wm */
  useEffect(() => {
    if (containerRef.current && !wmRef.current) {
      wmRef.current = new WindowManager(containerRef.current);
    }
  }, []);

  /* 寫這坨注解的時候 就是爲了找這個 */
  /* 這個是他媽的 初始化動畫 */
  useEffect(() => {
    if (!isLogin) return;

    (async () => {
      await functions.timeSleep(.5e3)
      setReady(true)
    })()
  }, [isLogin])

  /* 初始化狀態 */
  useEffect(() => {
    const wm = wmRef.current;
    if (!wm || !ready) return;

    WSA.getUser(usrIndx).then(async (user) => {
      if (!user.workSpaces || user.workSpaces.length <= 0) {
        const defaultWs = newEmptyAccount.workSpaces[0];
        await WSA.addWorkspace(usrIndx, defaultWs as any);
        user.workSpaces = [defaultWs as any];
      }

      const currentWorkspace = user.workSpaces.find(w => w.id === user.state.nowWorkSpace) || user.workSpaces[0];
      const targetStatus = currentWorkspace.status || [];

      if (targetStatus.length > 0) {
        setTimeout(() => {
          applySnapshot(targetStatus);
          setWindowsList(wm.getWindows());
        }, 500);
      }
    }).catch(err => {
      console.error("Desktop Initialization Error:", err);
    });

  }, [ready]);

  // #endregion

  /* 關是窗前先問你個問題 */
  useEffect(() => {
    let messageIsDisplay = false
    let eventBlock = true
    const awa = (e: BeforeUnloadEvent) => {
      if (eventBlock) e.preventDefault();
      if (messageIsDisplay) return;
      if (electronMode) {
        messageIsDisplay = true
        newInput.message(t("ELECTRON.beforeUnload.msg"),
          [
            {
              name: t("ELECTRON.beforeUnload.cancel"),
              value: "nah",
            },
            {
              name: t("ELECTRON.beforeUnload.no"),
              value: "no",
              key: "Backspace",
            },
            {
              name: t("ELECTRON.beforeUnload.yes"),
              value: "yes",
              key: "Enter",
            },
          ],
          e => {
            switch (e) {
              case "yes": {
                saveWinStatus()
                eventBlock = false
                messageIsDisplay = false
                ELECTRON_ACT("CLOSE")
                return;
              }
              case "no": {
                eventBlock = false
                messageIsDisplay = false
                ELECTRON_ACT("CLOSE")
                return;
              }
              case "nah": {
                messageIsDisplay = false
                return;
              }
            }
          }, () => messageIsDisplay = false
        )
      }
    }

    window.addEventListener('beforeunload', awa)

    return () => {
      window.removeEventListener('beforeunload', awa)
    }
  }, [saveWinStatus])


  // #region 視窗管理相關

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
  }, [])

  /* fucking *SnapPreview* */
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

  /* 欸 snap 的他媽的視覺效果 幹 */
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

  // #endregion

  /* 手動存工作區狀態 啊他會自動幫你存 放心 */
  useEffect(() => {
    let isPress = false;

    const intr = setInterval(saveWinStatus, 300e3);

    const event = (e: KeyboardEvent) => {
      if (isPress) return;
      if (e.ctrlKey && (e.code === "KeyS")) {
        isPress = true;
        if (!wmRef.current) return;
        e.preventDefault();
        saveWinStatus();
      }
    };

    const up = () => {
      isPress = false;
    };

    document.addEventListener("keydown", event);
    document.addEventListener("keyup", up);

    return () => {
      document.removeEventListener("keydown", event);
      document.removeEventListener("keyup", up);
      clearInterval(intr);
    };
  }, [saveWinStatus]);

  // #region 沒有拖只有放

  /* 全局的拖放 */
  useEffect(() => {
    const dragoverEvent = (e: DragEvent) => e.preventDefault();
    const dropEvent = (e: DragEvent) => {
      if (startMenu || workSpaceEditor || runBox) return;
      if (!e.dataTransfer) return;

      const itemdata = e.dataTransfer.getData(e621Type.DragItemType.appname)
      const item = e.dataTransfer.items[0]

      if (itemdata) {
        StopEvent(e)
        const item: e621Type.DragItemType.defaul = JSON.parse(itemdata)
        const { data, type } = item

        const scale = 100 / nowSetting.appearance.scale;

        const position: {
          left: number;
          top: number;
          anchor: WindowAnchor;
        } = {
          left: scale * e.clientX,
          top: scale * e.clientY,
          anchor: "center-center",
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
              }, position, true)
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
              }, position, true)
            break;
          };
          case "pool": {
            createWindow(wmRef,
              {
                type: "pool",
                data
              }, position, true)
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
              }, position, true)
            break;
          }
          case "postSearch": {
            createWindow(wmRef,
              {
                type: "postSearch",
                data
              }, position, true)
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
                }, position, true)
            }
            break;
          };
          case "postImg": {
            createWindow(wmRef,
              {
                type: "viewer",
                data: data
              }, position, true)
            break;
          };
          case "temp": {
            createWindow(wmRef,
              {
                type: "tmp",
              }, position, true)
            break;
          };
          case "setting": {
            createWindow(wmRef,
              {
                type: "setting",
                data
              }, position, true)
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
  }, [startMenu, workSpaceEditor, runBox])

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

  // #endregion

  const onClickEvent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, menu: MenuAction.Item[]) => {
    event.stopPropagation()
    event.preventDefault()
    const btn = (event.target as HTMLButtonElement)
    const btnRect = btn.getBoundingClientRect()
    const x = btnRect.top
    const y = btnRect.left + (btnRect.width / 2)
    MenuAction.showMenu(menu, [x, y], "bc")
  }

  const windowAction: (id: string) => MenuAction.Item[] = (id) => {
    const win = wmRef.current?.getWindow(id)

    return windowActionList(win);
  }

  return (
    displayDesktop && <div
      id={style["Desktop"]}
      className={clsx(
        !ready && style["hide"],
        workSpaceEditor && style["workSpaceEditor"],
        ...PERF_ClassList.map(e => style[e])
      )}

      style={{
        zoom: `${nowSetting.appearance.scale}%`
      }}
    >
      {importing && <div className={style["Importing"]}>
        <div className={style["dark"]} />
        <NODATA.Fetching />
      </div>}


      <div className={style["workSpaceMgr"]}>
        <div className={style["menu"]}>
          {workSpaces.map((e, i) => (
            <div className={clsx(style["workSpace"], nowWorkSpace === e.id ? style["activ"] : "")} key={e.id}>
              <div className={style["top"]}>
                <input
                  type="text"
                  key={e.note.name}
                  defaultValue={e.note.name}
                  placeholder={t("workSpaceManager.name.placeholder")}
                  onKeyDown={(el) => {
                    inputKeyEvent(el)
                    switch (el.code) {
                      case "Enter":
                      case "NumpadEnter": {
                        WSA.updateWorkspace(usrIndx, e.id, {
                          note: { ...e.note, name: el.currentTarget.value }
                        })
                        return;
                      }
                    }
                  }}
                  onBlur={(el) => WSA.updateWorkspace(usrIndx, e.id, {
                    note: { ...e.note, name: el.currentTarget.value }
                  })}
                  style={{ color: e.setting.color }}
                />
                {workSpaces.length > 1 && (
                  <button onClick={() => handleDeleteWorkspace(e.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m291-240-51-51 189-189-189-189 51-51 189 189 189-189 51 51-189 189 189 189-51 51-189-189-189 189Z" /></svg>
                  </button>
                )}
              </div>
              <button
                className={style["desktopPreview"]}
                onClick={() => handleSwitchWorkspace(e.id)}
                style={{
                  aspectRatio: `${resolution[0]} / ${resolution[1]}`,
                  borderColor: e.setting.color
                }}
              >
                <div className={style["indexNumber"]}><span style={{ color: e.setting.color }}>{`# ${i}`}</span></div>
                <div className={style["backdrop"]} />
                <div className={style["windows"]} >
                  {(e.id === nowWorkSpace && liveSnapshotRef.current?.id === nowWorkSpace
                    ? liveSnapshotRef.current.snapshot
                    : e.status
                  ).filter(win => !win.isMinimized).map((win, i) => <div
                    className={style["win"]}
                    key={i}
                    style={{ zIndex: win.zIndex }}
                  >
                    <div
                      className={style["position"]}
                      style={{
                        borderColor: color.bright(e.setting.color, .8),
                        backgroundColor: color.bright(e.setting.color, .3) + "80",
                        top: win.rect.top + "%",
                        left: win.rect.left + "%",
                        width: win.rect.width + "%",
                        height: win.rect.height + "%",
                      }}
                    />
                  </div>)}
                </div>
                <Background bg={e.setting.wallpaper} />
              </button>
            </div>
          ))}
          <button onClick={handleAddWorkspace} className={style["add"]}>
            {t("workSpaceManager.newDesktop")}
          </button>
        </div>
      </div>

      <div className={style["textArea"]}>
        {(() => {
          const ws = workSpaces.find(w => w.id === nowWorkSpace);
          if (!ws) return null;
          return <>
            <div className={style["name"]}>
              <input
                key={nowWorkSpace + "-name:" + ws.note.name}
                type="text"
                defaultValue={ws.note.name}
                placeholder={t("workSpaceManager.name.placeholder")}
                onKeyDown={(el) => {
                  inputKeyEvent(el)
                  switch (el.code) {
                    case "Enter":
                    case "NumpadEnter": {
                      WSA.updateWorkspace(usrIndx, ws.id, {
                        note: { ...ws.note, name: el.currentTarget.value }
                      })
                      return;
                    }
                  }
                }}
                onBlur={(el) => WSA.updateWorkspace(usrIndx, ws.id, {
                  note: { ...ws.note, name: el.currentTarget.value }
                })}
                style={{ color: ws.setting.color }}
              />
            </div>
            <div className={style["note"]}>
              <input
                key={nowWorkSpace + "-note:" + ws.note.note}
                type="text"
                defaultValue={ws.note.note ?? ""}
                placeholder={t("workSpaceManager.note.placeholder")}
                onKeyDown={(el) => {
                  inputKeyEvent(el)
                  switch (el.code) {
                    case "Enter":
                    case "NumpadEnter": {
                      WSA.updateWorkspace(usrIndx, ws.id, {
                        note: { ...ws.note, note: el.currentTarget.value }
                      })
                      return;
                    }
                  }
                }}
                onBlur={(el) => WSA.updateWorkspace(usrIndx, ws.id, {
                  note: { ...ws.note, note: el.currentTarget.value }
                })}
                style={{ color: ws.setting.color }}
              />
            </div>
          </>;
        })()}
      </div>

      <div
        className={style["mainArea"]}
        onClick={e => e.isTrusted ? setWorkSpaceEditor(false) : ""}
      >

        <div className={style["wsEditor"]}>
          <div className={style["backdrop"]} />
          <div className={style["index"]}>
            <span>{"# " + workSpaces.findIndex(w => w.id === nowWorkSpace)}</span>
          </div>
        </div>

        <div className={style["WindowSelector"]}>

        </div>

        <div className={style["Buttons"]}>
          <div className={clsx(style["MainArea"], startMenu ? style["startMenu"] : "")}>

            <div className={style["StartMenu"]}
              onDrop={e => { setStartMenu(false); }}
            >

              {nowSetting.appearance.KIASTALA && <div className={style["KIASTALA"]}>
                <div>
                  <div className={style["LINIE"]} />
                </div>

                <div>
                  <div className={style["CORE"]} />
                </div>

                {
                  [
                    /* Size , Duration , Width , Blur , Opacity */
                    [100, .3, 10, 1, .8],
                    [200, .5, 10, 5, .8],
                    [300, 1, 10, 8, .5],
                    [500, 2, 15, 10, .25],
                    [700, 5, 20, 15, .1],
                    [1000, 10, 30, 20, .1],
                    [1600, 20, 40, 5, .1],
                    [2000, 30, 50, 10, .1],
                    [2500, 50, 60, 15, .1],
                  ].map((e, i) => <div>
                    <div
                      key={i}
                      className={style["CER"]}
                      style={{
                        width: e[0] + "px",
                        height: e[0] + "px",
                        filter: `blur(${e[3]}px)`,
                        opacity: e[4],
                        transform: i % 2 === 0 ? "translate(-50%, -50%)" : "translate(-50%, -50%) rotateY(180deg)"
                      }}
                    >
                      <div
                        key={i}
                        style={{
                          animationDuration: e[1] + "s",
                        }}
                      >
                        <div style={{
                          borderWidth: e[2] + "px",
                        }} />
                      </div>
                    </div>
                  </div>
                  )
                }
              </div>}

              <div className={style["Side"]}>
                <div>
                  {
                    ([
                      [
                        t("startMenuSide.logout"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" /></svg>,
                        () => {
                          saveWinStatus(true)
                        }
                      ],
                      [
                        t("startMenuSide.appSetting"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M433-80q-27 0-46.5-18T363-142l-9-66q-13-5-24.5-12T307-235l-62 26q-25 11-50 2t-39-32l-47-82q-14-23-8-49t27-43l53-40q-1-7-1-13.5v-27q0-6.5 1-13.5l-53-40q-21-17-27-43t8-49l47-82q14-23 39-32t50 2l62 26q11-8 23-15t24-12l9-66q4-26 23.5-44t46.5-18h94q27 0 46.5 18t23.5 44l9 66q13 5 24.5 12t22.5 15l62-26q25-11 50-2t39 32l47 82q14 23 8 49t-27 43l-53 40q1 7 1 13.5v27q0 6.5-2 13.5l53 40q21 17 27 43t-8 49l-48 82q-14 23-39 32t-50-2l-60-26q-11 8-23 15t-24 12l-9 66q-4 26-23.5 44T527-80h-94Zm7-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" /></svg>,
                        () => createWindow(wmRef, {
                          type: "setting",
                          data: "NONE"
                        })
                      ],
                      [
                        t("runBox"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" /></svg>,
                        () => setRunBox(true),
                        true,
                      ],
                      [
                        t("workSpaceManager"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M640-160v-360H160v360h480Zm80-200v-80h80v-360H320v200h-80v-200q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v360q0 33-23.5 56.5T800-360h-80ZM160-80q-33 0-56.5-23.5T80-160v-360q0-33 23.5-56.5T160-600h480q33 0 56.5 23.5T720-520v360q0 33-23.5 56.5T640-80H160Zm400-603ZM400-340Z" /></svg>,
                        () => setWorkSpaceEditor(true),
                      ],
                      [
                        t("startMenuSide.console"),
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Zm187-200-76-76q-12-12-11.5-28t12.5-28q12-11 28-11.5t28 11.5l104 104q12 12 12 28t-12 28L328-308q-11 11-27.5 11.5T272-308q-11-11-11-28t11-28l75-76Zm173 160q-17 0-28.5-11.5T480-320q0-17 11.5-28.5T520-360h160q17 0 28.5 11.5T720-320q0 17-11.5 28.5T680-280H520Z" /></svg>,
                        () => Kiasole.toggle(),
                      ],
                    ] as ([string, JSX.Element, () => {}] | [string, JSX.Element, () => {}, boolean])[]).map((e, i) => <button key={i} hover-tips={e[0]} onClick={(ev) => { ev.stopPropagation(); e[2](); setStartMenu(false) }} style={{ marginTop: e[3] ? "auto" : "" }}>{e[1]}</button>)
                  }
                </div>
              </div>

              <div className={style["Buttons"]}>
                {
                  ([
                    [
                      t("windowsType.postSearch"),
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
                      t("windowsType.postGetByID"),
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
                      t("windowsType.pool"),
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
                      t("windowsType.tmpList"),
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
                  ] as ([string, JSX.Element, () => {}, e621Type.DragItemType.defaul] | [string, JSX.Element, () => {}])[]).map((btn, i) => <div
                    key={i}
                    style={{
                      transitionDelay: DELAY_EFFECT(startMenu ? `${(i * .05) + .2}s` : "")
                    }}
                  >
                    <button
                      onClick={() => {
                        btn[2]()
                        setStartMenu(false)
                      }}

                      draggable={btn.length === 4}
                      onDragStart={ev => { btn[3] ? dragItem(ev, btn[3]) : ""; }}
                      onDrag={() => setStartMenu(false)}

                      onDragEnter={(e) => {
                        e.preventDefault();
                        clearTimeout(dragTimeOut.current);

                        dragTimeOut.current = setTimeout(() => {
                          setStartMenu(false);
                          btn[2]();
                        }, 250);
                      }}

                      onDragLeave={(e) => {
                        e.preventDefault();
                        clearTimeout(dragTimeOut.current);
                      }}

                      onDragOver={(e) => {
                        e.preventDefault();
                      }}

                    >
                      <div className={style["icon"]}>{btn[1]}</div>
                      <div className={style["name"]}>
                        <span>
                          {btn[0]}
                        </span>
                      </div>
                    </button>
                  </div>
                  )
                }
              </div>

            </div>

            {RunboxElement}

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
                    <span>{t("Desktop.drag.Cancel")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={style["Bar"]}
            onDragEnter={e => { e.currentTarget.classList.add(style["activ"]) }}
            onDragLeave={e => { e.currentTarget.classList.remove(style["activ"]) }}
            onDrop={e => { e.currentTarget.classList.remove(style["activ"]); StopEvent(e) }}
          >
            <div className={style["Left"]}>
              <Button
                onDrop={e => { e.preventDefault(); e.stopPropagation(); }}
                status={startMenu ? "isOpen" : "icon"}
                title={t("taskBar.startMenu")}

                onClick={() => setStartMenu(e => {
                  if (!e) setRunBox(false);
                  return !e
                })}

                onDragEnter={(e) => {
                  e.preventDefault();
                  clearTimeout(dragTimeOut.current);

                  dragTimeOut.current = setTimeout(() => {
                    setStartMenu(e => {
                      if (!e) setRunBox(false);
                      return !e
                    });
                  }, 250);
                }}

                onDragLeave={(e) => {
                  e.preventDefault();
                  clearTimeout(dragTimeOut.current);
                }}

                onDragOver={(e) => {
                  e.preventDefault();
                }}

              >
                <svg width="37.812" height="32" viewBox="0 0 37.812 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M37.0567 17.2745L28.3305 32L9.48148 32L0 16L9.48148 3.33786e-06L28.3305 0L37.812 16L37.0567 17.2745L37.0567 17.2745ZM25.4815 27L32 16L25.4815 5L12.3305 5L5.81198 16L12.3305 27L25.4815 27L25.4815 27Z" fill-rule="evenodd" transform="translate(0 -0)" />
                </svg>
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

                  onContextMenu={e => { e.preventDefault(); onClickEvent(e, windowAction(win.id)) }}
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
              {nowSetting.appearance.clockFormat.map((e, i) => <div>{cnvFormat.clock(clock, e)}</div>)}
            </div>
          </div>
        </div>

        <Background bg={background} />
      </div>

      <Background bg={background} />
    </div >
  )
}

const Login = () => {
  const [userList, setUserList] = useState<workSpaceType.Unit.SaveInfo[]>([])
  const [userWorkSpaceList, setUserWorkSpaceList] = useState<workSpaceType.WorkSpaces.Setting[]>([])

  const [appStatus, setAppStatus] = useState<workSpaceType.App | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [START, SET_START] = useState<boolean>(false)

  const refreshUserList = useCallback(async () => {
    const userIds = await WSA.listUsers();
    const users: workSpaceType.Unit.SaveInfo[] = [];
    const workspaces: workSpaceType.WorkSpaces.Setting[] = [];

    for (const id of userIds) {
      try {
        const u = await WSA.getSaveInfo(id);
        const s = await (await WSA.userState(id)).get();
        users.push(u);

        const wsSetting = await WSA.getWorkspaceInfo(id, s.nowWorkSpace, "setting");
        workspaces.push(wsSetting);

      } catch (e) {
        console.error("Failed to load user:", id, e);
      }
    }
    setUserList(users);
    setUserWorkSpaceList(workspaces);
    return { users, workspaces };
  }, []);

  const [selectUser, setSelectUser] = useState<number>(0)
  const [newAccount, setNewAccount] = useState<boolean>(false)

  const cfmPassRef = useRef<string>("")
  const newAccInfoRef = useRef<EmptyAccountOption>({
    name: "",
    id: "",
    color: "#ffffff"
  })

  useEffect(() => {
    (async () => {
      while (!READY) {
        await functions.timeSleep(100);
      }

      let status: workSpaceType.App;
      try {
        status = await WSA.getAppStatus();
      } catch (e) {
        status = { autoLogin: false };
      }
      setAppStatus(status);

      const { users } = await refreshUserList();

      if (users.length === 0) {
        setSelectUser(-1);
        setNewAccount(true);
      } else {
        setSelectUser(status.lastUser ?? 0);
      }
      setLoaded(true);
    })();
  }, [READY, refreshUserList]);

  const login = useCallback(async (passKey: string, usrIndex?: number, listOverride?: workSpaceType.Unit.SaveInfo[]) => {
    const targetIndex = usrIndex ?? selectUser;
    const targetList = listOverride || userList;
    const user = targetList[targetIndex];

    if (!user) return;

    const psKy = user.user.passKey;
    const isPassCorrect = psKy ? (psKy === passKey) : true;

    if (isPassCorrect) {
      usrIndx = user.id;

      try {
        const setting = await (await WSA.userSetting(user.id)).get();
        const saveInfo = await (await WSA.userSaveInfo(user.id)).get();

        setNowSetting(setting);
        setNowSaveInfo(saveInfo);
      } catch (error) {
        console.error("Failed to load user settings:", error);
      }

      setIsLogin(true);

      const newStatus = {
        ...(appStatus || { autoLogin: false }),
        lastUser: targetIndex,
        autoLogin: true,
        rememberPassword: passKey || ""
      };
      await WSA.setAppStatus(newStatus);
      setAppStatus(newStatus);

      setDisplayDesktop(true);
    } else {
      Kiasole.error("密碼錯誤");
    }
  }, [selectUser, userList, appStatus]);

  useEffect(() => {
    (async () => {
      if (!loaded || userList.length === 0 || !appStatus) return;
      const { lastUser = 0, autoLogin: auto, rememberPassword: pass } = appStatus;
      const user = userList[lastUser];

      if (auto && user) {
        const psKy = user.user.passKey;
        if (!psKy || (psKy && psKy === pass)) {
          usrIndx = user.id;
          setSelectUser(lastUser);
          setIsLogin(true);
          setNowSetting(await (await WSA.userSetting(user.id)).get())
          setNowSaveInfo(await (await WSA.userSaveInfo(user.id)).get())
          setDisplayDesktop(true)
        }
      }
    })();
  }, [loaded])

  const createAccount = useCallback(async () => {
    const newAcc = newAccInfoRef.current;
    if (!newAcc.id || !newAcc.name) {
      _app.throwNewNotic("ID跟名字是必填的喔！");
      return;
    }

    try {
      _app.throwNewNotic("正在建立資料...");
      await WSA.newUser(newAcc);
      await functions.timeSleep(300);

      const { users: freshList } = await refreshUserList();

      _app.throwNewNotic("建立成功！");

      const newIndex = freshList.findIndex(u => u.id === newAcc.id);
      if (newIndex !== -1) {
        await login(newAcc.password || "", newIndex, freshList);
      } else {
        setNewAccount(false);
      }
    } catch (e) {
      Kiasole.error("Account Creation Error: " + e);
      _app.throwNewNotic("建立失敗，請檢查 Console");
    }
  }, [refreshUserList, login]);

  useEffect(() => {
    if (!loaded) return;
    if (!isLogin) {
      _app.setColor("#ffffff")
    } else {
      const lastUserIndex = appStatus?.lastUser ?? 0;
      const wsSetting = userWorkSpaceList[lastUserIndex];
      if (wsSetting) {
        _app.setColor(wsSetting.color);
      }
    }
  }, [isLogin, loaded, userWorkSpaceList, appStatus])

  useEffect(() => {
    if (loaded)
      setTimeout(() => {
        SET_START(true)
      }, .5e3);
  }, [loaded])

  useEffect(() => {
    const owo = Array.from(document.getElementsByClassName("passwordInput")) as HTMLInputElement[]
    owo.forEach(e => e.value = "")
  }, [selectUser, isLogin])

  const EmptyUser = useMemo(() => EmptyAccount({ name: "New Account", id: ".w." }), [])
  const emptyWs = useMemo(() => EmptyUser.workSpaces.find(ws => ws.id === EmptyUser.state.nowWorkSpace) || EmptyUser.workSpaces[0], [EmptyUser])

  return (<div id={style["Login"]} className={clsx(!START && style["hide"])}>

    <div className={style["UserList"]}>
      <div>
        {
          userList.map((_user, i) => {
            const { user, id } = _user;
            const wsSetting = userWorkSpaceList[i];
            const clr = wsSetting?.color || "#ffffff";

            return <button
              key={`${i}_${id}`}
              className={style["User"]}
              style={{ outlineColor: i === selectUser ? clr + "50" : "" }}
              onClick={() => { setSelectUser(i); setNewAccount(false); }}
            >
              <div className={style["Main"]}>
                <div className={style["avatar"]}><Background bg={user.avatar} /></div>
                <div className={style["name"]} >
                  <span style={{ color: clr }}>{user.name}</span>
                </div>
              </div>
              <div className={style["Background"]} style={{ backgroundColor: clr }} />
            </button>
          })
        }
        <button
          key={`add_acc`}
          className={style["User"]}
          style={{
            outlineColor: -1 === selectUser ? emptyWs.setting.color + "50" : "",
            marginTop: "50px",
          }}
          onClick={() => { setSelectUser(-1); setNewAccount(true); }}
        >
          <div className={style["Main"]}>
            <div className={style["avatar"]}><Background bg={EmptyUser.saveInfo.user.avatar} /></div>
            <div className={style["name"]} >
              <span style={{ color: emptyWs.setting.color }}>{EmptyUser.saveInfo.user.name}</span>
            </div>
          </div>
          <div className={style["Background"]} style={{ backgroundColor: emptyWs.setting.color }} />
        </button>
      </div>
    </div>

    <div className={style["LoginBoard"]}>
      {
        userList.map((_user, i) => {
          const saveInfo = _user;
          const user = saveInfo.user;
          const { avatar, name } = user;
          return <div key={saveInfo.id} className={selectUser === i ? style["show"] : (selectUser > i ? style["up"] : style["down"])}>

            <div className={style["avatar"]}><Background bg={avatar} /></div>
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
                  <button onClick={() => { login("") }}>{"Login"}</button>
                </div>
            }
          </div>
        })
      }
      <div key={"new_account"} className={clsx(selectUser === -1 ? style["show"] : style["hide"], style["createAccount"])}>

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

    <div className={clsx(style["Backdrop"], newAccount && style["newAccount"])} />

    <div className={style["Backgrounds"]}>
      {userList.map((user, i) => {
        const wsSetting = userWorkSpaceList[i];
        return <div
          key={i}
          style={{ opacity: i === selectUser ? "1" : "0" }}
          className={clsx(
            style["img"],
            selectUser === i ? style["show"] : (selectUser > i ? style["up"] : style["down"])
          )}
        >
          {wsSetting && <Background bg={wsSetting.wallpaper} />}
        </div>
      })}

      <div
        key={-1}
        style={{ opacity: -1 === selectUser ? "1" : "0" }}
        className={clsx(
          style["img"],
          selectUser === -1 ? style["show"] : style["hide"],
        )}
      >
        <Background bg={(() => {
          const { saves } = EmptyUser
          const wallpaper = emptyWs.setting.wallpaper
          return typeof wallpaper === "number" ? saves.wallpapers[wallpaper] : wallpaper
        })()} />
      </div>
    </div>

  </div >)
}

/* ========================================================================================= */

const App = () => {
  [isLogin, setIsLogin] = useState(false);
  [displayDesktop, setDisplayDesktop] = useState(false);
  [APP_READY, SET_APP_READY] = useState(false);
  [OFFLINE_MODE, SET_OFFLINE_MODE] = useState(false);
  [ELECTRON_APP_INFO, SET_ELECTRON_APP_INFO] = useState<ELECTRON_APP_INFO_TYPE>(ELECTRON_APP_INFO_NOREADY);
  [nowSetting, _setNowSetting] = useState(newEmptyAccount.setting);
  [nowSaveInfo, setNowSaveInfo] = useState(newEmptyAccount.saveInfo);
  [importing, setImporting] = useState<boolean>(false)

  const res = fuckingState.resolution()
  const frsStart = useRef(true)

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "AltLeft":
        case "AltRight":
        case "F1":
          { e.preventDefault(); return; }
      }
    }

    document.addEventListener("keydown", keydown)

    return () => {
      document.removeEventListener("keydown", keydown)
    }
  }, [])

  useEffect(() => {
    if (!isLogin || !usrIndx) return;

    (async () => {
      try {
        const setting = await (await WSA.userSetting(usrIndx)).get();
        const saveInfo = await (await WSA.userSaveInfo(usrIndx)).get();

        setNowSetting(setting);
        setNowSaveInfo(saveInfo);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    })();
  }, [isLogin, usrIndx]);

  useEffect(() => {
    const onSaveInfo = (e: any) => {
      if (e.detail.userId === usrIndx) setNowSaveInfo(e.detail.value);
    };
    const onSetting = (e: any) => {
      if (e.detail.userId === usrIndx) setNowSetting(e.detail.value);
    };

    WSA.addEventListener("user:saveInfoSet", onSaveInfo);
    WSA.addEventListener("user:settingSet", onSetting);
    return () => {
      WSA.removeEventListener("user:saveInfoSet", onSaveInfo);
      WSA.removeEventListener("user:settingSet", onSetting);
    };
  }, []);

  useEffect(() => { SET_APP_READY(true) }, [])

  useEffect(() => {
    if (!isLogin) {
      setNowSetting(newEmptyAccount.setting)
      setNowSaveInfo(newEmptyAccount.saveInfo)
    }
  }, [isLogin])

  useEffect(() => {
    if (!APP_READY) return;
    _app.hideColorPanel(true)

    return () => {
      _app.hideColorPanel(false)
    }
  }, [APP_READY])

  useEffect(() => {
    ELECTRON_SET_TRAY(appName + (guestMode ? ` ( Gust Mode ) ` : ""))
    ELECTRON_APP_IS_READY()
  }, [APP_READY])

  useEffect(() => {
    const appInfo = (e: any) => {
      SET_ELECTRON_APP_INFO(e.detail)
    }
    document.addEventListener("APP-INFO", appInfo)
    return () => {
      document.removeEventListener("APP-INFO", appInfo)
    }
  }, [])

  useEffect(() => {
    if (frsStart.current) { frsStart.current = false; return; };
    const ele = document.getElementById(style["Resolution"])!
    ele.classList.add(style["hide"])
    return () => {
      ele.classList.remove(style["hide"])
      void ele.clientHeight
    }
  }, [res])

  const Content = (<>
    {APP_READY && <>
      <div id={style["Frame"]} >
        {!isLogin ? <Login key={usrIndx} /> : <></>}
        {(isLogin && displayDesktop) ? <Desktop key={usrIndx} /> : <></>}
      </div >
    </>}
  </>)

  const win = (
    <div
      className={clsx(
        winStyle["window"],
        winStyle["active"],
        winStyle["nonTransparens"],
        ELECTRON_APP_INFO.isFocused ? "" : winStyle["blurred"],
      )}
    >
      <div className={winStyle["title"]} style={{ display: ELECTRON_APP_INFO.isFullScreen ? "none" : "" }}>
        <span className={winStyle["text"]}>{appName + (guestMode ? ` ( Gust Mode ) ` : "")}</span>
        <span className={winStyle["btns"]}>
          <div className={clsx(winStyle["DropArea"], style["electron-drag"])}></div>
          <div className={winStyle["min"]} onClick={() => ELECTRON_ACT("MINI")} onContextMenu={() => ELECTRON_ACT("HIDE")}>
            <div className={winStyle["icon"]}>
              <svg width="22" height="3" viewBox="0 0 22 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L20 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
              </svg>
            </div>
            <div className={winStyle["bg"]} />
          </div>
          <div className={winStyle["res"]} onClick={() => ELECTRON_APP_INFO.isMaximized ? ELECTRON_ACT("RSTR") : ELECTRON_ACT("MAXI")}>
            <div className={winStyle["icon"]}>
              {ELECTRON_APP_INFO.isMaximized ? (
                <svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0L10 4L20 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                </svg>
              ) : (
                <svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 4L10 0L20 4" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                </svg>
              )}
            </div>
            <div className={winStyle["bg"]} />
          </div>
          <div className={winStyle["cls"]} onClick={() => ELECTRON_ACT("CLOSE")} onContextMenu={() => ELECTRON_ACT("KILL")}>
            <div className={winStyle["icon"]}>
              <svg width="28.28" height="28.28" viewBox="0 0 28.28 28.28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M0 0L14.1421 14.1421" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                  <path d="M0 14.1421L14.1421 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                </g>
              </svg>
            </div>
            <div className={winStyle["bg"]} />
          </div>
        </span>
      </div >
      <div className={clsx(winStyle["content"], style["winBackground"])}>
        {Content}
      </div>
    </div >
  )

  return (<div
    id={style["APP"]}
  >
    <div id={style["Resolution"]} className={style["hide"]}>
      <div>{res[0]}x{res[1]}</div>
    </div>
    <Menu />
    {electronMode ?
      win
      :
      Content
    }
  </div>);
}

export default function () {
  [READY, SET_READY] = useState(false);
  [OFFLINE_MODE, SET_OFFLINE_MODE] = useLocalStorage("E621-APP/OFFLINE", false);

  useEffect(() => {
    const urlParams = new URL(window.location.toString()).searchParams

    if (urlParams.has("guest")) {
      guestMode = true;
    }

    if (urlParams.has("electron")) {
      electronMode = true;
    }

    if (urlParams.has("storage")) {
      storage = urlParams.get("storage")!
    }

    WSA = new WSAction.WorkSpaceActions(storage, () => {
      SET_READY(true)
    }, false)
  }, [])

  return (<>
    <HeadSetting title={appName + (guestMode ? ` ( Gust Mode ) ` : "")} />
    {READY && <App />}
  </>)
}