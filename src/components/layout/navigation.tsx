
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Cpu, Search, BookOpen, History, Bot, ShieldCheck, BarChart3 } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builder', label: 'AI Builder', icon: Bot },
  { href: '/components-db', label: 'Components', icon: Cpu },
  { href: '/bottleneck-calculator', label: 'Bottleneck', icon: Search }, // Using Search as a proxy for analysis/magnifying glass
  { href: '/compatibility-checker', label: 'Compat. Check', icon: ShieldCheck },
  { href: '/cinebench-scores', label: 'Cinebench', icon: BarChart3 },
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
          // For Cinebench specifically, ensure it's not active if on a sub-route of compatibility for example
          const isSpecificallyActive = item.href === '/cinebench-scores' ? pathname === item.href : isActive;

          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ease-in-out hover:bg-primary/20',
                'w-16 h-16 aspect-square', 
                'md:aspect-auto md:w-auto md:h-12 md:flex-row md:px-3 md:py-2 md:space-x-1', // Adjusted padding and space for md screens
                isSpecificallyActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:text-primary',
              )}
              aria-current={isSpecificallyActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              <span className="text-[9px] mt-1 md:mt-0 md:text-[11px] font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
