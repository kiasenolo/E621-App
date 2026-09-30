import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const siteName = "KIASENOLO";
  const domain = "https://public-project-kilo-things.vercel.app";

  const fullTitle = prop.title ?? siteName;
  const description = prop.ogp?.description ?? prop.description ?? "沒寫描述捏.w.";

  const image = prop.ogp?.image
    ? (prop.ogp.image.startsWith('http') ? prop.ogp.image : `${domain}${prop.ogp.image}`)
    : `${domain}/og-image.png`;

  const url = prop.ogp?.url ?? `${domain}${router.asPath}`;
  const color = prop.ogp?.color ?? "#aff";

  return (
    <Head>
      {/* Base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {prop.keywords && <meta name="keywords" content={prop.keywords} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
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
    </Head>
  );
};

export default HeadSetting;