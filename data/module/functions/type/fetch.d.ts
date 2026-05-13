import type notes from "@/pages/api/_type/notes"
import type system from "@/pages/api/_type/system"
import type color from "@/pages/api/_type/color"
import type log from "@/pages/api/_type/log"
import { SystemRes } from "@/pages/api/system"
import { ColorRes } from "@/pages/api/color"

export interface FetchNotesType {
    /* 
      這東西應該是沒戲了 等文檔寫完的時候再説吧
      而且有個比較惡心的事情就是 我不會SQL
      但這東西我打算用SQL下去搞

      雖然是立過一個Flag 說API全部丟給AI寫
      但還是感覺不現實 所以 之後 需要學新的東西了
      再加上 也是迫於學業啊......
      隨便啦 如果我們科系存在FINALE PROJETA的話
      啊 這個東西丟過去應該就可以了
    */
    type: "notes"
    options: notes
}

export interface FetchSystemType {
    type: "system"
    options: system
}

export interface FetchColorType {
    type: "color"
    options: color
}

export interface FetchLogType {
    type: "log",
    options: log
}

export interface FetchVersionType {
    type: "version",
    options?: undefined
}

export interface FetchKiloType {
    type: "kilo"
    options?: undefined
}

export type AllFetchType = FetchNotesType | FetchSystemType | FetchColorType | FetchLogType | FetchVersionType | FetchKiloType