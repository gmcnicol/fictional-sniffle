// Stub for backward compatibility
export function useReadState(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _articleId: number,
) {
  return {
    read: false,
    setRead: (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _read: boolean,
    ) => {
      // Stub implementation
    },
  };
}
