import { useEffect, useRef, useState } from "react"
import style from "./style.module.scss"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import functions from "@/data/module/functions"
import React from "react"
import clsx from "clsx/lite"
import * as workSpaceType from "../../types/workSpaceType"
import { Cache } from "../../core/cache"
import { dragEvent, iNeedThis, nowSetting } from "../../core/globals"
import { cnvFormat, dragItem } from "../../core/helpers"
import { fuckingState } from "../../core/hooks"
import { MenuAction } from "../../core/menuAction"

/* ========================================================================================= */

export const Menu = () => {
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
            onContextMenu={e => item.onContextMenu && e.preventDefault()}
            onMouseUp={(e) => {
              if (e.button === 0) {
                item.action?.();
              } if (e.button === 2) {
                item.onContextMenu?.();
              }
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

export const sharedVideoRegistry = new Map<string, HTMLVideoElement>()

export function toProxiedUrl(url: string): string {
  if (!url) return url
  const isMedia = /\.(webm|mp4|jpg|jpeg|png|gif|webp)$/i.test(url)
  if (!isMedia) return url
  return `/_LABS/E621-API/proxy?url=${encodeURIComponent(url)}`
}

export function getOrCreateSharedVideo(url: string): HTMLVideoElement {
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

export const VideoMirror = ({ src, style: css }: { src: string; style?: React.CSSProperties }) => {
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

export const TaskbarClock = React.memo(({ formats }: { formats: string[] }) => {
  const clock = fuckingState.clock()
  return <>
    {formats.map((e, i) => <div key={i}>{cnvFormat.clock(clock, e)}</div>)}
  </>
})

export const ClockPreview = React.memo(({ formats }: { formats: string[] }) => {
  const timeCode = fuckingState.clock()
  return <>
    {formats.map((e, i) => <div key={i} mid-txt="">{cnvFormat.clock(timeCode, e)}</div>)}
  </>
})

export const Background = React.memo(({ bg, className }: { bg: workSpaceType.Unit.BaseItem.Image, className?: string }) => {
  const position = `${bg.positionX ?? 50}% ${bg.positionY ?? 50}%`
  const baseCss: React.CSSProperties = {
    objectPosition: position,
    transformOrigin: position,
    transform: `scale(${(bg.scale ?? 100) / 100})`,
  }

  const cachedPost = Cache.useCachedPost(bg.fromPost ?? ({} as E621.Post));
  const cachedSrc = iNeedThis.toE926Static(bg.fromPost ? cachedPost : bg.url);


  return (
    <div className={clsx(style["Background"], className)} key={bg.url}>
      {(() => {
        if (functions.str.mulitEndWith([".jpg", ".jpeg", ".png", ".gif", ".webp",], bg.url.toLowerCase())) {
          return cachedSrc ? <img style={baseCss} src={cachedSrc} /> : <></>
        } else if (functions.str.mulitEndWith([".webm", ".mp4",], bg.url.toLowerCase())) {
          return <VideoMirror src={cachedSrc ?? ""} style={baseCss} />
        }
      })()}

    </div>
  )
}, (prev, next) =>
  prev.className === next.className &&
  prev.bg.url === next.bg.url &&
  prev.bg.positionX === next.bg.positionX &&
  prev.bg.positionY === next.bg.positionY &&
  prev.bg.scale === next.bg.scale &&
  prev.bg.fromPost?.id === next.bg.fromPost?.id
)

/* ========================================================================================= */

