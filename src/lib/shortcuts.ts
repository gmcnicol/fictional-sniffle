export interface ShortcutActions {
  nextArticle: () => void | Promise<void>;
  prevArticle: () => void | Promise<void>;
  toggleRead: () => void | Promise<void>;
  openOriginal: () => void | Promise<void>;
  focusSearch: () => void | Promise<void>;
  gotoFeedList: () => void | Promise<void>;
}

export function registerShortcuts(actions: ShortcutActions) {
  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return;
    }
    switch (e.key) {
      case 'j':
        e.preventDefault();
        actions.nextArticle();
        break;
      case 'k':
        e.preventDefault();
        actions.prevArticle();
        break;
      case 'u':
        e.preventDefault();
        actions.toggleRead();
        break;
      case 'o':
        e.preventDefault();
        actions.openOriginal();
        break;
      case '/':
        e.preventDefault();
        actions.focusSearch();
        break;
      case 'g':
        e.preventDefault();
        actions.gotoFeedList();
        break;
      default:
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
