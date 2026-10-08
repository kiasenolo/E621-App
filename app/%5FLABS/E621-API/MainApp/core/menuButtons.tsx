import { _app } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import { GetNowTime } from "../utlis/other"
import { createWindow, nonePrxy, usrIndx, wmRef } from "./globals"
import { E6Url, SetS, acts, copyString, t, tools } from "./helpers"
import { MenuAction } from "./menuAction"
import { toProxiedUrl } from "../ui/DesktopParts"

export const menuBtn = {
  copyJSON: (data?: object, active?: boolean, text?: string) => {
    return data ? [{
      name: text ?? t("menuButton.CopyRawJson"),
      action() {
        copyString(JSON.stringify(data, null, 2))
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
          acts.open.browser.post(id, urlQue)
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
            acts.open.view(post)
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
            acts.open.getByID(post)
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
            acts.saveToTmp(usrIndx, {
              type: "postGetByID",
              data: {
                currentId: post.id,
                status: "success",
                fetchedPost: post
              }
            }, `post_get_by_id-${post.id}`)
        },
        onContextMenu() { acts.windows.tempList() },
        dragItem: {
          type: "post",
          data: post!
        },
        active: post ? true : false,
      },
      ...(nonePrxy() ? [] : [{
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

          _app.throwNewNotic(t("Notic.Downloading"));

          const extension = url.split('.').pop() || 'bin';
          const filename = `e621_${post.id}.${extension}`;

          await tools.downloadMedia(url, filename);

          _app.throwNewNotic(t("Notic.Downloading.done"));
        },
        dragItem: {
          type: "postImg",
          data: post!
        },
        active: !!post?.file.url
      },] as MenuAction.Item[]),
      {
        name: t("menuButton.CopyURL"),
        action() {
          copyString(E6Url.post(id, urlQue))
        },
        dragItem: {
          type: "post",
          data: post!
        },
        active: !!post
      },
      ...(() => {
        if (nonePrxy()) return [];
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
                  _app.throwNewNotic(t("Notic.Downloading"));
                  const proxiedUrl = toProxiedUrl(url);
                  const response = await fetch(proxiedUrl);
                  const originalBlob = await response.blob();

                  const pngBlob = originalBlob.type === "image/png"
                    ? originalBlob
                    : await tools.convertToPng(originalBlob);

                  const data = [new ClipboardItem({ "image/png": pngBlob })];
                  await navigator.clipboard.write(data);

                  _app.throwNewNotic(t("Notic.imageCopyToClipper"));
                } catch (err) {
                  _app.throwNewNotic(t("Notic.imageCopyToClipper.err"));
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
          copyString(id.toString())
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
            SetS.wallpaper(usrIndx, post.file.url!, post)
        },
        onContextMenu() {
          acts.setting.wallpaper();
        },
        active: post ? true : false,
      },
      {
        name: t("menuButton.SetAsAvatar"),
        action() {
          if (post)
            SetS.avatar(usrIndx, post.file.url!, post)
        },
        onContextMenu() {
          acts.setting.avatar()
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
          copyString(tag)
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
      {
        name: t("menuButton.SaveToTmp"),
        action() {
          acts.saveToTmp(usrIndx, {
            type: "postSearch",
            data: {
              searchTags: [tag],
              pageCache: [],
              nowPage: 1,
            }
          }, `post_search-${GetNowTime()}`)
        },
        onContextMenu() { acts.windows.tempList() },
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

