
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

const primaryNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/builder', label: 'AI Builder', icon: Bot },
  { href: '/components-db', label: 'Components', icon: Cpu },
  { href: '/bottleneck-calculator', label: 'Bottleneck', icon: AnalysisIcon },
  { href: '/compatibility-checker', label: 'Compat. Check', icon: ShieldCheck },
  { href: '/build-guide', label: 'Guide', icon: BookOpen },
  { href: '/history', label: 'History', icon: History },
];

const moreNavItems = [
  { href: '/cinebench-scores', label: 'Cinebench', icon: BarChart3 },
  { href: '/3dmark-scores', label: '3DMark', icon: BarChartHorizontalBig },
  { href: '/furmark-scores', label: 'FurMark', icon: Flame },
  { href: '/pcmark-scores', label: 'PCMark', icon: Gauge },
  { href: '/geekbench-scores', label: 'Geekbench', icon: Brain },
  { href: '/aida64-scores', label: 'AIDA64', icon: ClipboardList },
  { href: '/userbenchmark-scores', label: 'UserBench', icon: Users },
];

const NavLink = ({ href, label, icon: Icon, isActive, isDropdownTrigger = false }: { href?: string, label: string, icon: React.ElementType, isActive?: boolean, isDropdownTrigger?: boolean }) => {
  const commonClasses = cn(
    'flex flex-col items-center justify-center p-1.5 rounded-full transition-all duration-300 ease-in-out hover:bg-primary/20 shrink-0',
    'w-16 h-16 md:w-auto md:h-12', // Adjusted base size for readability
    'md:flex-row md:px-3 md:py-1.5',
    isActive && !isDropdownTrigger ? 'bg-primary text-primary-foreground shadow-md' : 'text-foreground hover:text-primary',
  );

  if (isDropdownTrigger) {
    return (
      <div className={commonClasses} role="button" tabIndex={0} aria-haspopup="menu">
        <Icon className="w-5 h-5 md:w-4 shrink-0" />
        <span className="text-[10px] mt-0.5 md:mt-0 md:text-xs md:ml-1.5 font-medium whitespace-nowrap">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href!} // href will be defined if not a dropdown trigger
      className={commonClasses}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-5 h-5 md:w-4 shrink-0" />
      <span className="text-[10px] mt-0.5 md:mt-0 md:text-xs md:ml-1.5 font-medium whitespace-nowrap">{label}</span>
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

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[95vw] md:max-w-max">
      <div className="flex items-center justify-center bg-card/70 backdrop-blur-md border border-primary/30 shadow-2xl rounded-full p-1 md:p-1.5 space-x-1 md:space-x-1.5 overflow-x-auto no-scrollbar">
        {primaryNavItems.map((item) => {
          // Active if it's the homepage and path is exactly '/', or for other pages, if path starts with item.href
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
              <NavLink
                isDropdownTrigger // This now uses the NavLink styling for the trigger
                label="More"
                icon={ChevronUp}
                // isActive can be determined if any of moreNavItems is active, but simpler to keep it neutral
              />
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
