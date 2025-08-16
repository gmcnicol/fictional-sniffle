import { db, type Folder } from '../db.ts';

export const foldersRepo = {
  async add(folder: Omit<Folder, 'id'>) {
    return db.folders.add(folder);
  },
  async all() {
    return db.folders.toArray();
  },
  async remove(id: number) {
    return db.folders.delete(id);
  },
};
