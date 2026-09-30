
export namespace E621 {
  export interface BaseRequest {
    user?: {
      name: string;
      key: string;
    };
  }

  export interface PostFile {
    width: number;
    height: number;
    ext:
    | "jpg"
    | "jpeg"
    | "png"
    | "gif"
    | "webm"
    | "webp"
    | "mp4";
    size: number;
    md5: string;
    url: string | null;
  }

  export interface PostPreview {
    width: number;
    height: number;
    url: string | null;
  }

  export interface PostScore {
    up: number;
    down: number;
    total: number;
  }

  export interface PostTags {
    general: string[];
    species: string[];
    character: string[];
    copyright: string[];
    artist: string[];
    invalid: string[];
    lore: string[];
    meta: string[];
  }

  export interface Post {
    id: number;
    created_at: string;
    updated_at: string;
    file: PostFile;
    preview: PostPreview;
    sample: PostPreview;
    score: PostScore;
    tags: PostTags;
    locked_tags: string[];
    change_seq: number;
    flags: {
      pending: boolean;
      flagged: boolean;
      note_locked: boolean;
      status_locked: boolean;
      rating_locked: boolean;
      deleted: boolean;
    };
    rating: "s" | "q" | "e";
    fav_count: number;
    sources: string[];
    pools: number[];
    relationships: {
      parent_id: number | null;
      has_children: boolean;
      has_active_children: boolean;
      children: number[];
    };
    approver_id: number | null;
    uploader_id: number;
    description: string;
    comment_count: number;
    is_favorited: boolean;
    has_notes: boolean;
    duration: number | null;
  }

  export enum TagCategory {
    General = 0,
    Artist = 1,
    Copyright = 3,
    Character = 4,
    Species = 5,
    Invalid = 6,
    Meta = 7,
    Lore = 8,
  }

  export interface Tag {
    id: number;
    name: string;
    post_count: number;
    related_tags: string;
    related_tags_updated_at: string;
    category: TagCategory;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
  }

  export interface Pool {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    creator_id: number;
    description: string;
    is_active: boolean;
    category: "series" | "collection";
    post_ids: number[];
    creator_name: string;
    post_count: number;
  }

  export interface WikiPage {
    id: number;
    title: string;
    body: string;
    creator_id: number;
    creator_name: string;
    created_at: string;
    updated_at: string;
    is_locked: boolean;
    is_deleted: boolean;
  }

  export type PostsResponse = { posts: Post[] };
  export type TagsResponse = Tag[];
  export type PoolResponse = Pool;
  export type PoolsResponse = Pool[];

  export interface FetchError extends Error {
    statusCode: number;
    upstreamBody: unknown;
  }
}