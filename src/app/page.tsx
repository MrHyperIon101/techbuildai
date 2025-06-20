
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import Link from 'next/link';
import { ArrowRight, Bot, Cpu, Wrench, ShieldCheck, BarChart3, BarChartHorizontalBig, Search as AnalysisIcon, Flame, Gauge, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <header className="text-center mb-12 animate-fade-in">
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
           <Bot size={64} className="text-primary" />
        </div>
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            TechBuild AI
          </span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Your intelligent assistant for crafting the perfect PC build, understanding components, and conquering bottlenecks.
        </p>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 max-w-7xl w-full animate-slide-in-up ">
        <FeatureCard
          title="AI PC Builder"
          description="Get personalized PC component recommendations based on your budget and needs."
          icon={<Bot className="w-8 h-8 text-accent" />}
          href="/builder"
        />
        <FeatureCard
          title="Component Insights"
          description="Deep dive into any PC component. Get AI-powered details, specs, and analysis."
          icon={<Cpu className="w-8 h-8 text-accent" />}
          href="/components-db"
        />
        <FeatureCard
          title="Bottleneck Calculator"
          description="Identify potential performance bottlenecks in your build with our smart calculator."
          icon={<AnalysisIcon className="w-8 h-8 text-accent" />} 
          href="/bottleneck-calculator"
        />
        <FeatureCard
          title="Compatibility Checker"
          description="Verify component compatibility with our AI-powered checker before you buy."
          icon={<ShieldCheck className="w-8 h-8 text-accent" />}
          href="/compatibility-checker"
        />
        <FeatureCard
          title="Cinebench Scores"
          description="Compare CPU performance with Cinebench R23 & R24 benchmark scores."
          icon={<BarChart3 className="w-8 h-8 text-accent" />}
          href="/cinebench-scores"
        />
        <FeatureCard
          title="3DMark GPU Scores"
          description="Compare GPU performance with 3DMark benchmark scores from various sources."
          icon={<BarChartHorizontalBig className="w-8 h-8 text-accent" />}
          href="/3dmark-scores"
        />
         <FeatureCard
          title="FurMark GPU Scores"
          description="Assess GPU stability and thermal performance with FurMark scores."
          icon={<Flame className="w-8 h-8 text-accent" />}
          href="/furmark-scores"
        />
        <FeatureCard
          title="PCMark Scores"
          description="Evaluate overall system performance for various tasks with PCMark."
          icon={<Gauge className="w-8 h-8 text-accent" />}
          href="/pcmark-scores"
        />
        <FeatureCard
          title="Geekbench Scores"
          description="Measure CPU and GPU compute performance using Geekbench."
          icon={<Brain className="w-8 h-8 text-accent" />}
          href="/geekbench-scores"
        />
        <FeatureCard
          title="Step-by-Step Guide"
          description="New to PC building? Our comprehensive guide walks you through the entire process."
          icon={<Wrench className="w-8 h-8 text-accent" />}
          href="/build-guide"
          className="lg:col-span-1" 
        />
      </main>

      <footer className="mt-16 text-center animate-fade-in">
        <Link href="/builder" passHref>
          <Button size="lg" variant="default" className="rounded-full group bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-accent/50 transition-all duration-300 transform hover:scale-105">
            Get Started <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} Made by Souvik Bagchi.
        </p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  className?: string;
}

function FeatureCard({ title, description, icon, href, className }: FeatureCardProps) {
  return (
    <Link href={href} passHref>
      <GlassCard className={cn("h-full flex flex-col group cursor-pointer hover:border-accent/50", className)}>
        <GlassCardHeader className="flex items-start justify-between">
          <div className="p-3 bg-accent/10 rounded-xl">
            {icon}
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
        </GlassCardHeader>
        <GlassCardContent className="flex-grow">
          <h3 className="text-xl font-headline font-semibold text-primary group-hover:text-accent transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        </GlassCardContent>
      </GlassCard>
    </Link>
  );
}
