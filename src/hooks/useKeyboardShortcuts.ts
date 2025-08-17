import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  handler: () => void;
  description: string;
  preventDefault?: boolean;
  // Conditions when this shortcut should be active
  condition?: () => boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Don't trigger if modifier keys are pressed (except for specific combos)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const shortcut = shortcuts.find((s) => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const conditionMet = !s.condition || s.condition();
        return keyMatch && conditionMet;
      });

      if (shortcut) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler();
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcuts.filter((s) => !s.condition || s.condition()),
  };
}

// Predefined shortcut groups for common use cases
export const createReaderShortcuts = ({
  onNext,
  onPrevious,
  onToggleRead,
  onOpenOriginal,
  onFocusSearch,
  onGoToFeeds,
}: {
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleRead?: () => void;
  onOpenOriginal?: () => void;
  onFocusSearch?: () => void;
  onGoToFeeds?: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'j',
    handler: onNext || (() => {}),
    description: 'Next article',
    condition: () => !!onNext,
  },
  {
    key: 'k',
    handler: onPrevious || (() => {}),
    description: 'Previous article',
    condition: () => !!onPrevious,
  },
  {
    key: 'u',
    handler: onToggleRead || (() => {}),
    description: 'Toggle read/unread',
    condition: () => !!onToggleRead,
  },
  {
    key: 'o',
    handler: onOpenOriginal || (() => {}),
    description: 'Open original article',
    condition: () => !!onOpenOriginal,
  },
  {
    key: '/',
    handler: onFocusSearch || (() => {}),
    description: 'Focus search',
    condition: () => !!onFocusSearch,
  },
  {
    key: 'g',
    handler: onGoToFeeds || (() => {}),
    description: 'Go to feeds',
    condition: () => !!onGoToFeeds,
  },
];
