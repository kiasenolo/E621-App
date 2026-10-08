import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import { WindowRect } from "@/data/components/Window/Window"
import { WindowInstance } from "@/data/components/Window/WindowManager"

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
    thisWindow?: WindowInstance<defaul>
    data: window.dataType.postSearch
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
    thisWindow?: WindowInstance<defaul>
    data: window.dataType.pool
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
