import { NextApiRequest, NextApiResponse } from "next";

const USER_AGENT = "KIASENOLO_E621App/0.0.0 (by KIASENOLO; kilo93466@gmail.com)";

const ALLOWED_HOSTS = [
  "static1.e621.net",
  "static2.e621.net",
  "static3.e621.net",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "沒給 url" });
  }

  let parsed: URL;
  try {
    parsed = new URL(decodeURIComponent(url));
  } catch {
    return res.status(400).json({ error: "url 格式爛掉了" });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return res.status(403).json({ error: `不允許 proxy 這個域名：${parsed.hostname}` });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        ...(req.headers.range ? { "Range": req.headers.range } : {}),
      },
    });

    res.status(upstream.status);

    const forward = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
      "last-modified",
      "etag",
    ];
    for (const key of forward) {
      const val = upstream.headers.get(key);
      if (val) res.setHeader(key, val);
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");

    if (!upstream.body) {
      return res.end();
    }

    const reader = upstream.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); return; }
        res.write(value);
      }
    };
    await pump();

  } catch (err) {
    console.error("video proxy error:", err);
    res.status(500).json({ error: "proxy 炸了" });
  }
}