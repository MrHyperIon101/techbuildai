import { cn } from '@/lib/utils';
import React from 'react';

interface SectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function SectionTitle({ children, className, as: Component = 'h1', ...props }: SectionTitleProps) {
  return (
    <Component
      className={cn('text-3xl font-headline font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-8 text-center animate-fade-in', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
