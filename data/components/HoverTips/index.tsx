import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import style from "./style.module.scss";
import functions from '@/data/module/functions';

const HoverTips: NextPage = () => {
  const [tipsCtx, setTipsCtx] = useState<string>("")

  useEffect(() => {
    const tips = document.getElementById(style["hoverTips"])!;
    const tips2 = document.getElementById(style["hoverTips2"])!
    const FLASH_ELE = document.getElementById(style["FLASH"])!
    tips.classList.remove(style["show"])

    const FLASH = (color?: string) => {
      {
        const div = document.createElement("div")

        if (color) {
          div.style.backgroundColor = color
        }

        div.style.zIndex = new Date().getTime().toString()

        for (let index = 0; index < FLASH_ELE.children.length; index++) {
          const element = FLASH_ELE.children[index];
          element.remove()
        }

        FLASH_ELE.appendChild(div);

        (
          async () => {

            await functions.timeSleep(1e3)

            div.remove()
          }
        )()

        return div
      }
    }

    const displayTips = (tip: string) => {
      setTipsCtx(tip)

      if (tipsCtx !== tip) {
        FLASH()
      }

      tips.classList.add(style["show"])

      {
        const tipsStyle = tips.style;
        tipsStyle.width = (tips2.offsetWidth + 1) + "px"
        tipsStyle.height = tips2.offsetHeight + "px"
      };
    }

    const hideTips = () => {
      tips.classList.remove(style["show"])
    }

    const isTip = (tar: HTMLElement | null) => {
      if (tar) {
        if (tar.hasAttribute("hover-tips")) {
          displayTips(tar.getAttribute("hover-tips")!)
        } else if (tar.parentElement) {
          isTip(tar.parentElement)
        } else {
          hideTips()
        }
      }
    }

    const MouseMove = (e: MouseEvent) => {

      const target = e.target as HTMLElement | null

      isTip(target)

      const X = e.clientX;
      const Y = e.clientY;
      {
        const tipsStyle = tips.style;
        tipsStyle.top = Y + "px"
        tipsStyle.left = X + "px"
      };

      if ((window.innerWidth - X < tips2.offsetWidth) && (Y < tips2.offsetHeight)) {
        tips.classList.add(style["LeftBottom"])
      } else {
        tips.classList.remove(style["LeftBottom"])

        if (window.innerWidth - X < tips2.offsetWidth) {
          tips.classList.add(style["LeftTop"])
        } else {
          tips.classList.remove(style["LeftTop"])
        }

        if (Y < tips2.offsetHeight) {
          tips.classList.add(style["RightBottom"])
        } else {
          tips.classList.remove(style["RightBottom"])
        }
      }

    }

    document.addEventListener("mousemove", MouseMove);

    return () => {
      document.removeEventListener("mousemove", MouseMove);

      tips.classList.remove(style["show"])
    }
  }, [tipsCtx])

  return (
    <>
      <svg aria-hidden="true" style={{ display: "none" }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="6.29" numOctaves="6" stitchTiles="stitch"></feTurbulence>
        </filter>
      </svg>
      <div id={style["hoverTips"]} >
        <div id={style["FLASH"]} />
        <div dangerouslySetInnerHTML={{ __html: tipsCtx }}></div>
      </div>

      <div id={style["hoverTips2"]} dangerouslySetInnerHTML={{ __html: tipsCtx }} />

    </>
  )
}

export default HoverTips