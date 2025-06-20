"use client"; 

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { SectionTitle } from '@/components/common/section-title';
import { GlassCard, GlassCardContent, GlassCardHeader } from '@/components/common/glass-card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <GlassCard className="max-w-lg w-full">
        <GlassCardHeader className="items-center">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <SectionTitle as="h2" className="mb-2 text-destructive">Oops! Something went wrong.</SectionTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <p className="text-muted-foreground">
            We encountered an unexpected issue. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <details className="text-left p-3 bg-destructive/10 rounded-md">
              <summary className="cursor-pointer font-medium text-destructive">Error Details (Dev Mode)</summary>
              <pre className="mt-2 text-xs text-destructive/80 whitespace-pre-wrap font-code">
                {error.stack || error.message}
              </pre>
            </details>
          )}
          <Button
            onClick={() => reset()}
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            size="lg"
          >
            Try Again
          </Button>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
