import React from "react";
import { createRoot, Root } from "react-dom/client";
import Window, { WindowProps, WindowRect } from "./Window";
import functions from "@/data/module/functions";

export type SnapPosition =
  | "top"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type WindowAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center-center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type WindowManagerEventMap<T> = {
  "create": { id: string; customData?: T };
  "close": { id: string };
  "focus": { id: string };
  "blur": { id: string };
  "moveStart": { id: string; rect?: WindowRect };
  "move": { id: string; rect?: WindowRect };
  "moveEnd": { id: string; rect?: WindowRect };
  "resizeStart": { id: string; rect?: WindowRect };
  "resize": { id: string; rect?: WindowRect };
  "resizeEnd": { id: string; rect?: WindowRect };
  "idupdate": { originalID: string; newID: string };
  "snapPreview": { id: string; snapPosition: SnapPosition | null };
  "snapEnd": { id: string; snapPosition: SnapPosition };
  "btn-min": { id: string; preventDefault: () => void };
  "btn-max": { id: string; preventDefault: () => void };
  "btn-close": { id: string; preventDefault: () => void };
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
  setRect: (rect: Partial<WindowRect>, type?: "%" | "px", anchor?: WindowAnchor) => void;
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
  anchor?: WindowAnchor;
};

type WindowState<T> = {
  id: string;
  title: string;
  zIndex: number;
  focused: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isSnapped: boolean;
  preMaximizedRect?: WindowRect;
  root: Root;
  element: HTMLDivElement;
  isClosing?: boolean;
  customData?: T;
  currentProps: Omit<WindowProps, "manager" | "onClose">;
};

export type WMSettings = {
  nonTransparens?: boolean;
};

export const defaultWMSettings: WMSettings = {
  nonTransparens: false
}

export type CreateWindowOptions<T> = {
  id: string;
  title?: string;
  children?: React.ReactNode;
  rect?: WindowRect;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  customData?: T;
  anchor?: WindowAnchor;
  actions?: {
    canMinimize?: boolean
    canMaximize?: boolean
    canResize?: boolean
    canClose?: boolean
  }
  events?: {
    onClose?: () => void
  }
};

export class WindowManager<T = undefined> {
  private container: HTMLElement;
  private windows: WindowState<T>[] = [];
  private windowMap = new Map<string, WindowState<T>>();
  private highestZIndex = 10;
  private _settings: WMSettings = defaultWMSettings;
  private subscribers: Set<(windows: WindowState<T>[]) => void> = new Set();
  private eventListeners: { [K in keyof WindowManagerEventMap<T>]?: Set<(data: WindowManagerEventMap<T>[K]) => void> } = {};
  private focusHistory: string[] = [];
  private _boundsCache: { rect: DOMRect; ts: number } | null = null;

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

  public setting = {
    set: (opts: Partial<WMSettings>) => {
      Object.assign(this._settings, opts);
      this._applySettingsToAll();
    },
    setNonTransparens: (val: boolean) => {
      this._settings.nonTransparens = val;
      this._applySettingsToAll();
    },
    get: (): Readonly<WMSettings> => ({ ...this._settings }),
  };

  private _applySettingsToAll = () => {
    this.windows.forEach((win) => {
      const newProps = {
        ...win.currentProps,
        nonTransparens: this._settings.nonTransparens,
        manager: this,
        onClose: (winId: string) => { this.closeWindow?.(winId); },
      };
      win.currentProps = newProps;
      win.root.render(React.createElement(Window, newProps));
    });
    this.notify();
  };

  public translateFromAnchor = (
    x: number, y: number, width: number, height: number, anchor: WindowAnchor
  ): { left: number; top: number } => {
    let left = x;
    let top = y;

    if (anchor === "top-center" || anchor === "center-center" || anchor === "bottom-center") {
      left -= width / 2;
    } else if (anchor === "top-right" || anchor === "center-right" || anchor === "bottom-right") {
      left -= width;
    }

    if (anchor === "center-left" || anchor === "center-center" || anchor === "center-right") {
      top -= height / 2;
    } else if (anchor === "bottom-left" || anchor === "bottom-center" || anchor === "bottom-right") {
      top -= height;
    }

    return { left, top };
  };

  public getContainerBounds = (): DOMRect => {
    const now = performance.now();
    if (this._boundsCache && now - this._boundsCache.ts < 16) {
      return this._boundsCache.rect;
    }
    const rect = this.container.getBoundingClientRect();
    this._boundsCache = { rect, ts: now };
    return rect;
  }

  public globalToLocal = (clientX: number, clientY: number) => {
    const bounds = this.getContainerBounds();

    let scaleX = this.container.offsetWidth ? bounds.width / this.container.offsetWidth : 1;
    let scaleY = this.container.offsetHeight ? bounds.height / this.container.offsetHeight : 1;

    if (scaleX === 0) scaleX = 1;
    if (scaleY === 0) scaleY = 1;

    return {
      left: (clientX - bounds.left) / scaleX,
      top: (clientY - bounds.top) / scaleY
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

  public notifyBtnEvent = (id: string, type: "min" | "max" | "close"): boolean => {
    let prevented = false;
    const data = {
      id,
      preventDefault: () => { prevented = true; }
    };

    if (type === "min") this.emit("btn-min", data as any);
    if (type === "max") this.emit("btn-max", data as any);
    if (type === "close") this.emit("btn-close", data as any);

    return prevented;
  };

  public getContainerMetrics = () => {
    return {
      width: this.container.offsetWidth || 1,
      height: this.container.offsetHeight || 1
    };
  };

  public notifySnapPreview = (id: string, snapPosition: SnapPosition | null) => {
    this.emit("snapPreview", { id, snapPosition });
  };

  public notifySnapEnd = (id: string, snapPosition: SnapPosition) => {
    this.emit("snapEnd", { id, snapPosition });
  };

  public snapWindow = (id: string, position: SnapPosition) => {
    const win = this.windowMap.get(id);
    if (!win) return;

    if (!win.preMaximizedRect) {
      win.preMaximizedRect = { ...win.currentProps.rect };
    }

    if (position === "top") {
      this.maximizeWindow(id);
      return;
    }

    win.isMaximized = false;
    win.isSnapped = true;
    let rect: WindowRect;

    switch (position) {
      case "left": rect = { left: 0, top: 0, width: 50, height: 100 }; break;
      case "right": rect = { left: 50, top: 0, width: 50, height: 100 }; break;
      case "top-left": rect = { left: 0, top: 0, width: 50, height: 50 }; break;
      case "bottom-left": rect = { left: 0, top: 50, width: 50, height: 50 }; break;
      case "top-right": rect = { left: 50, top: 0, width: 50, height: 50 }; break;
      case "bottom-right": rect = { left: 50, top: 50, width: 50, height: 50 }; break;
      default: return;
    }
    this.updateWindow(id, { rect });
  };

  public notifyMoveStart = (id: string, rect?: WindowRect) => { this.emit("moveStart", { id, rect }); };
  public notifyMove = (id: string, rect?: WindowRect) => {
    if (rect) {
      const win = this.windowMap.get(id);
      if (win) win.currentProps.rect = rect;
    }
    this.emit("move", { id, rect });
  };
  public notifyMoveEnd = (id: string) => {
    this.syncWindowRect(id);
    const win = this.windowMap.get(id);
    if (win && !win.isMinimized && !win.isClosing) {
      this.updateWindow(id, { rect: win.currentProps.rect });
    }
    this.emit("moveEnd", { id, rect: win?.currentProps.rect });
  };

  public notifyResizeStart = (id: string, rect?: WindowRect) => { this.emit("resizeStart", { id, rect }); };
  public notifyResize = (id: string, rect?: WindowRect) => {
    if (rect) {
      const win = this.windowMap.get(id);
      if (win) win.currentProps.rect = rect;
    }
    this.emit("resize", { id, rect });
  };
  public notifyResizeEnd = (id: string) => {
    const win = this.windowMap.get(id);
    if (win) win.isSnapped = false;
    this.syncWindowRect(id);
    if (win && !win.isMinimized && !win.isClosing) {
      this.updateWindow(id, { rect: win.currentProps.rect });
    }
    this.emit("resizeEnd", { id, rect: win?.currentProps.rect });
  };

  public subscribe = (callback: (windows: WindowState<T>[]) => void): (() => void) => {
    this.subscribers.add(callback);
    callback(this.windows);
    return () => { this.subscribers.delete(callback); };
  };

  private notify = () => {
    this.subscribers.forEach((callback) => callback(this.windows));
  };

  private syncWindowRect = (id: string) => {
    const win = this.windowMap.get(id);
    if (win && !win.isMinimized && !win.isClosing) {
      win.currentProps.rect = this.getCurrentRect(win);
    }
  }

  public hasWindowID = (id: string): boolean => {
    return this.windowMap.has(id);
  };

  public getWindows = (): { id: string; title: string; customData?: T }[] => {
    return this.windows.map((w) => ({
      id: w.id, title: w.title, customData: w.customData,
    }));
  };

  private pxToPct = (val: number, containerSize: number): number => {
    if (containerSize === 0) return 0;
    return (val / containerSize) * 100;
  }

  public getPreMaximizedRect = (id: string): WindowRect | undefined => {
    return this.windowMap.get(id)?.preMaximizedRect;
  }

  public getWindow = (id: string): WindowInstance<T> | undefined => {
    const win = this.windowMap.get(id);
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
          if (payload.id === id || payload.originalID === id) {
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
      setRect: (rect, type = "%", anchor = "top-left") => this.updateWindow(id, {
        rect: { ...rect, top: rect.top !== undefined ? functions.clamp(rect.top, 0, Infinity) : undefined },
        type,
        anchor
      }),
      focus: () => this.bringToFront(id),
      minimize: () => this.minimizeWindow(id),
      toggleMaximize: () => this.toggleMaximize(id),
      close: () => this.closeWindow(id),
      snapWindow: (position) => this.snapWindow(id, position),
      convertGlobalToLocal: this.globalToLocal,
      getContainerMetrics: this.getContainerMetrics,
    };
  };

  public _lookupWindow = (id: string): WindowState<T> | undefined => {
    return this.windowMap.get(id);
  };

  public captureSnapshot = (): WindowSnapshot<T>[] => {
    return this.windows.map((w) => {
      return {
        id: w.id, title: w.title, rect: this.getCurrentRect(w),
        zIndex: w.zIndex, isMinimized: w.isMinimized, isMaximized: w.isMaximized,
        isTop: w.focused, isFocused: w.focused, customData: w.customData,
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

    const left = parseFloat(node.style.left) || 0;
    const top = parseFloat(node.style.top) || 0;
    const width = parseFloat(node.style.width) || 0;
    const height = parseFloat(node.style.height) || 0;

    if (node.style.left.endsWith('%')) {
      return { left, top, width, height };
    }

    return {
      left: (left / containerW) * 100,
      top: (top / containerH) * 100,
      width: (width / containerW) * 100,
      height: (height / containerH) * 100,
    };
  };

  public updateWindow = (id: string, updates: UpdateWindowOptions<T>): void => {
    const win = this.windowMap.get(id);

    if (!win) return;

    if (updates.title !== undefined) win.title = updates.title;

    if (updates.customData !== undefined) win.customData = updates.customData;

    let updateRect: Partial<WindowRect> | undefined = updates.rect;

    if (updateRect) {
      const type = updates.type ?? "%";
      const anchor = updates.anchor ?? "top-left";

      if (type === "px") {
        const { width: containerW, height: containerH } = this.getContainerMetrics();
        const convertedRect: Partial<WindowRect> = {};
        if (updateRect.left !== undefined) convertedRect.left = (updateRect.left / containerW) * 100;
        if (updateRect.top !== undefined) convertedRect.top = (updateRect.top / containerH) * 100;
        if (updateRect.width !== undefined) convertedRect.width = (updateRect.width / containerW) * 100;
        if (updateRect.height !== undefined) convertedRect.height = (updateRect.height / containerH) * 100;
        updateRect = convertedRect;
      }
    }

    const currentRect = win.currentProps.rect;

    let newRect: WindowRect = {
      left: updateRect?.left ?? currentRect.left,
      top: updateRect?.top ?? currentRect.top,
      width: updateRect?.width ?? currentRect.width,
      height: updateRect?.height ?? currentRect.height,
    };

    if (updateRect && updates.anchor !== "top-left") {
      const translated = this.translateFromAnchor(
        newRect.left, newRect.top, newRect.width, newRect.height, updates.anchor ?? "top-left"
      );
      if (updateRect.left !== undefined) newRect.left = translated.left;
      if (updateRect.top !== undefined) newRect.top = translated.top;
    }

    const newProps: WindowProps = {
      ...win.currentProps,
      rect: newRect,
      title: win.title,
      manager: this,
      onClose: (winId) => { this.closeWindow?.(winId); },
      nonTransparens: this._settings.nonTransparens,
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
    if (this.windowMap.has(newID)) return false;

    const win = this.windowMap.get(currentID);
    if (!win) return false;

    win.id = newID;
    if (win.element) win.element.id = newID;

    this.windowMap.delete(currentID);
    this.windowMap.set(newID, win);

    const newProps = {
      ...win.currentProps, manager: this, windowId: newID,
      onClose: (winId: string) => this.closeWindow(winId),
    };

    win.currentProps = { ...win.currentProps, windowId: newID };
    win.root.render(React.createElement(Window, newProps));

    const historyIndex = this.focusHistory.indexOf(currentID);
    if (historyIndex !== -1) this.focusHistory[historyIndex] = newID;

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
      if (!snapshotIds.has(w.id)) this.closeWindow(w.id);
    });

    this.focusHistory = [];
    let maxZ = 10;

    snapshot.forEach(snap => {
      let win = this.windows.find(w => w.id === snap.id);
      if (win) {
        this.updateWindow(snap.id, { title: snap.title, rect: snap.rect, customData: snap.customData });
      } else {
        this.createWindow({
          id: snap.id, title: snap.title, rect: snap.rect,
          customData: snap.customData, children: contentFactory(snap.id, snap.customData),
        }, true);
        win = this.windows.find(w => w.id === snap.id);
      }

      if (win) {
        win.isMinimized = snap.isMinimized;
        win.zIndex = snap.zIndex;
        win.isMaximized = snap.isMaximized;
        win.focused = snap.isMinimized ? false : snap.isFocused;
        if (win.zIndex > maxZ) maxZ = win.zIndex;
        this.focusHistory.push(win.id);
      }
    });

    this.highestZIndex = maxZ;
    const zMap = new Map<string, number>(this.windows.map(w => [w.id, w.zIndex]));
    this.focusHistory.sort((idA, idB) => (zMap.get(idA) ?? 0) - (zMap.get(idB) ?? 0));

    this.notify();
  };

  public toggleMaximize = (id: string) => {
    const win = this.windowMap.get(id);
    if (!win || win.isClosing || win.isMinimized) return;
    if (win.isMaximized) this.restoreWindow(id);
    else this.maximizeWindow(id);
  }

  public maximizeWindow = (id: string) => {
    const win = this.windowMap.get(id);
    if (!win) return;
    win.preMaximizedRect = { ...win.currentProps.rect };
    win.isMaximized = true;
    win.isSnapped = false;
    this.updateWindow(id, { rect: { left: 0, top: 0, width: 100, height: 100 } });
  }

  public restoreWindow = (id: string, targetRect?: WindowRect) => {
    const win = this.windowMap.get(id);
    if (!win) return;
    const restoreTo = targetRect || win.preMaximizedRect || { left: 10, top: 10, width: 50, height: 50 };
    win.isMaximized = false;
    win.isSnapped = false;
    win.preMaximizedRect = undefined;
    this.updateWindow(id, { rect: restoreTo });
  }

  public minimizeWindow = (id: string): void => {
    const win = this.windowMap.get(id);
    if (win && !win.isClosing) {
      if (!win.isMinimized) win.currentProps.rect = this.getCurrentRect(win);
      const wasFocused = win.focused;
      win.isMinimized = true;
      win.focused = false;
      this.notify();
      if (wasFocused) {
        this.emit("blur", { id: win.id });
        setTimeout(() => { this.focusNextActiveWindow(id); }, this.CLOSE_ANIMATION_DURATION);
      }
    }
  };

  public closeWindow = (id: string): void => {
    const windowToClose = this.windowMap.get(id);
    if (!windowToClose || windowToClose.isClosing) return;

    if (windowToClose.focused) {
      windowToClose.focused = false;
      this.emit("blur", { id });
    }

    windowToClose.isClosing = true;
    this.notify();

    setTimeout(() => { this._finalizeDestroy(id); }, this.CLOSE_ANIMATION_DURATION);
  };

  public destroyWindow = (id: string): void => {
    this._finalizeDestroy(id);
  };

  private getSmartPositionPixels = (widthPx: number, heightPx: number): { left: number, top: number } => {
    const { width: containerW, height: containerH } = this.getContainerMetrics();
    let left = Math.max(0, (containerW - widthPx) / 2);
    let top = Math.max(0, (containerH - heightPx) / 2);

    const existingRects = this.windows
      .filter(w => !w.isMinimized && !w.isClosing)
      .map(w => {
        const winNode = w.element.firstElementChild as HTMLElement;
        return winNode ? { left: winNode.offsetLeft, top: winNode.offsetTop } : null;
      }).filter((r): r is { left: number; top: number } => r !== null);

    let hasConflict = true;
    let loopCount = 0;

    while (hasConflict && loopCount < 50) {
      loopCount++;
      hasConflict = false;
      for (const rect of existingRects) {
        if (Math.abs(rect.left - left) < 20 && Math.abs(rect.top - top) < 20) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) {
        left += 40; top += 40;
        if (top + heightPx > containerH || left + widthPx > containerW) {
          left = 60; top = 60;
        }
      }
    }
    return { left, top };
  };

  public createWindow = (options: CreateWindowOptions<T>, suppressFocus = false): string => {
    const { id, title = "Window", children, actions, events, customData } = options;
    const anchor = options.anchor || "top-left";

    if (this.hasWindowID(id)) {
      const existingWin = this.windows.find(w => w.id === id);
      if (existingWin) {
        if (existingWin.isMinimized) existingWin.isMinimized = false;
        this.bringToFront(id);
      }
      return id;
    }

    const windowElement = document.createElement("div");
    windowElement.style.transition = "all ease .1s , z-index 0s"
    windowElement.id = id;
    this.container.appendChild(windowElement);

    const root = createRoot(windowElement);

    let finalWindowRect: WindowRect;

    if (options.rect) {
      finalWindowRect = { ...options.rect };

      if (anchor !== "top-left") {
        const translated = this.translateFromAnchor(
          finalWindowRect.left, finalWindowRect.top, finalWindowRect.width, finalWindowRect.height, anchor
        );
        finalWindowRect.left = translated.left;
        finalWindowRect.top = translated.top;
      }
    } else {
      const { width: containerW, height: containerH } = this.getContainerMetrics();

      const targetW = options.width ?? this.DEFAULT_WIDTH;
      const targetH = options.height ?? this.DEFAULT_HEIGHT;
      const finalPixelW = Math.min(targetW, containerW);
      const finalPixelH = Math.min(targetH, containerH);

      let finalPixelLeft: number;
      let finalPixelTop: number;

      if (options.left !== undefined && options.top !== undefined) {
        const translated = this.translateFromAnchor(
          options.left, options.top, finalPixelW, finalPixelH, anchor
        );
        finalPixelLeft = translated.left;
        finalPixelTop = translated.top;
      } else {
        const smartPos = this.getSmartPositionPixels(finalPixelW, finalPixelH);
        finalPixelLeft = smartPos.left;
        finalPixelTop = smartPos.top;
      }

      if (finalPixelLeft + finalPixelW > containerW) finalPixelLeft = Math.max(0, containerW - finalPixelW);
      if (finalPixelTop + finalPixelH > containerH) finalPixelTop = Math.max(0, containerH - finalPixelH);

      finalWindowRect = {
        width: this.pxToPct(finalPixelW, containerW), height: this.pxToPct(finalPixelH, containerH),
        left: this.pxToPct(finalPixelLeft, containerW), top: this.pxToPct(finalPixelTop, containerH)
      };
    }

    if (finalWindowRect.left + finalWindowRect.width > 100) finalWindowRect.left = Math.max(0, 100 - finalWindowRect.width);
    if (finalWindowRect.top + finalWindowRect.height > 100) finalWindowRect.top = Math.max(0, 100 - finalWindowRect.height);
    if (finalWindowRect.left < 0) finalWindowRect.left = 0;
    if (finalWindowRect.top < 0) finalWindowRect.top = 0;

    const props: WindowProps = {
      windowId: id, title, children: children, manager: this,
      onClose: (id) => { this.closeWindow?.(id); events?.onClose?.() },
      actions, rect: finalWindowRect,
      nonTransparens: this._settings.nonTransparens,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    };

    const newWindow: WindowState<T> = {
      id: id, title: title, zIndex: 0, focused: false,
      isMinimized: false, isMaximized: false, isSnapped: false, root,
      element: windowElement, isClosing: false, customData: customData,
      currentProps: props,
    };
    this.windows.push(newWindow);
    this.windowMap.set(id, newWindow);

    root.render(React.createElement(Window, props));

    if (!suppressFocus) this.bringToFront(id);
    else this.focusHistory.push(id);

    this.emit("create", { id, customData });
    return id;
  };

  public getSnapDelta = (
    id: string, rect: { left: number; top: number; width: number; height: number }, action: string, ctrlKey = false
  ): { x: number; y: number } => {
    if (ctrlKey) return { x: 0, y: 0 };

    let snapX = 0; let snapY = 0;
    let minDiffX = this.SNAP_THRESHOLD + 1; let minDiffY = this.SNAP_THRESHOLD + 1;

    const { width: cW, height: cH } = this.getContainerMetrics();
    const targets = this.windows
      .filter((w) => w.id !== id && !w.isMinimized && !w.isClosing)
      .map((w) => {
        const r = w.currentProps.rect;
        const left = (r.left / 100) * cW;
        const top = (r.top / 100) * cH;
        const right = ((r.left + r.width) / 100) * cW;
        const bottom = ((r.top + r.height) / 100) * cH;
        return { left, top, right, bottom };
      });

    const current = { left: rect.left, top: rect.top, right: rect.left + rect.width, bottom: rect.top + rect.height };
    const isMove = action === "move" || action === "alt-move";
    const activeLeft = isMove || action.includes("w");
    const activeRight = isMove || action.includes("e");
    const activeTop = isMove || action.includes("n");
    const activeBottom = isMove || action.includes("s");

    targets.forEach((target) => {
      const yNear =
        current.top < target.bottom + this.SNAP_THRESHOLD &&
        current.bottom > target.top - this.SNAP_THRESHOLD;

      const xNear =
        current.left < target.right + this.SNAP_THRESHOLD &&
        current.right > target.left - this.SNAP_THRESHOLD;

      if (activeLeft && yNear) {
        const diff = target.right - current.left;
        if (Math.abs(diff) < Math.abs(minDiffX)) { minDiffX = diff; snapX = diff; }
      }
      if (activeRight && yNear) {
        const diff = target.left - current.right;
        if (Math.abs(diff) < Math.abs(minDiffX)) { minDiffX = diff; snapX = diff; }
      }
      if (activeTop && xNear) {
        const diff = target.bottom - current.top;
        if (Math.abs(diff) < Math.abs(minDiffY)) { minDiffY = diff; snapY = diff; }
      }
      if (activeBottom && xNear) {
        const diff = target.top - current.bottom;
        if (Math.abs(diff) < Math.abs(minDiffY)) { minDiffY = diff; snapY = diff; }
      }
    });

    const xSnapping = Math.abs(minDiffX) <= this.SNAP_THRESHOLD;
    const ySnapping = Math.abs(minDiffY) <= this.SNAP_THRESHOLD;

    if (xSnapping && isMove && !ySnapping) {
      let minCornerY = this.SNAP_THRESHOLD + 1;
      let cornerSnapY = 0;
      targets.forEach((target) => {
        const d1 = target.top - current.top;
        if (Math.abs(d1) < Math.abs(minCornerY)) { minCornerY = d1; cornerSnapY = d1; }
        const d2 = target.bottom - current.bottom;
        if (Math.abs(d2) < Math.abs(minCornerY)) { minCornerY = d2; cornerSnapY = d2; }
      });
      if (Math.abs(minCornerY) <= this.SNAP_THRESHOLD) {
        snapY = cornerSnapY;
        minDiffY = minCornerY;
      }
    }

    if (ySnapping && isMove && !xSnapping) {
      let minCornerX = this.SNAP_THRESHOLD + 1;
      let cornerSnapX = 0;
      targets.forEach((target) => {
        const d1 = target.left - current.left;
        if (Math.abs(d1) < Math.abs(minCornerX)) { minCornerX = d1; cornerSnapX = d1; }
        const d2 = target.right - current.right;
        if (Math.abs(d2) < Math.abs(minCornerX)) { minCornerX = d2; cornerSnapX = d2; }
      });
      if (Math.abs(minCornerX) <= this.SNAP_THRESHOLD) {
        snapX = cornerSnapX;
        minDiffX = minCornerX;
      }
    }

    if (Math.abs(minDiffX) > this.SNAP_THRESHOLD) snapX = 0;
    if (Math.abs(minDiffY) > this.SNAP_THRESHOLD) snapY = 0;

    return { x: snapX, y: snapY };
  };

  private _finalizeDestroy = (id: string): void => {
    const windowToDestroy = this.windowMap.get(id);
    if (!windowToDestroy) return;
    const windowIndex = this.windows.indexOf(windowToDestroy);
    if (windowIndex === -1) return;
    windowToDestroy.root.unmount();
    if (this.container.contains(windowToDestroy.element)) this.container.removeChild(windowToDestroy.element);
    this.windows.splice(windowIndex, 1);
    this.windowMap.delete(id);
    this.focusHistory = this.focusHistory.filter((historyId) => historyId !== id);
    if (this.windows.length > 0) this.focusNextActiveWindow(id);
    else this.highestZIndex = 10;
    this.notify();
    this.emit("close", { id });
  };

  public bringToFront = (id: string): void => {
    const windowToFocus = this.windowMap.get(id);
    if (!windowToFocus || windowToFocus.isClosing) return;

    if (windowToFocus.isMinimized) windowToFocus.isMinimized = false;

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
        if (w.focused) { w.focused = false; this.emit("blur", { id: w.id }); }
        return;
      }
      if (w.id === id) {
        w.focused = true;
      } else {
        if (w.focused) {
          w.focused = false;
          needsUpdate = true;
          this.emit("blur", { id: w.id });
        }
      }
    });

    this.notify();
    this.emit("focus", { id });
  };
}