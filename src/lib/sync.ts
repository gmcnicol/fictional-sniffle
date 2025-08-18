import { fetchFeed, DEFAULT_PROXY } from './fetcher.ts';
import { parseFeed } from './feedParser.ts';
import {
  articlesRepo,
  feedsRepo,
  settingsRepo,
  syncLogRepo,
} from './repositories.ts';

let timer: ReturnType<typeof setInterval> | null = null;

export async function syncFeedsOnce() {
  console.log('syncFeedsOnce: Starting sync...');
  try {
    const proxySetting = await settingsRepo.get('proxyUrl');
    const proxy = proxySetting?.value || DEFAULT_PROXY;
    console.log('syncFeedsOnce: Got proxy setting:', proxy);

    const feeds = await feedsRepo.all();
    console.log('syncFeedsOnce: Got feeds:', feeds.length);
    for (const feed of feeds) {
      console.log('syncFeedsOnce: Processing feed:', feed.title, feed.url);
      try {
        const res = await fetchFeed(feed.url, {
          etag: feed.etag,
          lastModified: feed.lastModified,
          proxy,
        });
        console.log(
          'syncFeedsOnce: Fetch result for',
          feed.title,
          '- Status:',
          res.status,
          'Text length:',
          res.text?.length,
        );

        if (res.status === 304) {
          console.log('syncFeedsOnce: Feed not modified:', feed.title);
          await feedsRepo.update(feed.id, { lastFetchedAt: new Date() });
          await syncLogRepo.add({
            feedId: feed.id,
            status: 'not-modified',
            runAt: new Date(),
          });
          continue;
        }
        if (res.text) {
          console.log('syncFeedsOnce: Parsing feed text for', feed.title);
          const items = parseFeed(res.text);
          console.log(
            'syncFeedsOnce: Parsed',
            items.length,
            'items for',
            feed.title,
          );

          for (const item of items) {
            console.log(
              'syncFeedsOnce: Adding article:',
              item.title,
              'Image:',
              !!item.image,
              'Content:',
              !!item.contentHtml,
            );
            await articlesRepo.add({
              feedId: feed.id,
              title: item.title,
              link: item.link,
              publishedAt: item.publishedAt,
              mainImageUrl: item.image || null,
              contentHtml: item.contentHtml || null,
            });
          }
        } else {
          console.warn('syncFeedsOnce: No text content for', feed.title);
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
  } catch (syncError) {
    console.error('syncFeedsOnce: Error during sync:', syncError);
    throw syncError;
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
