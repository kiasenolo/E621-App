import { NextPage } from "next";
import { useEffect, useRef } from "react";
import style from "./style.module.scss"

export interface settingForKILO {
  defaultImage?: string
}

export interface BackgroundProp {
  className?: string
  id?: string
  src?: string
  srcObject?: MediaStream | null
  settingForKILO?: settingForKILO
}

const Background: NextPage<BackgroundProp> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (props.srcObject) {
        videoRef.current.srcObject = props.srcObject;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [props.srcObject]);

  return (
    <div className={`${style["Background"]} ${props.className}`} id={props.id}>
      {props.src && (
        <div className={style["Image"]} style={{ backgroundImage: `url(${props.src})` }} />
      )}
      <div className={`${style["Mask"]} ${props.settingForKILO?.defaultImage ? (props.settingForKILO?.defaultImage === props.src) ? style["Show"] : "" : ""}`} />
      <video
        ref={videoRef}
        className={style["Video"]}
        autoPlay={true}
        loop={true}
        muted={true}
        playsInline={true}
        src={props.src}
      />
    </div>
  )
}

export default Background