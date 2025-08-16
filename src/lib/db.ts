import Dexie, { type Table } from 'dexie';

export interface Feed {
  id?: number;
  url: string;
  title: string;
  folderId?: number | null;
  etag?: string | null;
  lastModified?: string | null;
  lastFetchedAt?: Date | null;
}

export interface Article {
  id?: number;
  feedId: number;
  title: string;
  link: string;
  publishedAt: Date;
  mainImageUrl?: string | null;
  mainImageAlt?: string | null;
  contentHtml?: string | null;
}

export interface ReadState {
  articleId: number;
  read: boolean;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Preference {
  key: string;
  value: string;
}

export interface Folder {
  id?: number;
  name: string;
}

export interface SyncLog {
  id?: number;
  feedId: number;
  status: string;
  runAt: Date;
  message?: string;
}

class AppDB extends Dexie {
  feeds!: Table<Feed, number>;
  articles!: Table<Article, number>;
  readState!: Table<ReadState, number>;
  settings!: Table<Setting, string>;
  preferences!: Table<Preference, string>;
  folders!: Table<Folder, number>;
  syncLog!: Table<SyncLog, number>;

  constructor() {
    super('app');
    this.version(1).stores({
      settings: '&key',
    });
    this.version(2).stores({
      settings: '&key',
      feeds: '++id, url, folderId',
      articles: '++id, feedId, publishedAt',
      readState: 'articleId',
      folders: '++id, name',
      syncLog: '++id, feedId, runAt',
    });
    this.version(3).stores({
      settings: '&key',
      feeds: '++id, url, folderId',
      articles: '++id, feedId, publishedAt',
      readState: 'articleId',
      folders: '++id, name',
      syncLog: '++id, feedId, runAt',
      preferences: '&key',
    });
  }
}

export const db = new AppDB();
