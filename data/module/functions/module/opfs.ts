/**
 * opfs-fs.ts
 * A Node.js `fs`-compatible library built on the Origin Private File System (OPFS).
 *
 * Supports:
 *  - fs.promises.*         → async/await API (works everywhere)
 *  - fs.*( ..., callback ) → Node-style callback API (works everywhere)
 *  - fs.*Sync(...)         → synchronous API (Web Worker only, via createSyncAccessHandle)
 *
 * Usage (ESM):
 *   import fs from './opfs-fs.js';
 *   await fs.promises.writeFile('/hello.txt', 'Hello, OPFS!');
 *   const text = await fs.promises.readFile('/hello.txt', 'utf8');
 *
 * Sync (Web Worker only):
 *   const fsSync = await fs.initSyncFs();
 *   const text = fsSync.readFileSync('/hello.txt', 'utf8');
 */

// ─────────────────────────────────────────────
// Browser-compatible type aliases
// (BufferEncoding & WorkerGlobalScope are Node/Worker typings
//  not available in lib.dom — we declare them locally)
// ─────────────────────────────────────────────

/** Common text encodings (mirrors Node.js BufferEncoding). */
export type BufferEncoding =
  | 'utf8' | 'utf-8'
  | 'ascii' | 'latin1' | 'binary'
  | 'base64' | 'base64url'
  | 'hex' | 'ucs2' | 'ucs-2'
  | 'utf16le' | 'utf-16le';

/** Minimal FileSystemSyncAccessHandle shape (available in Workers, absent from lib.dom). */
interface FileSystemSyncAccessHandle {
  read(buffer: AllowSharedBufferSource, options?: FileSystemReadWriteOptions): number;
  write(buffer: AllowSharedBufferSource, options?: FileSystemReadWriteOptions): number;
  getSize(): number;
  truncate(newSize: number): void;
  flush(): void;
  close(): void;
}

interface FileSystemReadWriteOptions { at?: number; }

/** Augment FileSystemFileHandle to include the sync API. */
declare global {
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
  interface FileSystemFileHandle {
    createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
  }
  /** WorkerGlobalScope — defined in lib.webworker but not lib.dom. */
  // eslint-disable-next-line no-var
  var WorkerGlobalScope: typeof globalThis | undefined;
}

// ─────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────

export type FileData = string | Uint8Array | ArrayBuffer | ArrayBufferView;
export type Encoding = BufferEncoding | null;

export interface ReadFileOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

export interface WriteFileOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

export interface AppendFileOptions {
  encoding?: BufferEncoding;
}

export interface MkdirOptions {
  recursive?: boolean;
}

export interface RmdirOptions {
  recursive?: boolean;
}

export interface RmOptions {
  recursive?: boolean;
  force?: boolean;
}

export interface ReaddirOptions {
  withFileTypes?: boolean;
}

export interface ReadStreamOptions {
  start?: number;
  end?: number;
}

export interface WriteStreamOptions {
  /** Set to 'a' for append mode. */
  flags?: string;
}

export interface WalkOptions {
  create?: boolean;
}

/** Result of walk(): the parent directory handle + the final path segment. */
interface WalkResult {
  parentDir: FileSystemDirectoryHandle;
  name: string;
}

/** Shape of the sync fs object returned by initSyncFs(). */
export interface SyncFs {
  readFileSync(path: string, options?: BufferEncoding | ReadFileOptions | null): string | Uint8Array;
  writeFileSync(path: string, data: FileData, options?: BufferEncoding | WriteFileOptions): void;
  appendFileSync(path: string, data: FileData, options?: BufferEncoding | AppendFileOptions): void;
  unlinkSync(path: string): void;
  mkdirSync(path: string, options?: MkdirOptions): void;
  rmdirSync(path: string, options?: RmdirOptions): void;
  rmSync(path: string, options?: RmOptions): void;
  readdirSync(path: string, options?: ReaddirOptions): string[] | Dirent[];
  statSync(path: string): Stats;
  accessSync(path: string): void;
  renameSync(oldPath: string, newPath: string): void;
  copyFileSync(src: string, dest: string): void;
  truncateSync(path: string, len?: number): void;
  existsSync(path: string): boolean;
  promises: typeof promises;
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Split a path string into non-empty segments. */
function segments(p: string): string[] {
  if (typeof p !== 'string') throw new TypeError(`Path must be a string, got ${typeof p}`);
  return p.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter(Boolean);
}

/** Resolve the OPFS root FileSystemDirectoryHandle. */
async function root(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

/**
 * Walk segments down from root, returning { parentDir, name }.
 * If create is true, missing intermediate directories are created.
 */
async function walk(segs: string[], { create = false }: WalkOptions = {}): Promise<WalkResult> {
  if (segs.length === 0) throw new OPFSError('EINVAL', 'Path resolves to root directory');
  let dir = await root();
  for (let i = 0; i < segs.length - 1; i++) {
    try {
      dir = await dir.getDirectoryHandle(segs[i], { create });
    } catch {
      throw new OPFSError('ENOENT', `No such directory: /${segs.slice(0, i + 1).join('/')}`);
    }
  }
  return { parentDir: dir, name: segs[segs.length - 1] };
}

/** Walk all segments, returning a DirectoryHandle for the full path. */
async function walkDir(segs: string[], { create = false }: WalkOptions = {}): Promise<FileSystemDirectoryHandle> {
  let dir = await root();
  for (let i = 0; i < segs.length; i++) {
    try {
      dir = await dir.getDirectoryHandle(segs[i], { create });
    } catch {
      throw new OPFSError('ENOENT', `No such directory: /${segs.slice(0, i + 1).join('/')}`);
    }
  }
  return dir;
}

/** Normalise encoding option → string or null. */
function enc(options?: BufferEncoding | ReadFileOptions | null): BufferEncoding | null {
  if (typeof options === 'string') return options;
  if (options && typeof options === 'object') return (options as ReadFileOptions).encoding ?? null;
  return null;
}

/** Convert data to Uint8Array. */
function toBytes(data: FileData): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (typeof data === 'string') return encoder.encode(data);
  throw new TypeError(`Data must be a string or Buffer/Uint8Array, got ${typeof data}`);
}

/** OPFS-style errors that resemble Node.js fs errors. */
export class OPFSError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'OPFSError';
  }
}

// ─────────────────────────────────────────────
// Callback helpers
// ─────────────────────────────────────────────

type Callback<T = void> = (err: Error | null, result?: T) => void;

/**
 * Wrap an async fn so it accepts an optional Node-style callback as last arg.
 * If no callback is provided the Promise is returned directly.
 */
function cbWrap<TArgs extends unknown[], TReturn>(
  asyncFn: (...args: TArgs) => Promise<TReturn>
): {
  (...args: [...TArgs, Callback<TReturn>]): void;
  (...args: TArgs): Promise<TReturn>;
} {
  return function (...args: unknown[]): unknown {
    const last = args[args.length - 1];
    if (typeof last === 'function') {
      const cb = last as Callback<TReturn>;
      const rest = args.slice(0, -1) as TArgs;
      asyncFn(...rest).then(
        (r) => cb(null, r),
        (e: Error) => cb(e)
      );
      return undefined;
    }
    return asyncFn(...(args as TArgs));
  } as ReturnType<typeof cbWrap<TArgs, TReturn>>;
}

// ─────────────────────────────────────────────
// Stats class (mirrors Node.js fs.Stats)
// ─────────────────────────────────────────────

type EntryKind = 'file' | 'directory';

export class Stats {
  public readonly size: number;
  public readonly mtimeMs: number;
  public readonly mtime: Date;
  public readonly atimeMs: number;
  public readonly atime: Date;
  public readonly birthtimeMs: number;
  public readonly birthtime: Date;
  private readonly _kind: EntryKind;

  constructor(size: number, mtimeMs: number, kind: EntryKind) {
    this.size = size;
    this.mtimeMs = mtimeMs;
    this.mtime = new Date(mtimeMs);
    this.atimeMs = mtimeMs;
    this.atime = new Date(mtimeMs);
    this.birthtimeMs = mtimeMs;
    this.birthtime = new Date(mtimeMs);
    this._kind = kind;
  }

  isFile(): boolean { return this._kind === 'file'; }
  isDirectory(): boolean { return this._kind === 'directory'; }
  isSymbolicLink(): boolean { return false; }
  isBlockDevice(): boolean { return false; }
  isCharacterDevice(): boolean { return false; }
  isFIFO(): boolean { return false; }
  isSocket(): boolean { return false; }
}

// ─────────────────────────────────────────────
// Dirent class (mirrors Node.js fs.Dirent)
// ─────────────────────────────────────────────

export class Dirent {
  public readonly name: string;
  private readonly _kind: FileSystemHandleKind;

  constructor(name: string, kind: FileSystemHandleKind) {
    this.name = name;
    this._kind = kind;
  }

  isFile(): boolean { return this._kind === 'file'; }
  isDirectory(): boolean { return this._kind === 'directory'; }
  isSymbolicLink(): boolean { return false; }
  isBlockDevice(): boolean { return false; }
  isCharacterDevice(): boolean { return false; }
  isFIFO(): boolean { return false; }
  isSocket(): boolean { return false; }
}

// ─────────────────────────────────────────────
// fs.promises  (async API)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Standalone overloaded helpers (object literals
// cannot contain overload signatures in TS)
// ─────────────────────────────────────────────

/** Read the contents of a directory. */
async function _readdir(path: string, options: ReaddirOptions & { withFileTypes: true }): Promise<Dirent[]>;
async function _readdir(path: string, options?: ReaddirOptions & { withFileTypes?: false }): Promise<string[]>;
async function _readdir(path: string, options?: ReaddirOptions): Promise<string[] | Dirent[]> {
  const withFileTypes = options?.withFileTypes ?? false;
  const segs = segments(path);
  const dir = segs.length === 0 ? await root() : await walkDir(segs);
  const entries: Array<string | Dirent> = [];
  for await (const [entName, handle] of dir.entries()) {
    if (withFileTypes) {
      entries.push(new Dirent(entName, handle.kind));
    } else {
      entries.push(entName);
    }
  }
  return entries as string[] | Dirent[];
}

/** Read the entire contents of a file. */
async function _readFile(path: string, options: BufferEncoding | ReadFileOptions): Promise<string>;
async function _readFile(path: string, options?: null): Promise<Uint8Array>;
async function _readFile(
  path: string,
  options?: BufferEncoding | ReadFileOptions | null
): Promise<string | Uint8Array> {
  const encoding = enc(options);
  const segs = segments(path);
  const { parentDir, name } = await walk(segs);
  let fh: FileSystemFileHandle;
  try {
    fh = await parentDir.getFileHandle(name);
  } catch {
    throw new OPFSError('ENOENT', `ENOENT: no such file or directory, open '${path}'`);
  }
  const file = await fh.getFile();

  if (encoding !== null) return file.text();
  if (encoding === null && options === null) {
    return new Uint8Array(await file.arrayBuffer());
  }

  return file.text();
}

export const promises = {

  /** Read the entire contents of a file. */
  readFile: _readFile,

  /** Write data to a file, replacing it if it already exists. */
  async writeFile(
    path: string,
    data: FileData,
    _options?: BufferEncoding | WriteFileOptions
  ): Promise<void> {
    const segs = segments(path);
    const { parentDir, name } = await walk(segs, { create: false });
    const fh = await parentDir.getFileHandle(name, { create: true });
    const writable = await fh.createWritable({ keepExistingData: false });
    try {
      await writable.write(toBytes(data) as unknown as ArrayBuffer);
      await writable.close();
    } catch (e) {
      await writable.abort();
      throw e;
    }
  },

  /** Append data to a file, creating it if it does not exist. */
  async appendFile(
    path: string,
    data: FileData,
    _options?: BufferEncoding | AppendFileOptions
  ): Promise<void> {
    const segs = segments(path);
    const { parentDir, name } = await walk(segs, { create: false });
    const fh = await parentDir.getFileHandle(name, { create: true });
    const file = await fh.getFile();
    const existing = new Uint8Array(await file.arrayBuffer());
    const extra = toBytes(data);
    const merged = new Uint8Array(existing.byteLength + extra.byteLength);
    merged.set(existing, 0);
    merged.set(extra, existing.byteLength);
    const writable = await fh.createWritable({ keepExistingData: false });
    try {
      await writable.write(merged as unknown as ArrayBuffer);
      await writable.close();
    } catch (e) {
      await writable.abort();
      throw e;
    }
  },

  /** Delete a file. */
  async unlink(path: string): Promise<void> {
    const segs = segments(path);
    const { parentDir, name } = await walk(segs);
    try {
      await parentDir.removeEntry(name, { recursive: false });
    } catch {
      throw new OPFSError('ENOENT', `ENOENT: no such file or directory, unlink '${path}'`);
    }
  },

  /** Create a directory. */
  async mkdir(path: string, options?: MkdirOptions): Promise<void> {
    const recursive = options?.recursive ?? false;
    const segs = segments(path);
    if (recursive) {
      await walkDir(segs, { create: true });
    } else {
      const { parentDir, name } = await walk(segs, { create: false });
      try {
        await parentDir.getDirectoryHandle(name, { create: true });
      } catch {
        throw new OPFSError('EEXIST', `EEXIST: file already exists, mkdir '${path}'`);
      }
    }
  },

  /** Remove a directory (empty by default; use recursive to remove with contents). */
  async rmdir(path: string, options?: RmdirOptions): Promise<void> {
    const recursive = options?.recursive ?? false;
    const segs = segments(path);
    const { parentDir, name } = await walk(segs);
    try {
      await parentDir.removeEntry(name, { recursive });
    } catch {
      throw new OPFSError('ENOENT', `ENOENT: no such file or directory, rmdir '${path}'`);
    }
  },

  /** Remove a file or directory (recursive supported). */
  async rm(path: string, options?: RmOptions): Promise<void> {
    const recursive = options?.recursive ?? false;
    const force = options?.force ?? false;
    const segs = segments(path);
    try {
      const { parentDir, name } = await walk(segs);
      await parentDir.removeEntry(name, { recursive });
    } catch (e) {
      if (!force) throw e;
    }
  },

  /** Read the contents of a directory. */
  readdir: _readdir,

  /** Get file/directory metadata. */
  async stat(path: string): Promise<Stats> {
    const segs = segments(path);
    const { parentDir, name } = await walk(segs);
    // Try file first
    try {
      const fh = await parentDir.getFileHandle(name);
      const file = await fh.getFile();
      return new Stats(file.size, file.lastModified, 'file');
    } catch { /* fall through */ }
    // Try directory
    try {
      await parentDir.getDirectoryHandle(name);
      return new Stats(0, Date.now(), 'directory');
    } catch { /* fall through */ }
    throw new OPFSError('ENOENT', `ENOENT: no such file or directory, stat '${path}'`);
  },

  /** Test whether a path can be accessed (existence check). */
  async access(path: string): Promise<void> {
    await promises.stat(path); // throws ENOENT if missing
  },

  /**
   * Rename (move) a file or directory.
   * Note: OPFS has no native rename; this copies then deletes the source.
   */
  async rename(oldPath: string, newPath: string): Promise<void> {
    const st = await promises.stat(oldPath);
    if (st.isDirectory()) {
      await _copyDir(oldPath, newPath);
      await promises.rm(oldPath, { recursive: true });
    } else {
      const data = await promises.readFile(oldPath);
      await promises.writeFile(newPath, data);
      await promises.unlink(oldPath);
    }
  },

  /** Copy a file. */
  async copyFile(src: string, dest: string): Promise<void> {
    const data = await promises.readFile(src);
    await promises.writeFile(dest, data);
  },

  /** Truncate a file to a specified length. */
  async truncate(path: string, len = 0): Promise<void> {
    const data = await promises.readFile(path);
    const truncated = data.slice(0, len);
    const padded =
      truncated.length < len
        ? (() => { const b = new Uint8Array(len); b.set(truncated as Uint8Array); return b; })()
        : truncated;
    await promises.writeFile(path, padded as Uint8Array);
  },

  /**
   * Check if a path exists.
   * Returns a boolean instead of throwing (non-standard, like legacy fs.exists).
   */
  async exists(path: string): Promise<boolean> {
    try { await promises.stat(path); return true; } catch { return false; }
  },

  /** Recursively list all files under a directory. */
  async readdirRecursive(path: string): Promise<string[]> {
    const results: string[] = [];
    async function walk_(p: string): Promise<void> {
      const entries = await promises.readdir(p, { withFileTypes: true });
      for (const e of entries) {
        const child = `${p}/${e.name}`;
        if (e.isDirectory()) await walk_(child);
        else results.push(child);
      }
    }
    await walk_(path);
    return results;
  },
};

/** Internal: recursively copy a directory. */
async function _copyDir(src: string, dest: string): Promise<void> {
  await promises.mkdir(dest, { recursive: true });
  const entries = await promises.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = `${src}/${e.name}`;
    const d = `${dest}/${e.name}`;
    if (e.isDirectory()) await _copyDir(s, d);
    else await promises.copyFile(s, d);
  }
}

// ─────────────────────────────────────────────
// Sync API  (Web Worker ONLY)
// Uses createSyncAccessHandle + Atomics to block.
// ─────────────────────────────────────────────

function assertWorker(): void {
  const isWorker =
    typeof WorkerGlobalScope !== 'undefined' &&
    typeof self !== 'undefined' &&
    (self as unknown as { constructor: unknown }).constructor === WorkerGlobalScope;
  if (!isWorker) {
    throw new OPFSError(
      'ENOTSUP',
      'Sync OPFS access is only available inside a Web Worker.'
    );
  }
}

/**
 * Initialise sync helpers inside a Web Worker.
 * Call this once at worker startup; it returns synchronous fs methods.
 *
 * @example
 * // worker.ts
 * import { initSyncFs } from './opfs-fs.js';
 * const fsSync = await initSyncFs();
 * const text = fsSync.readFileSync('/hello.txt', 'utf8');
 */
export async function initSyncFs(): Promise<SyncFs> {
  assertWorker();

  function atomicRun<T>(asyncFn: () => Promise<T>): T {
    const sab = new SharedArrayBuffer(4);
    const flag = new Int32Array(sab);
    const result: { data?: T; err?: unknown } = {};

    void (async () => {
      try {
        result.data = await asyncFn();
      } catch (e) {
        result.err = e;
      }
      Atomics.store(flag, 0, 1);
      Atomics.notify(flag, 0);
    })();

    Atomics.wait(flag, 0, 0);
    if (result.err !== undefined) throw result.err;
    return result.data as T;
  }

  return {
    /** Read a file synchronously (Web Worker only). */
    readFileSync(
      path: string,
      options?: BufferEncoding | ReadFileOptions | null
    ): string | Uint8Array {
      const encoding = enc(options);
      const segs = segments(path);

      const bytes = atomicRun(async () => {
        const { parentDir, name } = await walk(segs);
        const fh = await parentDir.getFileHandle(name);
        const syncHandle = await fh.createSyncAccessHandle();
        const size = syncHandle.getSize();
        const buf = new Uint8Array(size);
        syncHandle.read(buf, { at: 0 });
        syncHandle.close();
        return buf;
      });

      return encoding ? decoder.decode(bytes) : bytes;
    },

    /** Write a file synchronously (Web Worker only). */
    writeFileSync(path: string, data: FileData): void {
      const bytes = toBytes(data);
      const segs = segments(path);

      atomicRun(async () => {
        const { parentDir, name } = await walk(segs);
        const fh = await parentDir.getFileHandle(name, { create: true });
        const syncHandle = await fh.createSyncAccessHandle();
        syncHandle.truncate(0);
        syncHandle.write(bytes, { at: 0 });
        syncHandle.flush();
        syncHandle.close();
      });
    },

    /** Append to a file synchronously (Web Worker only). */
    appendFileSync(path: string, data: FileData): void {
      const extra = toBytes(data);
      const segs = segments(path);

      atomicRun(async () => {
        const { parentDir, name } = await walk(segs);
        const fh = await parentDir.getFileHandle(name, { create: true });
        const syncHandle = await fh.createSyncAccessHandle();
        const offset = syncHandle.getSize();
        syncHandle.write(extra, { at: offset });
        syncHandle.flush();
        syncHandle.close();
      });
    },

    /** Delete a file synchronously (Web Worker only). */
    unlinkSync(path: string): void {
      atomicRun(() => promises.unlink(path));
    },

    /** Create a directory synchronously (Web Worker only). */
    mkdirSync(path: string, options?: MkdirOptions): void {
      atomicRun(() => promises.mkdir(path, options));
    },

    /** Remove a directory synchronously (Web Worker only). */
    rmdirSync(path: string, options?: RmdirOptions): void {
      atomicRun(() => promises.rmdir(path, options));
    },

    /** Remove a file or directory synchronously (Web Worker only). */
    rmSync(path: string, options?: RmOptions): void {
      atomicRun(() => promises.rm(path, options));
    },

    /** Read the contents of a directory synchronously (Web Worker only). */
    readdirSync(path: string, options?: ReaddirOptions): string[] | Dirent[] {
      return atomicRun(async () => {
        if (options?.withFileTypes) {
          return promises.readdir(path, options as ReaddirOptions & { withFileTypes: true });
        }
        return promises.readdir(path, options as ReaddirOptions & { withFileTypes?: false });
      }) as string[] | Dirent[];
    },

    /** Get file/directory metadata synchronously (Web Worker only). */
    statSync(path: string): Stats {
      return atomicRun(() => promises.stat(path));
    },

    /** Test whether a path can be accessed synchronously (Web Worker only). */
    accessSync(path: string): void {
      atomicRun(() => promises.access(path));
    },

    /** Rename (move) a file or directory synchronously (Web Worker only). */
    renameSync(oldPath: string, newPath: string): void {
      atomicRun(() => promises.rename(oldPath, newPath));
    },

    /** Copy a file synchronously (Web Worker only). */
    copyFileSync(src: string, dest: string): void {
      atomicRun(() => promises.copyFile(src, dest));
    },

    /** Truncate a file to a specified length synchronously (Web Worker only). */
    truncateSync(path: string, len = 0): void {
      atomicRun(() => promises.truncate(path, len));
    },

    /**
     * Check if a path exists synchronously (Web Worker only).
     * Returns a boolean (never throws).
     */
    existsSync(path: string): boolean {
      return atomicRun(() => promises.exists(path));
    },

    /** Expose async promises for operations that have no sync equivalent. */
    promises,
  };
}

// ─────────────────────────────────────────────
// createReadStream / createWriteStream
// ─────────────────────────────────────────────

/**
 * Create a ReadableStream for a file.
 * Compatible with: response.body, fetch, pipeTo, etc.
 */
export function createReadStream(
  path: string,
  options?: ReadStreamOptions
): ReadableStream<Uint8Array> {
  const { start = 0, end } = options ?? {};
  let cancelled = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const segs = segments(path);
        const { parentDir, name } = await walk(segs);
        const fh = await parentDir.getFileHandle(name);
        const file = await fh.getFile();
        const slice = file.slice(start, end !== undefined ? end + 1 : undefined);
        const reader = slice.stream().getReader();
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    cancel() { cancelled = true; },
  });
}

/**
 * Create a WritableStream for a file.
 * Use `options.flags = 'a'` for append mode.
 */
export function createWriteStream(
  path: string,
  options?: WriteStreamOptions
): WritableStream<FileData> {
  const appendMode = options?.flags === 'a';
  let writable!: FileSystemWritableFileStream;
  let offset = 0;

  return new WritableStream<FileData>({
    async start() {
      const segs = segments(path);
      const { parentDir, name } = await walk(segs, { create: false });
      const fh = await parentDir.getFileHandle(name, { create: true });
      writable = await fh.createWritable({ keepExistingData: appendMode });
      if (appendMode) {
        const file = await fh.getFile();
        offset = file.size;
        await writable.seek(offset);
      }
    },
    async write(chunk: FileData) {
      const bytes = toBytes(chunk);
      await writable.write(bytes as unknown as ArrayBuffer);
      offset += bytes.byteLength;
    },
    async close() {
      await writable.close();
    },
    async abort(reason?: unknown) {
      await writable.abort(reason as string | undefined);
    },
  });
}

// ─────────────────────────────────────────────
// Callback-based top-level API
// ─────────────────────────────────────────────

export const readFile = cbWrap(promises.readFile as (path: string, options?: BufferEncoding | ReadFileOptions | null) => Promise<string | Uint8Array>);
export const writeFile = cbWrap(promises.writeFile);
export const appendFile = cbWrap(promises.appendFile);
export const unlink = cbWrap(promises.unlink);
export const mkdir = cbWrap(promises.mkdir);
export const rmdir = cbWrap(promises.rmdir);
export const rm = cbWrap(promises.rm);
export const readdir = cbWrap(promises.readdir as (path: string, options?: ReaddirOptions) => Promise<string[] | Dirent[]>);
export const stat = cbWrap(promises.stat);
export const access = cbWrap(promises.access);
export const rename = cbWrap(promises.rename);
export const copyFile = cbWrap(promises.copyFile);
export const truncate = cbWrap(promises.truncate);

/**
 * Check whether a path exists (legacy callback style, like old Node.js fs.exists).
 * Note: the callback receives a boolean, not an error.
 */
export function exists(path: string, callback: (exists: boolean) => void): void {
  promises.exists(path).then(callback);
}

// ─────────────────────────────────────────────
// Default export (mirrors `import fs from 'fs'`)
// ─────────────────────────────────────────────

const fs = {
  // Classes
  Stats,
  Dirent,
  OPFSError,

  // Promise API
  promises,

  // Callback API
  readFile,
  writeFile,
  appendFile,
  unlink,
  mkdir,
  rmdir,
  rm,
  readdir,
  stat,
  access,
  rename,
  copyFile,
  truncate,
  exists,

  // Stream API
  createReadStream,
  createWriteStream,

  // Sync initialiser (Worker only)
  initSyncFs,
};

export default fs;