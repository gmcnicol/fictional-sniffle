import { db, type SyncLog } from '../db.ts';

export const syncLogRepo = {
  async add(log: Omit<SyncLog, 'id'>) {
    return db.syncLog.add(log);
  },
  async byFeed(feedId: number) {
    return db.syncLog.where('feedId').equals(feedId).toArray();
  },
};
