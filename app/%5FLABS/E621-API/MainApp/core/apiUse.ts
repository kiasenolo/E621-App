import { E621 } from "../../types/e621";

export const makeQuery = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

type coreOptions = {
  userAgent?: string;
  baseUrl?: string;
}

type kiloUserAgentType = {
  appName: string;
  version: string;
  authorName: string;
  email?: string;
}

type authType = E621.BaseRequest['user']

function genUserAgent(opt: kiloUserAgentType) {
  const { appName, authorName, version, email } = opt
  return `${appName}/${version} (by ${authorName}${email ? `; ${email}` : ""})`
}

const defaultAgent = genUserAgent({
  appName: "KIASENOLO_E621App",
  version: "0.1.2",
  authorName: "KIASENOLO",
})

type baseReq<T> = E621.BaseRequest & T

export class E621_API_CORE {
  private USER_AGENT = defaultAgent;
  private BASE_URL = "https://e926.net";
  private AUTH_USER: authType = undefined

  get baseInfo() {
    return {
      USER_AGENT: this.USER_AGENT,
      BASE_URL: this.BASE_URL,
      AUTH_USER: this.AUTH_USER,
    }
  }

  constructor(opt?: coreOptions) {
    if (opt) {
      const { baseUrl, userAgent } = opt
      if (baseUrl) this.BASE_URL = baseUrl;
      if (userAgent) this.USER_AGENT = userAgent;
    }
  }

  public setBaseURL(url?: string) {
    this.BASE_URL = url ?? "https://e926.net";
  }

  public setUserAgent(agent?: kiloUserAgentType | string) {
    let newAgent = defaultAgent

    if (agent) {
      if (typeof agent === "string") newAgent = agent;
      else newAgent = genUserAgent(agent);
    }

    this.USER_AGENT = newAgent
    return newAgent
  }

  public setUserAuth(auth?: authType) {
    this.AUTH_USER = auth;
  }

  public async fetch<T>(
    endpoint: string,
    params: any = {},
    user: E621.BaseRequest['user'] = this.AUTH_USER)
    : Promise<T> {
    const url = `${this.BASE_URL}${endpoint}?${makeQuery(params)}`;

    const headers: HeadersInit = {
      "User-Agent": this.USER_AGENT,
      "Content-Type": "application/json",
    };

    if (user && user.name && user.key) {
      const auth = Buffer.from(`${user.name}:${user.key}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    const res = await fetch(url, { headers });
    console.log(url)
    console.log(headers)
    if (!res.ok) {
      console.error(`E621 Fetch Error: ${res.status} ${res.statusText}`);
      const body = await res.json().catch(() => null);
      const err = new Error("E621_FETCH_ERROR") as E621.FetchError;
      err.statusCode = res.status;
      err.upstreamBody = body;
      throw err;
    }

    return res.json() as Promise<T>;
  }

  /* ========[ POST ]======== */
  public async POST_GET(
    opt: baseReq<{
      id: number;
    }>
  ): Promise<E621.Post | null> {
    try {
      const data = await this.fetch<{ post: E621.Post }>(
        `/posts/${opt.id}.json`,
        {},
        opt.user
      );
      return data.post;
    } catch (e) {
      return null;
    }
  }

  public async POST_SEARCH(
    opt: baseReq<{
      tags: string | string[];
      limit?: number;
      page?: number | string;
    }>
  ): Promise<E621.Post[]> {
    const tagString = Array.isArray(opt.tags)
      ? opt.tags.join(" ")
      : opt.tags;

    const data = await this.fetch<{ posts: E621.Post[] }>(
      "/posts.json",
      {
        tags: tagString,
        limit: opt.limit || 75,
        page: opt.page || 1
      },
      opt.user
    );
    return data.posts;
  }

  /* ========[ TAG ]======== */
  public async TAG_GET(
    opt: baseReq<{
      name: string | string[];
    }>
  ): Promise<E621.Tag[]> {
    const nameString = Array.isArray(opt.name)
      ? opt.name.join(",")
      : opt.name;

    const data = await this.fetch<E621.TagsResponse>(
      "/tags.json",
      { "search[name]": nameString },
      opt.user
    );

    return data;
  }

  public async TAG_MATCH(
    opt: baseReq<{
      query: string;
      limit?: number;
    }>
  ): Promise<E621.Tag[]> {
    const data = await this.fetch<E621.TagsResponse>(
      "/tags.json",
      {
        "search[name_matches]": `*${opt.query}*`,
        "search[order]": "count",
        limit: opt.limit || 20
      },
      opt.user
    );
    return data;
  }

  /* ========[ POOL ]======== */
  public async POOL_GET(
    opt: baseReq<{
      id: number;
    }>
  ): Promise<E621.Pool | null> {
    try {
      const data = await this.fetch<E621.Pool>(
        `/pools/${opt.id}.json`,
        {},
        opt.user
      );
      return data;
    } catch {
      return null;
    }
  }

  /* ========[ WIKI ]======== */
  public async WIKI_GET(
    opt: baseReq<{
      title: string;
    }>
  ): Promise<E621.WikiPage | null> {
    try {
      const encoded = encodeURIComponent(opt.title.replace(/ /g, "_"));
      const data = await this.fetch<E621.WikiPage>(
        `/wiki_pages/${encoded}.json`,
        {},
        opt.user
      );
      return data;
    } catch (e) {
      return null;
    }
  }

  public async WIKI_SEARCH_BODY(
    opt: baseReq<{
      body_matches: string;
      limit?: number;
      page?: number | string;
    }>
  ): Promise<E621.WikiPage[]> {
    const data = await this.fetch<E621.WikiPage[]>(
      "/wiki_pages.json",
      {
        "search[body_matches]": opt.body_matches,
        limit: opt.limit ?? 20,
        page: opt.page ?? 1,
      },
      opt.user
    );
    return data;
  }

  public async WIKI_SEARCH_TITLE(
    opt: baseReq<{
      title: string;
      limit?: number;
      page?: number | string;
    }>
  ): Promise<E621.WikiPage[]> {
    const data = await this.fetch<E621.WikiPage[]>(
      "/wiki_pages.json",
      {
        "search[title]": opt.title,
        limit: opt.limit ?? 20,
        page: opt.page ?? 1,
      },
      opt.user
    );
    return data;
  }

  readonly methods = {
    posts: {
      get: this.POST_GET.bind(this),
      search: this.POST_SEARCH.bind(this),
    },
    tags: {
      get: this.TAG_GET.bind(this),
      nameMatch: this.TAG_MATCH.bind(this),
    },
    pools: {
      get: this.POOL_GET.bind(this),
    },
    wiki: {
      get: this.WIKI_GET.bind(this),
      searchBody: this.WIKI_SEARCH_BODY.bind(this),
      searchTitle: this.WIKI_SEARCH_TITLE.bind(this),
    },
  }

}

export const E621Internal = new E621_API_CORE();
