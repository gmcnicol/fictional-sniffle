import type { HTMLAttributes } from 'react';
import './Grid.css';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: '1' | '2' | '3' | '4' | '6' | '12' | 'auto-fit' | 'auto-fill';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'stretch';
}

export function Grid({
  children,
  cols = 'auto-fit',
  gap = 'md',
  align,
  justify,
  className = '',
  ...props
}: GridProps) {
  const classNames = [
    'grid',
    `grid--cols-${cols}`,
    `grid--gap-${gap}`,
    align && `grid--align-${align}`,
    justify && `grid--justify-${justify}`,
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
