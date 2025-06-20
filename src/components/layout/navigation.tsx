
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home, Cpu, Search as AnalysisIcon, BookOpen, History, Bot, ShieldCheck,
  BarChart3, BarChartHorizontalBig, Flame, Gauge, Brain, ClipboardList, Users,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

const primaryNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builder', label: 'AI Builder', icon: Bot },
  { href: '/components-db', label: 'Components', icon: Cpu },
  { href: '/bottleneck-calculator', label: 'Bottleneck', icon: AnalysisIcon },
  { href: '/compatibility-checker', label: 'Compat. Check', icon: ShieldCheck },
  { href: '/history', label: 'History', icon: History },
];

const moreNavItems = [
  { href: '/build-guide', label: 'Guide', icon: BookOpen },
  { href: '/cinebench-scores', label: 'Cinebench', icon: BarChart3 },
  { href: '/3dmark-scores', label: '3DMark', icon: BarChartHorizontalBig },
  { href: '/furmark-scores', label: 'FurMark', icon: Flame },
  { href: '/pcmark-scores', label: 'PCMark', icon: Gauge },
  { href: '/geekbench-scores', label: 'Geekbench', icon: Brain },
  { href: '/aida64-scores', label: 'AIDA64', icon: ClipboardList },
  { href: '/userbenchmark-scores', label: 'UserBench', icon: Users },
];

// Base classes for consistent styling of all nav items (links and the "More" trigger button)
const navItemBaseClasses = cn(
  'flex flex-col items-center justify-center rounded-full transition-all duration-300 ease-in-out hover:bg-primary/20 shrink-0',
  'p-1 w-12 h-12', // Default (XS Mobile / Icon Only): 48px x 48px
  'sm:w-14 sm:h-14', // SM Mobile (Icon + Text Below): 56px x 56px
  'md:w-auto md:h-12 md:flex-row md:px-3 md:py-1.5' // Desktop layout adjustments (h-12 = 48px height)
);

const NavLink = ({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: React.ElementType, isActive: boolean }) => {
  return (
    <Link
      href={href}
      className={cn(
        navItemBaseClasses,
        isActive ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:text-primary',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 shrink-0 md:w-4" />
      <span className={cn(
        "hidden sm:block sm:text-[9px] sm:mt-[1px] sm:leading-3", // Hidden by default, visible and styled for sm+
        "md:mt-0 md:text-xs md:ml-1.5", // Desktop overrides
        "font-medium whitespace-nowrap" // Common styles
      )}>{label}</span>
    </Link>
  );
};

const DropdownNavLink = ({ href, label, icon: Icon, isActive }: { href: string, label: string, icon: React.ElementType, isActive: boolean }) => (
   <DropdownMenuItem asChild className={cn("cursor-pointer", isActive && 'bg-primary/10 text-primary')}>
    <Link
      href={href}
      className={cn(
        'flex items-center w-full',
      )}
    >
      <Icon className="w-4 h-4 mr-2 shrink-0" />
      <span>{label}</span>
    </Link>
  </DropdownMenuItem>
);


export function Navigation() {
  const pathname = usePathname();
  const isMoreMenuActive = moreNavItems.some(item => pathname.startsWith(item.href));

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[95vw] md:max-w-max">
      <div className="flex items-center justify-center bg-card/70 backdrop-blur-md border border-primary/30 shadow-2xl rounded-full p-1 md:p-1.5 space-x-0.5 md:space-x-1 overflow-x-auto no-scrollbar">
        {primaryNavItems.map((item) => {
          const isActive = (item.href === '/' && pathname === '/') || 
                           (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
            />
          );
        })}

        {moreNavItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" 
                className={cn(
                  navItemBaseClasses, 
                  isMoreMenuActive ? 'bg-primary/15 text-primary shadow-sm' : 'text-foreground hover:text-primary' 
                )}
              >
                <ChevronUp className="w-5 h-5 shrink-0 md:w-4" />
                <span className={cn(
                  "hidden sm:block sm:text-[9px] sm:mt-[1px] sm:leading-3", // Hidden by default, visible and styled for sm+
                  "md:mt-0 md:text-xs md:ml-1.5", // Desktop overrides
                  "font-medium whitespace-nowrap" // Common styles
                )}>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="mb-2 w-56 bg-card/90 backdrop-blur-md border-primary/30">
              {moreNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                 <DropdownNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                  />
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
}
