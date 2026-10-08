import { useEffect, useState } from 'react'
import colormgr from '@/data/module/color'
import style from '../_app.module.scss'

const channels = [
  ["r", "ChannelR"],
  ["g", "ChannelG"],
  ["b", "ChannelB"],
] as const

export const defaultColorList = ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff", "#ffff00"]

const CUSTOM_COLOR_KEY = "kilo-custom-colors"

export const customColorStore = {
  list(): string[] {
    try {
      const v = JSON.parse(localStorage.getItem(CUSTOM_COLOR_KEY) ?? "[]")
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  },
  save(list: string[]) {
    try {
      localStorage.setItem(CUSTOM_COLOR_KEY, JSON.stringify(list))
    } catch { }
  },
  add(color: string) {
    const c = color.startsWith("#") ? color : "#" + color
    const list = customColorStore.list()
    if (!list.includes(c)) customColorStore.save([...list, c])
  },
  remove(index: number) {
    customColorStore.save(customColorStore.list().filter((_, i) => i !== index))
  },
}

export function useColorLists() {
  const [customColors, setCustomColors] = useState<string[]>([])

  const refresh = () => setCustomColors(customColorStore.list())

  const add = (color: string) => {
    customColorStore.add(color)
    refresh()
  }

  const remove = (index: number) => {
    customColorStore.remove(index)
    refresh()
  }

  useEffect(refresh, [])

  return { defaultColors: defaultColorList, customColors, add, remove }
}

export function ColorControl({ prefix, className, color, setColor, lists }: {
  prefix: string
  className: string
  color: string
  setColor: (color: string) => void
  lists: ReturnType<typeof useColorLists>
}) {
  const rgb = colormgr.hexToRgb(color)

  useEffect(() => {
    const root = document.documentElement.style
    const { r, g, b } = colormgr.hexToRgb(color)

    root.setProperty(prefix + "-r", r.toString())
    root.setProperty(prefix + "-g", g.toString())
    root.setProperty(prefix + "-b", b.toString())
  }, [color, prefix])

  const setChannel = (channel: "r" | "g" | "b", value: string) => {
    setColor(colormgr.rgbToHex({ ...rgb, [channel]: +value }))
  }

  return (
    <div className={[style["ColorContro"], className].join(" ")}>
      {channels.map(([channel, tips]) => (
        <div className={style["SettingUnit"]} key={channel}>
          <input
            type="range"
            min={0}
            max={255}
            value={rgb[channel]}
            onChange={e => setChannel(channel, e.target.value)}
            hover-tips={tips}
            kilo-style=""
          />
          <input
            type="number"
            min={0}
            max={255}
            value={rgb[channel]}
            onChange={e => setChannel(channel, e.target.value)}
            hover-tips={tips}
            kilo-style=""
          />
        </div>
      ))}
      <input
        type="text"
        className={style["HexInput"]}
        value={color}
        onChange={e => setColor(e.target.value)}
        hover-tips={"HexInput"}
        kilo-style=""
      />
      <div className={style["ColorList"]}>
        <div className={style["Default"]}>
          {lists.defaultColors.map((e, i) =>
            <button
              key={i}
              className={style["Color"]}
              onClick={() => setColor(e)}
              style={{ backgroundColor: e }}
              hover-tips={`預設顔色 : ${e}`}
            />
          )}
        </div>
        <div className={style["Custom"]}>
          {lists.customColors.map((e, i) =>
            <button
              key={i}
              className={style["Color"]}
              onClick={() => setColor(e)}
              onContextMenu={ev => {
                ev.preventDefault()
                lists.remove(i)
              }}
              style={{ backgroundColor: e }}
              hover-tips={`自定顔色 : ${e} [ 右鍵刪除 ]`}
            />
          )}
          <button
            className={style["Add"]}
            onClick={() => lists.add(color)}
            hover-tips="新增顔色"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
