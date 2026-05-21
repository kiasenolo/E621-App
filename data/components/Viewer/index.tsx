import clsx from "clsx";
import style from "./style.module.scss";
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

type randerMode = "pixelated" | "auto";

const lang = {
  "resetTransform": "Reset Transform",
  "randerMode": "Rander Mode : ",
  "randerMode.auto": "Auto",
  "randerMode.pixelated": "Pixelated",
}

export type ViewerProps = {
  defaultRanderMode?: randerMode;
  backgroundColor?: string;
  contro?: boolean;
  tTranslate?: {
    "resetTransform"?: string
    "randerMode"?: string
    "randerMode.auto"?: string
    "randerMode.pixelated"?: string
  }
}

export type State = { x: number, y: number, scale: number }

export interface ViewerHandle {
  resetTransform: () => void;
  setTransform: (state: State) => void;
  setRanderMode: (mode: randerMode) => void;
  setBackgroundColor: (color: string) => void;
}

const Viewer = forwardRef<ViewerHandle, React.ComponentProps<"div"> & ViewerProps>((Prop, ref) => {
  const t = (key: keyof typeof lang) => {
    const list = Prop.tTranslate ?? lang;
    const tt = list[key] ?? lang[key];
    return tt;
  };

  const [bgColor, setBgColor] = useState<string>(Prop.backgroundColor ?? "#00000000");
  const [randerMode, setRanderMode] = useState<randerMode>(Prop.defaultRanderMode ?? "auto");
  const [state, setState] = useState<State>({ x: 0, y: 0, scale: 1 })

  const gestureRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const resetBtnRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<{ x: number; y: number; time: number }[]>([]);

  const internalStateRef = useRef<{
    x: number; y: number; scale: number;
    updateTransform?: () => void;
  }>({ x: 0, y: 0, scale: 1 });

  useImperativeHandle(ref, () => ({
    resetTransform: () => {
      resetBtnRef.current?.click();
    },
    setTransform: ({ x, y, scale }: State) => {
      const transformLayer = transformRef.current;
      if (!transformLayer) return;
      internalStateRef.current.x = x;
      internalStateRef.current.y = y;
      internalStateRef.current.scale = scale;
      transformLayer.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      setState({ x, y, scale });
    },
    setRanderMode: (mode: randerMode) => {
      setRanderMode(mode);
    },
    setBackgroundColor: (color: string) => {
      setBgColor(color);
    },
  }));

  useEffect(() => {
    const gestureLayer = gestureRef.current;
    const transformLayer = transformRef.current;
    const resetBtn = resetBtnRef.current;

    const ZOOM_MAX = 100;
    const ZOOM_MIN = .1;

    if (!gestureLayer || !transformLayer) return;

    transformLayer.style.transformOrigin = "0 0";

    const s = internalStateRef.current; // 共用同一個 ref object
    Object.assign(s, { x: 0, y: 0, scale: 1 });

    // 額外的拖曳狀態
    const drag = {
      vx: 0, vy: 0,
      friction: .9,
      animationId: 0,
      lastX: 0, lastY: 0,
      lastDist: 0,
      isDragging: false,
      mouseX: 0, mouseY: 0,
    };

    function getCompensatedPoint(clientX: number, clientY: number) {
      const rect = gestureLayer!.getBoundingClientRect();
      const scaleX = gestureLayer!.offsetWidth > 0 ? rect.width / gestureLayer!.offsetWidth : 1;
      const compScale = scaleX || 1;
      return {
        x: (clientX - rect.left) / compScale,
        y: (clientY - rect.top) / compScale,
      };
    }

    function updateTransform() {
      transformLayer!.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
      setState({ x: s.x, y: s.y, scale: s.scale });
    }

    // 讓 imperative setTransform 也能透過這個路徑更新（可選）
    s.updateTransform = updateTransform;

    function resetTransform() {
      s.x = 0; s.y = 0; s.scale = 1;
      updateTransform();
    }

    function trackMovement(currentX: number, currentY: number) {
      const now = performance.now();
      historyRef.current.push({ x: currentX, y: currentY, time: now });
      while (historyRef.current.length > 0 && now - historyRef.current[0].time > 100) {
        historyRef.current.shift();
      }
    }

    function startInertia() {
      if (Math.abs(drag.vx) < 0.05 && Math.abs(drag.vy) < 0.05) {
        drag.vx = 0; drag.vy = 0; return;
      }
      s.x += drag.vx * 16; s.y += drag.vy * 16;
      drag.vx *= drag.friction; drag.vy *= drag.friction;
      updateTransform();
      drag.animationId = requestAnimationFrame(startInertia);
    }

    function stopInertia() {
      cancelAnimationFrame(drag.animationId);
      drag.vx = 0; drag.vy = 0;
    }

    function applyReleaseVelocity() {
      const now = performance.now();
      const history = historyRef.current;
      if (history.length < 2) return;
      const oldest = history[0];
      const newest = history[history.length - 1];
      const timeDiff = newest.time - oldest.time;
      if (timeDiff <= 0 || now - newest.time > 100) {
        drag.vx = 0; drag.vy = 0; return;
      }
      drag.vx = (newest.x - oldest.x) / timeDiff;
      drag.vy = (newest.y - oldest.y) / timeDiff;
      const MAX_SPEED = 5;
      drag.vx = Math.max(-MAX_SPEED, Math.min(drag.vx, MAX_SPEED));
      drag.vy = Math.max(-MAX_SPEED, Math.min(drag.vy, MAX_SPEED));
      startInertia();
    }

    const handleTouchStartOrEnd = (e: TouchEvent) => {
      const touches = e.touches;
      if (e.type === 'touchstart') { stopInertia(); historyRef.current = []; }
      if (touches.length === 1) {
        const pt = getCompensatedPoint(touches[0].clientX, touches[0].clientY);
        drag.lastX = pt.x; drag.lastY = pt.y;
        trackMovement(drag.lastX, drag.lastY);
      } else if (touches.length === 2) {
        const pt1 = getCompensatedPoint(touches[0].clientX, touches[0].clientY);
        const pt2 = getCompensatedPoint(touches[1].clientX, touches[1].clientY);
        drag.lastDist = Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);
        drag.lastX = (pt1.x + pt2.x) / 2; drag.lastY = (pt1.y + pt2.y) / 2;
      }
      if (e.type === 'touchend' && touches.length === 0) applyReleaseVelocity();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touches = e.touches;
      if (touches.length === 1) {
        const pt = getCompensatedPoint(touches[0].clientX, touches[0].clientY);
        s.x += pt.x - drag.lastX; s.y += pt.y - drag.lastY;
        drag.lastX = pt.x; drag.lastY = pt.y;
        trackMovement(drag.lastX, drag.lastY);
      } else if (touches.length === 2) {
        historyRef.current = [];
        const pt1 = getCompensatedPoint(touches[0].clientX, touches[0].clientY);
        const pt2 = getCompensatedPoint(touches[1].clientX, touches[1].clientY);
        const currentDist = Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);
        const currentX = (pt1.x + pt2.x) / 2;
        const currentY = (pt1.y + pt2.y) / 2;
        const rawZoom = currentDist / drag.lastDist;
        let nextScale = Math.max(ZOOM_MIN, Math.min(s.scale * rawZoom, ZOOM_MAX));
        const effectiveZoom = nextScale / s.scale;
        s.x -= (currentX - s.x) * (effectiveZoom - 1);
        s.y -= (currentY - s.y) * (effectiveZoom - 1);
        s.x += currentX - drag.lastX; s.y += currentY - drag.lastY;
        s.scale = nextScale;
        drag.lastDist = currentDist; drag.lastX = currentX; drag.lastY = currentY;
      }
      updateTransform();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || e.button === 0) {
        e.preventDefault(); stopInertia(); historyRef.current = [];
        const pt = getCompensatedPoint(e.clientX, e.clientY);
        drag.isDragging = true; drag.mouseX = pt.x; drag.mouseY = pt.y;
        trackMovement(drag.mouseX, drag.mouseY);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!drag.isDragging) return;
      e.preventDefault();
      const pt = getCompensatedPoint(e.clientX, e.clientY);
      s.x += pt.x - drag.mouseX; s.y += pt.y - drag.mouseY;
      drag.mouseX = pt.x; drag.mouseY = pt.y;
      trackMovement(pt.x, pt.y);
      updateTransform();
    };

    const handleMouseUp = () => {
      if (!drag.isDragging) return;
      drag.isDragging = false;
      applyReleaseVelocity();
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); stopInertia();
      const pt = getCompensatedPoint(e.clientX, e.clientY);
      const MOUSE_ZOOM_SENSITIVITY = 0.002;
      const zoomFactor = Math.exp(-e.deltaY * (e.shiftKey ? MOUSE_ZOOM_SENSITIVITY : MOUSE_ZOOM_SENSITIVITY * .5));
      let nextScale = Math.max(ZOOM_MIN, Math.min(s.scale * zoomFactor, ZOOM_MAX));
      const effectiveZoom = nextScale / s.scale;
      s.x -= (pt.x - s.x) * (effectiveZoom - 1);
      s.y -= (pt.y - s.y) * (effectiveZoom - 1);
      s.scale = nextScale;
      updateTransform();
    };

    gestureLayer.addEventListener("touchstart", handleTouchStartOrEnd, { passive: false });
    gestureLayer.addEventListener("touchend", handleTouchStartOrEnd);
    gestureLayer.addEventListener("touchcancel", handleTouchStartOrEnd);
    gestureLayer.addEventListener("touchmove", handleTouchMove, { passive: false });
    gestureLayer.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    resetBtn?.addEventListener("click", resetTransform);
    gestureLayer.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      stopInertia();
      gestureLayer.removeEventListener("touchstart", handleTouchStartOrEnd);
      gestureLayer.removeEventListener("touchend", handleTouchStartOrEnd);
      gestureLayer.removeEventListener("touchcancel", handleTouchStartOrEnd);
      gestureLayer.removeEventListener("touchmove", handleTouchMove);
      gestureLayer.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      resetBtn?.removeEventListener("click", resetTransform);
      gestureLayer.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    resetBtnRef.current?.click();
  }, []);

  return (
    <>
      <div className={style["Frame"]}>
        <div className={clsx(style["GUI"], (Prop.contro ?? true) && style["displayCtrl"])}>
          <div className={style["Bar"]}>
            <div className={style["Contro"]}>
              <button ref={resetBtnRef}>{t("resetTransform")}</button>
              <button onClick={() => setRanderMode(e => e === "pixelated" ? "auto" : "pixelated")}>
                {`${t("randerMode")}${randerMode === "auto" ? t("randerMode.auto") : t("randerMode.pixelated")}`}
              </button>
              <input type="color" onChange={e => setBgColor(e.currentTarget.value)} />
            </div>
            <div className={style["Value"]}>
              <span>{`X:${~~state.x} // Y:${~~state.y} // S:${~~(state.scale * 100)}%`}</span>
            </div>
          </div>
        </div>
        <div className={style["Img"]} ref={gestureRef}>
          <div className={style["Tar"]} ref={transformRef} style={{ imageRendering: randerMode, backgroundColor: bgColor }}>
            <div {...Prop} />
          </div>
        </div>
      </div>
    </>
  );
});

Viewer.displayName = "Viewer";
export default Viewer;