
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Cpu, Search, BookOpen, History, Bot, ShieldCheck, BarChart3, BarChartHorizontalBig, Flame, Gauge, Brain, ClipboardList } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builder', label: 'AI Builder', icon: Bot },
  { href: '/components-db', label: 'Components', icon: Cpu },
  { href: '/bottleneck-calculator', label: 'Bottleneck', icon: Search },
  { href: '/compatibility-checker', label: 'Compat. Check', icon: ShieldCheck },
  { href: '/cinebench-scores', label: 'Cinebench', icon: BarChart3 },
  { href: '/3dmark-scores', label: '3DMark', icon: BarChartHorizontalBig },
  { href: '/furmark-scores', label: 'FurMark', icon: Flame },
  { href: '/pcmark-scores', label: 'PCMark', icon: Gauge },
  { href: '/geekbench-scores', label: 'Geekbench', icon: Brain },
  { href: '/aida64-scores', label: 'AIDA64', icon: ClipboardList },
  { href: '/build-guide', label: 'Build Guide', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center justify-center bg-card/70 backdrop-blur-md border border-primary/30 shadow-2xl rounded-full p-1 md:p-2 space-x-0.5 md:space-x-1">
        {navItems.map((item) => {
          const isActiveStrict = pathname === item.href;
          // Allow broad match for paths like /components-db/some-id, but not for / itself.
          const isActiveBroad = item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 1;
          
          // Prioritize strict match for benchmark pages to avoid multiple active states if paths are similar.
          const isBenchmarkPage = ['/cinebench-scores', '/3dmark-scores', '/furmark-scores', '/pcmark-scores', '/geekbench-scores', '/aida64-scores'].includes(item.href);
          const isActive = isBenchmarkPage ? isActiveStrict : (isActiveStrict || isActiveBroad);


          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-1.5 md:p-2 rounded-full transition-all duration-300 ease-in-out hover:bg-primary/20',
                'w-14 h-14 md:w-[calc(theme(space.16)_-_2px)] md:h-11 aspect-square', // Adjusted width for md
                'md:aspect-auto md:flex-row md:px-2 md:py-1', // Further fine-tuned padding for md
                isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:text-primary',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-4 h-4 md:w-3 shrink-0" /> 
              <span className="text-[7px] mt-0.5 md:mt-0 md:text-[8px] md:ml-1 font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    