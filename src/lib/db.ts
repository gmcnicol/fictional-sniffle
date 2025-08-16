import Dexie, { Table } from 'dexie';

export interface Setting {
  key: string;
  value: string;
}

class AppDB extends Dexie {
  settings!: Table<Setting, string>;

  constructor() {
    super('app');
    this.version(1).stores({
      settings: '&key',
    });
  }
}

export const db = new AppDB();
