import JSZip from "jszip";
import * as workSpaceType from "../types/workSpaceType"
import * as workSpaceTypeOld from "../types/workSpaceTypeOld"
import BACKGROUND_IMAGE from "../background.png"
import { merge } from "lodash";

import opfs, { Dirent } from "@/data/module/functions/module/opfs";
import { GetNowTime, MakeID } from "../utlis/other";
import { defaultWMSettings } from "@/data/components/Window/WindowManager";
import * as e621DatabaseCache from "./cacheSystem"
const fs = opfs.promises

const jstr = (obj: object) => JSON.stringify(obj);

export type EmptyAccountOption = {
  name: string,
  id: string,
  password?: string,
  color?: string,
  avatar?: workSpaceType.Unit.BaseItem.Image,
  wallpaper?: workSpaceType.Unit.BaseItem.Image,
  e621?: {
    name: string;
    key: string;
  }
}

export const EmptyAccount: ((option: EmptyAccountOption) => workSpaceType.User) = (opt: EmptyAccountOption) => {
  const _: workSpaceType.User = {
    saveInfo: {
      user: {
        name: opt.name,
        avatar: opt.avatar ?? {
          url: "/_SYSTEM/Images/root/avatar.png"
        },
        passKey: opt.password, // 這東西只有我自己一個人用 絕對不會泄漏 忽略這一段
        e621: opt.e621
      },
      id: opt.id,
    },
    setting: {
      wmSettings: defaultWMSettings,
      performance: {
        All: true,
        cssAnimation: true,
        transition: true,
        transitionDelay: true,
        cssFilter: true,
        backdropFilter: true,
        transparenWinodw: false,
      },
      lang: "en-us",
      search: {
        defaultSearchFilter: {
          rating: {
            s: true,
            e: false,
            q: false,
          }
        },
      },
      download: {
        format: "%artist% - %id%",
        maxConcurrentDownloads: 2,
      },
      appearance: {
        scale: 80,
        color: opt.color ?? "#ffffff",
        wallpaper: opt.wallpaper ?? {
          url: BACKGROUND_IMAGE.src
        },
        clockFormat: [
          ":HH:::mm:::ss:",
          "-dd- -MM- -YY-",
        ],
        KIASTALA: false,
        transparens: false,
      },
      cache: {
        enable: {
          global: false,
          post: {
            data: false,
            image: false,
            thumb: false,
          },
          pool: false,
          tags: false,
        },
        isManualLimit: false,
        limit: {
          _all: 100,
          post: {
            data: 100,
            image: 100,
            thumb: 100,
          },
          pool: 100,
          tags: 100,
        },
        isManualMaxDownload: false,
        maxConcurrentDownload: {
          _all: 100,
          post: {
            image: 100,
            thumb: 100,
          },
        },
        downloadFromCache: false,
      }
    },
    saves: {
      download: [],
      wallpapers: [],
      tmpList: [],
    },
    history: {
      search: [],
      wallpaper: [],
      color: [],
      download: [],
    },
    state: {
      nowWorkSpace: "main",
    },
    workSpaces: [
      {
        id: "main",
        note: {
          name: "Main",
        },
        preview: [],
        status: [],
        setting: {
          wallpaper: opt.wallpaper ?? {
            url: BACKGROUND_IMAGE.src
          },
          color: opt.color ?? "#ffffff",
        }
      }
    ]
  }

  return _
}

export const newEmptyAccount = EmptyAccount({ name: "", id: "" })

export interface UserIOOptions {
  cache?: boolean;
  workspaces?: boolean;
  saves?: boolean;
  tempList?: boolean;
  history?: boolean;
  offlineDB?: boolean;
}

export type WorkSpaceEventMap = {
  "app:statusSet": CustomEvent<{ state: workSpaceType.App }>;

  "user:created": CustomEvent<{ user: workSpaceType.User }>;
  "user:deleted": CustomEvent<{ userId: string }>;
  "user:settingSet": CustomEvent<{ userId: string; value: workSpaceType.Unit.Setting }>;
  "user:saveInfoSet": CustomEvent<{ userId: string; value: workSpaceType.Unit.SaveInfo }>;
  "user:stateSet": CustomEvent<{ userId: string; value: workSpaceType.State }>;
  "user:historySet": CustomEvent<{ userId: string; key: keyof workSpaceType.Unit.History; value: unknown }>;
  "user:savesSet": CustomEvent<{ userId: string; key: Exclude<keyof workSpaceType.Unit.Saves, "tmpList">; value: unknown }>;
  "user:langChanged": CustomEvent<{ userId: string; lang: string }>;

  "workspace:added": CustomEvent<{ userId: string; ws: workSpaceType.WorkSpaces.WorkSpaces }>;
  "workspace:updated": CustomEvent<{ userId: string; wsId: string; partial: Partial<Omit<workSpaceType.WorkSpaces.WorkSpaces, "id">> }>;
  "workspace:appearance": CustomEvent<{ userId: string; wsId: string; value: workSpaceType.WorkSpaces.Setting }>;  // 新增
  "workspace:deleted": CustomEvent<{ userId: string; wsId: string }>;

  "tmpItem:added": CustomEvent<{ userId: string; itemUuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }>;
  "tmpItem:update": CustomEvent<{ userId: string; itemUuid: string; newItem: workSpaceType.Unit.BaseItem.TmpItem }>;
  "tmpItem:removed": CustomEvent<{ userId: string; itemUuid: string }>;
  "tmpItem:cleared": CustomEvent<{ userId: string }>;
};


export declare interface WorkSpaceActions {
  addEventListener<K extends keyof WorkSpaceEventMap>(
    type: K,
    listener: (ev: WorkSpaceEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;

  removeEventListener<K extends keyof WorkSpaceEventMap>(
    type: K,
    listener: (ev: WorkSpaceEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void;
}


export class WorkSpaceActions extends EventTarget {
  readonly userIdExcludeReg = /\ |\(|\)|\\|\||\/|!|\?|\:/;

  public rootDir = "";

  // #region ── Constructor ─────────────────────────────────────────────────────────────

  constructor(id?: string, initDone?: () => void, nope?: boolean) {
    super();
    if (nope) return;
    this.rootDir = `/E621-App[${id ?? "Main"}]/`;

    const init = async () => {
      if (!await fs.exists(this.rootDir)) {
        await fs.mkdir(this.rootDir);
      }
      initDone?.();
    };

    init();
  }

  // #endregion


  // #region ── Helper ───────────────────────────────────────────────────────────────────

  private fire<K extends keyof WorkSpaceEventMap>(
    type: K,
    detail: WorkSpaceEventMap[K] extends CustomEvent<infer D> ? D : never
  ) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // #endregion


  // #region ── 切換語言 ─────────────────────────────────────────────────────────────────

  public async switchLanguage(userId: string, newLang: string): Promise<void> {
    await this.assertUserExists(userId);

    const settingStore = await this.userSetting(userId);
    const currentSettings = await settingStore.get();

    if (currentSettings.lang === newLang) return;

    await settingStore.set((prev) => {
      prev.lang = newLang;
      return prev;
    });

    this.fire("user:langChanged", { userId, lang: newLang });
  }

  public async getLanguage(userId: string): Promise<string> {
    await this.assertUserExists(userId);
    const settingStore = await this.userSetting(userId);
    const settings = await settingStore.get();
    return settings.lang;
  }

  // #endregion


  // #region ── 路徑 helpers ─────────────────────────────────────────────────────────────

  public usrDir(id: string) {
    return this.rootDir + id + "/";
  }

  public usrSubDir(id: string, sub: "workspaces" | "history" | "saves" | "storage") {
    return this.usrDir(id) + sub + "/";
  }

  public wsDir(userId: string, wsId: string) {
    return this.usrSubDir(userId, "workspaces") + wsId + "/";
  }

  public tmpListDir(userId: string) {
    return this.usrSubDir(userId, "saves") + "tmpList/";
  }

  public async createFolder(id: string): Promise<void> {
    await this.assertUserExists(id);

    const wsBase = this.usrSubDir(id, "workspaces");
    const histBase = this.usrSubDir(id, "history");
    const savesBase = this.usrSubDir(id, "saves");
    const storageBase = this.usrSubDir(id, "storage");
    const tmpBase = this.tmpListDir(id);

    const requiredDirs = [wsBase, histBase, savesBase, storageBase, tmpBase];
    await Promise.all(
      requiredDirs.map(dir => fs.mkdir(dir, { recursive: true }))
    );

    const ensureFile = async (path: string, defaultData: any) => {
      if (!await fs.exists(path)) {
        await fs.writeFile(path, jstr(defaultData));
      }
    };

    await Promise.all([
      ensureFile(savesBase + "download.json", []),
      ensureFile(savesBase + "wallpapers.json", []),
      ensureFile(histBase + "search.json", []),
      ensureFile(histBase + "color.json", []),
      ensureFile(histBase + "wallpaper.json", []),
      ensureFile(histBase + "download.json", [])
    ]);
  }

  // #endregion


  // #region ── 驗證 ─────────────────────────────────────────────────────────────────────

  private async assertValidId(id: string) {
    if (!id || this.userIdExcludeReg.test(id)) throw new Error("ID 格式不規範");
  }

  private async assertUserExists(id: string) {
    await this.assertValidId(id);
    if (!await fs.exists(this.usrDir(id)))
      throw new Error("這個使用者不存在");
  }

  private async assertUserNotExists(id: string) {
    await this.assertValidId(id);
    if (await fs.exists(this.usrDir(id)))
      throw new Error("這個使用者已經存在了");
  }

  public async havThisUser(id: string): Promise<boolean> {
    if (!id || this.userIdExcludeReg.test(id)) return false;
    return fs.exists(this.usrDir(id));
  }

  // #endregion


  // #region ── App 層級 ─────────────────────────────────────────────────────────────────

  public async setAppStatus(state: workSpaceType.App): Promise<void> {
    await fs.writeFile(this.rootDir + "appStatus.json", jstr(state));
    this.fire("app:statusSet", { state });
  }

  public async getAppStatus(): Promise<workSpaceType.App> {
    const raw = await fs.readFile(this.rootDir + "appStatus.json");
    return JSON.parse(raw.toString()) as workSpaceType.App;
  }

  public async exportSaves(): Promise<Uint8Array> {
    const zip = new JSZip();

    const writeRecursive = async (dirPath: string, relPath: string) => {
      const entries = (await fs.readdir(dirPath, { withFileTypes: true })) as Dirent[];
      for (const entry of entries) {
        const isDir = entry.isDirectory();
        const path = dirPath + entry.name + (isDir ? "/" : "");
        const name = relPath + entry.name;

        if (isDir) {
          await writeRecursive(path, `${name}/`);
        } else {
          const data = await fs.readFile(path, null) as Uint8Array;
          zip.file(name, data);
        }
      }
    };

    if (await fs.exists(this.rootDir)) {
      await writeRecursive(this.rootDir, "");
    }

    return await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });
  }

  public async importSaves(zipSource: Blob | ArrayBuffer | Uint8Array): Promise<void> {
    const rawData = zipSource instanceof Blob
      ? await zipSource.arrayBuffer()
      : zipSource instanceof Uint8Array
        ? (zipSource.buffer as ArrayBuffer)
        : zipSource;

    const zip = await JSZip.loadAsync(rawData as ArrayBuffer | Uint8Array);

    if (await fs.exists(this.rootDir)) {
      const entries = (await fs.readdir(this.rootDir, { withFileTypes: true })) as Dirent[];
      for (const entry of entries) {
        const isDir = entry.isDirectory();
        const path = this.rootDir + entry.name + (isDir ? "/" : "");
        if (isDir) {
          await fs.rmdir(path, { recursive: true });
        } else {
          await fs.unlink(path);
        }
      }
    } else {
      await fs.mkdir(this.rootDir, { recursive: true });
    }

    const ensureDir = async (filePath: string): Promise<void> => {
      const segments = filePath.split("/").slice(0, -1).filter(Boolean);
      if (segments.length === 0) return;
      await fs.mkdir(this.rootDir + segments.join("/") + "/", { recursive: true });
    };

    const files = Object.values(zip.files);
    for (const file of files) {
      if (file.dir) {
        await fs.mkdir(this.rootDir + file.name, { recursive: true });
        continue;
      }
      await ensureDir(file.name);
      const contents = await file.async("uint8array");
      await fs.writeFile(this.rootDir + file.name, contents);
    }
  }

  public async importSavesOld(data: workSpaceTypeOld.defaul): Promise<void> {
    const newID = GetNowTime();
    const emptyOldUserData: workSpaceTypeOld.User = {
      saveInfo: {
        user: {
          name: "",
          avatar: {
            url: "/_SYSTEM/Images/root/avatar.png"
          },
          passKey: "",
        },
        id: "",
      },
      setting: {
        wmSettings: defaultWMSettings,
        performance: {
          All: true,
          cssAnimation: true,
          transition: true,
          transitionDelay: true,
          cssFilter: true,
          backdropFilter: true,
          transparenWinodw: false,
        },
        lang: "en-us",
        search: {
          defaultSearchFilter: {
            rating: {
              s: true,
              e: false,
              q: false,
            }
          },
        },
        download: {
          format: "%artist% - %id%",
          maxConcurrentDownloads: 2,
        },
        appearance: {
          scale: 80,
          color: "#ffffff",
          wallpaper: {
            url: BACKGROUND_IMAGE.src
          },
          clockFormat: [
            ":HH:::mm:::ss:",
            "-dd- -MM- -YY-",
          ],
          KIASTALA: false,
          transparens: false,
        }
      },
      saves: {
        download: [],
        wallpapers: [],
        tmpList: [],
      },
      history: {
        search: [],
        wallpaper: [],
        color: [],
        download: [],
      },
      windowsStatus: [],
      nowWorkSpace: 0,
      workSpaces: [
        {
          name: "Main",
          status: [],
          setting: {
            wallpaper: {
              url: BACKGROUND_IMAGE.src
            },
            color: "#ffffff",
          }
        }
      ]
    }
    const nD: workSpaceType.defaul = {
      autoLogin: data.autoLogin,
      lastUser: data.lastUser,
      rememberPassword: data.rememberPassword,
      userList: data.userList.map(usr => merge({}, emptyOldUserData, usr)).map(usr => ({
        history: usr.history,
        saveInfo: {
          ...usr.saveInfo,
          id: usr.saveInfo.id.replaceAll(/\ |\(|\)|\\|\||\/|!|\?|\:/g, "_"),
        },
        saves: usr.saves,
        setting: usr.setting,
        state: {
          nowWorkSpace: (newID + usr.nowWorkSpace).toString()
        },
        workSpaces: usr.workSpaces.map((ws, i) => ({
          id: (newID + i).toString(),
          note: {
            name: ws.name,
            note: ws.note
          },
          preview: ws.status.map(({ rect: r, zIndex }) => ({
            x: r.left,
            y: r.top,
            w: r.width,
            h: r.height,
            z: zIndex,
          })) as workSpaceType.WorkSpaces.Preview[],
          setting: ws.setting,
          status: ws.status,
        })) as workSpaceType.WorkSpaces.WorkSpaces[]
      })) as workSpaceType.User[]
    }

    await fs.rmdir(this.rootDir, { recursive: true });
    await fs.mkdir(this.rootDir);

    await this.setAppStatus({
      autoLogin: nD.autoLogin,
      lastUser: nD.lastUser,
      rememberPassword: nD.rememberPassword,
    })

    const users = nD.userList

    for (let index = 0; index < users.length; index++) {
      const user = users[index];

      await this.overwriteUserData(user)
    }

  }

  private async runTasksWithConcurrency<T>(
    tasks: (() => Promise<T>)[],
    concurrencyLimit: number,
    onTaskCompleted: () => void
  ): Promise<void> {
    const executing: Promise<any>[] = [];

    for (const task of tasks) {
      const promise = task().then(() => {
        onTaskCompleted();
        const index = executing.indexOf(promise);
        if (index !== -1) {
          executing.splice(index, 1);
        }
      });
      executing.push(promise);

      if (executing.length >= concurrencyLimit) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }

  readonly CONCURRENCY_LIMIT = 25;

  public async exportToDirectoryHandle(
    dirHandle: any,
    onUpdate?: (max: number, now: number) => void
  ): Promise<void> {
    if (!(await fs.exists(this.rootDir))) {
      console.warn(`Source directory ${this.rootDir} does not exist.`);
      return;
    }

    const fileWriteTasks: (() => Promise<void>)[] = [];

    const collectTasksRecursive = async (vDirPath: string, nDirHandle: any) => {
      const entries = (await fs.readdir(vDirPath, { withFileTypes: true })) as Dirent[];

      await Promise.all(entries.map(async (entry) => {
        const isDir = entry.isDirectory();
        const path = vDirPath + entry.name + (isDir ? "/" : "");

        if (isDir) {
          const newNDirHandle = await nDirHandle.getDirectoryHandle(entry.name, { create: true });
          await collectTasksRecursive(path, newNDirHandle);
        } else {
          const task = async () => {
            const data = await fs.readFile(path, null) as Uint8Array;
            const fileHandle = await nDirHandle.getFileHandle(entry.name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
          };
          fileWriteTasks.push(task);
        }
      }));
    };

    await collectTasksRecursive(this.rootDir, dirHandle);

    const max = fileWriteTasks.length;
    let now = 0;
    let updateInterval: any = null;

    if (onUpdate) {
      onUpdate(max, now);
      updateInterval = setInterval(() => {
        onUpdate(max, now);
      }, 500);
    }

    console.log(`Found ${max} files to export. Starting...`);

    await this.runTasksWithConcurrency(fileWriteTasks, this.CONCURRENCY_LIMIT, () => {
      now++;
    });

    if (updateInterval) {
      clearInterval(updateInterval);
    }
    if (onUpdate) {
      onUpdate(max, max);
    }

    console.log("Export completed.");
  }

  public async importFromDirectoryHandle(
    dirHandle: any,
    onUpdate?: (max: number, now: number) => void
  ): Promise<void> {
    console.log(`Cleaning and preparing directory: ${this.rootDir}...`);
    await fs.rm(this.rootDir, { recursive: true, force: true });
    await fs.mkdir(this.rootDir, { recursive: true });

    const fileWriteTasks: (() => Promise<void>)[] = [];

    const collectTasksRecursive = async (nDirHandle: any, vDirPath: string) => {
      for await (const handle of nDirHandle.values()) {
        const newVPath = vDirPath + handle.name;

        if (handle.kind === 'directory') {
          await fs.mkdir(newVPath + "/", { recursive: true });
          await collectTasksRecursive(handle, newVPath + "/");
        } else if (handle.kind === 'file') {
          const task = async () => {
            const file = await handle.getFile();
            const buffer = await file.arrayBuffer();
            await fs.writeFile(newVPath, new Uint8Array(buffer));
          };
          fileWriteTasks.push(task);
        }
      }
    };

    await collectTasksRecursive(dirHandle, this.rootDir);

    const max = fileWriteTasks.length;
    let now = 0;
    let updateInterval: any = null;

    if (onUpdate) {
      onUpdate(max, now);
      updateInterval = setInterval(() => {
        onUpdate(max, now);
      }, 500);
    }

    console.log(`Found ${max} files to import. Starting...`);

    await this.runTasksWithConcurrency(fileWriteTasks, this.CONCURRENCY_LIMIT, () => {
      now++;
    });

    if (updateInterval) {
      clearInterval(updateInterval);
    }
    if (onUpdate) {
      onUpdate(max, max);
    }

    console.log("Import completed.");
  }

  public async listUsers(): Promise<string[]> {
    const items = (await fs.readdir(this.rootDir, { withFileTypes: true }))
      .filter(e => e.isDirectory())
      .filter(e => e.name !== ".cache");

    const users: string[] = [];

    for (const item of items) {
      const infoPath = this.usrDir(item.name) + "saveInfo.json";
      if (await fs.exists(infoPath)) {
        users.push(item.name);
        await this.createFolder(item.name);
      }
    }

    return users;
  }

  // #endregion


  // #region ── 使用者 CRUD ───────────────────────────────────────────────────────────────

  public async newUser(opt: EmptyAccountOption): Promise<void> {
    await this.assertUserNotExists(opt.id);

    const newUser = EmptyAccount(opt);

    await this.overwriteUserData(newUser);
    this.fire("user:created", { user: newUser });
  }

  public async getUser(id: string): Promise<workSpaceType.User> {
    await this.assertUserExists(id);
    const dir = this.usrDir(id);

    const read = async <T,>(path: string): Promise<T> => {
      const raw = await fs.readFile(path);
      return JSON.parse(raw.toString()) as T;
    };

    const wsBase = this.usrSubDir(id, "workspaces");
    const wsItems = (await fs.readdir(wsBase)) as string[];
    const workSpaces: workSpaceType.WorkSpaces.WorkSpaces[] = [];

    for (const wsId of wsItems) {
      if (await fs.exists(wsBase + wsId + "/")) {
        const wsDir = wsBase + wsId + "/";
        workSpaces.push({
          id: wsId,
          setting: await read(wsDir + "setting.json"),
          note: await read(wsDir + "note.json"),
          status: await read(wsDir + "status.json"),
        } as workSpaceType.WorkSpaces.WorkSpaces);
      }
    }

    const tmpListDir = this.tmpListDir(id);
    const tmpItems = (await fs.readdir(tmpListDir)) as string[];
    const tmpList: workSpaceType.Unit.BaseItem.TmpItem[] = [];

    for (const f of tmpItems) {
      if (f.endsWith(".json")) {
        tmpList.push(await read(tmpListDir + f));
      }
    }

    const savesBase = this.usrSubDir(id, "saves");
    const histBase = this.usrSubDir(id, "history");

    return {
      saveInfo: await read(dir + "saveInfo.json"),
      setting: await read(dir + "setting.json"),
      state: await read(dir + "state.json"),
      history: {
        search: await read(histBase + "search.json"),
        color: await read(histBase + "color.json"),
        wallpaper: await read(histBase + "wallpaper.json"),
        download: await read(histBase + "download.json"),
      },
      saves: {
        download: await read(savesBase + "download.json"),
        wallpapers: await read(savesBase + "wallpapers.json"),
        tmpList,
      },
      workSpaces,
    };
  }

  public async getSaveInfo(id: string): Promise<workSpaceType.Unit.SaveInfo> {
    await this.assertUserExists(id);
    const dir = this.usrDir(id);

    const read = async <T,>(path: string): Promise<T> => {
      const raw = await fs.readFile(path);
      return JSON.parse(raw.toString()) as T;
    };
    return await read(dir + "saveInfo.json");
  }

  public async deleteUser(id: string): Promise<void> {
    await this.assertUserExists(id);
    await fs.rmdir(this.usrDir(id), { recursive: true });
    this.fire("user:deleted", { userId: id });
  }

  // #endregion


  // #region ── 使用者欄位單獨更新 ────────────────────────────────────────────────────────

  private rs<T extends object>(filePath: string, onSet?: () => void) {
    return {
      async get(): Promise<T> {
        return JSON.parse((await fs.readFile(filePath)).toString()) as T;
      },
      async set(value: T | ((prev: T) => T)): Promise<void> {
        const resolved =
          typeof value === "function"
            ? (value as (e: T) => T)(JSON.parse((await fs.readFile(filePath)).toString()))
            : value;
        await fs.writeFile(filePath, jstr(resolved));
        onSet?.();
      },
    };
  }

  public async userSetting(id: string) {
    await this.assertUserExists(id);
    const filePath = this.usrDir(id) + "setting.json";
    return this.rs<workSpaceType.Unit.Setting>(filePath, async () => {
      const value = JSON.parse((await fs.readFile(filePath)).toString()) as workSpaceType.Unit.Setting;
      this.fire("user:settingSet", { userId: id, value });
    });
  }

  public async userSaveInfo(id: string) {
    await this.assertUserExists(id);
    const filePath = this.usrDir(id) + "saveInfo.json";
    return this.rs<workSpaceType.Unit.SaveInfo>(filePath, async () => {
      const value = JSON.parse((await fs.readFile(filePath)).toString()) as workSpaceType.Unit.SaveInfo;
      this.fire("user:saveInfoSet", { userId: id, value });
    });
  }

  public async userState(id: string) {
    await this.assertUserExists(id);
    const filePath = this.usrDir(id) + "state.json";
    return this.rs<workSpaceType.State>(filePath, async () => {
      const value = JSON.parse((await fs.readFile(filePath)).toString()) as workSpaceType.State;
      this.fire("user:stateSet", { userId: id, value });
    });
  }

  public async userHistory(id: string, key: keyof workSpaceType.Unit.History) {
    await this.assertUserExists(id);
    const filePath = this.usrSubDir(id, "history") + key + ".json";
    return this.rs(filePath, async () => {
      const value = JSON.parse((await fs.readFile(filePath)).toString());
      this.fire("user:historySet", { userId: id, key, value });
    });
  }

  public async userSaves(
    id: string,
    key: Exclude<keyof workSpaceType.Unit.Saves, "tmpList">
  ) {
    await this.assertUserExists(id);
    const filePath = this.usrSubDir(id, "saves") + key + ".json";
    return this.rs(filePath, async () => {
      const value = JSON.parse((await fs.readFile(filePath)).toString());
      this.fire("user:savesSet", { userId: id, key, value });
    });
  }

  // #endregion


  // #region ── Workspace CRUD ───────────────────────────────────────────────────────────

  public async listWorkspaces(userId: string): Promise<string[]> {
    await this.assertUserExists(userId);
    const wsBase = this.usrSubDir(userId, "workspaces");

    const items = (await fs.readdir(wsBase)) as string[];
    const workspaces: string[] = [];

    for (const name of items) {
      if (await fs.exists(wsBase + name + "/")) {
        workspaces.push(name);
      }
    }
    return workspaces.sort((a, b) => parseInt(a) - parseInt(b));;
  }

  public async addWorkspace(
    userId: string,
    ws: workSpaceType.WorkSpaces.WorkSpaces
  ): Promise<void> {
    await this.assertUserExists(userId);
    const dir = this.wsDir(userId, ws.id);
    if (await fs.exists(dir)) throw new Error("這個 Workspace 已存在");
    await fs.mkdir(dir);
    await fs.writeFile(dir + "preview.json", jstr([]));
    await fs.writeFile(dir + "setting.json", jstr(ws.setting));
    await fs.writeFile(dir + "note.json", jstr(ws.note));
    await fs.writeFile(dir + "status.json", jstr(ws.status));
    this.fire("workspace:added", { userId, ws });
  }

  public async getWorkspace(
    userId: string,
    wsId: string
  ): Promise<workSpaceType.WorkSpaces.WorkSpaces> {
    await this.assertUserExists(userId);
    const dir = this.wsDir(userId, wsId);
    if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
    const read = async <T,>(p: string) =>
      JSON.parse((await fs.readFile(p)).toString()) as T;
    return {
      id: wsId,
      preview: await read(dir + "preview.json"),
      setting: await read(dir + "setting.json"),
      note: await read(dir + "note.json"),
      status: await read(dir + "status.json"),
    };
  }

  public async getWorkspaceInfo(
    userId: string,
    wsId: string,
    type: "preview"
  ): Promise<workSpaceType.WorkSpaces.Preview[]>;
  public async getWorkspaceInfo(
    userId: string,
    wsId: string,
    type: "setting"
  ): Promise<workSpaceType.WorkSpaces.Setting>;
  public async getWorkspaceInfo(
    userId: string,
    wsId: string,
    type: "note"
  ): Promise<workSpaceType.WorkSpaces.Note>;
  public async getWorkspaceInfo(
    userId: string,
    wsId: string,
    type: "status"
  ): Promise<workSpaceType.Unit.windowsStatus>;
  public async getWorkspaceInfo(
    userId: string,
    wsId: string,
    type:
      | "preview"
      | "setting"
      | "note"
      | "status"
  ): Promise<any> {
    await this.assertUserExists(userId);
    const dir = this.wsDir(userId, wsId);
    if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
    const read = async <T,>(p: string) =>
      JSON.parse((await fs.readFile(p)).toString()) as T;
    switch (type) {
      case "note": return await read(dir + "note.json");
      case "preview": return await read(dir + "preview.json");
      case "setting": return await read(dir + "setting.json");
      case "status": return await read(dir + "status.json");
    }
  }

  public async updateWorkspace(
    userId: string,
    wsId: string,
    partial: Partial<Omit<workSpaceType.WorkSpaces.WorkSpaces, "id">>
  ): Promise<void> {
    await this.assertUserExists(userId);
    const dir = this.wsDir(userId, wsId);
    if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
    if (partial.setting)
      await fs.writeFile(dir + "setting.json", jstr(partial.setting));
    if (partial.note)
      await fs.writeFile(dir + "note.json", jstr(partial.note));
    if (partial.status) {
      await fs.writeFile(dir + "status.json", jstr(partial.status));
      await fs.writeFile(dir + "preview.json", jstr(partial.status?.map(({ rect, zIndex }) => ({
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
        z: zIndex,
      }))));
    }
    this.fire("workspace:updated", { userId, wsId, partial });
  }

  public async setWorkspaceAppearance(
    userId: string,
    wsId: string,
    value:
      | workSpaceType.WorkSpaces.Setting
      | ((prev: workSpaceType.WorkSpaces.Setting) => workSpaceType.WorkSpaces.Setting)
  ): Promise<void> {
    await this.assertUserExists(userId);
    const dir = this.wsDir(userId, wsId);
    if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");

    const filePath = dir + "setting.json";
    const prev = JSON.parse(
      (await fs.readFile(filePath)).toString()
    ) as workSpaceType.WorkSpaces.Setting;

    const resolved = typeof value === "function" ? value(prev) : value;

    await fs.writeFile(filePath, jstr(resolved));
    this.fire("workspace:appearance", { userId, wsId, value: resolved });
  }

  public async deleteWorkspace(userId: string, wsId: string): Promise<void> {
    await this.assertUserExists(userId);
    const dir = this.wsDir(userId, wsId);
    if (!await fs.exists(dir)) throw new Error("這個 Workspace 不存在");
    await fs.rmdir(dir, { recursive: true });
    this.fire("workspace:deleted", { userId, wsId });
  }

  // #endregion


  // #region ── TmpList CRUD ─────────────────────────────────────────────────────────────

  public async listTmpItems(
    userId: string
  ): Promise<{ uuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }[]> {
    await this.assertUserExists(userId);
    const dir = this.tmpListDir(userId);

    const items = (await fs.readdir(dir)) as string[];
    const files = items.filter((f: string) => f.endsWith(".json"));

    const result = [];
    for (const f of files) {
      const raw = await fs.readFile(dir + f);
      result.push({
        uuid: f.replace(".json", ""),
        item: JSON.parse(raw.toString()),
      });
    }
    return result;
  }

  public async addTmpItem(
    userId: string,
    item: workSpaceType.Unit.BaseItem.TmpItem
  ): Promise<string> {
    await this.assertUserExists(userId);
    const itemUuid = MakeID();
    await fs.writeFile(this.tmpListDir(userId) + itemUuid + ".json", jstr(item));
    this.fire("tmpItem:added", { userId, itemUuid, item });
    return itemUuid;
  }

  public async updateTmpItem(
    userId: string,
    itemUuid: string,
    newItem: workSpaceType.Unit.BaseItem.TmpItem
  ): Promise<string> {
    await this.assertUserExists(userId);
    await fs.writeFile(this.tmpListDir(userId) + itemUuid + ".json", jstr(newItem));
    this.fire("tmpItem:update", { userId, itemUuid, newItem });
    return itemUuid;
  }

  public async getTmpList(
    userId: string
  ): Promise<{ uuid: string; item: workSpaceType.Unit.BaseItem.TmpItem }[]> {
    return this.listTmpItems(userId);
  }

  public async removeTmpItem(userId: string, itemUuid: string): Promise<void> {
    await this.assertUserExists(userId);
    const path = this.tmpListDir(userId) + itemUuid + ".json";
    if (!await fs.exists(path)) throw new Error("這個 TmpItem 不存在");
    await fs.unlink(path);
    this.fire("tmpItem:removed", { userId, itemUuid });
  }

  public async clearTmpList(userId: string): Promise<void> {
    await this.assertUserExists(userId);
    const dir = this.tmpListDir(userId);
    (await fs.readdir(dir) as string[])
      .filter((f: string) => f.endsWith(".json"))
      .forEach((f: string) => fs.unlink(dir + f));
    this.fire("tmpItem:cleared", { userId });
  }

  // #endregion


  // #region ── Private: 完整覆寫使用者目錄 ──────────────────────────────────────────────

  private async overwriteUserData(newUser: workSpaceType.User): Promise<void> {
    const id = newUser.saveInfo.id;
    const dir = this.usrDir(id);

    if (await fs.exists(dir)) {
      await fs.rm(dir, { recursive: true, force: true });
    }

    await fs.mkdir(dir, { recursive: true });

    const wsBase = this.usrSubDir(id, "workspaces");
    const histBase = this.usrSubDir(id, "history");
    const savesBase = this.usrSubDir(id, "saves");
    const storageBase = this.usrSubDir(id, "storage");
    const tmpBase = this.tmpListDir(id);

    await fs.mkdir(wsBase, { recursive: true });
    await fs.mkdir(histBase, { recursive: true });
    await fs.mkdir(savesBase, { recursive: true });
    await fs.mkdir(storageBase, { recursive: true });
    await fs.mkdir(tmpBase, { recursive: true });

    await Promise.all([
      fs.writeFile(dir + "setting.json", jstr(newUser.setting)),
      fs.writeFile(dir + "saveInfo.json", jstr(newUser.saveInfo)),
      fs.writeFile(dir + "state.json", jstr(newUser.state)),
      fs.writeFile(histBase + "search.json", jstr(newUser.history.search)),
      fs.writeFile(histBase + "color.json", jstr(newUser.history.color)),
      fs.writeFile(histBase + "wallpaper.json", jstr(newUser.history.wallpaper)),
      fs.writeFile(histBase + "download.json", jstr(newUser.history.download)),
      fs.writeFile(savesBase + "download.json", jstr(newUser.saves.download)),
      fs.writeFile(savesBase + "wallpapers.json", jstr(newUser.saves.wallpapers))
    ]);

    for (const ws of newUser.workSpaces) {
      const wsDir = wsBase + ws.id + "/";
      await fs.mkdir(wsDir, { recursive: true });
      await Promise.all([
        fs.writeFile(wsDir + "preview.json", jstr(ws.preview)),
        fs.writeFile(wsDir + "setting.json", jstr(ws.setting)),
        fs.writeFile(wsDir + "note.json", jstr(ws.note)),
        fs.writeFile(wsDir + "status.json", jstr(ws.status))
      ]);
    }
  }

  // #endregion


  // #region ──  Export / Import User ───────────────────────────────────────────────────

  public async exportUser(
    userId: string,
    options: UserIOOptions,
    mode: "zip" | "folder",
    dirHandle?: any
  ): Promise<Uint8Array | void> {
    await this.assertUserExists(userId);

    const uDir = this.usrDir(userId);
    const exportFiles = new Map<string, Uint8Array | Blob>();

    const addFile = async (realPath: string, virtualPath: string) => {
      if (await fs.exists(realPath)) {
        exportFiles.set(virtualPath, await fs.readFile(realPath, null) as Uint8Array);
      }
    };

    const addDirRecursive = async (realDir: string, virtualDir: string) => {
      if (!await fs.exists(realDir)) return;
      const entries = (await fs.readdir(realDir, { withFileTypes: true })) as Dirent[];
      for (const entry of entries) {
        const rPath = realDir + entry.name + (entry.isDirectory() ? "/" : "");
        const vPath = virtualDir + entry.name + (entry.isDirectory() ? "/" : "");
        if (entry.isDirectory()) {
          await addDirRecursive(rPath, vPath);
        } else {
          exportFiles.set(vPath, await fs.readFile(rPath, null) as Uint8Array);
        }
      }
    };

    await addFile(uDir + "setting.json", "setting.json");
    await addFile(uDir + "saveInfo.json", "saveInfo.json");
    await addFile(uDir + "state.json", "state.json");

    const stateStore = await this.userState(userId);
    const state = await stateStore.get();
    const nowWs = state.nowWorkSpace;

    const wsBase = this.usrSubDir(userId, "workspaces");
    if (options.workspaces) {
      await addDirRecursive(wsBase, "workspaces/");
    } else {
      if (await fs.exists(wsBase + nowWs + "/")) {
        await addDirRecursive(wsBase + nowWs + "/", `workspaces/${nowWs}/`);
      }
    }

    if (options.history) {
      await addDirRecursive(this.usrSubDir(userId, "history"), "history/");
    }

    if (options.saves) {
      const savesBase = this.usrSubDir(userId, "saves");
      await addFile(savesBase + "download.json", "saves/download.json");
      await addFile(savesBase + "wallpapers.json", "saves/wallpapers.json");
    }

    if (options.tempList) {
      await addDirRecursive(this.tmpListDir(userId), "saves/tmpList/");
    }

    if (options.cache) {
      await addDirRecursive(this.usrSubDir(userId, "storage"), "storage/");
    }

    if (options.offlineDB) {
      try {
        await import("dexie-export-import");

        const db = new e621DatabaseCache.E621Database(userId, this.rootDir);
        await db.init();
        const dbBlob = await db.export();
        exportFiles.set("offline.db", dbBlob);
      } catch (e) {
        console.error("Offline DB Export failed", e);
      }
    }

    if (mode === "zip") {
      const zip = new JSZip();
      for (const [vPath, data] of exportFiles.entries()) {
        zip.file(vPath, data);
      }
      return await zip.generateAsync({ type: "uint8array", compression: "STORE" });
    }
    else if (mode === "folder") {
      if (!dirHandle) throw new Error("Folder mode requires dirHandle");
      for (const [vPath, data] of exportFiles.entries()) {
        const segments = vPath.split("/");
        const fileName = segments.pop();
        let currentHandle = dirHandle;

        for (const folder of segments) {
          if (folder) {
            currentHandle = await currentHandle.getDirectoryHandle(folder, { create: true });
          }
        }

        if (fileName) {
          const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(data);
          await writable.close();
        }
      }
    }
  }

  public async importUser(
    userId: string,
    options: UserIOOptions,
    mode: "zip" | "folder",
    source: Blob | Uint8Array | ArrayBuffer | any
  ): Promise<void> {
    if (!await this.havThisUser(userId)) {
      await fs.mkdir(this.usrDir(userId), { recursive: true });
      await this.createFolder(userId);
    }

    const uDir = this.usrDir(userId);
    const importMap = new Map<string, Uint8Array | ArrayBuffer | Blob>();

    if (mode === "zip") {
      const rawData = source instanceof Blob ? await source.arrayBuffer()
        : source instanceof Uint8Array ? source.buffer
          : source;
      const zip = await JSZip.loadAsync(rawData);

      for (const file of Object.values(zip.files)) {
        if (!file.dir) {
          importMap.set(file.name, await file.async("uint8array"));
        }
      }
    }
    else if (mode === "folder") {
      const readDirRecursive = async (handle: any, currentPath: string) => {
        for await (const entry of handle.values()) {
          const path = currentPath + entry.name;
          if (entry.kind === 'directory') {
            await readDirRecursive(entry, path + '/');
          } else if (entry.kind === 'file') {
            const file = await entry.getFile();
            importMap.set(path, await file.arrayBuffer());
          }
        }
      };
      await readDirRecursive(source, "");
    }

    const writeFileFromMap = async (vPath: string, realPath: string) => {
      const data = importMap.get(vPath);
      if (data) {
        const segments = realPath.split("/").slice(0, -1);
        if (segments.length > 0) {
          await fs.mkdir(segments.join("/") + "/", { recursive: true });
        }
        await fs.writeFile(realPath, new Uint8Array(data as ArrayBuffer));
      }
    };

    await writeFileFromMap("setting.json", uDir + "setting.json");
    await writeFileFromMap("saveInfo.json", uDir + "saveInfo.json");
    await writeFileFromMap("state.json", uDir + "state.json");

    if (options.workspaces) {
      const wsBase = this.usrSubDir(userId, "workspaces");
      await fs.rm(wsBase, { recursive: true, force: true });
      await fs.mkdir(wsBase, { recursive: true });

      for (const vPath of importMap.keys()) {
        if (vPath.startsWith("workspaces/")) {
          await writeFileFromMap(vPath, uDir + vPath);
        }
      }
    }

    if (options.history) {
      const histBase = this.usrSubDir(userId, "history");
      await fs.rm(histBase, { recursive: true, force: true });
      await fs.mkdir(histBase, { recursive: true });
      for (const vPath of importMap.keys()) {
        if (vPath.startsWith("history/")) await writeFileFromMap(vPath, uDir + vPath);
      }
    }

    if (options.saves) {
      await writeFileFromMap("saves/download.json", uDir + "saves/download.json");
      await writeFileFromMap("saves/wallpapers.json", uDir + "saves/wallpapers.json");
    }

    if (options.tempList) {
      const tmpBase = this.tmpListDir(userId);
      await fs.rm(tmpBase, { recursive: true, force: true });
      await fs.mkdir(tmpBase, { recursive: true });
      for (const vPath of importMap.keys()) {
        if (vPath.startsWith("saves/tmpList/")) await writeFileFromMap(vPath, uDir + vPath);
      }
    }

    if (options.cache) {
      const cacheBase = this.usrSubDir(userId, "storage");
      await fs.rm(cacheBase, { recursive: true, force: true });
      await fs.mkdir(cacheBase, { recursive: true });
      for (const vPath of importMap.keys()) {
        if (vPath.startsWith("storage/")) await writeFileFromMap(vPath, uDir + vPath);
      }
    }

    if (options.offlineDB && importMap.has("offline.db")) {
      try {
        await import("dexie-export-import");

        const dbBlobData = importMap.get("offline.db")!;
        const blob = new Blob([dbBlobData as any]);
        const db = new e621DatabaseCache.E621Database(userId, this.rootDir);

        await db.delete();
        await db.init();
        await db.import(blob);
      } catch (e) {
        console.error("Offline DB Import failed", e);
      }
    }

    try {
      const stateStore = await this.userState(userId);
      const state = await stateStore.get();
      const wsBase = this.usrSubDir(userId, "workspaces");

      if (!await fs.exists(wsBase + state.nowWorkSpace + "/")) {
        const availableWorkspaces = await this.listWorkspaces(userId);

        if (availableWorkspaces.length > 0) {
          const firstWs = availableWorkspaces[0];
          await stateStore.set(prev => {
            prev.nowWorkSpace = firstWs;
            return prev;
          });
          console.warn(`Workspace [${state.nowWorkSpace}] not found. Fallback to [${firstWs}].`);
        } else {
          const newWsId = "0";
          const defaultWs: workSpaceType.WorkSpaces.WorkSpaces = {
            id: newWsId,
            setting: { wallpaper: { url: BACKGROUND_IMAGE.src }, color: "#ffffff" },
            note: { name: "Main", note: "" },
            status: [],
            preview: []
          };
          await this.addWorkspace(userId, defaultWs);
          await stateStore.set(prev => {
            prev.nowWorkSpace = newWsId;
            return prev;
          });
        }
      }
    } catch (e) {
      console.error("Workspace state validation failed after import", e);
    }
  }

  // #endregion

}