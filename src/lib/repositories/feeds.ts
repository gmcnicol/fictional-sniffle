import { db, type Feed } from '../db.ts';

export const feedsRepo = {
  async add(feed: Omit<Feed, 'id'>) {
    return db.feeds.add(feed);
  },
  async get(id: number) {
    return db.feeds.get(id);
  },
  async all() {
    return db.feeds.toArray();
  },
  async update(id: number, changes: Partial<Feed>) {
    return db.feeds.update(id, changes);
  },
  async remove(id: number) {
    return db.feeds.delete(id);
  },
};
