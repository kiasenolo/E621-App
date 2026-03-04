import React from "react";
import { createRoot, Root } from "react-dom/client";
import Window, { WindowProps, WindowRect } from "./Window";
import functions from "@/data/module/functions";
export type SnapPosition = "top" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WindowManagerEventMap<T> = {
  "create": { id: string; customData?: T };
  "close": { id: string };
  "focus": { id: string };
  "moveStart": { id: string; rect?: WindowRect };
  "move": { id: string; rect?: WindowRect };
  "moveEnd": { id: string; rect?: WindowRect };
  "resizeStart": { id: string; rect?: WindowRect };
  "resize": { id: string; rect?: WindowRect };
  "resizeEnd": { id: string; rect?: WindowRect };
  "idupdate": { originalID: string; newID: string };
  "snapPreview": { id: string; snapPosition: SnapPosition | null };
  "snapEnd": { id: string; snapPosition: SnapPosition };
};

export type WindowSnapshot<T = undefined> = {
  id: string;
  title: string;
  rect: WindowRect;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isTop: boolean;
  isFocused: boolean;
  customData?: T;
};

export type WindowInstance<T = undefined> = WindowSnapshot<T> & {
  addEventListener: <K extends keyof WindowManagerEventMap<T>>(
    event: K,
    listener: (data: WindowManagerEventMap<T>[K]) => void
  ) => () => void;

  update: (options: UpdateWindowOptions<T>) => void;
  setTitle: (title: string) => void;
  setData: (data: T) => void;
  setRect: (rect: Partial<WindowRect>, type?: "%" | "px") => void;
  focus: () => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  snapWindow: (position: SnapPosition) => void;

  convertGlobalToLocal: (clientX: number, clientY: number) => { left: number, top: number };
  getContainerMetrics: () => { width: number, height: number };
};

export type UpdateWindowOptions<T> = {
  title?: string;
  children?: React.ReactNode;
  rect?: Partial<WindowRect>;
  customData?: T;
  type?: "%" | "px";
};

type WindowState<T> = {
  id: string;
  title: string;
  zIndex: number;
  focused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  preMaximizedRect?: WindowRect;
  root: Root;
  element: HTMLDivElement;
  isClosing?: boolean;
  customData?: T;
  currentProps: Omit<WindowProps, "manager" | "onClose">;
};

export type CreateWindowOptions<T> = {
  id: string;
  title?: string;
  children?: React.ReactNode;
  rect?: WindowRect;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  customData?: T;
  actions?: {
    canMinimize?: boolean
    canMaximize?: boolean
    canResize?: boolean
  }
  events?: {
    onClose?: () => void
  }
};

export class WindowManager<T = undefined> {
  private container: HTMLElement;
  private windows: WindowState<T>[] = [];
  private highestZIndex = 10;
  private subscribers: Set<(windows: WindowState<T>[]) => void> = new Set();
  private focusHistory: string[] = [];
  private eventListeners: { [K in keyof WindowManagerEventMap<T>]?: Set<(data: WindowManagerEventMap<T>[K]) => void> } = {};

  private readonly CLOSE_ANIMATION_DURATION = 200;
  private readonly DEFAULT_WIDTH = 800;
  private readonly DEFAULT_HEIGHT = 600;
  private readonly SNAP_THRESHOLD = 15;

  constructor(containerElement: HTMLElement) {
    if (!containerElement) {
      throw new Error("WindowManager requires a valid container element.");
    }
    this.container = containerElement;

    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
    }
  }

  public getContainerBounds = (): DOMRect => {
    return this.container.getBoundingClientRect();
  }

  public globalToLocal = (clientX: number, clientY: number) => {
    const bounds = this.getContainerBounds();

    return {
      left: clientX - bounds.left,
      top: clientY - bounds.top
    };
  }

  public pixelsToPercentRect = (rect: { left: number, top: number, width: number, height: number }): WindowRect => {
    const { width: cW, height: cH } = this.getContainerMetrics();
    return {
      left: (rect.left / cW) * 100,
      top: (rect.top / cH) * 100,
      width: (rect.width / cW) * 100,
      height: (rect.height / cH) * 100
    };
  }

  public clampRect = (rect: Partial<WindowRect>): Partial<WindowRect> => {
    const newRect = { ...rect };

    if (newRect.left !== undefined) {
      newRect.left = Math.max(0, Math.min(newRect.left, 100 - (newRect.width || 0)));
    }
    if (newRect.top !== undefined) {
      newRect.top = Math.max(0, Math.min(newRect.top, 100 - (newRect.height || 0)));
    }

    return newRect;
  }

  public addEventListener = <K extends keyof WindowManagerEventMap<T>>(
    event: K,
    listener: (data: WindowManagerEventMap<T>[K]) => void
  ) => {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = new Set() as any;
    }
    (this.eventListeners[event] as any).add(listener);
  };

  public removeEventListener = <K extends keyof WindowManagerEventMap<T>>(
    event: K,
    listener: (data: WindowManagerEventMap<T>[K]) => void
  ) => {
    if (this.eventListeners[event]) {
      (this.eventListeners[event] as any).delete(listener);
    }
  };

  private emit = <K extends keyof WindowManagerEventMap<T>>(event: K, data: WindowManagerEventMap<T>[K]) => {
    this.eventListeners[event]?.forEach((listener) => listener(data));
  };

  public getContainerMetrics = () => {
    const rect = this.container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  };

  public notifySnapPreview = (id: string, snapPosition: SnapPosition | null) => {
    this.emit("snapPreview", { id, snapPosition });
  };

  public notifySnapEnd = (id: string, snapPosition: SnapPosition) => {
    this.emit("snapEnd", { id, snapPosition });
  };

  public snapWindow = (id: string, position: SnapPosition) => {
    const win = this.windows.find(w => w.id === id);
    if (!win) return;

    if (!win.preMaximizedRect) {
      win.preMaximizedRect = { ...win.currentProps.rect };
    }

    if (position === "top") {
      this.maximizeWindow(id);
      return;
    }

    win.isMaximized = false;
    let rect: WindowRect;

    switch (position) {
      case "left":
        rect = { left: 0, top: 0, width: 50, height: 100 }; break;
      case "right":
        rect = { left: 50, top: 0, width: 50, height: 100 }; break;
      case "top-left":
        rect = { left: 0, top: 0, width: 50, height: 50 }; break;
      case "bottom-left":
        rect = { left: 0, top: 50, width: 50, height: 50 }; break;
      case "top-right":
        rect = { left: 50, top: 0, width: 50, height: 50 }; break;
      case "bottom-right":
        rect = { left: 50, top: 50, width: 50, height: 50 }; break;
      default: return;
    }
    this.updateWindow(id, { rect });
  };

  public notifyMoveStart = (id: string, rect?: WindowRect) => {
    this.emit("moveStart", { id, rect });
  };

  public notifyMove = (id: string, rect?: WindowRect) => {
    this.emit("move", { id, rect });
  };

  public notifyMoveEnd = (id: string) => {
    this.syncWindowRect(id);
    const win = this.windows.find((w) => w.id === id);
    if (win && !win.isMinimized && !win.isClosing) {
      this.updateWindow(id, { rect: win.currentProps.rect });
    }
    this.emit("moveEnd", { id, rect: win?.currentProps.rect });
  };

  public notifyResizeStart = (id: string, rect?: WindowRect) => {
    this.emit("resizeStart", { id, rect });
  };

  public notifyResize = (id: string, rect?: WindowRect) => {
    this.emit("resize", { id, rect });
  };

  public notifyResizeEnd = (id: string) => {
    this.syncWindowRect(id);
    const win = this.windows.find((w) => w.id === id);
    if (win && !win.isMinimized && !win.isClosing) {
      this.updateWindow(id, { rect: win.currentProps.rect });
    }
    this.emit("resizeEnd", { id, rect: win?.currentProps.rect });
  };

  public subscribe = (callback: (windows: WindowState<T>[]) => void): (() => void) => {
    this.subscribers.add(callback);
    callback(this.windows);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  private notify = () => {
    this.subscribers.forEach((callback) => callback(this.windows));
  };

  private syncWindowRect = (id: string) => {
    const win = this.windows.find((w) => w.id === id);
    if (win && !win.isMinimized && !win.isClosing) {
      win.currentProps.rect = this.getCurrentRect(win);
    }
  }

  public hasWindowID = (id: string): boolean => {
    return this.windows.some((w) => w.id === id);
  };

  public getWindows = (): { id: string; title: string; customData?: T }[] => {
    return this.windows.map((w) => ({
      id: w.id,
      title: w.title,
      customData: w.customData,
    }));
  };

  private pxToPct = (val: number, containerSize: number): number => {
    if (containerSize === 0) return 0;
    return (val / containerSize) * 100;
  }

  public getPreMaximizedRect = (id: string): WindowRect | undefined => {
    const win = this.windows.find(w => w.id === id);
    return win?.preMaximizedRect;
  }

  public getWindow = (id: string): WindowInstance<T> | undefined => {
    const win = this.windows.find((w) => w.id === id);
    if (!win) return undefined;

    return {
      id: win.id,
      title: win.title,
      rect: win.currentProps.rect,
      zIndex: win.zIndex,
      isMinimized: win.isMinimized,
      isMaximized: win.isMaximized,
      isTop: win.focused,
      isFocused: win.focused,
      customData: win.customData,
      addEventListener: <K extends keyof WindowManagerEventMap<T>>(
        event: K,
        listener: (data: WindowManagerEventMap<T>[K]) => void
      ) => {
        const filteredListener = (data: WindowManagerEventMap<T>[K]) => {
          const payload = data as any;

          if (payload.id === id) {
            listener(data);
            return;
          }

          if (payload.originalID === id) {
            listener(data);
            return;
          }
        };

        this.addEventListener(event, filteredListener);
        return () => this.removeEventListener(event, filteredListener);
      },
      update: (options) => this.updateWindow(id, options),
      setTitle: (title) => this.updateWindow(id, { title }),
      setData: (data) => this.updateWindow(id, { customData: data }),
      setRect: (rect, type = "%") => this.updateWindow(id, { rect: { ...rect, top: rect.top !== undefined ? functions.clamp(rect.top, 0, Infinity) : undefined }, type }),
      focus: () => this.bringToFront(id),
      minimize: () => this.minimizeWindow(id),
      toggleMaximize: () => this.toggleMaximize(id),
      close: () => this.closeWindow(id),
      snapWindow: (position) => this.snapWindow(id, position),
      convertGlobalToLocal: this.globalToLocal,
      getContainerMetrics: this.getContainerMetrics,
    };
  };

  public captureSnapshot = (): WindowSnapshot<T>[] => {
    return this.windows.map((w) => {
      const currentRect = this.getCurrentRect(w);

      return {
        id: w.id,
        title: w.title,
        rect: currentRect,
        zIndex: w.zIndex,
        isMinimized: w.isMinimized,
        isMaximized: w.isMaximized,
        isTop: w.focused,
        isFocused: w.focused,
        customData: w.customData,
      };
    });
  };

  private getCurrentRect = (win: WindowState<T>): WindowRect => {
    const node = win.element.firstElementChild as HTMLElement;
    const isMaximized = node ? (node.className.includes("full") || node.className.includes("maximize")) : false;

    if (!node || win.isMinimized || isMaximized || !node.style.width) {
      return win.currentProps.rect;
    }

    const { width: containerW, height: containerH } = this.getContainerMetrics();

    return {
      left: this.pxToPct(node.offsetLeft, containerW),
      top: this.pxToPct(node.offsetTop, containerH),
      width: this.pxToPct(node.offsetWidth, containerW),
      height: this.pxToPct(node.offsetHeight, containerH)
    };
  };

  public updateWindow = (id: string, updates: UpdateWindowOptions<T>): void => {
    const win = this.windows.find((w) => w.id === id);
    if (!win) return;

    if (updates.title !== undefined) win.title = updates.title;
    if (updates.customData !== undefined) win.customData = updates.customData;

    let updateRect = updates.rect;
    if (updates.type === "px" && updateRect) {
      const { width: cW, height: cH } = this.getContainerMetrics();
      const convertedRect: Partial<WindowRect> = {};

      if (updateRect.left !== undefined) convertedRect.left = this.pxToPct(updateRect.left, cW);
      if (updateRect.top !== undefined) convertedRect.top = this.pxToPct(updateRect.top, cH);
      if (updateRect.width !== undefined) convertedRect.width = this.pxToPct(updateRect.width, cW);
      if (updateRect.height !== undefined) convertedRect.height = this.pxToPct(updateRect.height, cH);

      updateRect = convertedRect;
    }

    const currentRect = win.currentProps.rect;

    let newRect: WindowRect = {
      left: updateRect?.left ?? currentRect.left,
      top: updateRect?.top ?? currentRect.top,
      width: updateRect?.width ?? currentRect.width,
      height: updateRect?.height ?? currentRect.height,
    };

    const newProps: WindowProps = {
      ...win.currentProps,
      rect: newRect,
      title: win.title,
      manager: this,
      onClose: (winId) => { this.closeWindow?.(winId); },
    };

    if (updates.children) {
      newProps.children = updates.children;
    }

    win.currentProps = newProps;
    win.root.render(React.createElement(Window, newProps));

    this.notify();
  };

  public updateWindowID = (currentID: string, newID: string): boolean => {
    if (currentID === newID) return true;
    if (this.hasWindowID(newID)) {
      console.warn(`WindowManager: Cannot update ID. Target ID "${newID}" already exists.`);
      return false;
    }

    const win = this.windows.find((w) => w.id === currentID);
    if (!win) {
      console.warn(`WindowManager: Cannot update ID. Window "${currentID}" not found.`);
      return false;
    }

    win.id = newID;

    if (win.element) {
      win.element.id = newID;
    }

    const newProps = {
      ...win.currentProps,
      manager: this,
      windowId: newID,
      onClose: (winId: string) => this.closeWindow(winId),
    };

    win.currentProps = {
      ...win.currentProps,
      windowId: newID
    };;
    win.root.render(React.createElement(Window, newProps));

    const historyIndex = this.focusHistory.indexOf(currentID);
    if (historyIndex !== -1) {
      this.focusHistory[historyIndex] = newID;
    }

    this.emit("idupdate", { originalID: currentID, newID: newID });

    this.notify();

    return true;
  };

  private focusNextActiveWindow = (excludeId: string) => {
    for (let i = this.focusHistory.length - 1; i >= 0; i--) {
      const candidateId = this.focusHistory[i];
      if (candidateId === excludeId) continue;
      const candidateWin = this.windows.find((w) => w.id === candidateId);
      if (candidateWin && !candidateWin.isMinimized && !candidateWin.isClosing) {
        this.bringToFront(candidateId);
        return;
      }
    }
  };

  public applySnapshot = (
    snapshot: WindowSnapshot<T>[],
    contentFactory: (id: string, customData?: T) => React.ReactNode
  ): void => {
    const snapshotIds = new Set(snapshot.map(s => s.id));
    [...this.windows].forEach(w => {
      if (!snapshotIds.has(w.id)) {
        this.closeWindow(w.id);
      }
    });

    this.focusHistory = [];
    let maxZ = 10;

    snapshot.forEach(snap => {
      let win = this.windows.find(w => w.id === snap.id);

      if (win) {
        this.updateWindow(snap.id, {
          title: snap.title,
          rect: snap.rect,
          customData: snap.customData,
        });
      } else {
        this.createWindow({
          id: snap.id,
          title: snap.title,
          rect: snap.rect,
          customData: snap.customData,
          children: contentFactory(snap.id, snap.customData),
        }, true);

        win = this.windows.find(w => w.id === snap.id);
      }

      if (win) {
        win.isMinimized = snap.isMinimized;
        win.zIndex = snap.zIndex;
        win.isMaximized = snap.isMaximized;

        if (snap.isMinimized) {
          win.focused = false;
        } else {
          win.focused = snap.isFocused;
        }

        if (win.zIndex > maxZ) maxZ = win.zIndex;

        this.focusHistory.push(win.id);
      }
    });

    this.highestZIndex = maxZ;

    this.focusHistory.sort((idA, idB) => {
      const wA = this.windows.find(w => w.id === idA);
      const wB = this.windows.find(w => w.id === idB);
      return (wA?.zIndex || 0) - (wB?.zIndex || 0);
    });

    this.notify();
  };

  public toggleMaximize = (id: string) => {
    const win = this.windows.find(w => w.id === id);
    if (!win || win.isClosing || win.isMinimized) return;

    if (win.isMaximized) {
      this.restoreWindow(id);
    } else {
      this.maximizeWindow(id);
    }
  }

  public maximizeWindow = (id: string) => {
    const win = this.windows.find(w => w.id === id);
    if (!win) return;

    win.preMaximizedRect = { ...win.currentProps.rect };

    win.isMaximized = true;

    this.updateWindow(id, {
      rect: { left: 0, top: 0, width: 100, height: 100 }
    });
  }

  public restoreWindow = (id: string, targetRect?: WindowRect) => {
    const win = this.windows.find(w => w.id === id);
    if (!win) return;

    const restoreTo = targetRect || win.preMaximizedRect || { left: 10, top: 10, width: 50, height: 50 };

    win.isMaximized = false;
    win.preMaximizedRect = undefined;

    this.updateWindow(id, { rect: restoreTo });
  }

  public minimizeWindow = (id: string): void => {
    const win = this.windows.find((w) => w.id === id);
    if (win && !win.isClosing) {
      if (!win.isMinimized) {
        const currentRect = this.getCurrentRect(win);
        win.currentProps.rect = currentRect;
      }
      const wasFocused = win.focused;
      win.isMinimized = true;
      win.focused = false;
      this.notify();
      if (wasFocused) {
        setTimeout(() => {
          this.focusNextActiveWindow(id);
        }, this.CLOSE_ANIMATION_DURATION);
      }
    }
  };

  public closeWindow = (id: string): void => {
    const windowToClose = this.windows.find((w) => w.id === id);
    if (!windowToClose || windowToClose.isClosing) return;

    windowToClose.isClosing = true;
    this.notify();

    setTimeout(() => {
      this._finalizeDestroy(id);
    }, this.CLOSE_ANIMATION_DURATION);
  };

  private getSmartPositionPixels = (widthPx: number, heightPx: number): { left: number, top: number } => {
    const { width: containerW, height: containerH } = this.getContainerMetrics();

    let left = Math.max(0, (containerW - widthPx) / 2);
    let top = Math.max(0, (containerH - heightPx) / 2);

    const existingRects = this.windows
      .filter(w => !w.isMinimized && !w.isClosing)
      .map(w => {
        const winNode = w.element.firstElementChild as HTMLElement;
        if (winNode) {
          return { left: winNode.offsetLeft, top: winNode.offsetTop };
        }
        return null;
      })
      .filter((r): r is { left: number; top: number } => r !== null);

    const OFFSET = 40;
    const RESET_POS = 60;
    const CONFLICT_THRESHOLD = 20;

    let hasConflict = true;
    let loopCount = 0;
    const MAX_LOOPS = 50;

    while (hasConflict && loopCount < MAX_LOOPS) {
      loopCount++;
      hasConflict = false;
      for (const rect of existingRects) {
        if (
          Math.abs(rect.left - left) < CONFLICT_THRESHOLD &&
          Math.abs(rect.top - top) < CONFLICT_THRESHOLD
        ) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) {
        left += OFFSET;
        top += OFFSET;

        if (top + heightPx > containerH || left + widthPx > containerW) {
          left = RESET_POS;
          top = RESET_POS;
        }
      }
    }

    return { left, top };
  };

  public createWindow = (options: CreateWindowOptions<T>, suppressFocus = false): string => {
    const { id, title = "Window", children, actions, events, customData } = options;

    if (this.hasWindowID(id)) {
      const existingWin = this.windows.find(w => w.id === id);
      if (existingWin) {
        if (existingWin.isMinimized) {
          existingWin.isMinimized = false;
        }
        this.bringToFront(id);
      }
      return id;
    }

    const windowElement = document.createElement("div");
    windowElement.id = id;
    this.container.appendChild(windowElement);

    const root = createRoot(windowElement);

    let finalWindowRect: WindowRect;

    if (options.rect) {
      finalWindowRect = { ...options.rect };
    }
    else {
      const { width: containerW, height: containerH } = this.getContainerMetrics();


      const targetW = options.width ?? this.DEFAULT_WIDTH;
      const targetH = options.height ?? this.DEFAULT_HEIGHT;
      const finalPixelW = Math.min(targetW, containerW);
      const finalPixelH = Math.min(targetH, containerH);

      let finalPixelLeft: number;
      let finalPixelTop: number;

      if (options.left !== undefined && options.top !== undefined) {
        finalPixelLeft = options.left;
        finalPixelTop = options.top;
      } else {
        const smartPos = this.getSmartPositionPixels(finalPixelW, finalPixelH);
        finalPixelLeft = smartPos.left;
        finalPixelTop = smartPos.top;
      }

      if (finalPixelLeft + finalPixelW > containerW) {
        finalPixelLeft = Math.max(0, containerW - finalPixelW);
      }
      if (finalPixelTop + finalPixelH > containerH) {
        finalPixelTop = Math.max(0, containerH - finalPixelH);
      }

      finalWindowRect = {
        width: this.pxToPct(finalPixelW, containerW),
        height: this.pxToPct(finalPixelH, containerH),
        left: this.pxToPct(finalPixelLeft, containerW),
        top: this.pxToPct(finalPixelTop, containerH)
      };
    }

    if (finalWindowRect.left + finalWindowRect.width > 100) {
      finalWindowRect.left = Math.max(0, 100 - finalWindowRect.width);
    }
    if (finalWindowRect.top + finalWindowRect.height > 100) {
      finalWindowRect.top = Math.max(0, 100 - finalWindowRect.height);
    }
    if (finalWindowRect.left < 0) finalWindowRect.left = 0;
    if (finalWindowRect.top < 0) finalWindowRect.top = 0;

    const props: WindowProps = {
      windowId: id,
      title,
      children: children,
      manager: this,
      onClose: (id) => { this.closeWindow?.(id); events?.onClose?.() },
      actions,
      rect: finalWindowRect,
    };

    const newWindow: WindowState<T> = {
      id: id,
      title: title,
      zIndex: 0,
      focused: false,
      isMinimized: false,
      isMaximized: false,
      root,
      element: windowElement,
      isClosing: false,
      customData: customData,
      currentProps: props,
    };
    this.windows.push(newWindow);

    root.render(React.createElement(Window, props));
    this.bringToFront(id);

    if (!suppressFocus) {
      this.bringToFront(id);
    } else {
      this.focusHistory.push(id);
    }

    this.emit("create", { id, customData });

    return id;
  };

  public getSnapDelta = (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
    action: string
  ): { x: number; y: number } => {
    let snapX = 0;
    let snapY = 0;
    let minDiffX = this.SNAP_THRESHOLD + 1;
    let minDiffY = this.SNAP_THRESHOLD + 1;

    const { width: cW, height: cH } = this.getContainerMetrics();
    const targets = this.windows
      .filter((w) => w.id !== id && !w.isMinimized && !w.isClosing && w.element)
      .map((w) => {
        const node = w.element.firstElementChild as HTMLElement;
        if (!node) return null;
        return {
          left: node.offsetLeft,
          top: node.offsetTop,
          right: node.offsetLeft + node.offsetWidth,
          bottom: node.offsetTop + node.offsetHeight,
          centerX: node.offsetLeft + node.offsetWidth / 2,
          centerY: node.offsetTop + node.offsetHeight / 2,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const current = {
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    };

    const isMove = action === "move" || action === "alt-move";
    const activeLeft = isMove || action.includes("w");
    const activeRight = isMove || action.includes("e");
    const activeTop = isMove || action.includes("n");
    const activeBottom = isMove || action.includes("s");

    targets.forEach((target) => {
      if (activeLeft) {
        const diff1 = target.right - current.left;
        if (Math.abs(diff1) < Math.abs(minDiffX)) { minDiffX = diff1; snapX = diff1; }

        const diff2 = target.left - current.left;
        if (Math.abs(diff2) < Math.abs(minDiffX)) { minDiffX = diff2; snapX = diff2; }
      }

      if (activeRight) {
        const diff1 = target.left - current.right;
        if (Math.abs(diff1) < Math.abs(minDiffX)) { minDiffX = diff1; snapX = diff1; }

        const diff2 = target.right - current.right;
        if (Math.abs(diff2) < Math.abs(minDiffX)) { minDiffX = diff2; snapX = diff2; }
      }

      if (activeTop) {
        const diff1 = target.bottom - current.top;
        if (Math.abs(diff1) < Math.abs(minDiffY)) { minDiffY = diff1; snapY = diff1; }

        const diff2 = target.top - current.top;
        if (Math.abs(diff2) < Math.abs(minDiffY)) { minDiffY = diff2; snapY = diff2; }
      }

      if (activeBottom) {
        const diff1 = target.top - current.bottom;
        if (Math.abs(diff1) < Math.abs(minDiffY)) { minDiffY = diff1; snapY = diff1; }

        const diff2 = target.bottom - current.bottom;
        if (Math.abs(diff2) < Math.abs(minDiffY)) { minDiffY = diff2; snapY = diff2; }
      }
    });

    if (Math.abs(minDiffX) > this.SNAP_THRESHOLD) snapX = 0;
    if (Math.abs(minDiffY) > this.SNAP_THRESHOLD) snapY = 0;

    return { x: snapX, y: snapY };
  };

  private _finalizeDestroy = (id: string): void => {
    const windowIndex = this.windows.findIndex((w) => w.id === id);
    if (windowIndex === -1) return;
    const windowToDestroy = this.windows[windowIndex];
    windowToDestroy.root.unmount();
    if (this.container.contains(windowToDestroy.element)) {
      this.container.removeChild(windowToDestroy.element);
    }
    this.windows.splice(windowIndex, 1);
    this.focusHistory = this.focusHistory.filter((historyId) => historyId !== id);
    if (this.windows.length > 0) {
      this.focusNextActiveWindow(id);
    } else {
      this.highestZIndex = 10;
    }
    this.notify();
    this.emit("close", { id });
  };

  public bringToFront = (id: string): void => {
    const windowToFocus = this.windows.find((w) => w.id === id);
    if (!windowToFocus || windowToFocus.isClosing) return;

    if (windowToFocus.isMinimized) {
      windowToFocus.isMinimized = false;
    }

    this.focusHistory = this.focusHistory.filter((historyId) => historyId !== id);
    this.focusHistory.push(id);

    let needsUpdate = false;

    if (windowToFocus.zIndex !== this.highestZIndex) {
      this.highestZIndex++;
      windowToFocus.zIndex = this.highestZIndex;
      needsUpdate = true;
    }

    if (!windowToFocus.focused) {
      windowToFocus.focused = true;
      needsUpdate = true;
    }

    this.windows.forEach((w) => {
      if (w.isClosing) {
        w.focused = false;
        return;
      }
      if (w.id === id) {
        w.focused = true;
      } else {
        if (w.focused) {
          w.focused = false;
          needsUpdate = true;
        }
      }
    });

    this.notify();
    this.emit("focus", { id });
  };
}