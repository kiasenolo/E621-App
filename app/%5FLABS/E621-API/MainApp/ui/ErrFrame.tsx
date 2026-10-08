import React, { JSX } from "react"
import clsx from "clsx/lite"
import style from "../style.module.scss"

export type ErrFrameProp = {
  ctns: JSX.Element[];
  ref: React.Ref<HTMLDivElement>;
  ready: boolean;
  hide: boolean;
}

export const ErrFrame = ({
  ctns,
  ref,
  ready,
  hide,
}: ErrFrameProp) => {
  return <div
    id={style["ERROR"]}
    className={clsx(
      ready && style["ready"],
      hide && style["hide"]
    )}
    ref={ref}
  >
    {ctns.map((e, i) => <div key={i} className={style["area"]} style={{ transitionDelay: `${i * .06}s` }}>{e}</div>)}
  </div >
}
