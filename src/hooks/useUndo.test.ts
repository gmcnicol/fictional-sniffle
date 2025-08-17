import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndo } from './useUndo';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useUndo', () => {
  it('should initialize with no pending undo', () => {
    const { result } = renderHook(() => useUndo());

    expect(result.current.pendingUndo).toBeNull();
  });

  it('should schedule an undo action', () => {
    const { result } = renderHook(() => useUndo());
    const mockAction = vi.fn();

    act(() => {
      result.current.scheduleUndo(mockAction, { id: 1 }, 'Test action');
    });

    expect(result.current.pendingUndo).toEqual({
      action: mockAction,
      data: { id: 1 },
      description: 'Test action',
    });
  });

  it('should clear pending undo after timeout', () => {
    const { result } = renderHook(() => useUndo({ timeout: 1000 }));
    const mockAction = vi.fn();

    act(() => {
      result.current.scheduleUndo(mockAction, { id: 1 }, 'Test action');
    });

    expect(result.current.pendingUndo).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.pendingUndo).toBeNull();
  });

  it('should execute undo action', async () => {
    const { result } = renderHook(() => useUndo());
    const mockAction = vi.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.scheduleUndo(mockAction, { id: 1 }, 'Test action');
    });

    await act(async () => {
      await result.current.executeUndo();
    });

    expect(mockAction).toHaveBeenCalled();
    expect(result.current.pendingUndo).toBeNull();
  });

  it('should handle undo action errors gracefully', async () => {
    const { result } = renderHook(() => useUndo());
    const mockAction = vi.fn().mockRejectedValue(new Error('Undo failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    act(() => {
      result.current.scheduleUndo(mockAction, { id: 1 }, 'Test action');
    });

    await act(async () => {
      await result.current.executeUndo();
    });

    expect(mockAction).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to execute undo:',
      expect.any(Error),
    );
    expect(result.current.pendingUndo).not.toBeNull(); // Should keep undo available

    consoleSpy.mockRestore();
  });

  it('should clear pending undo manually', () => {
    const { result } = renderHook(() => useUndo());
    const mockAction = vi.fn();

    act(() => {
      result.current.scheduleUndo(mockAction, { id: 1 }, 'Test action');
    });

    expect(result.current.pendingUndo).not.toBeNull();

    act(() => {
      result.current.clearPendingUndo();
    });

    expect(result.current.pendingUndo).toBeNull();
  });

  it('should replace existing undo when scheduling new one', () => {
    const { result } = renderHook(() => useUndo());
    const mockAction1 = vi.fn();
    const mockAction2 = vi.fn();

    act(() => {
      result.current.scheduleUndo(mockAction1, { id: 1 }, 'First action');
    });

    expect(result.current.pendingUndo?.description).toBe('First action');

    act(() => {
      result.current.scheduleUndo(mockAction2, { id: 2 }, 'Second action');
    });

    expect(result.current.pendingUndo?.description).toBe('Second action');
    expect(result.current.pendingUndo?.data).toEqual({ id: 2 });
  });

  it('should use custom timeout', () => {
    const { result } = renderHook(() => useUndo({ timeout: 2000 }));
    const mockAction = vi.fn();

    act(() => {
      result.current.scheduleUndo(mockAction, { id: 1 }, 'Test action');
    });

    expect(result.current.pendingUndo).not.toBeNull();

    // Advance time but not past the custom timeout
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.pendingUndo).not.toBeNull();

    // Advance past the custom timeout
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.pendingUndo).toBeNull();
  });

  it('should not execute undo when no pending action', async () => {
    const { result } = renderHook(() => useUndo());

    await act(async () => {
      await result.current.executeUndo();
    });

    // Should not throw or cause issues
    expect(result.current.pendingUndo).toBeNull();
  });
});
