import { db, type Article } from '../db.ts';

export const articlesRepo = {
  async add(article: Omit<Article, 'id'>) {
    return db.articles.add(article);
  },
  async get(id: number) {
    return db.articles.get(id);
  },
  async byFeed(feedId: number) {
    return db.articles.where('feedId').equals(feedId).toArray();
  },
  async remove(id: number) {
    return db.articles.delete(id);
  },
};
