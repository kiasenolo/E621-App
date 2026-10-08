import JSZip from "jszip";
import opfs from "@/data/module/functions/module/opfs";
const fs = opfs.promises

async function listFiles(dir: string, base = ""): Promise<string[]> {
  const out: string[] = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) out.push(...await listFiles(`${dir}/${e.name}`, rel))
    else out.push(rel)
  }
  return out
}

export async function exportStorage(dirPath: string, name: string): Promise<void> {
  const root = dirPath.replace(/\/+$/, "")
  const zip = new JSZip()
  for (const rel of await listFiles(root)) {
    zip.file(rel, await fs.readFile(`${root}/${rel}`))
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${name}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function pickArchiveFile(): Promise<File | undefined> {
  return new Promise(resolve => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".zip,application/zip"
    input.onchange = () => resolve(input.files?.[0])
    input.oncancel = () => resolve(undefined)
    input.click()
  })
}

const isSafePath = (p: string) =>
  !!p && !p.startsWith("/") && !/\\/.test(p) && !p.split("/").some(s => s === ".." || s === ".")

export async function importStorage(file: File, destPath: string): Promise<void> {
  const zip = await JSZip.loadAsync(file)
  const files = Object.values(zip.files).filter(f => !f.dir)
  if (files.length === 0) throw new Error("Archive is empty")
  const bad = files.find(f => !isSafePath(f.name))
  if (bad) throw new Error(`Unsafe path in archive: ${bad.name}`)

  await fs.mkdir(destPath, { recursive: true })
  try {
    for (const f of files) {
      const full = `${destPath}/${f.name}`
      const parent = full.slice(0, full.lastIndexOf("/"))
      if (parent !== destPath) await fs.mkdir(parent, { recursive: true })
      await fs.writeFile(full, await f.async("uint8array"))
    }
  } catch (e) {
    await fs.rm(destPath, { recursive: true, force: true }).catch(() => { })
    throw e
  }
}
