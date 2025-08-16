import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

export function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="btn" {...props}>
      {children}
    </button>
  );
}
