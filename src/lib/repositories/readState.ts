// Stub for backward compatibility
export const readStateRepo = {
  async get(_articleId: number): Promise<{ read: boolean } | undefined> {
    return undefined;
  },
  async set(_articleId: number, _read: boolean): Promise<void> {
    // No-op for now
  }
};