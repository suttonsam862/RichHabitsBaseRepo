import React from 'react';
import { cn } from '@/lib/utils';

interface ScrollableDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableDialogContent({
  children,
  className,
  ...props
}: ScrollableDialogContentProps) {
  return (
    <div
      className={cn(
        'relative rounded-md border overflow-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}