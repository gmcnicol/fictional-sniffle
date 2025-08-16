import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db.ts';
import { feedsRepo } from './repositories/feeds.ts';
import { articlesRepo } from './repositories/articles.ts';
import { readStateRepo } from './repositories/readState.ts';
import { getUnreadCount } from './queries.ts';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('repositories and queries', () => {
  it('computes unread counts per feed', async () => {
    const feedId = await feedsRepo.add({
      url: 'https://example.com',
      title: 'Example',
    });
    const a1 = await articlesRepo.add({
      feedId,
      title: 'First',
      link: 'https://example.com/1',
      publishedAt: new Date(),
    });
    await articlesRepo.add({
      feedId,
      title: 'Second',
      link: 'https://example.com/2',
      publishedAt: new Date(),
    });

    expect(await getUnreadCount(feedId)).toBe(2);

    await readStateRepo.markRead(a1);
    expect(await getUnreadCount(feedId)).toBe(1);
  });
});
