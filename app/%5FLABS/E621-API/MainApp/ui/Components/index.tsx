import { useCallback, useEffect, useRef, useState, useMemo, MouseEventHandler, Fragment } from "react"
import style from "./style.module.scss"
import { WindowInstance } from "@/data/components/Window/WindowManager"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import Viewer from "@/data/components/Viewer"
import React from "react"
import Fuse from "fuse.js"
import clsx from "clsx/lite"
import * as e621Type from "../../types/appTypes"
import { Cache } from "../../core/cache"
import { canBlurContent, createWindow, iNeedThis, usrIndx, wmRef } from "../../core/globals"
import { DELAY_EFFECT, SetS, acts, dragItem, t } from "../../core/helpers"
import { MenuAction } from "../../core/menuAction"
import { menuBtn } from "../../core/menuButtons"
import VideoViewer from "@/data/components/VideoViewer"

export namespace Components {

  export type Card = {
    event?: {
      mouseLeave?: (p: E621.Post) => void
      mouseMove?: (p: E621.Post) => void
    }
    post: E621.Post,
    onClick?: MouseEventHandler<HTMLDivElement>,
    actionMenu: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, post: E621.Post) => void,
    delay?: number,
    queryQ?: string
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

export const Card = React.memo(({ post: _post, onClick, actionMenu, delay, queryQ, event }: Components.Card) => {
  const post = iNeedThis.normalizePost(_post)

  const totalScore = post.score.total
  const favIsNav = totalScore === 0 ? "=" : totalScore < 0 ? "-" : "+";
  const cachedSrc = Cache.useCachedThumbnail(post);
  const [suses, setSuses] = useState(false)

  const hoverTips = [
    `Rating ${post.rating}`,
    `ID ${post.id}`,
    `Create at ${post.created_at}`,
    `Score ${post.score.total}`,
  ].join("<br/>")

  return <div
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        e.currentTarget.click()
      }
    }}
    data-post-id={post.id}
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
      }, queryQ ? { q: queryQ } : undefined)
    }}
    style={{
      transitionDelay: DELAY_EFFECT(delay + "s")
    }}
  >
    <div className={style["previewImage"]}>
      <div
        className={style["vid"]}
        style={{
          filter: canBlurContent(post, 30)
        }}
      >
        {post.file.ext === 'webm' || post.file.ext === 'mp4' ? (
          cachedSrc && <video
            key={cachedSrc}
            poster={cachedSrc}
          />
        ) : (
          cachedSrc && <img
            src={cachedSrc}
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
          <div className={clsx(style["total"])}>
            <div className={style["icon"]}>{favIsNav}</div>
            <div>{post.score.total}</div>
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
        >{"..."}</button>
      </div>
    </div>

    <div className={style["Ext"]}>
      <div>{post.file.ext.toLocaleUpperCase()}</div>
    </div>
  </div>
});

export const Components = {
  Card,
  Post: ({ postData: _post, thisWindow }: Components.Post) => {
    const post = iNeedThis.normalizePost(_post)
    const [start, setStart] = useState<boolean>(false)
    const [searchTag, setSearch] = useState("");

    const tags = useMemo(() => {
      const callback: E621.PostTags | undefined = (() => {
        const input = searchTag.trim()
        if (!input) return post?.tags;

        const filter = (list: string[]) => {
          const fuse = new Fuse(list, {
            includeScore: true,
            threshold: 0.3,
          });
          return fuse.search(input).map(e => e.item)
        }

        return {
          general: filter(post?.tags.general),
          species: filter(post?.tags.species),
          character: filter(post?.tags.character),
          copyright: filter(post?.tags.copyright),
          artist: filter(post?.tags.artist),
          invalid: filter(post?.tags.invalid),
          lore: filter(post?.tags.lore),
          meta: filter(post?.tags.meta),
        }
      })();

      return callback
    }, [searchTag])

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

    const [isFocus, setIsFocus] = useState(false)

    return (<div
      ref={eRef}
      className={clsx(style["Post"], start && style["START"])}
    >
      <div
        className={style["Tags"]}
        onKeyDown={e => { if (e.code === "Space") if (!isFocus) e.preventDefault(); }}
      >
        <input
          type="text"
          placeholder={t("components.post.tagFilter")}
          className={style["tagFilter"]}
          onInput={e => setSearch(e.currentTarget.value)}
          onKeyDown={e => { if (e.code === "Escape") e.currentTarget.blur() }}
          onFocus={_ => setIsFocus(true)}
          onBlur={_ => setIsFocus(false)}
        />
        {
          ([
            [t("components.post.Artists"), tags.artist],
            [t("components.post.Copyrights"), tags.copyright],
            [t("components.post.Character"), tags.character],
            [t("components.post.Species"), tags.species],
            [t("components.post.General"), tags.general],
            [t("components.post.Meta"), tags.meta],
            [t("components.post.Lore"), tags.lore],
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
                        [t("components.post.info.Rating"), post.rating.toLocaleUpperCase(), { type: "tag", data: { action: "+", tag: "rating:" + post.rating } }],
                        [t("components.post.info.Score"), post.score.total],
                        [t("components.post.info.Favs"), post.fav_count],
                        "CLIP",
                        [t("components.post.info.Posted"), dateToString(post.created_at)],
                      ] as ([string, string] | [string, string, e621Type.DragItemType.defaul] | "CLIP")[]).map((e, indx) => {
                        if (e === "CLIP") {
                          return <Fragment key={`clip_line_${indx}`}>
                            <div className={style["Clip"]} />
                            <div className={style["Clip"]} />
                          </Fragment>
                        } else {
                          const props: React.HTMLAttributes<HTMLDivElement> = {
                            draggable: !!e[2],
                            onDragStart(ev) { dragItem(ev, e[2]!) }
                          }
                          return <Fragment key={`key_and_value_${indx}`}>
                            <div
                              className={style["key"]}
                              style={{
                                transitionDelay: DELAY_EFFECT(`${dely + (indx * .05)}s`)
                              }}
                            >{e[0]}</div>
                            <div
                              {...props}
                              className={style["value"]}
                              style={{
                                transitionDelay: DELAY_EFFECT(`${dely + (indx * .05)}s`)
                              }}
                            >{e[1]}</div>
                          </Fragment>
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
                    {list[1]!.map((tag, indx) => <Fragment key={indx}>
                      <div className={style["tag"]}
                        style={{
                          transitionDelay: DELAY_EFFECT(`${dely + (indx * .01)}s`)
                        }}
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
                    </Fragment>)}
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
            <span draggable={true} onDragStart={e => dragItem(e, { type: "tag", data: { action: "+", tag: "rating:" + post.rating } })}>{post.rating.toLocaleUpperCase()}</span>
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
              acts.open.view(post)
            }}
            draggable
            onDragStart={(e) => {
              dragItem(e, { type: "postImg", data: post })
            }}
          >{t("menuButton.OpenWithViewer")}</button>

          <button
            kiase-style=""
            onClick={(e) => {
              SetS.wallpaper(usrIndx, post?.file.url!, post)
            }}
            style={{ marginLeft: "auto" }}
            onContextMenu={e => {
              e.preventDefault();
              acts.setting.wallpaper();
            }}
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
                  acts.open.browser.post(post?.id, { q })
                }
              } else if (thisWindow?.customData?.type === "postGetByID") {
                acts.open.browser.post(post?.id)
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
          {post?.description.split("\n").map((e, i) => <Fragment key={i}>{e}<br /></Fragment>)}
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

    const [preview, setPreview] = useState(true);

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
              style={{
                filter: canBlurContent(post, 50)
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
                  <img
                    src={main ?? post.file.url ?? ""}
                    loading="lazy"
                    onLoad={_ => setPreview(false)}
                  />
                </div>

                {preview && <div className={style["prev"]}>
                  <img
                    src={prev ?? post.preview.url ?? ""}
                    loading="lazy"
                  />
                </div>}
              </Viewer>
            </div>

          case "webm":
          case "mp4":
            return <VideoViewer
              src={main ?? post.file.url ?? ""}
              tTranslate={{
                "resetTransform": t("windowsType.viewer.ResetTransform"),
                "randerMode": t("windowsType.viewer.RenderMode"),
                "randerMode.auto": t("windowsType.viewer.RenderMode.Auto"),
                "randerMode.pixelated": t("windowsType.viewer.RenderMode.Pixelated"),
              }}
            />
        }
      })()}
    </div >

  }
}

