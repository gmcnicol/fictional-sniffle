// Stub for backward compatibility
export function useReadState(_articleId: number) {
  return {
    read: false,
    setRead: (_read: boolean) => {}
  };
}