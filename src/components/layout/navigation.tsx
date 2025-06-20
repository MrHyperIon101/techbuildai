
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Cpu, Search, Info, BookOpen, History, Bot } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builder', label: 'AI Builder', icon: Bot },
  { href: '/components-db', label: 'Components DB', icon: Cpu },
  { href: '/bottleneck-calculator', label: 'Bottleneck Calc', icon: Search },
  { href: '/build-guide', label: 'Build Guide', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center justify-center bg-card/70 backdrop-blur-md border border-primary/30 shadow-2xl rounded-full p-2 space-x-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ease-in-out  hover:bg-primary/20 aspect-square w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-12 md:aspect-auto md:flex-row md:px-4 md:py-2 md:space-x-2',
                isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:text-primary',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="text-xs mt-1 md:mt-0 md:text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
