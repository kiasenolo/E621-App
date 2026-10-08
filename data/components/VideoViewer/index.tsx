import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import clsx from "clsx/lite"
import Viewer, { ViewerProps } from "../Viewer"
import style from "./style.module.scss"

export type VideoViewerProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  /** Forwarded to <Viewer> for translating its UI labels */
  tTranslate?: ViewerProps["tTranslate"]
}

const INACTIVITY_DELAY = 1500

const formatTime = (seconds: number) => {
  if (!isFinite(seconds)) seconds = 0
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Props are the native <video> props; internal state is synced through the video's
 * own events, and every event handler passed in is still called afterwards.
 */
export const VideoViewer = forwardRef<HTMLVideoElement, VideoViewerProps>((props, outerRef) => {
  const {
    onLoadedMetadata, onPlay, onPause, onVolumeChange, onRateChange,
    onDurationChange, onSeeked, onTimeUpdate,
    loop = true, muted = true, tTranslate,
    ...videoProps
  } = props

  const videoRef = useRef<HTMLVideoElement>(null)
  useImperativeHandle(outerRef, () => videoRef.current!, [])

  const mainObject = useRef<HTMLDivElement | null>(null)
  const wasPlayingBeforeSeek = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef(0)

  const [isActive, setIsActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(muted)
  const [isLoop, setIsLoop] = useState(loop)
  const [isFull, setIsFull] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isSeeking, setIsSeeking] = useState(false)

  const handleMouseMove = () => {
    setIsActive(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsActive(false), INACTIVITY_DELAY)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsActive(false)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  useEffect(() => { setIsLoop(loop) }, [loop])
  useEffect(() => { setIsMuted(muted) }, [muted])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => { })
    else v.pause()
  }, [])

  const toggleLoop = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.loop = !v.loop
    setIsLoop(v.loop)
  }, [])

  const toggleFull = useCallback(() => {
    if (!mainObject.current) return
    if (document.fullscreenElement) document.exitFullscreen()
    else mainObject.current.requestFullscreen()
  }, [])

  const handleSeekStart = useCallback(() => {
    wasPlayingBeforeSeek.current = isPlaying
    setIsSeeking(true)
    videoRef.current?.pause()
  }, [isPlaying])

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false)
    if (wasPlayingBeforeSeek.current) videoRef.current?.play().catch(() => { })
  }, [])

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const handleVolumeChange = useCallback((val: number) => {
    if (!videoRef.current) return
    const newVolume = Math.max(0, Math.min(1, val))
    videoRef.current.volume = newVolume
    videoRef.current.muted = newVolume === 0
  }, [])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
  }, [])

  useEffect(() => {
    const updateProgress = () => {
      if (videoRef.current && !isSeeking) setCurrentTime(videoRef.current.currentTime)
      requestRef.current = requestAnimationFrame(updateProgress)
    }
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateProgress)
    } else {
      cancelAnimationFrame(requestRef.current)
      if (videoRef.current && !isSeeking) setCurrentTime(videoRef.current.currentTime)
    }
    return () => cancelAnimationFrame(requestRef.current)
  }, [isPlaying, isSeeking])

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === mainObject.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  type E<K extends keyof React.VideoHTMLAttributes<HTMLVideoElement>> = Parameters<NonNullable<React.VideoHTMLAttributes<HTMLVideoElement>[K]>>[0]

  const syncDuration = (v: HTMLVideoElement) => setDuration(v.duration)

  return <div
    className={style["VideoViewer"]}
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
      tTranslate={tTranslate}
      contro={isActive}
    >
      <div className={style["main"]}>
        <video
          {...videoProps}
          ref={videoRef}
          loop={loop}
          muted={muted}
          onLoadedMetadata={(e: E<"onLoadedMetadata">) => { syncDuration(e.currentTarget); onLoadedMetadata?.(e) }}
          onDurationChange={(e: E<"onDurationChange">) => { syncDuration(e.currentTarget); onDurationChange?.(e) }}
          onPlay={(e: E<"onPlay">) => { setIsPlaying(true); onPlay?.(e) }}
          onPause={(e: E<"onPause">) => { setIsPlaying(false); onPause?.(e) }}
          onVolumeChange={(e: E<"onVolumeChange">) => {
            setVolume(e.currentTarget.volume)
            setIsMuted(e.currentTarget.muted)
            onVolumeChange?.(e)
          }}
          onRateChange={(e: E<"onRateChange">) => { setPlaybackRate(e.currentTarget.playbackRate); onRateChange?.(e) }}
          onSeeked={(e: E<"onSeeked">) => { setCurrentTime(e.currentTarget.currentTime); onSeeked?.(e) }}
          onTimeUpdate={(e: E<"onTimeUpdate">) => { if (!isPlaying && !isSeeking) setCurrentTime(e.currentTarget.currentTime); onTimeUpdate?.(e) }}
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
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
            />
            <div>{formatTime(duration)}</div>
            <button onClick={toggleLoop}>
              {isLoop ?
                <svg key={"loop"} xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px"><g><rect fill="none" height="24" width="24" /></g><g><path d="M21,1H3C1.9,1,1,1.9,1,3v18c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2V3C23,1.9,22.1,1,21,1z M19,19H6.83l1.58,1.58L7,22l-4-4 l4-4l1.41,1.42L6.83,17H17v-4h2V19z M17,10l-1.41-1.42L17.17,7H7v4H5V5h12.17l-1.58-1.58L17,2l4,4L17,10z" /></g></svg>
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
})

VideoViewer.displayName = "VideoViewer"

export default VideoViewer
