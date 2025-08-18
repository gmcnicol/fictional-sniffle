// Simplified queries for new SimpleDB
import { db, type Article } from './db.ts';

export async function getUnreadCount(_feedId: number): Promise<number> {
  return 0; // Stub for now
}

export interface ArticleSearchParams {
  keyword?: string;
  feedId?: number;
  folderId?: number;
  unreadOnly?: boolean;
  hasImage?: boolean;
}

export async function searchArticles(
  params: ArticleSearchParams,
): Promise<Article[]> {
  // Simple implementation for now
  const allFeeds = await db.getAllFeeds();
  const allArticles: Article[] = [];
  
  for (const feed of allFeeds) {
    const feedArticles = await db.getArticlesByFeed(feed.id);
    allArticles.push(...feedArticles);
  }

  let filtered = allArticles;

  // Apply keyword filter
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(a => a.titleLower.includes(kw));
  }

  // Apply feed filter
  if (params.feedId != null) {
    filtered = filtered.filter(a => a.feedId === params.feedId);
  }

  // Apply image filter
  if (params.hasImage) {
    filtered = filtered.filter(a => !!a.mainImageUrl);
  }

  // Sort by date
  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  return filtered;
}

// Stub for readability worker
export async function fetchReadableHtml(
  _url: string,
  _options: { fetchContent?: boolean } = {},
): Promise<{ html: string | null; mainImage?: string | null; corsBlocked?: boolean }> {
  return { html: null, mainImage: null, corsBlocked: false };
}