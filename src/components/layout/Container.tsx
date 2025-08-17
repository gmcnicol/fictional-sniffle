import type { HTMLAttributes } from 'react';
import './Container.css';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  center?: boolean;
}

export function Container({
  children,
  maxWidth = 'lg',
  center = true,
  className = '',
  ...props
}: ContainerProps) {
  const classNames = [
    'container',
    `container--${maxWidth}`,
    center && 'container--center',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}
