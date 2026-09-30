import type { NextPage } from 'next'
import { ReactNode, useRef } from 'react'

import style from "./components.module.scss"
import Link from 'next/link';


/*******/

export const After: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["After"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const Before: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["Before"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const ClipLineLarge: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["ClipLineLarge"]}>
      <span {...Prop} />
    </span>
  );
};
export const ClipLineLarge2: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["ClipLineLarge"]} set-title="">
      <span {...Prop} />
    </span>
  );
};


/*******/

export const ClipLine: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["ClipLine"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const ClipLineSpace: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["ClipLineSpace"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const ClipLineText: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["ClipLineText"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const ClipLineText2: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["ClipLineText2"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const CodeText: NextPage<React.ComponentProps<"code">> = (Prop) => {
  return (
    <span className={style["CodeText"]}>
      <code {...Prop} />
    </span>
  );
};

/*******/

export const SmallText: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["SmallText"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const EmpText: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["EmpText"]}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const HideText: NextPage<React.ComponentProps<"span">> = (Prop) => {
  return (
    <span className={style["HideText"]} {...Prop}>
      <span {...Prop} />
    </span>
  );
};

/*******/

export const InnerContent: NextPage<React.ComponentProps<"blockquote">> = (Prop) => {
  return (
    <div className={style["InnerContent"]}>
      <blockquote {...Prop} />
    </div>
  );
};

/*******/

export const Title: NextPage<React.ComponentProps<"h1">> = (Prop) => {
  const ctn = <div className={style["Title"]} id={Prop.id}>
    <Before>
      <span />
    </Before>
    <div className={style["Text"]}>{Prop.children ? <h1 {...Prop} /> : <h1 {...Prop} >{"Untitle"}</h1>}</div>
    <After />
    <ClipLine />
  </div>
  return Prop.id ?
    <Link href={`#${Prop.id}`}>
      {ctn}
    </Link>
    : ctn;
};

/*******/

export const Subtitle: NextPage<React.ComponentProps<"h2">> = (Prop) => {
  const ctn = <div className={style["Subtitle"]}>
    <Before />
    <div className={style["Text"]}>{Prop.children ? <h2 {...Prop} /> : <h2 {...Prop} >{"No Any Content"}</h2>}</div>
    <After />
  </div>
  return Prop.id ?
    <Link href={`#${Prop.id}`}>
      {ctn}
    </Link>
    : ctn;
};

/*******/



export const Thirdtitle: NextPage<React.ComponentProps<"h3">> = (Prop) => {
  const ctn = <div className={style["Thirdtitle"]}>
    <span className={style["BeforeLine"]} />
    <div className={style["Text"]}>{Prop.children ? <h3 {...Prop} /> : <h3 {...Prop} >{"Empty"}</h3>}</div>
  </div>
  return Prop.id ?
    <Link href={`#${Prop.id}`}>
      {ctn}
    </Link>
    : ctn;
};

export default {
  After,
  Before,
  ClipLineLarge,
  ClipLineLarge2,
  ClipLine,
  ClipLineSpace,
  ClipLineText,
  ClipLineText2,
  CodeText,
  SmallText,
  EmpText,
  HideText,
  InnerContent,
  Title,
  Subtitle,
  Thirdtitle,
}