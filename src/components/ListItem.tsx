import type { HTMLAttributes } from 'react';
import './ListItem.css';

export function ListItem({
  children,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li className="list-item" {...props}>
      {children}
    </li>
  );
}
