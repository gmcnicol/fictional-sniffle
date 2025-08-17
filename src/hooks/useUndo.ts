import { useState, useRef, useCallback } from 'react';

interface UndoState<T> {
  action: () => Promise<void>;
  data: T;
  description: string;
}

interface UseUndoOptions {
  timeout?: number; // milliseconds before undo expires (default: 5000)
}

export function useUndo<T>({ timeout = 5000 }: UseUndoOptions = {}) {
  const [pendingUndo, setPendingUndo] = useState<UndoState<T> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingUndo = useCallback(() => {
    setPendingUndo(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleUndo = useCallback(
    (action: () => Promise<void>, data: T, description: string) => {
      // Clear any existing undo
      clearPendingUndo();

      const undoState: UndoState<T> = {
        action,
        data,
        description,
      };

      setPendingUndo(undoState);

      // Set timeout to clear undo
      timeoutRef.current = setTimeout(() => {
        clearPendingUndo();
      }, timeout);
    },
    [clearPendingUndo, timeout],
  );

  const executeUndo = useCallback(async () => {
    if (pendingUndo) {
      try {
        await pendingUndo.action();
        clearPendingUndo();
      } catch (error) {
        console.error('Failed to execute undo:', error);
        // Keep the undo available in case of error
      }
    }
  }, [pendingUndo, clearPendingUndo]);

  return {
    pendingUndo,
    scheduleUndo,
    executeUndo,
    clearPendingUndo,
  };
}
