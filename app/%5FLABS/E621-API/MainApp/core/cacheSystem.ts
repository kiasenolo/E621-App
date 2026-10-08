import { E621 } from "@/app/%5FLABS/E621-API/types/e621";
import Dexie, { Table } from 'dexie';


export type E621Post = E621.Post;
export type E621Pool = E621.Pool;

export interface CachedPost extends E621Post {
  all_tags: string[];
}

export class E621Database extends Dexie {
  posts!: Table<CachedPost, number>;
  pools!: Table<E621Pool, number>;

  constructor(user: string, storage: string) {
    super(storage + '/' + user + '/' + 'e621_enhanced_db');

    this.version(1).stores({
      posts: 'id, *all_tags',
      pools: 'id'
    });
  }

  async init() {
    try {
      await this.open();
      console.log('Dexie Database initialized');
    } catch (err) {
      console.error('Failed to initialize Dexie DB', err);
    }
  }

  async savePosts(posts: E621Post[]) {
    const postsToSave: CachedPost[] = posts.map(post => {
      const flattenedTags = Object.values(post.tags).flat();

      return {
        ...post,
        all_tags: flattenedTags
      };
    });

    await this.posts.bulkPut(postsToSave);
  }

  async savePool(pool: E621Pool) {
    await this.pools.put(pool);
  }

  async getPostsInPool(poolId: number): Promise<E621Post[]> {
    const pool = await this.pools.get(poolId);
    if (!pool || !pool.post_ids || pool.post_ids.length === 0) {
      return [];
    }

    const posts = await this.posts.bulkGet(pool.post_ids);
    const validPosts = posts.filter((p): p is CachedPost => p !== undefined);

    const orderMap = new Map(pool.post_ids.map((id, index) => [id, index]));
    validPosts.sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 0;
      const orderB = orderMap.get(b.id) ?? 0;
      return orderA - orderB;
    });

    return validPosts;
  }

  async searchPostsLocal(tags: string[], page: number, limit: number): Promise<E621Post[]> {
    const offset = (page - 1) * limit;

    const andTags: string[] = [];
    const excludeTags: string[] = [];
    const orTags: string[] = [];
    const metaTags: { key: string; value: string }[] = [];

    for (const t of tags) {
      if (t.startsWith('-')) {
        const content = t.substring(1);
        if (content.includes(':')) {
          const [key, ...valParts] = content.split(':');
          metaTags.push({ key: '-' + key.toLowerCase(), value: valParts.join(':').toLowerCase() });
        } else {
          excludeTags.push(content);
        }
      } else if (t.startsWith('~')) {
        orTags.push(t.substring(1));
      } else if (t.includes(':')) {
        const [key, ...valParts] = t.split(':');
        metaTags.push({ key: key.toLowerCase(), value: valParts.join(':').toLowerCase() });
      } else {
        andTags.push(t);
      }
    }

    let collection: Dexie.Collection<CachedPost, number>;

    if (andTags.length > 0) {
      collection = this.posts.where('all_tags').equals(andTags[0]);
    } else {
      collection = this.posts.toCollection();
    }

    collection = collection.filter(post => {
      const postTags = post.all_tags || [];

      for (let i = 1; i < andTags.length; i++) {
        if (!postTags.includes(andTags[i])) return false;
      }

      for (const ext of excludeTags) {
        if (postTags.includes(ext)) return false;
      }

      if (orTags.length > 0) {
        const hasOr = orTags.some(ot => postTags.includes(ot));
        if (!hasOr) return false;
      }

      for (const meta of metaTags) {
        const isNegative = meta.key.startsWith('-');
        const actualKey = isNegative ? meta.key.substring(1) : meta.key;

        let matches = false;

        if (actualKey === 'rating') {
          matches = post.rating === meta.value;
        }
        else if (actualKey === 'id') {
          matches = post.id.toString() === meta.value;
        }
        else if (actualKey === 'type') {
          const ext = post.file?.ext;
          if (meta.value === 'webm') matches = ext === 'webm';
          else if (meta.value === 'gif') matches = ext === 'gif';
          else if (meta.value === 'pic' || meta.value === 'image') matches = ['png', 'jpg', 'jpeg'].includes(ext);
          else if (meta.value === 'video') matches = ['webm', 'mp4'].includes(ext);
        }
        else if (actualKey === 'has') {
          const hasWhat = meta.value;
          if (hasWhat === 'source' || hasWhat === 'sources') {
            matches = !!(post.sources && post.sources.length > 0);
          }
          else if (hasWhat === 'description') {
            matches = !!(post.description && post.description.trim() !== '');
          }
          else if (hasWhat === 'parent') {
            matches = !!(post.relationships && post.relationships.parent_id !== null);
          }
          else if (hasWhat === 'children') {
            matches = !!(post.relationships && post.relationships.has_children);
          }
          else if (hasWhat === 'notes') {
            matches = !!post.has_notes;
          }
        }

        if (isNegative ? matches : !matches) {
          return false;
        }
      }

      return true;
    });

    const allMatched = await collection.toArray();

    allMatched.sort((a, b) => b.id - a.id);

    return allMatched.slice(offset, offset + limit);
  }
}