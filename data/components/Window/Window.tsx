import { useEffect, useRef, useState } from "react";
import style from "./style.module.scss";
import { WindowManager, SnapPosition } from "./WindowManager";

export type WindowRect = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export type WindowProps = {
  windowId: string;
  title?: string;
  children?: React.ReactNode;
  nonTransparens?: boolean;
  manager: WindowManager<any>;
  onClose: (id: string) => void;
  rect: WindowRect;
  actions?: {
    canMinimize?: boolean;
    canMaximize?: boolean;
    canResize?: boolean;
  };
};

export default function Window({
  windowId,
  title = "Window",
  children,
  manager,
  onClose,
  actions,
  rect,
  nonTransparens,
}: WindowProps) {
  const {
    canMinimize = true,
    canMaximize = true,
    canResize = true,
  } = actions ?? {
    canMinimize: true,
    canMaximize: true,
    canResize: true,
  };

  const winRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [zIndex, setZIndex] = useState(1);
  const [focused, setFocused] = useState(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  const [isMounted, setIsMounted] = useState(false);
  const [actionStatus, setActionStatus] = useState<boolean>(false);
  const [altIsPress, setAltIsPress] = useState(false);

  const lastSyncedRect = useRef(rect);

  const stateRef = useRef({
    isMaximized,
    isMinimized,
    canResize,
  });

  useEffect(() => {
    stateRef.current = { isMaximized, isMinimized, canResize };
  }, [isMaximized, isMinimized, canResize]);

  useEffect(() => {
    if (winRef.current) {
      winRef.current.style.width = `${rect.width}%`;
      winRef.current.style.height = `${rect.height}%`;
      winRef.current.style.left = `${rect.left}%`;
      winRef.current.style.top = `${rect.top}%`;

      void winRef.current.offsetWidth;
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    if (winRef.current && !actionStatus) {
      const hasChanged =
        rect.left !== lastSyncedRect.current.left ||
        rect.top !== lastSyncedRect.current.top ||
        rect.width !== lastSyncedRect.current.width ||
        rect.height !== lastSyncedRect.current.height;

      if (hasChanged) {
        winRef.current.style.width = `${rect.width}%`;
        winRef.current.style.height = `${rect.height}%`;
        winRef.current.style.left = `${rect.left}%`;
        winRef.current.style.top = `${rect.top}%`;
        lastSyncedRect.current = rect;
      }
    }
  }, [rect, actionStatus]);

  useEffect(() => {
    const unsubscribe = manager.subscribe((windows) => {
      const self = windows.find((w) => w.id === windowId);
      if (self) {
        setZIndex(self.zIndex);
        setFocused(self.focused);
        setIsClosing(self.isClosing ?? false);
        setIsMinimized(self.isMinimized);
        setIsMaximized(self.isMaximized);
      }
    });
    return () => unsubscribe();
  }, [windowId, manager]);

  const handleMaximize = () => {
    if ((manager as any).toggleMaximize) {
      (manager as any).toggleMaximize(windowId);
    }
  };

  const handleMinimize = () => {
    manager.minimizeWindow(windowId);
  };

  const handleClose = () => {
    onClose(windowId);
  };

  useEffect(() => {
    const win = winRef.current;
    const handle = handleRef.current;

    if (!win || !handle) return;

    let startX = 0, startY = 0;
    let startLeft = 0, startTop = 0;
    let startWidth = 0, startHeight = 0;
    let clickOffsetX = 0;
    let clickOffsetY = 0;

    let action: string | null = null;
    let hasMoved = false;

    let isDragging = false;
    let isResizing = false;

    let capturedElement: HTMLElement | null = null;
    let currentSnapPosition: SnapPosition | null = null;

    let latestRect: WindowRect | undefined;

    const snapDist = 15;
    const minW = 600;
    const minH = 400;

    const getSnapped = (val: number, limit: number) => {
      if (limit <= 0) return val;
      if (Math.abs(val) < snapDist) return 0;
      if (Math.abs(val - limit) < snapDist) return limit;
      return val;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!win || !action) return;

      e.preventDefault();
      setActionStatus(true);

      const localPos = manager.globalToLocal(e.clientX, e.clientY);
      const localX = localPos.left;
      const localY = localPos.top;

      const dx = localX - startX;
      const dy = localY - startY;

      const currentMaximized = stateRef.current.isMaximized;

      if (!hasMoved) {
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          hasMoved = true;

          if (currentMaximized && (action === "move" || action === "alt-move")) {
            const { width: cW, height: cH } = manager.getContainerMetrics();

            const preRect = (manager as any).getPreMaximizedRect?.(windowId);
            const restoreW = preRect ? (preRect.width / 100) * cW : Math.min(800, cW * 0.8);
            const restoreH = preRect ? (preRect.height / 100) * cH : Math.min(600, cH * 0.8);

            const currentMouseRatioX = localX / cW;
            clickOffsetX = currentMouseRatioX * restoreW;
            clickOffsetY = localY - 0;

            let restoredLeft = localX - clickOffsetX;
            let restoredTop = localY - 20;

            restoredLeft = Math.max(0, Math.min(restoredLeft, cW - restoreW));
            restoredTop = Math.max(0, Math.min(restoredTop, cH - restoreH));

            startX = localX;
            startY = localY;
            startLeft = restoredLeft;
            startTop = restoredTop;
            startWidth = restoreW;
            startHeight = restoreH;

            const pctRect = {
              left: (restoredLeft / cW) * 100,
              top: (restoredTop / cH) * 100,
              width: (restoreW / cW) * 100,
              height: (restoreH / cH) * 100,
            };

            latestRect = pctRect;

            if ((manager as any).restoreWindow) {
              (manager as any).restoreWindow(windowId, pctRect);
            }

            win.style.width = `${pctRect.width}%`;
            win.style.height = `${pctRect.height}%`;
            win.style.left = `${pctRect.left}%`;
            win.style.top = `${pctRect.top}%`;
          }

          if (action === "move" || action === "alt-move") {
            isDragging = true;
            manager.notifyMoveStart(windowId, latestRect as any);
          } else {
            isResizing = true;
            manager.notifyResizeStart(windowId, latestRect as any);
          }
        } else {
          return;
        }
      }

      const { width: cw, height: ch } = manager.getContainerMetrics();

      if (action === "move" || action === "alt-move") {
        let newLeft = localX - clickOffsetX;
        let newTop = localY - clickOffsetY;
        const currentW = win.offsetWidth;
        const currentH = win.offsetHeight;

        const snapDelta = manager.getSnapDelta(
          windowId,
          { left: newLeft, top: newTop, width: currentW, height: currentH },
          action
        );

        newLeft += snapDelta.x;
        newTop += snapDelta.y;

        const limitW = cw - currentW;
        const limitH = ch - currentH;

        if (snapDelta.x === 0) {
          newLeft = getSnapped(newLeft, limitW);
        }
        if (snapDelta.y === 0) {
          newTop = getSnapped(newTop, limitH);
        }

        if (newTop < 0) newTop = 0;

        const pctLeft = (newLeft / cw) * 100;
        const pctTop = (newTop / ch) * 100;

        win.style.left = `${pctLeft}%`;
        win.style.top = `${pctTop}%`;

        latestRect = {
          left: pctLeft,
          top: pctTop,
          width: (currentW / cw) * 100,
          height: (currentH / ch) * 100,
        };

        const EDGE = 20;
        let newSnapPosition: SnapPosition | null = null;
        if (localY <= EDGE && localX <= EDGE) newSnapPosition = "top-left";
        else if (localY >= ch - EDGE && localX <= EDGE) newSnapPosition = "bottom-left";
        else if (localY <= EDGE && localX >= cw - EDGE) newSnapPosition = "top-right";
        else if (localY >= ch - EDGE && localX >= cw - EDGE) newSnapPosition = "bottom-right";
        else if (localY <= EDGE) newSnapPosition = "top";
        else if (localX <= EDGE) newSnapPosition = "left";
        else if (localX >= cw - EDGE) newSnapPosition = "right";

        if (newSnapPosition !== currentSnapPosition) {
          currentSnapPosition = newSnapPosition;
          if ((manager as any).notifySnapPreview) {
            (manager as any).notifySnapPreview(windowId, currentSnapPosition);
          }
        }

        if (isDragging) {
          manager.notifyMove(windowId, latestRect as any);
        }
        return;
      }

      if (currentMaximized) return;

      if (action === "c") {
        const rawW = startWidth + dx * 2;
        const rawH = startHeight + dy * 2;
        const newW = Math.max(minW, Math.abs(rawW));
        const newH = Math.max(minH, Math.abs(rawH));
        const centerX = startLeft + startWidth / 2;
        const centerY = startTop + startHeight / 2;

        const finalLeft = centerX - newW / 2;
        const finalTop = centerY - newH / 2;

        const pctWidth = (newW / cw) * 100;
        const pctHeight = (newH / ch) * 100;
        const pctLeft = (finalLeft / cw) * 100;
        const pctTop = (finalTop / ch) * 100;

        win.style.width = `${pctWidth}%`;
        win.style.height = `${pctHeight}%`;
        win.style.left = `${pctLeft}%`;
        win.style.top = `${pctTop}%`;

        latestRect = { left: pctLeft, top: pctTop, width: pctWidth, height: pctHeight };

        if (isResizing) {
          manager.notifyResize(windowId, latestRect as any);
        }
        return;
      }

      let rawLeft = startLeft;
      let rawTop = startTop;
      let rawWidth = startWidth;
      let rawHeight = startHeight;

      if (action.includes("e")) rawWidth = startWidth + dx;
      if (action.includes("s")) rawHeight = startHeight + dy;
      if (action.includes("w")) {
        rawWidth = startWidth - dx;
        rawLeft = startLeft + dx;
      }
      if (action.includes("n")) {
        rawHeight = startHeight - dy;
        rawTop = startTop + dy;
      }

      const snapDelta = manager.getSnapDelta(
        windowId,
        { left: rawLeft, top: rawTop, width: rawWidth, height: rawHeight },
        action
      );

      if (action.includes("e")) rawWidth += snapDelta.x;
      if (action.includes("s")) rawHeight += snapDelta.y;
      if (action.includes("w")) {
        rawLeft += snapDelta.x;
        rawWidth -= snapDelta.x;
      }
      if (action.includes("n")) {
        rawTop += snapDelta.y;
        rawHeight -= snapDelta.y;
      }

      if (action.includes("w")) {
        if (Math.abs(rawLeft) < snapDist) {
          const offset = rawLeft;
          rawLeft = 0;
          rawWidth += offset;
        }
      }

      if (action.includes("n")) {
        if (Math.abs(rawTop) < snapDist) {
          const offset = rawTop;
          rawTop = 0;
          rawHeight += offset;
        }
      }

      if (action.includes("e")) {
        const currentRight = rawLeft + rawWidth;
        if (Math.abs(currentRight - cw) < snapDist) {
          rawWidth = cw - rawLeft;
        }
      }

      if (action.includes("s")) {
        const currentBottom = rawTop + rawHeight;
        if (Math.abs(currentBottom - ch) < snapDist) {
          rawHeight = ch - rawTop;
        }
      }

      const effectiveW = Math.max(rawWidth, minW);
      const effectiveH = Math.max(rawHeight, minH);

      let finalLeft = rawLeft;
      let finalTop = rawTop;

      if (action.includes("w")) {
        finalLeft = (startLeft + startWidth) - effectiveW;
      }

      if (action.includes("n")) {
        finalTop = (startTop + startHeight) - effectiveH;
      }

      const pctWidth = (effectiveW / cw) * 100;
      const pctHeight = (effectiveH / ch) * 100;
      const pctLeft = (finalLeft / cw) * 100;
      const pctTop = (finalTop / ch) * 100;

      win.style.width = `${pctWidth}%`;
      win.style.height = `${pctHeight}%`;

      if (action.includes("w") || action.includes("move")) {
        win.style.left = `${pctLeft}%`;
      } else {
        win.style.left = `${pctLeft}%`;
      }

      if (action.includes("n")) {
        win.style.top = `${pctTop}%`;
      } else {
        win.style.top = `${pctTop}%`;
      }

      latestRect = { left: pctLeft, top: pctTop, width: pctWidth, height: pctHeight };

      if (isResizing) {
        manager.notifyResize(windowId);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDragging) {
        manager.notifyMoveEnd(windowId);
        isDragging = false;

        if (currentSnapPosition) {
          if ((manager as any).snapWindow) {
            (manager as any).snapWindow(windowId, currentSnapPosition);
          }
          if ((manager as any).notifySnapEnd) {
            (manager as any).notifySnapEnd(windowId, currentSnapPosition);
          }
          if ((manager as any).notifySnapPreview) {
            (manager as any).notifySnapPreview(windowId, null);
          }
          currentSnapPosition = null;
        }
      }

      if (isResizing) {
        manager.notifyResizeEnd(windowId);
        isResizing = false;
      }

      action = null;
      hasMoved = false;
      setActionStatus(false);

      if (capturedElement) {
        try {
          capturedElement.releasePointerCapture(e.pointerId);
        } catch (err) { }
        capturedElement = null;
      }

      win.removeEventListener("pointermove", onPointerMove);
      win.removeEventListener("pointerup", onPointerUp);
    };

    const onPointerDown = (e: PointerEvent) => {
      manager.bringToFront(windowId);

      if (stateRef.current.isMinimized) return;

      const target = e.target as HTMLElement;

      const isResizeHandle = target.dataset.resizeType !== undefined;
      const isTitleBar = target === handle || handle?.contains(target);
      const isAltKeyAction = e.altKey;

      if (!isResizeHandle && !isTitleBar && !isAltKeyAction) {
        return;
      }

      const currentMaximized = stateRef.current.isMaximized;
      const currentCanResize = stateRef.current.canResize;

      if (currentMaximized && isResizeHandle) return;

      e.preventDefault();
      e.stopPropagation();

      const dir = target.dataset.resizeDir;
      const resizeType = target.dataset.resizeType;

      if (e.button !== 0 && e.button !== 2) return;

      startLeft = win.offsetLeft;
      startTop = win.offsetTop;
      startWidth = win.offsetWidth;
      startHeight = win.offsetHeight;

      const { width: cw, height: ch } = manager.getContainerMetrics();
      latestRect = {
        left: (startLeft / cw) * 100,
        top: (startTop / ch) * 100,
        width: (startWidth / cw) * 100,
        height: (startHeight / ch) * 100
      };

      const localPos = manager.globalToLocal(e.clientX, e.clientY);
      startX = localPos.left;
      startY = localPos.top;

      const calcDragOffset = () => {
        clickOffsetX = startX - startLeft;
        clickOffsetY = startY - startTop;
      };

      if (resizeType === "alt" && dir && e.altKey) {
        if (e.button === 2) {
          e.preventDefault();
          e.stopPropagation();
          action = dir;
        } else if (e.button === 0) {
          action = "move";
          if (!currentMaximized) calcDragOffset();
        }
      } else if (resizeType === "standard" && dir) {
        if ((e.button === 0 || e.pointerType === "touch") && currentCanResize && !currentMaximized) {
          e.stopPropagation();
          action = dir;
        }
      } else if (e.altKey && e.button === 0) {
        action = "alt-move";
        e.preventDefault();
        if (!currentMaximized) calcDragOffset();
      } else if (target === handle || handle.contains(target)) {
        if (e.button === 0 || e.pointerType === "touch") {
          action = "move";
          if (!currentMaximized) calcDragOffset();
        }
      }

      if (action) {
        hasMoved = false;
        target.setPointerCapture(e.pointerId);
        capturedElement = target;
        win.addEventListener("pointermove", onPointerMove);
        win.addEventListener("pointerup", onPointerUp);
      }
    };

    win.addEventListener("pointerdown", onPointerDown);
    return () => {
      win.removeEventListener("pointerdown", onPointerDown);
      win.removeEventListener("pointermove", onPointerMove);
      win.removeEventListener("pointerup", onPointerUp);
    };

  }, [windowId, manager]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setAltIsPress(e.altKey);
    const handleKeyUp = (e: KeyboardEvent) => setAltIsPress(e.altKey);
    const altCancel = () => setAltIsPress(false);

    document.addEventListener("blur", altCancel);
    document.addEventListener("focus", altCancel);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("blur", altCancel);
      document.removeEventListener("focus", altCancel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <div
      ref={winRef}
      className={[
        style["window"],
        isMounted ? style["active"] : "",
        focused ? "" : style["blurred"],
        actionStatus ? style["action"] : "",
        isMaximized ? style["full"] : "",
        isClosing ? style["close"] : "",
        isMinimized ? style["minimize"] : "",
        nonTransparens ? style["nonTransparens"] : "",
      ].join(" ")}
      style={{ zIndex, touchAction: "none" }}
    >
      <div className={style["title"]}>
        <span className={style["text"]}>{title}</span>
        <span className={style["btns"]}>
          <div className={style["DropArea"]} ref={handleRef} onDoubleClick={handleMaximize}></div>
          {canMinimize && (
            <div className={style["min"]} onClick={handleMinimize}>
              <div className={style["icon"]}>
                <svg width="22" height="3" viewBox="0 0 22 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0L20 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                </svg>
              </div>
              <div className={style["bg"]} />
            </div>
          )}
          {canMaximize && (
            <div className={style["res"]} onClick={handleMaximize}>
              <div className={style["icon"]}>
                {isMaximized ? (
                  <svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0L10 4L20 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                  </svg>
                ) : (
                  <svg width="22" height="6" viewBox="0 0 22 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 4L10 0L20 4" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(1 1)" />
                  </svg>
                )}
              </div>
              <div className={style["bg"]} />
            </div>
          )}
          <div className={style["cls"]} onClick={handleClose}>
            <div className={style["icon"]}>
              <svg width="28.28" height="28.28" viewBox="0 0 28.28 28.28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  <path d="M0 0L14.1421 14.1421" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                  <path d="M0 14.1421L14.1421 0" fill="none" strokeWidth="2" strokeLinecap="round" transform="translate(7 7)" />
                </g>
              </svg>
            </div>
            <div className={style["bg"]} />
          </div>
        </span>
      </div>

      <div className={`${style["content"]} ${actionStatus ? style["action"] : ""} `}>{children}</div>

      {!isMinimized && !isMaximized && (
        <>
          <div className={style["altHandle"]} style={{ display: altIsPress ? "" : "none" }}>
            {["c", "n", "s", "e", "w", "ne", "nw", "se", "sw"].map((d) => (
              <div
                key={d}
                data-resize-dir={d}
                data-resize-type="alt"
                className={`${style["handle"]} ${style[d]}`}
                style={{ gridArea: d }}
              />
            ))}
          </div>

          {canResize && ["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((d) => (
            <div
              key={d}
              data-resize-dir={d}
              data-resize-type="standard"
              className={`${style["handle"]} ${style[d]}`}
            />
          ))}
        </>
      )}
    </div>
  );
}