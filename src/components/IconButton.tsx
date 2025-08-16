import { ButtonHTMLAttributes } from 'react';
import './IconButton.css';

export function IconButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="icon-btn" {...props}>
      {children}
    </button>
  );
}
