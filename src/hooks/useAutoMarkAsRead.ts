import { useEffect, useRef } from 'react';
import { readStateRepo } from '../lib/repositories/readState';

interface UseAutoMarkAsReadOptions {
  articleId: number;
  isRead: boolean;
  threshold?: number; // percentage of visibility required (default: 0.6)
  delay?: number; // milliseconds to wait before marking as read (default: 1500)
  enabled?: boolean; // whether auto-marking is enabled (default: true)
}

export function useAutoMarkAsRead({
  articleId,
  isRead,
  threshold = 0.6,
  delay = 1500,
  enabled = true,
}: UseAutoMarkAsReadOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Don't set up observer if auto-marking is disabled, already read, or no article ID
    if (!enabled || isRead || !articleId) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visibilityRatio = entry.intersectionRatio;

        if (visibilityRatio >= threshold) {
          // Element is sufficiently visible, start timer
          if (!timeoutRef.current) {
            timeoutRef.current = setTimeout(async () => {
              try {
                await readStateRepo.markRead(articleId);
                console.log(`Auto-marked article ${articleId} as read`);
              } catch (error) {
                console.error('Failed to auto-mark article as read:', error);
              }
            }, delay);
          }
        } else {
          // Element is not sufficiently visible, cancel timer
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      },
      {
        threshold: [0, threshold, 1],
        rootMargin: '0px',
      },
    );

    observerRef.current = observer;

    // If we have an element to observe, start observing
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      // Cleanup observer and timer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [articleId, isRead, threshold, delay, enabled]);

  // Function to set the element to observe
  const setElement = (element: HTMLElement | null) => {
    elementRef.current = element;

    if (observerRef.current) {
      // Stop observing the previous element
      observerRef.current.disconnect();

      // Start observing the new element
      if (element) {
        observerRef.current.observe(element);
      }
    }
  };

  return { setElement };
}
