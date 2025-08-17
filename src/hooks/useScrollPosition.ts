import { useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/db';

interface ScrollPosition {
  articleId: number;
  scrollTop: number;
  timestamp: number;
}

interface UseScrollPositionOptions {
  articleId: number;
  enabled?: boolean;
  saveThrottle?: number; // milliseconds to throttle save operations (default: 500)
}

export function useScrollPosition({
  articleId,
  enabled = true,
  saveThrottle = 500,
}: UseScrollPositionOptions) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPosition = useRef<number>(0);

  // Save scroll position to database
  const saveScrollPosition = useCallback(
    async (scrollTop: number) => {
      if (!enabled || !articleId || scrollTop === lastSavedPosition.current) {
        return;
      }

      try {
        const position: ScrollPosition = {
          articleId,
          scrollTop,
          timestamp: Date.now(),
        };

        // Save to IndexedDB using a custom table for scroll positions
        await db.transaction('rw', ['settings'], async () => {
          await db.settings.put({
            key: `scroll-position-${articleId}`,
            value: JSON.stringify(position),
          });
        });

        lastSavedPosition.current = scrollTop;
      } catch (error) {
        console.warn('Failed to save scroll position:', error);
      }
    },
    [articleId, enabled],
  );

  // Throttled save function
  const throttledSave = useCallback(
    (scrollTop: number) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveScrollPosition(scrollTop);
      }, saveThrottle);
    },
    [saveScrollPosition, saveThrottle],
  );

  // Restore scroll position from database
  const restoreScrollPosition = useCallback(async () => {
    if (!enabled || !articleId) {
      return 0;
    }

    try {
      const setting = await db.settings.get(`scroll-position-${articleId}`);
      if (setting?.value) {
        const position: ScrollPosition = JSON.parse(setting.value);
        // Only restore if the position is recent (within 24 hours)
        const isRecent = Date.now() - position.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent) {
          return position.scrollTop;
        }
      }
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
    }

    return 0;
  }, [articleId, enabled]);

  // Set up scroll listener
  const setupScrollListener = useCallback(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      throttledSave(scrollTop);
    };

    if (enabled) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        // Save final position on cleanup
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        saveScrollPosition(scrollTop);
      };
    }
  }, [enabled, throttledSave, saveScrollPosition]);

  // Restore scroll position on mount
  useEffect(() => {
    if (enabled && articleId) {
      restoreScrollPosition().then((position) => {
        if (position > 0) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            window.scrollTo(0, position);
          });
        }
      });
    }
  }, [articleId, enabled, restoreScrollPosition]);

  // Set up scroll listener
  useEffect(() => {
    return setupScrollListener();
  }, [setupScrollListener]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    restoreScrollPosition,
    saveScrollPosition: throttledSave,
  };
}
