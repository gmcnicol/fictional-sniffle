import type { HTMLAttributes } from 'react';
import './ReaderViewport.css';

export interface ReaderViewportProps extends HTMLAttributes<HTMLDivElement> {
  /** Center content both horizontally and vertically */
  center?: boolean;
}

export function ReaderViewport({
  children,
  center = true,
  className = '',
  ...props
}: ReaderViewportProps) {
  const classNames = [
    'reader-viewport',
    center && 'reader-viewport--center',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      <div className="reader-viewport__content">{children}</div>
    </div>
  );
}
