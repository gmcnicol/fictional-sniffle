import { db, type Setting } from '../db.ts';

export const settingsRepo = {
  async set(key: string, value: string) {
    return db.settings.put({ key, value } satisfies Setting);
  },
  async get(key: string) {
    return db.settings.get(key);
  },
  async remove(key: string) {
    return db.settings.delete(key);
  },
};
