// Simple in-memory database with localStorage persistence
export interface Feed {
  id: number;
  url: string;
  title: string;
  folderId?: number | null;
  etag?: string | null;
  lastModified?: string | null;
  lastFetchedAt?: Date | null;
}

export interface Article {
  id: number;
  feedId: number;
  title: string;
  titleLower: string;
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
  id: number;
  name: string;
}

export interface SyncLog {
  id: number;
  feedId: number;
  status: string;
  runAt: Date;
  message?: string;
}

class SimpleDB {
  private feeds: Feed[] = [];
  private articles: Article[] = [];
  private readStates: ReadState[] = [];
  private settings: Setting[] = [];
  private preferencesData: Preference[] = [];
  private folders: Folder[] = [];
  private syncLogs: SyncLog[] = [];

  private nextFeedId = 1;
  private nextArticleId = 1;
  private nextFolderId = 1;
  private nextSyncLogId = 1;

  // Public interface for theme provider
  preferences: {
    get: (key: string) => Promise<Preference | undefined>;
    put: ({ key, value }: { key: string; value: string }) => Promise<void>;
  };

  constructor() {
    this.load();

    // Create interface for theme provider
    this.preferences = {
      get: (key: string) => this.getPreference(key),
      put: ({ key, value }: { key: string; value: string }) =>
        this.setPreference(key, value),
    };

    // Create interface for AddFeedForm
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).folders = {
      where: (_field: string) => ({
        equals: (value: string) => ({
          first: async () => this.getFolderByName(value),
        }),
      }),
      add: (folder: { name: string }) => this.addFolder(folder),
    };
  }

  private load() {
    try {
      const data = localStorage.getItem('fictional-sniffle-db');
      if (data) {
        const parsed = JSON.parse(data);
        this.feeds = parsed.feeds || [];
        this.articles = parsed.articles || [];
        this.readStates = parsed.readStates || [];
        this.settings = parsed.settings || [];
        this.preferencesData = parsed.preferences || [];
        this.folders = parsed.folders || [];
        this.syncLogs = parsed.syncLogs || [];

        this.nextFeedId =
          this.feeds.length > 0
            ? Math.max(...this.feeds.map((f) => f.id)) + 1
            : 1;
        this.nextArticleId =
          this.articles.length > 0
            ? Math.max(...this.articles.map((a) => a.id)) + 1
            : 1;
        this.nextFolderId =
          this.folders.length > 0
            ? Math.max(...this.folders.map((f) => f.id)) + 1
            : 1;
        this.nextSyncLogId =
          this.syncLogs.length > 0
            ? Math.max(...this.syncLogs.map((s) => s.id)) + 1
            : 1;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  private save() {
    try {
      const data = {
        feeds: this.feeds,
        articles: this.articles,
        readStates: this.readStates,
        settings: this.settings,
        preferences: this.preferencesData,
        folders: this.folders,
        syncLogs: this.syncLogs,
      };
      localStorage.setItem('fictional-sniffle-db', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  // Feed operations
  async addFeed(feed: Omit<Feed, 'id'>): Promise<number> {
    const newFeed: Feed = { ...feed, id: this.nextFeedId++ };
    this.feeds.push(newFeed);
    this.save();
    return newFeed.id;
  }

  async getFeed(id: number): Promise<Feed | undefined> {
    return this.feeds.find((f) => f.id === id);
  }

  async getFeedByUrl(url: string): Promise<Feed | undefined> {
    return this.feeds.find((f) => f.url === url);
  }

  async getAllFeeds(): Promise<Feed[]> {
    return [...this.feeds];
  }

  async updateFeed(id: number, changes: Partial<Feed>): Promise<void> {
    const index = this.feeds.findIndex((f) => f.id === id);
    if (index >= 0) {
      this.feeds[index] = { ...this.feeds[index], ...changes };
      this.save();
    }
  }

  async deleteFeed(id: number): Promise<void> {
    this.feeds = this.feeds.filter((f) => f.id !== id);
    this.articles = this.articles.filter((a) => a.feedId !== id);
    this.save();
  }

  // Article operations
  async addArticle(article: Omit<Article, 'id'>): Promise<number> {
    // Check if article already exists
    const existing = this.articles.find(
      (a) => a.link === article.link && a.feedId === article.feedId,
    );
    if (existing) {
      return existing.id;
    }

    const newArticle: Article = {
      ...article,
      id: this.nextArticleId++,
      titleLower: article.title.toLowerCase(),
    };
    this.articles.push(newArticle);
    this.save();
    return newArticle.id;
  }

  async getArticlesByFeed(feedId: number): Promise<Article[]> {
    return this.articles.filter((a) => a.feedId === feedId);
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.find((a) => a.id === id);
  }

  async getAllArticles(): Promise<Article[]> {
    return [...this.articles];
  }

  // Preference operations
  async getPreference(key: string): Promise<Preference | undefined> {
    return this.preferencesData.find((p) => p.key === key);
  }

  async setPreference(key: string, value: string): Promise<void> {
    const index = this.preferencesData.findIndex((p) => p.key === key);
    if (index >= 0) {
      this.preferencesData[index].value = value;
    } else {
      this.preferencesData.push({ key, value });
    }
    this.save();
  }

  // Setting operations
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.find((s) => s.key === key);
  }

  async setSetting(key: string, value: string): Promise<void> {
    const index = this.settings.findIndex((s) => s.key === key);
    if (index >= 0) {
      this.settings[index].value = value;
    } else {
      this.settings.push({ key, value });
    }
    this.save();
  }

  // Folder operations
  async addFolder(folder: Omit<Folder, 'id'>): Promise<number> {
    const newFolder: Folder = { ...folder, id: this.nextFolderId++ };
    this.folders.push(newFolder);
    this.save();
    return newFolder.id;
  }

  async getFolderByName(name: string): Promise<Folder | undefined> {
    return this.folders.find((f) => f.name === name);
  }

  // Sync log operations
  async addSyncLog(log: Omit<SyncLog, 'id'>): Promise<number> {
    const newLog: SyncLog = { ...log, id: this.nextSyncLogId++ };
    this.syncLogs.push(newLog);
    this.save();
    return newLog.id;
  }

  // Clear all data
  async clear(): Promise<void> {
    this.feeds = [];
    this.articles = [];
    this.readStates = [];
    this.settings = [];
    this.preferencesData = [];
    this.folders = [];
    this.syncLogs = [];

    this.nextFeedId = 1;
    this.nextArticleId = 1;
    this.nextFolderId = 1;
    this.nextSyncLogId = 1;

    localStorage.removeItem('fictional-sniffle-db');
    console.log('Database cleared');
  }
}

export const db = new SimpleDB();
