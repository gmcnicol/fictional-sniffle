import { db, type Preference } from '../db.ts';

export const settingsRepo = {
  async set(key: string, value: string) {
    if (value) {
      return db.preferences.put({ key, value } satisfies Preference);
    }
    return db.preferences.delete(key);
  },
  async get(key: string) {
    return db.preferences.get(key);
  },
  async remove(key: string) {
    return db.preferences.delete(key);
  },
};
