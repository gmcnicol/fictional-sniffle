import { db, type ReadState } from '../db.ts';

export const readStateRepo = {
  async markRead(articleId: number) {
    const state: ReadState = { articleId, read: true };
    return db.readState.put(state);
  },
  async markUnread(articleId: number) {
    return db.readState.delete(articleId);
  },
  async isRead(articleId: number) {
    const state = await db.readState.get(articleId);
    return state?.read ?? false;
  },
};
