
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Cpu, Search, BookOpen, History, Bot, ShieldCheck, BarChart3, BarChartHorizontalBig, Flame, Gauge, Brain, ClipboardList, Users } from 'lucide-react';

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
  { href: '/userbenchmark-scores', label: 'UserBench', icon: Users },
  { href: '/build-guide', label: 'Build Guide', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[95vw] md:max-w-max">
      <div className="flex items-center justify-center bg-card/70 backdrop-blur-md border border-primary/30 shadow-2xl rounded-full p-1 md:p-1.5 space-x-0.5 md:space-x-1 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const isActiveStrict = pathname === item.href;
          const isActiveBroad = item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 1;
          
          const benchmarkPages = [
            '/cinebench-scores', '/3dmark-scores', '/furmark-scores', 
            '/pcmark-scores', '/geekbench-scores', '/aida64-scores', '/userbenchmark-scores'
          ];
          const isBenchmarkPage = benchmarkPages.includes(item.href);
          const isActive = isBenchmarkPage ? isActiveStrict : (isActiveStrict || isActiveBroad);

          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                'flex flex-col items-center justify-center p-1 md:p-1.5 rounded-full transition-all duration-300 ease-in-out hover:bg-primary/20 shrink-0', // shrink-0 added
                'w-12 h-12 md:w-auto md:h-10', // Slightly smaller base for more items
                'md:flex-row md:px-1.5 md:py-0.5', 
                isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:text-primary',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-3.5 h-3.5 md:w-3 shrink-0" /> 
              <span className="text-[6px] mt-0.5 md:mt-0 md:text-[7px] md:ml-1 font-medium whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

    
