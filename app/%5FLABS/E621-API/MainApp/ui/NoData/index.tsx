import style from "./style.module.scss"
import functions from "@/data/module/functions"
import clsx from "clsx/lite"
import { DELAY_EFFECT } from "../../core/helpers"

export const NODATA = {
  _Fetching: function (loading: boolean) {
    const Cers = (<div className={style["Cers"]}>
      {
        (loading ? [
          [100, 8, 3],
          [55, 6, 1],
        ] : [
          [400, 15, 6],
          [250, 12, 4],
          [100, 10, 2],
        ]).map((e, i) => <div className={style["cer"]} key={i}>
          <div className={style["Scale"]}
            style={{
              transitionDelay: DELAY_EFFECT(`${i * .2}s`)
            }}>
            <div className={style["Mri"]}>
              <div className={style["C"]} style={{
                width: `${e[0]}px`,
                borderWidth: `${e[1]}px`,
                animationDuration: `${e[2]}s`
              }} />
            </div>
          </div>
        </div>)}
    </div>)

    return (<div className={clsx(
      style["Fetching"],
      loading && style["Loading"]
    )}>
      {Cers}
      <div className={style["Line"]}>
        {Cers}
        <div className={style["Fill"]}>
          {Cers}
        </div>
      </div>
    </div>)
  },
  Fetching: () => NODATA._Fetching(false),
  Loading: () => NODATA._Fetching(true),
  None: function ({ WithFilter }: { WithFilter?: boolean }) {
    return (<div className={style["None"]}>
      <div className={style["Text"]}>
        <div className={style["Line"]}>
          {functions.htmlElement.splitToElement("NO DATA", (e, i) => <div key={i} className={style["case"]}>{e}</div>)}
        </div>
        {WithFilter && <div className={style["Line"]}>
          {functions.htmlElement.splitToElement("WITH FILTER", (e, i) => <div key={i} style={{ fontSize: "25px" }} className={style["case"]}>{e}</div>)}
        </div>}
      </div>
    </div>)
  },
  Error: function ({ error, Reload }: { error: string, Reload: () => void }) {
    return (
      <div className={style["Error"]}>
        <div>
          {error}
          <br />
          我懶惰寫界面
          <br />
          <span onClick={Reload}>retry</span>
        </div>
      </div>
    )
  },
}

/* ========================================================================================= */

