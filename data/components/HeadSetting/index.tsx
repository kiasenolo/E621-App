'use client'

import type { NextPage } from 'next';
import { usePathname } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';

// 以前 next/head 會自動把 _app 的預設標題蓋掉 現在 React 19 不會去重複的 <title>
// 所以記一下目前有幾個 HeadSetting 掛著 _app 只有在沒有的時候才放預設標題
let mounted = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
};

export const useHasHeadSetting = () =>
  useSyncExternalStore(subscribe, () => mounted > 0, () => false);

export interface HeadSettingProps {
  title?: string;
  description?: string;
  icon?: string;
  keywords?: string;
  ogp?: {
    title?: string;
    url?: string;
    description?: string;
    image?: string;
    color?: string;
    type?: 'website' | 'article' | 'profile';
  };
  noIndex?: boolean;
}

const HeadSetting: NextPage<HeadSettingProps> = (prop) => {
  const pathname = usePathname();

  useEffect(() => {
    mounted++;
    listeners.forEach(e => e());
    return () => {
      mounted--;
      listeners.forEach(e => e());
    };
  }, []);
  const siteName = "KIASENOLO";
  const domain = "https://public-project-kilo-things.vercel.app";

  const fullTitle = prop.title ?? siteName;
  const description = prop.ogp?.description ?? prop.description ?? "沒寫描述捏.w.";

  const image = prop.ogp?.image
    ? (prop.ogp.image.startsWith('http') ? prop.ogp.image : `${domain}${prop.ogp.image}`)
    : `${domain}/og-image.png`;

  const url = prop.ogp?.url ?? `${domain}${pathname}`;
  const color = prop.ogp?.color ?? "#aff";

  // App Router 沒有 next/head 了 React 19 會把 <title> <meta> <link> 自動搬到 <head>
  return (
    <>
      {/* Base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {prop.keywords && <meta name="keywords" content={prop.keywords} />}
      <link rel="icon" href={prop.icon ?? "/favicon.svg"} sizes="any" />
      <link rel="canonical" href={url} />

      {/* --- Robots Control --- */}
      {prop.noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* --- Open Graph / Facebook / Discord --- */}
      <meta property="og:type" content={prop.ogp?.type ?? "website"} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={prop.ogp?.title ?? fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* --- Twitter / X Preview --- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={prop.ogp?.title ?? fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* --- Theme Color / UI Branding --- */}
      <meta name="theme-color" content={color} />
      <meta name="msapplication-TileColor" content={color} />
    </>
  );
};

export default HeadSetting;