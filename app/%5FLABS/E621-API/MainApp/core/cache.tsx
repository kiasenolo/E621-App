import { useEffect, useState } from "react"
import { E621 } from "@/app/%5FLABS/E621-API/types/e621"
import * as workSpaceType from "../types/workSpaceType"
import { fs } from "./globals"
import { toProxiedUrl } from "../ui/DesktopParts"

export let CACHE_BASE_ROOT = "/.cache";
export let THUMB_ROOT = `${CACHE_BASE_ROOT}/thumbnail`;
export let POST_ROOT = `${CACHE_BASE_ROOT}/posts`;

export namespace Cache {
  export type CacheID = string;
  export type CacheExt = string;
  export type CacheType = 'thumb' | 'post';

  export type CacheSettings = workSpaceType.Unit.SettingUnit.Cache;

  export let latestSettings: CacheSettings | null = null;

  export function syncSettings(settings: CacheSettings) {
    latestSettings = settings;
    if (!Queues.thumb.running) _pump('thumb');
    if (!Queues.post.running) _pump('post');
  }

  export interface DownloadTask {
    id: CacheID;
    ext: CacheExt;
    url: string;
    type: CacheType;
    onDone: (blob: Blob) => void;
    onError?: (err: unknown) => void;
  }

  const Queues = {
    thumb: {
      queue: [] as DownloadTask[],
      inFlight: new Set<CacheID>(),
      running: false,
    },
    post: {
      queue: [] as DownloadTask[],
      inFlight: new Set<CacheID>(),
      running: false,
    }
  };

  export namespace Cache {
    export function getRootPath(type: CacheType): string {
      return type === 'post' ? POST_ROOT : THUMB_ROOT;
    }

    export function getFilePath(id: CacheID, ext: CacheExt, type: CacheType): string {
      return `${getRootPath(type)}/${id}.${ext}`;
    }

    export async function ensureRoot(): Promise<void> {
      try {
        await fs.mkdir(THUMB_ROOT, { recursive: true });
        await fs.mkdir(POST_ROOT, { recursive: true });
      } catch { }
    }

    export async function pathExists(path: string): Promise<boolean> {
      try {
        await fs.stat(path);
        return true;
      } catch {
        return false;
      }
    }

    export async function isCached(id: CacheID, ext: CacheExt, type: CacheType = 'thumb'): Promise<boolean> {
      return pathExists(getFilePath(id, ext, type));
    }

    export async function readBlob(id: CacheID, ext: CacheExt, type: CacheType = 'thumb'): Promise<Blob | null> {
      const path = getFilePath(id, ext, type);
      if (!(await pathExists(path))) return null;

      const buffer = await fs.readFile(path, null);
      const mime = extToMime(ext);
      return new Blob([buffer as any], { type: mime });
    }

    export async function writeBlob(
      id: CacheID,
      ext: CacheExt,
      data: ArrayBuffer | Blob,
      type: CacheType
    ): Promise<Blob> {
      await ensureRoot();

      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      const path = getFilePath(id, ext, type);
      await fs.writeFile(path, buffer);

      const mime = extToMime(ext);
      const blob = new Blob([buffer], { type: mime });

      if (latestSettings) {
        enforceLimits(type, latestSettings).catch(err => console.error('Cache limit enforcement failed:', err));
      }

      return blob;
    }

    export async function remove(id: CacheID, ext: CacheExt, type: CacheType = 'thumb'): Promise<void> {
      const path = getFilePath(id, ext, type);
      try { await fs.unlink(path); } catch { }
    }

    export async function clear(): Promise<void> {
      try { await fs.rmdir(CACHE_BASE_ROOT, { recursive: true }); } catch { }
      await ensureRoot();
    }

    export function enqueue(task: DownloadTask): void {
      const state = Queues[task.type];
      state.queue.push(task);
      if (!state.running) _pump(task.type);
    }

    export function download(
      id: CacheID,
      ext: CacheExt,
      url: string,
      type: CacheType = 'thumb'
    ): Promise<Blob> {
      return new Promise<Blob>((resolve, reject) => {
        console.log(`Enqueue: ${id} / ${url}`);

        const customTask: DownloadTask = {
          id, ext, url, type,
          onDone: resolve,
          onError: reject
        };

        enqueue(customTask);
      });
    }

    export async function enforceLimits(type: CacheType, settings: CacheSettings): Promise<void> {
      const dirPath = getRootPath(type);
      if (!(await pathExists(dirPath))) return;

      let limitCount = settings.limit._all;

      if (settings.isManualLimit) {
        limitCount = type === 'post' ? settings.limit.post.image : settings.limit.post.thumb;
      }

      if (limitCount === 0) return;

      try {
        const files = await fs.readdir(dirPath);

        if (files.length <= limitCount) return;

        const fileStats = await Promise.all(
          files.map(async (filename) => {
            const filePath = `${dirPath}/${filename}`;
            const stats = await fs.stat(filePath);
            return { filePath, mtime: stats.mtime.getTime() };
          })
        );

        fileStats.sort((a, b) => a.mtime - b.mtime);

        const filesToDeleteCount = fileStats.length - limitCount;

        for (let i = 0; i < filesToDeleteCount; i++) {
          await fs.unlink(fileStats[i].filePath);
        }
      } catch (err) {
        console.error(`Failed to enforce limit for ${type}:`, err);
      }
    }
  }

  async function _pump(type: CacheType): Promise<void> {
    const state = Queues[type];
    state.running = true;

    while (state.queue.length > 0) {
      let maxConcurrent = 3;
      if (latestSettings) {
        maxConcurrent = latestSettings.maxConcurrentDownload._all;
        if (latestSettings.isManualMaxDownload) {
          maxConcurrent = type === 'post'
            ? latestSettings.maxConcurrentDownload.post.image
            : latestSettings.maxConcurrentDownload.post.thumb;
        }
      }

      if (state.inFlight.size >= maxConcurrent) break;

      const taskIndex = state.queue.findIndex(t => !state.inFlight.has(t.id));
      if (taskIndex === -1) break;

      const [task] = state.queue.splice(taskIndex, 1);
      state.inFlight.add(task.id);

      _runTask(task).finally(() => {
        state.inFlight.delete(task.id);
        _pump(type);
      });
    }

    if (state.queue.length === 0 && state.inFlight.size === 0) {
      state.running = false;
    }
  }

  async function _runTask(task: DownloadTask): Promise<void> {
    try {
      const cached = await Cache.readBlob(task.id, task.ext, task.type);
      if (cached) { task.onDone(cached); return; }

      const proxiedUrl = toProxiedUrl(task.url);
      const res = await fetch(proxiedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status} – ${task.url}`);

      const buffer = await res.arrayBuffer();
      const blob = await Cache.writeBlob(task.id, task.ext, buffer, task.type);

      task.onDone(blob);
    } catch (err) {
      task.onError?.(err);
    }
  }

  function extToMime(ext: CacheExt): string {
    const map: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", avif: "image/avif",
      webm: "video/webm", mp4: "video/mp4",
    };
    return map[ext.toLowerCase()] ?? "application/octet-stream";
  }

  export function useCachedThumbnail(post: E621.Post) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;
      let currentUrl: string | null = null;

      async function loadImage() {
        const id = String(post.id);
        const urlExt = post.preview?.url?.split('.').pop();
        const ext = urlExt || "jpg";
        const remoteUrl = post.preview?.url || "";

        try {
          let blob = await Cache.readBlob(id, ext, 'thumb');

          if (blob) {
            if (isMounted) {
              currentUrl = URL.createObjectURL(blob);
              setBlobUrl(currentUrl);
            }
          } else {
            const isEnabled = (latestSettings?.enable.post.thumb && latestSettings?.enable.global) ?? false;

            if (isEnabled && remoteUrl) {
              blob = await Cache.download(id, ext, remoteUrl, 'thumb');
              if (isMounted && blob) {
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
              }
            } else {
              if (isMounted) setBlobUrl(remoteUrl || null);
            }
          }
        } catch (err) {
          console.error(`Thumbnail failed: ${id}`, err);
          if (isMounted) setBlobUrl(remoteUrl || null);
        }
      }

      loadImage();
      return () => {
        isMounted = false;
        if (currentUrl) URL.revokeObjectURL(currentUrl);
      };
    }, [post.id, post.preview?.url]);

    return blobUrl;
  }

  export function useCachedPost(post: E621.Post) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
      let isMounted = true;
      let currentUrl: string | null = null;

      async function loadFile() {
        const id = String(post.id);
        const ext = post.file?.ext || "jpg";
        const remoteUrl = post.file?.url || "";

        try {
          let blob = await Cache.readBlob(id, ext, 'post');

          if (blob) {
            if (isMounted) {
              currentUrl = URL.createObjectURL(blob);
              setBlobUrl(currentUrl);
            }
          } else {
            const isEnabled = (latestSettings?.enable.post.image && latestSettings?.enable.global) ?? false;

            if (isEnabled && remoteUrl) {
              blob = await Cache.download(id, ext, remoteUrl, 'post');
              if (isMounted && blob) {
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
              }
            } else {
              if (isMounted) setBlobUrl(remoteUrl || null);
            }
          }
        } catch (err) {
          console.error(`Post failed: ${id}`, err);
          if (isMounted) setBlobUrl(remoteUrl || null);
        }
      }

      loadFile();
      return () => {
        isMounted = false;
        if (currentUrl) URL.revokeObjectURL(currentUrl);
      };
    }, [post.id, post.file?.url]);

    return blobUrl;
  }
}

/* ========================================================================================= */


export const setCacheRoot = (base: string) => {
  CACHE_BASE_ROOT = base;
  THUMB_ROOT = `${CACHE_BASE_ROOT}/thumbnail`;
  POST_ROOT = `${CACHE_BASE_ROOT}/posts`;
}
