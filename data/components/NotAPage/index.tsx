import type { NextPage } from 'next';
import style from './style.module.scss';
import { useEffect, useMemo, useState } from 'react';
import { Kiasole, setCustomCommandType } from '@/pages/_app';
import Link from 'next/link';
import functions from '@/data/module/functions';
import HeadSetting from '../HeadSetting';
import WebEffect, { ParallaxItem } from '@/data/module/WebEffect';

const { htmlElement } = functions;
type NAP = {
  info?: string[]
}

const NotAPage: NextPage<NAP> = (prop) => {

  const [nowDir, setDir] = useState<string>("")
  const [ParallaxEffectLock, setParallaxEffectLock] = useState<boolean>(false)

  const text = useMemo(() => (
    prop.info ?
      prop.info.map((e, i) => <div className={style["Line"]} key={i}>{htmlElement.splitToSpan(e)}</div>)
      :
      <>
        <div className={style["Line"]}>{htmlElement.splitToSpan("THIS IS NOT A PAGE")}</div>
        <div className={style["Line"]}>{htmlElement.splitToSpan("IT JUST A COMPONENT")}</div>
      </>
  ), [])

  useEffect(() => {
    setDir(window.location.pathname)
  }, [])

  useEffect(() => {
    Kiasole.setCustomCommand((() => {
      const _: setCustomCommandType = (log) => [
        {
          name: "backtoroot",
          alias: ["/"],
          dsc: "back to root",
          action: async () => {
            document.getElementById("gobegobe")!.click();
            await log("回家 勾北 勾北");
          }
        },

      ]
      return _
    }))

    return () => {
      Kiasole.setCustomCommand(undefined)
    }
  }, [])

  useEffect(() => {
    document.getElementById(style["InnerContent"])?.classList.remove(style["hide"])
  }, [])

  useEffect(() => {
    const keyEvent = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyL") {
        setParallaxEffectLock(e => !e)
      }
    }

    document.addEventListener("keydown", keyEvent)
    return () => {
      document.removeEventListener("keydown", keyEvent)
    }
  }, [])

  useEffect(() => {
    const list: [string, number, number][] = [
      ["efct-UHD", 5, 5],
      ["efct-BG", -5, -5],

      ["efct-BH1", -8, -5],
      ["efct-BH2", -8, -5],
      ["efct-BH3", -8, -5],

      ["efct-AFK", -2, -2],
    ]

    const effect = WebEffect.pageParallaxEffect(
      list.map(e => ({
        Element: document.getElementById(e[0]),
        XoffSet: e[1],
        YoffSet: e[2],
      })) as ParallaxItem[],
      () => ParallaxEffectLock
    )

    if (ParallaxEffectLock) {
      effect.Reset();
    }

    return () => {
      effect.RemoveEvent()
    }
  }, [ParallaxEffectLock])

  return (
    <>
      <HeadSetting title='Not A Page' />
      <div id={style["Frame"]} >
        <div id={style["InnerContent"]} className={style["hide"]}>

          <div className={style["BG"]} id='efct-BG'>
            <div className={style["Background"]}>
              <div className={style["G1"]} />
              <div className={style["G2"]} />
              <div className={style["G3"]} id='efct-BH1' />
              <div className={style["G4"]} id='efct-BH2' />
            </div>

            <div className={style["AFK"]} id='efct-AFK'>
              <div className={style["Circle"]}>
                {[
                  10,
                  20,
                  40,
                  50,
                  60,
                  80,
                  100,
                ].map((e, i) =>
                  <div key={i} className={style["cer"]} style={{
                    transitionDelay: (i * .15) + .1 + "s",
                    filter: `blur(${(i * 2) + 2}px)`,
                  }} >
                    <div className={style["zoom"]} style={{
                      animationDelay: (i * .2) + "s",
                      transform: " perspective(80rem) rotateX(71deg)"
                    }}>
                      <div className={style["rot"]} style={{
                        transform: `${i % 2 === 0 ? "none" : "rotateY(180deg)"}`
                      }}>
                        <div style={{
                          width: e + "vw",
                          height: e + "vw",
                          animationDuration: (i * 10) + 5 + "s",

                        }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={style["BlackHole1"]} id='efct-BH3' />

            <div className={style["Dark"]}>
              <div className={style["G1"]} />
              <div className={style["G2"]} />
            </div>
          </div>

          <div className={style["UHD"]} id='efct-UHD'>
            <div className={style["Dir"]}>
              <span>{htmlElement.splitToSpan(nowDir)}</span>
            </div>

            <div className={style["Text"]}>
              <div className={style["Main"]}>
                {text}
              </div>
              <div className={style["Shadow"]}>
                {text}
              </div>
              <div className={style["Border"]}>
                {text}
              </div>
            </div>

            <div className={style["Back"]}>
              <Link href={"/"} id="gobegobe" className={style["pointerEvent"]}>{"/"}</Link>
              <span className={style["Tips"]}>{htmlElement.splitToSpan("^ the  only  way  you  can  back  to  root", " ")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotAPage