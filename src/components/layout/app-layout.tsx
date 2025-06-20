import React from 'react';
import { Navigation } from './navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8 pt-10 pb-32"> {/* Added pb-32 for nav clearance */}
        {children}
      </main>
      <Navigation />
    </div>
  );
}
