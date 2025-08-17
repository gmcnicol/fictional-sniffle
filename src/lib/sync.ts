import { fetchFeed, DEFAULT_PROXY } from './fetcher.ts';
import { parseFeed } from './feedParser.ts';
import {
  articlesRepo,
  feedsRepo,
  settingsRepo,
  syncLogRepo,
} from './repositories/index.ts';

let timer: ReturnType<typeof setInterval> | null = null;

export async function syncFeedsOnce() {
  const proxySetting = await settingsRepo.get('proxyUrl');
  const proxy = proxySetting?.value || DEFAULT_PROXY;
  const feeds = await feedsRepo.all();
  for (const feed of feeds) {
    try {
      const res = await fetchFeed(feed.url, {
        etag: feed.etag,
        lastModified: feed.lastModified,
        proxy,
      });
      if (res.status === 304) {
        await feedsRepo.update(feed.id!, { lastFetchedAt: new Date() });
        await syncLogRepo.add({
          feedId: feed.id!,
          status: 'not-modified',
          runAt: new Date(),
        });
        continue;
      }
      if (res.text) {
        const items = parseFeed(res.text);
        for (const item of items) {
          await articlesRepo.add({
            feedId: feed.id!,
            title: item.title,
            link: item.link,
            publishedAt: item.publishedAt,
            mainImageUrl: item.image || null,
          });
        }
      }
      await feedsRepo.update(feed.id!, {
        etag: res.etag ?? null,
        lastModified: res.lastModified ?? null,
        lastFetchedAt: new Date(),
      });
      await syncLogRepo.add({
        feedId: feed.id!,
        status: 'ok',
        runAt: new Date(),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await syncLogRepo.add({
        feedId: feed.id!,
        status: 'error',
        message,
        runAt: new Date(),
      });
    }
  }
}

export async function scheduleSync() {
  const intervalSetting = await settingsRepo.get('syncEveryMinutes');
  const minutes = parseInt(intervalSetting?.value ?? '30', 10);
  if (timer) clearInterval(timer);
  timer = setInterval(syncFeedsOnce, minutes * 60 * 1000);
  await syncFeedsOnce();
}

export function stopSync() {
  if (timer) clearInterval(timer);
  timer = null;
}
