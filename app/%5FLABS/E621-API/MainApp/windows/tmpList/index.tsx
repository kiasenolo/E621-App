import { useEffect, useRef, useState, JSX, Fragment } from "react"
import style from "./style.module.scss"
import { _app, Kiasole, newInput } from "@/app/_app"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import React from "react"
import clsx from "clsx/lite"
import * as e621Type from "../../types/appTypes"
import * as workSpaceType from "../../types/workSpaceType"
import * as WSAction from "../../core/appStorage"
import { GetNowTime } from "../../utlis/other"
import { StopEvent, WSA, createWindow, disableWindowKeyEvent, usrIndx, wmRef } from "../../core/globals"
import { DELAY_EFFECT, SetS, acts, cnvFormat, dragItem, getWindowTitle, t } from "../../core/helpers"
import { WINDOW_FRAME, windowAction } from "../../ui/WindowFrame"
import { windowsType } from "../windowsType"

export const tmpList = function () {
  const windowID = "tmp-list"
  const thisWindow = wmRef.current?.getWindow(windowID);
  const [start, setStart] = useState<boolean>(false)
  const eRef = useRef<HTMLDivElement>(null)

  const [tmpList, setTmpList] = useState<{ uuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }[]>([]);

  const peekPreRef = useRef<E621.Post | undefined>(undefined);
  const peekPreKeyDown = useRef(false);

  const getPostFromTmpItem = (item: workSpaceType.Unit.BaseItem.TmpItem): E621.Post | undefined => {
    const { data } = item;
    if (data.type === "post") {
      return data.data.cachedPost;
    }
    if (data.type === "postGetByID") {
      return data.data.fetchedPost || undefined;
    }
    if (data.type === "viewer") {
      return data.data;
    }
    if (data.type === "preview") {
      return data.data;
    }
    return undefined;
  };

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
    thisWindow?.setTitle(getWindowTitle({ type: "tmp" }))
  }, [])

  useEffect(() => {
    let isdown = peekPreKeyDown.current;

    const display = () => {
      if (!peekPreRef.current) return;
      createWindow(wmRef, {
        type: "preview",
        data: peekPreRef.current
      });
    };

    const keydown = (e: KeyboardEvent) => {
      if (disableWindowKeyEvent) return;
      if (isdown) return;
      if (e.code === "Space") {
        isdown = true;
        display();
      }
    };

    const keyup = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isdown = false;
      }
    };

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  }, []);

  const [isDragSelf, setIsDragSelf] = useState(false);

  useEffect(() => {
    const drpEv = () => setIsDragSelf(false);
    document.addEventListener("drop", drpEv)
    return () => {
      document.removeEventListener("drop", drpEv)
    }
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
                        SetS.appState(e => {
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
        className={clsx(style["list"], start && style["START"])}
        ref={eRef}
        onKeyDown={e => { if (e.code === "Space") e.preventDefault(); }}
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
                  acts.saveToTmp(usrIndx,
                    {
                      type: "postSearch",
                      data: {
                        nowPage: 1,
                        pageCache: [],
                        searchTags: [data.tag]
                      }
                    }, `post_search-${createAt}`)
                }
                break;
              };
              case "postSearch": {
                const winId = item.thisWindow?.id ?? `post_search-${GetNowTime()}`;
                acts.saveToTmp(usrIndx, { type: "postSearch", data: item.data }, winId);
                break;
              };
              case "post": {
                acts.saveToTmp(usrIndx, {
                  type: "postGetByID",
                  data: {
                    currentId: data.id,
                    status: "success",
                    fetchedPost: data
                  }
                }, `post_get_by_id-${data.id}`)
                break;
              };
              case "postId": {
                acts.saveToTmp(usrIndx, {
                  type: "postGetByID",
                  data: {
                    currentId: data,
                    status: "loading",
                  }
                }, `post_get_by_id-${data}`)
                break;
              };
              case "postImg": {
                acts.saveToTmp(usrIndx, {
                  type: "viewer",
                  data: data
                }, `viewer-${data.id}`)
                break;
              };
              case "pool": {
                const winId = item.thisWindow?.id ?? `pool-${item.data.poolId}`;
                acts.saveToTmp(usrIndx, { type: "pool", data: item.data }, winId);
                break;
              };
              case "poolId": {
                acts.saveToTmp(usrIndx, {
                  type: "pool",
                  data: {
                    nowPage: 1,
                    pageCache: {},
                    poolId: data
                  }
                }, `pool-${data}`)
                break;
              };
              case "setting": {
                _app.throwNewNotic(t("Notic.templist.ondrop.setting"));
                break;
              };
              case "temp": {
                _app.throwNewNotic(t("Notic.templist.ondrop.temp"));
                break;
              };
              case "text": {
                _app.throwNewNotic(t("Notic.templist.ondrop.text"));
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

          const post = getPostFromTmpItem(item);

          return <div
            key={item.createAt}
            className={style["item"]}
            onDragOver={StopEvent}
            style={{
              transitionDelay: DELAY_EFFECT(`${baseDely}s`)
            }}
            onMouseEnter={() => {
              if (post) peekPreRef.current = post;
            }}
            onMouseMove={() => {
              if (post) peekPreRef.current = post;
            }}
            onMouseLeave={() => {
              peekPreRef.current = undefined;
            }}
            onDrop={async e => {
              if (isDragSelf) {
                StopEvent(e)
                setIsDragSelf(false)
                return;
              };
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
            onDragStart={e => {
              dragItem ? dragItem(e, dItem) : ""
              setIsDragSelf(true)
            }}
          >
            <div className={style["main"]}>
              <div className={style["info"]}>
                <div className={style["title"]}>
                  {getWindowTitle(item.data)}
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
                            title: getWindowTitle(item.data),
                            customData: item.data,
                            children: getChild()
                          });
                          wm.bringToFront(targetID);
                          Kiasole.log(`Restore Window: ${targetID}`);
                        } else {
                          wm.createWindow({
                            title: getWindowTitle(item.data),
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
                      }
                    })() as e621Type.DragItemType.defaul,
                  ] as ([JSX.Element, (() => void)] | [JSX.Element, (() => void), e621Type.DragItemType.defaul])[])
                    .map((e, i) =>
                      i === 2 ? <Fragment key={i}></Fragment> :
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
