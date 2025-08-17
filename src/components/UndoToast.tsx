import { useEffect, useState } from 'react';
import './UndoToast.css';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  visible: boolean;
  autoHideMs?: number;
}

export function UndoToast({
  message,
  onUndo,
  onDismiss,
  visible,
  autoHideMs = 5000,
}: UndoToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideMs);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [visible, onDismiss, autoHideMs]);

  const handleUndo = () => {
    onUndo();
    onDismiss();
  };

  if (!visible && !isAnimating) {
    return null;
  }

  return (
    <div
      className={`undo-toast ${
        visible ? 'undo-toast-enter-active' : 'undo-toast-exit-active'
      }`}
      role="alert"
      aria-live="polite"
    >
      <span className="undo-toast__message">{message}</span>
      <button
        type="button"
        className="undo-toast__button"
        onClick={handleUndo}
        aria-describedby="undo-description"
      >
        Undo
      </button>
      <button
        type="button"
        className="undo-toast__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
      <span id="undo-description" className="sr-only">
        Press U to undo, or click the dismiss button to close this notification.
      </span>
    </div>
  );
}
