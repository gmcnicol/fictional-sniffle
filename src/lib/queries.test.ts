import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db.ts';
import { feedsRepo } from './repositories/feeds.ts';
import { articlesRepo } from './repositories/articles.ts';
import { readStateRepo } from './repositories/readState.ts';
import { searchArticles } from './queries.ts';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('searchArticles', () => {
  it('applies keyword, feed, folder, unread and image filters', async () => {
    const folderId = await db.folders.add({ name: 'Faves' });
    const feed1 = await feedsRepo.add({
      url: 'https://a',
      title: 'Feed A',
      folderId,
    });
    const feed2 = await feedsRepo.add({
      url: 'https://b',
      title: 'Feed B',
    });
    const a1 = await articlesRepo.add({
      feedId: feed1,
      title: 'Hello World',
      link: 'https://a/1',
      publishedAt: new Date(),
    });
    const a2 = await articlesRepo.add({
      feedId: feed1,
      title: 'Image Post',
      link: 'https://a/2',
      publishedAt: new Date(),
      mainImageUrl: 'img.png',
    });
    await articlesRepo.add({
      feedId: feed2,
      title: 'Another Hello',
      link: 'https://b/1',
      publishedAt: new Date(),
    });
    await readStateRepo.markRead(a2);

    const kw = await searchArticles({ keyword: 'hello' });
    expect(kw.map((a) => a.title).sort()).toEqual([
      'Another Hello',
      'Hello World',
    ]);

    const byFeed = await searchArticles({ feedId: feed1 });
    expect(byFeed.map((a) => a.id).sort()).toEqual([a1, a2]);

    const byFolder = await searchArticles({ folderId });
    expect(byFolder.map((a) => a.id).sort()).toEqual([a1, a2]);

    const unreadOnly = await searchArticles({
      feedId: feed1,
      unreadOnly: true,
    });
    expect(unreadOnly.map((a) => a.id)).toEqual([a1]);

    const withImages = await searchArticles({ hasImage: true });
    expect(withImages.map((a) => a.id)).toEqual([a2]);
  });
});
