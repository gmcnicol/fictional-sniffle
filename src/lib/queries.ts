import { db } from './db.ts';

export async function getUnreadCount(feedId: number): Promise<number> {
  const articleIds = await db.articles
    .where('feedId')
    .equals(feedId)
    .primaryKeys();
  const states = await db.readState.bulkGet(articleIds);
  const readCount = states.filter((s) => s?.read).length;
  return articleIds.length - readCount;
}
