// Stub for backward compatibility
export const readStateRepo = {
  async get(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _articleId: number,
  ): Promise<{ read: boolean } | undefined> {
    return undefined;
  },
  async set(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _articleId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _read: boolean,
  ): Promise<void> {
    // No-op for now
  },
};
