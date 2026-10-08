import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import { Cache } from "../../core/cache"
import { createWindow, wmRef } from "../../core/globals"
import { acts, t } from "../../core/helpers"
import { menuBtn } from "../../core/menuButtons"
import { Components } from "../../ui/Components"
import { NODATA } from "../../ui/NoData"
import { WINDOW_FRAME, windowAction } from "../../ui/WindowFrame"

export type ViewerWindowProps = {
  winID: string,
  post: E621.Post,
  notViewer?: boolean
  fetching?: boolean
  reloadBtn?: () => void
}

export const ViewerWindow = ({ winID, post, notViewer, fetching, reloadBtn }: ViewerWindowProps) => {
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
      ]),
      [
        t("menuButton.top.Data"),
        [
          {
            name: t("menuButton.Reload"),
            action: reloadBtn
          }
        ]
      ],
      [
        t("menuButton.top.Other"),
        (notViewer ? [
          {
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
          },
          ...menuBtn.post(post.id, post, {}, "id")
        ] : menuBtn.post(post.id, post, {}, "viewer")),
      ]
    ]}
  >
    {
      fetching ?
        <NODATA.Fetching />
        :
        <Components.PostViewer
          post={post}
          main={cachedMainSrc ?? undefined}
          prev={cachedPrevSrc ?? undefined}
        />
    }
  </WINDOW_FRAME >
}

