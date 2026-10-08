import { useEffect, useState } from "react"
import { GetNowTime } from "../utlis/other"
import { Resolution } from "./globals"

export const fuckingState = {
  resolution: () => {
    const [resolution, setResolution] = useState<Resolution>([0, 0]);

    useEffect(() => {
      const onResize = () => {
        setResolution([window.innerWidth, window.innerHeight])
      }
      onResize()
      window.addEventListener("resize", onResize)
      return () => {
        window.removeEventListener("resize", onResize)
      }
    }, [])

    return resolution
  },
  clock: () => {
    const [timeCode, setTimeCode] = useState<number>(GetNowTime())

    useEffect(() => {
      const interv = setInterval(() => {
        setTimeCode(GetNowTime())
      }, .2e3)

      return () => clearInterval(interv)
    }, [])

    return timeCode
  }
}

