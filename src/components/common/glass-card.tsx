import { cn } from '@/lib/utils';
import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card-bg rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-2xl font-headline font-semibold text-primary', className)} {...props}>
      {children}
    </h2>
  );
}

export function GlassCardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function GlassCardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-6 pt-4 border-t border-white/10', className)} {...props}>
      {children}
    </div>
  );
}
