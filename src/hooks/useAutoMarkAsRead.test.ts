import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoMarkAsRead } from './useAutoMarkAsRead';
import { readStateRepo } from '../lib/repositories/readState';

// Mock the read state repository
vi.mock('../lib/repositories/readState', () => ({
  readStateRepo: {
    markRead: vi.fn(),
  },
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();

  mockIntersectionObserver.mockImplementation((callback) => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    callback,
  }));

  global.IntersectionObserver = mockIntersectionObserver;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useAutoMarkAsRead', () => {
  it('should not set up observer when disabled', () => {
    renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: false,
        enabled: false,
      }),
    );

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });

  it('should not set up observer when already read', () => {
    renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: true,
        enabled: true,
      }),
    );

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });

  it('should not set up observer without articleId', () => {
    renderHook(() =>
      useAutoMarkAsRead({
        articleId: 0,
        isRead: false,
        enabled: true,
      }),
    );

    expect(mockIntersectionObserver).not.toHaveBeenCalled();
  });

  it('should set up observer when enabled and not read', () => {
    renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: false,
        enabled: true,
      }),
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: [0, 0.6, 1],
        rootMargin: '0px',
      }),
    );
  });

  it('should mark article as read when visibility threshold is met and timer expires', async () => {
    const { result } = renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: false,
        enabled: true,
        delay: 1000,
      }),
    );

    // Create a mock element
    const mockElement = document.createElement('div');
    result.current.setElement(mockElement);

    expect(mockObserve).toHaveBeenCalledWith(mockElement);

    // Get the observer callback
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];

    // Simulate the element becoming sufficiently visible
    observerCallback([
      {
        intersectionRatio: 0.7, // Above threshold
        target: mockElement,
      },
    ]);

    // Fast-forward past the delay
    vi.advanceTimersByTime(1000);

    // Wait for the async operation
    await vi.runAllTimersAsync();

    expect(readStateRepo.markRead).toHaveBeenCalledWith(1);
  });

  it('should cancel timer when element becomes less visible', async () => {
    const { result } = renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: false,
        enabled: true,
        delay: 1000,
      }),
    );

    const mockElement = document.createElement('div');
    result.current.setElement(mockElement);

    const observerCallback = mockIntersectionObserver.mock.calls[0][0];

    // Simulate visibility above threshold
    observerCallback([
      {
        intersectionRatio: 0.7,
        target: mockElement,
      },
    ]);

    // Advance time partially
    vi.advanceTimersByTime(500);

    // Simulate visibility below threshold
    observerCallback([
      {
        intersectionRatio: 0.3,
        target: mockElement,
      },
    ]);

    // Advance time past original delay
    vi.advanceTimersByTime(600);

    // Article should not be marked as read
    expect(readStateRepo.markRead).not.toHaveBeenCalled();
  });

  it('should use custom threshold and delay', () => {
    renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: false,
        enabled: true,
        threshold: 0.8,
        delay: 2000,
      }),
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: [0, 0.8, 1],
      }),
    );
  });

  it('should clean up observer on unmount', () => {
    const { unmount } = renderHook(() =>
      useAutoMarkAsRead({
        articleId: 1,
        isRead: false,
        enabled: true,
      }),
    );

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
