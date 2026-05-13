type BufferLike = string | BufferSource | Blob;

interface MkdirOptions {
  recursive?: boolean;
}

class OPFSFileSystem {
  async getRoot(): Promise<FileSystemDirectoryHandle> {
    return navigator.storage.getDirectory();
  }

  private _normalizePath(path: string): string[] {
    const parts = path.split('/').filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return resolved;
  }

  async _resolvePath(path: string, createDirs = false) {
    const parts = this._normalizePath(path);
    const targetName = parts.pop();
    if (!targetName) throw new Error("Invalid path or root path cannot be resolved as a file");

    let currentDir = await this.getRoot();

    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create: createDirs });
      } catch (err: any) {
        if (err.name === 'NotFoundError') {
          throw new Error(`ENOENT: no such file or directory, resolve '${path}'`);
        }
        throw err;
      }
    }

    return { dirHandle: currentDir, targetName };
  }

  async writeFile(path: string, data: BufferLike): Promise<void> {
    const { dirHandle, targetName } = await this._resolvePath(path, true);
    const fileHandle = await dirHandle.getFileHandle(targetName, { create: true });

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async readFile(path: string, encoding: 'utf8'): Promise<string>;
  async readFile(path: string, encoding: 'blob'): Promise<File>;
  async readFile(path: string): Promise<Uint8Array>;
  async readFile(path: string, encoding?: 'utf8' | 'blob'): Promise<string | Uint8Array | File> {
    const { dirHandle, targetName } = await this._resolvePath(path);
    const fileHandle = await dirHandle.getFileHandle(targetName);
    const file = await fileHandle.getFile();

    if (encoding === 'utf8') {
      return file.text();
    } else if (encoding === 'blob') {
      return file;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
  }

  async mkdir(path: string, options?: MkdirOptions): Promise<void> {
    const parts = this._normalizePath(path);
    let currentDir = await this.getRoot();

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const create = options?.recursive || isLast;

      try {
        currentDir = await currentDir.getDirectoryHandle(part, { create });
      } catch (e: any) {
        throw new Error(`ENOENT: no such file or directory, mkdir '${path}'`);
      }
    }
  }

  async readdir(path: string): Promise<string[]> {
    let targetDir: FileSystemDirectoryHandle;

    if (path === '/' || path === '') {
      targetDir = await this.getRoot();
    } else {
      const { dirHandle, targetName } = await this._resolvePath(path);
      targetDir = await dirHandle.getDirectoryHandle(targetName);
    }

    const entries: string[] = [];
    for await (const name of (targetDir as any).keys()) {
      entries.push(name);
    }
    return entries;
  }

  async unlink(path: string): Promise<void> {
    const { dirHandle, targetName } = await this._resolvePath(path);
    await dirHandle.removeEntry(targetName);
  }

  async rmdir(path: string, options?: { recursive?: boolean }): Promise<void> {
    const { dirHandle, targetName } = await this._resolvePath(path);
    await dirHandle.removeEntry(targetName, { recursive: options?.recursive });
  }

  async stat(path: string) {
    if (path === '/' || path === '') {
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        lastModified: Date.now(),
      };
    }

    const { dirHandle, targetName } = await this._resolvePath(path);

    try {
      const fileHandle = await dirHandle.getFileHandle(targetName);
      const file = await fileHandle.getFile();

      return {
        isFile: () => true,
        isDirectory: () => false,
        size: file.size,
        lastModified: file.lastModified,
      };
    } catch (err: any) {
      if (err.name === 'TypeMismatchError') {
        return {
          isFile: () => false,
          isDirectory: () => true,
          size: 0,
          lastModified: 0,
        };
      }

      if (err.name === 'NotFoundError') {
        const error: any = new Error(`ENOENT: no such file or directory, stat '${path}'`);
        error.code = 'ENOENT';
        throw error;
      }

      throw err;
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.stat(path);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT' || err.name === 'NotFoundError') {
        return false;
      }
      throw err;
    }
  }

  async getImageUrl(path: string, mimeType = 'image/jpeg'): Promise<string> {
    const fileBlob = await this.readFile(path, 'blob');
    const blob = new Blob([fileBlob], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  async requestPersistentStorage(): Promise<boolean> {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`儲存空間持久化狀態: ${isPersisted ? '成功 (不會被自動刪除)' : '失敗 (空間不足時可能會被瀏覽器清除)'}`);
      return isPersisted;
    }
    return false;
  }
}

export const fs = new OPFSFileSystem();