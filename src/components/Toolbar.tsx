import type { HTMLAttributes } from 'react';
import './Toolbar.css';

export function Toolbar({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="toolbar" {...props}>
      {children}
    </div>
  );
}
