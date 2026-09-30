import { JSX } from "react"

const HTMLElement = {
  splitToSpan: function (text: string, split?: string | RegExp) {
    return text.split(split ?? "").map((e, i) => <span key={i}>{e}</span>)
  },
  splitToElement: function (text: string, map: (e: string, index: number) => JSX.Element, split?: string | RegExp) {
    return text.split(split ?? "").map(map)
  }
}
export default HTMLElement