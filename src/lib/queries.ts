import { db, type Article } from './db.ts';

export async function getUnreadCount(feedId: number): Promise<number> {
  const articleIds = await db.articles
    .where('feedId')
    .equals(feedId)
    .primaryKeys();
  const states = await db.readState.bulkGet(articleIds);
  const readCount = states.filter((s) => s?.read).length;
  return articleIds.length - readCount;
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
  const kw = params.keyword?.toLowerCase() ?? '';
  let collection = db.articles.toCollection();
  if (kw) {
    collection = collection.filter((a) => a.titleLower.includes(kw));
  }

  if (params.feedId != null) {
    collection = collection.filter((a) => a.feedId === params.feedId);
  } else if (params.folderId != null) {
    const feedIds = await db.feeds
      .where('folderId')
      .equals(params.folderId)
      .primaryKeys();
    collection = collection.filter((a) => feedIds.includes(a.feedId));
  }

  if (params.hasImage) {
    collection = collection.filter((a) => !!a.mainImageUrl);
  }

  let articles = await collection.toArray();

  if (params.unreadOnly) {
    const ids = articles.map((a) => a.id!) as number[];
    const states = await db.readState.bulkGet(ids);
    articles = articles.filter((_, i) => !states[i]?.read);
  }

  articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return articles;
}

let readabilityWorker: Worker | undefined;

export async function fetchReadableHtml(url: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!readabilityWorker) {
      readabilityWorker = new Worker(
        new URL('./readabilityWorker.ts', import.meta.url),
        { type: 'module' },
      );
    }

    const worker = readabilityWorker;

    const onMessage = (
      event: MessageEvent<{ html: string | null; error?: string }>,
    ) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.html);
      }
    };

    const onError = (err: ErrorEvent) => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(err);
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    worker.postMessage(url);
  });
}
