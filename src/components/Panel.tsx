import { HTMLAttributes } from 'react';
import './Panel.css';

export function Panel({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="panel" {...props}>
      {children}
    </div>
  );
}
