import type { HTMLAttributes } from 'react';
import './EmptyState.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  message: string;
}

export function EmptyState({ message, ...props }: Props) {
  return (
    <div className="empty-state" {...props}>
      <p>{message}</p>
    </div>
  );
}
