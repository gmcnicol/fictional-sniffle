import { useState, useCallback, useEffect } from 'react';
import { readStateRepo } from '../lib/repositories/readState';
import { useUndo } from './useUndo';
import { useLiveRegion } from './useLiveRegion';

interface UseReadStateOptions {
  articleId: number;
  initialReadState?: boolean;
}

export function useReadState({
  articleId,
  initialReadState = false,
}: UseReadStateOptions) {
  const [isRead, setIsRead] = useState(initialReadState);
  const [isLoading, setIsLoading] = useState(false);
  const { pendingUndo, scheduleUndo, executeUndo, clearPendingUndo } = useUndo<{
    articleId: number;
    wasRead: boolean;
  }>();
  const { announce } = useLiveRegion();

  // Load initial read state
  useEffect(() => {
    let isMounted = true;

    const loadReadState = async () => {
      try {
        const readState = await readStateRepo.isRead(articleId);
        if (isMounted) {
          setIsRead(readState);
        }
      } catch (error) {
        console.error('Failed to load read state:', error);
      }
    };

    if (articleId) {
      loadReadState();
    }

    return () => {
      isMounted = false;
    };
  }, [articleId]);

  // Mark article as read
  const markAsRead = useCallback(
    async (options: { silent?: boolean; skipUndo?: boolean } = {}) => {
      if (isRead || isLoading) return;

      setIsLoading(true);

      try {
        await readStateRepo.markRead(articleId);
        setIsRead(true);

        if (!options.silent) {
          announce('Article marked as read');
        }

        // Schedule undo unless explicitly disabled
        if (!options.skipUndo) {
          scheduleUndo(
            async () => {
              await readStateRepo.markUnread(articleId);
              setIsRead(false);
              announce('Article marked as unread');
            },
            { articleId, wasRead: false },
            'Marked as read',
          );
        }
      } catch (error) {
        console.error('Failed to mark article as read:', error);
        announce('Failed to mark article as read');
      } finally {
        setIsLoading(false);
      }
    },
    [isRead, isLoading, articleId, announce, scheduleUndo],
  );

  // Mark article as unread
  const markAsUnread = useCallback(
    async (options: { silent?: boolean; skipUndo?: boolean } = {}) => {
      if (!isRead || isLoading) return;

      setIsLoading(true);

      try {
        await readStateRepo.markUnread(articleId);
        setIsRead(false);

        if (!options.silent) {
          announce('Article marked as unread');
        }

        // Schedule undo unless explicitly disabled
        if (!options.skipUndo) {
          scheduleUndo(
            async () => {
              await readStateRepo.markRead(articleId);
              setIsRead(true);
              announce('Article marked as read');
            },
            { articleId, wasRead: true },
            'Marked as unread',
          );
        }
      } catch (error) {
        console.error('Failed to mark article as unread:', error);
        announce('Failed to mark article as unread');
      } finally {
        setIsLoading(false);
      }
    },
    [isRead, isLoading, articleId, announce, scheduleUndo],
  );

  // Toggle read state
  const toggleReadState = useCallback(
    async (options: { silent?: boolean; skipUndo?: boolean } = {}) => {
      if (isRead) {
        await markAsUnread(options);
      } else {
        await markAsRead(options);
      }
    },
    [isRead, markAsRead, markAsUnread],
  );

  // Handle undo action
  const handleUndo = useCallback(async () => {
    try {
      await executeUndo();
    } catch (error) {
      console.error('Failed to execute undo:', error);
      announce('Failed to undo action');
    }
  }, [executeUndo, announce]);

  return {
    isRead,
    isLoading,
    markAsRead,
    markAsUnread,
    toggleReadState,
    pendingUndo,
    handleUndo,
    clearPendingUndo,
  };
}
