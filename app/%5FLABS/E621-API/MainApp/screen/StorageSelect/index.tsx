"use client"

import { useCallback, useEffect, useState } from "react"
import style from "./style.module.scss"

import opfs from "@/data/module/functions/module/opfs";
import clsx from "clsx";
import { SET_NOW_STORAGE, SET_READY, SET_STORAGE_SELECT_MODE } from "../../core/globals";
import { _app, newInputSync } from "@/app/_app";
import functions from "@/data/module/functions";
import { exportStorage, importStorage, pickArchiveFile } from "./storageArchive";
import { NODATA } from "../../ui/NoData";
const fs = opfs.promises

const storageNameMatch = /E621-App\[(.*)\]/

const getNameMatch = (path: string) => path.match(storageNameMatch)![1]!
const getName = (name: string) => `E621-App[${name}]`

const STORAGE_NAME_MAX = 64

const validateStorageName = (name: string, existing: string[], self?: string): string | null => {
  if (!name) return "Storage name cannot be empty"
  if (name.length > STORAGE_NAME_MAX) return `Storage name is too long (max ${STORAGE_NAME_MAX})`
  if (/[\\/\[\]]/.test(name)) return "Storage name cannot contain / \\ [ ]"
  if (/[\u0000-\u001f\u007f]/.test(name)) return "Storage name cannot contain control characters"
  if (name === "." || name === "..") return "Invalid storage name"
  if (name !== self && existing.includes(getName(name))) return "Storage already exists"
  return null
}

export default function StorageSelect() {
  const [start, _start] = useState(false)
  const [storages, setStorages] = useState<string[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    const timout = setTimeout(() => {
      _start(true)
    }, 250);
    return () => {
      clearTimeout(timout)
    }
  }, [])

  const scanStorage = useCallback(async () => {

    const dirs = (await fs.readdir("/")).filter(e => storageNameMatch.test(e))

    setStorages(dirs.map(e => `/${e}`))
    return dirs
  }, [])

  useEffect(() => {
    scanStorage()
  }, [])


  const newInputSleep = async () => await functions.timeSleep(5e2)

  const applyStorage = useCallback(async (path: string) => {
    SET_NOW_STORAGE(getNameMatch(path))
    SET_STORAGE_SELECT_MODE(false)
    SET_READY(false)
    setTimeout(() => {
      SET_READY(true)
    }, 100);
  }, []);

  const newStorage = useCallback(async () => {
    let value = "StorageName"
    while (true) {
      const input = await newInputSync.textInput(`Create a New Storage`, value)
      if (input === undefined) return;
      const storageName = input.trim()
      const dirs = await scanStorage()
      const error = validateStorageName(storageName, dirs)
      if (!error) {
        applyStorage(getName(storageName))
        return;
      }
      _app.throwNewNotic(error)
      value = input
      await newInputSleep()
    }
  }, [applyStorage, scanStorage])

  const deleteStorage = useCallback(async (name: string) => {
    const q1 = await newInputSync.message(
      `are you sure you wanna delete this storage?<br>target : ${name}`,
      [{ name: "yap", value: "y", key: "Enter" }, { name: "nah", value: "" }]
    )
    if (q1 !== "y") return;
    await newInputSleep()
    const q2 = await newInputSync.message(
      `all everything (account,workspace,history, etc.) will be gone, are you sure<br>target : ${name}`,
      [{ name: "yes i know", value: "y", key: "Enter" }, { name: "hmmm wait....", value: "" }]
    )
    if (q2 !== "y") return;
    await newInputSleep()
    const q3 = await newInputSync.message(
      `last warning!<br>it will be gone forever, you wont be able to restore it<br>target : ${name}`,
      [{ name: "just delete it", value: "y", key: "Delete" }, { name: "no i wanna keep it", value: "" }]
    )
    if (q3 !== "y") return;
    await fs.rmdir(name, { recursive: true });
    await scanStorage()
  }, []);

  const renameStorage = useCallback(async (name: string) => {
    const original = getNameMatch(name)
    let value = original
    while (true) {
      const input = await newInputSync.textInput(`Rename this storage / original is "${original}"`, value)
      if (input === undefined) return; // cancelled
      const newName = input.trim()
      if (newName === original) return;
      const dirs = await scanStorage()
      const error = validateStorageName(newName, dirs, original)
      if (!error) {
        try {
          await fs.rename(name, getName(newName))
        } catch (e) {
          _app.throwNewNotic(`Rename failed: ${(e as Error).message}`)
        }
        await scanStorage()
        return;
      }
      _app.throwNewNotic(error)
      value = input
      await newInputSleep()
    }
  }, [scanStorage])


  const exportStorageZip = useCallback(async (path: string) => {
    try {
      await exportStorage(path, getNameMatch(path))
    } catch (e) {
      _app.throwNewNotic(`Export failed: ${(e as Error).message}`)
    }
  }, [])

  const importStorageZip = useCallback(async () => {
    const file = await pickArchiveFile()
    if (!file) return;
    let value = file.name.replace(/\.zip$/i, "")
    while (true) {
      const input = await newInputSync.textInput(`Import as / name this storage`, value)
      if (input === undefined) return;
      const storageName = input.trim()
      const dirs = await scanStorage()
      const error = validateStorageName(storageName, dirs)
      if (!error) {
        try {
          setImporting(true)
          await importStorage(file, `/${getName(storageName)}`)
        } catch (e) {
          _app.throwNewNotic(`Import failed: ${(e as Error).message}`)
        } finally {
          setImporting(false)
        }
        await scanStorage()
        return;
      }
      _app.throwNewNotic(error)
      value = input
      await newInputSleep()
    }
  }, [scanStorage])

  return <div
    id={style["StorageSelect"]}
    className={clsx(!start && style["hide"])}
  >
    <div className={style["Background"]}>
      <div className={style["MainText"]}>{"STORAGE SELECTOR"}</div>
    </div>

    <div className={style["selector"]}>
      <div className={style["solds"]}>
        {storages.map((pathName, index) => <div
          key={"storage-sold-" + index}
          className={style["sold"]}
        >
          <div className={style["main"]}>
            <div className={style["name"]}>{pathName}</div>
            <div className={style["buttons"]}>
              <button
                onClick={_ => applyStorage(pathName)}
              >{"Use"}</button>
              <button
                onClick={_ => deleteStorage(pathName)}
              >{"Delete"}</button>
              <button
                onClick={_ => renameStorage(pathName)}
              >{"Rename"}</button>
              <button
                onClick={_ => exportStorageZip(pathName)}
              >{"Export"}</button>
            </div>
          </div>
        </div>)}
      </div>
    </div>

    <div className={style["Buttons"]}>
      <button onClick={newStorage}>{"New Storage"}</button>
      <button onClick={importStorageZip}>{"Import"}</button>
    </div>

    <div className={clsx(style["NoData"], importing && style["display"])}>
      <NODATA.Loading />
    </div >
  </div >
}