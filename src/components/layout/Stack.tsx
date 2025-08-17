import type { HTMLAttributes } from 'react';
import './Stack.css';

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function Stack({
  children,
  gap = 'md',
  align,
  justify,
  className = '',
  ...props
}: StackProps) {
  const classNames = [
    'stack',
    `stack--gap-${gap}`,
    align && `stack--align-${align}`,
    justify && `stack--justify-${justify}`,
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
