import { db, type Feed, type Article, type SyncLog } from './db.ts';
import { normalizeUrl } from './normalizeUrl.ts';

export const feedsRepo = {
  async add(feed: Omit<Feed, 'id'>): Promise<number> {
    console.log('feedsRepo.add: Adding feed:', feed);
    const normalizedUrl = normalizeUrl(feed.url);
    
    // Check for duplicates
    const existing = await db.getFeedByUrl(normalizedUrl);
    if (existing) {
      throw new Error(`Feed already exists: ${feed.title || normalizedUrl}`);
    }

    // Validate
    if (!feed.title?.trim()) {
      throw new Error('Feed title is required');
    }

    try {
      new URL(normalizedUrl);
    } catch {
      throw new Error(`Invalid URL format: ${feed.url}`);
    }

    return await db.addFeed({
      ...feed,
      url: normalizedUrl,
      title: feed.title.trim(),
    });
  },

  async get(id: number): Promise<Feed | undefined> {
    return await db.getFeed(id);
  },

  async getByUrl(url: string): Promise<Feed | undefined> {
    const normalizedUrl = normalizeUrl(url);
    return await db.getFeedByUrl(normalizedUrl);
  },

  async all(): Promise<Feed[]> {
    console.log('feedsRepo.all: Fetching all feeds');
    const feeds = await db.getAllFeeds();
    console.log('feedsRepo.all: Found', feeds.length, 'feeds');
    return feeds;
  },

  async update(id: number, changes: Partial<Feed>): Promise<void> {
    if (changes.url) {
      changes.url = normalizeUrl(changes.url);
    }
    if (changes.title) {
      changes.title = changes.title.trim();
    }
    await db.updateFeed(id, changes);
  },

  async remove(id: number): Promise<void> {
    await db.deleteFeed(id);
  },
};

export const articlesRepo = {
  async add(article: Omit<Article, 'id' | 'titleLower'>): Promise<number> {
    console.log('articlesRepo.add: Adding article:', article.title, 'has image:', !!article.mainImageUrl, 'has content:', !!article.contentHtml);
    return await db.addArticle({
      ...article,
      titleLower: article.title.toLowerCase()
    });
  },

  async get(id: number): Promise<Article | undefined> {
    return await db.getArticle(id);
  },

  async getByFeed(feedId: number): Promise<Article[]> {
    return await db.getArticlesByFeed(feedId);
  },

  async all(): Promise<Article[]> {
    return await db.getAllArticles();
  },
};

export const settingsRepo = {
  async get(key: string): Promise<{ value: string } | undefined> {
    const setting = await db.getSetting(key);
    return setting ? { value: setting.value } : undefined;
  },

  async set(key: string, value: string): Promise<void> {
    await db.setSetting(key, value);
  },
};

export const syncLogRepo = {
  async add(log: Omit<SyncLog, 'id'>): Promise<number> {
    return await db.addSyncLog(log);
  },
};