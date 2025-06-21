
"use client";

import React, { useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { handleSuggestPcBuild, handleCalculateBottleneck, handleEstimateGamingPerformance } from '@/lib/actions';
import type { BuildSuggestion, PCComponent, BottleneckInfo, GamingPerformanceOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Bot, ShoppingCart, BarChart3, ShieldCheck, Gamepad2, Cpu, Video, MemoryStick, HardDrive, Power, HardDriveDownload, Monitor, Keyboard, Mouse, TestTube2, Wind, Layers, Network, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BenchmarkResults } from '@/components/common/benchmark-results';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const builderFormSchema = z.object({
  budget: z.coerce.number().min(8000, "Budget must be at least ₹8,000").max(8000000, "Budget cannot exceed ₹8,000,000"),
  desiredUsage: z.string().min(10, "Please describe your needs in at least 10 characters.").max(500, "Description is too long."),
  includePeripherals: z.boolean().default(false),
  chassisSize: z.enum(['Any', 'SFF', 'Mini-Tower', 'Mid-Tower', 'Full-Tower']).default('Any'),
  buildTheme: z.string().max(100, "Theme description is too long.").optional(),
});

type BuilderFormValues = z.infer<typeof builderFormSchema>;

const componentIcons: { [key: string]: React.ElementType } = {
  cpu: Cpu,
  gpu: Video,
  ram: MemoryStick,
  storage: HardDrive,
  motherboard: HardDriveDownload,
  psu: Power,
  case: (props: any) => <div {...props} className="w-5 h-5 border-2 rounded-sm border-current" />,
  'cpu cooler': Wind,
  'thermal paste': Layers,
  'custom cables': Network,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
};

export default function AiPcBuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<BuildSuggestion | null>(null);
  const [isBenchmarkDialogOpen, setIsBenchmarkDialogOpen] = useState(false);
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [bottleneckReport, setBottleneckReport] = useState<BottleneckInfo | null>(null);
  const [gamingReport, setGamingReport] = useState<GamingPerformanceOutput | null>(null);

  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      budget: 80000,
      desiredUsage: 'Gaming at 1440p and some light video editing.',
      includePeripherals: false,
      chassisSize: 'Any',
      buildTheme: '',
    },
  });

  const onSubmit: SubmitHandler<BuilderFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    setAnalysisLoading(false);
    setBottleneckReport(null);
    setGamingReport(null);

    const userMessage = `Budget: ₹${data.budget}, Usage: ${data.desiredUsage}, Peripherals: ${data.includePeripherals}, Size: ${data.chassisSize}, Theme: ${data.buildTheme || 'None'}`;
    addMessage({ type: 'user', feature: 'builder', content: userMessage });

    try {
      const result = await handleSuggestPcBuild(data);
      setSuggestion(result);
      addMessage({ type: 'ai', feature: 'builder', content: 'Here is your PC build suggestion:', data: result });
      toast({
        title: "Build Suggestion Ready!",
        description: "Now analyzing the build's performance...",
        variant: "default",
      });

      setAnalysisLoading(true);
      const cpu = result.components.find(c => c.type === 'CPU')?.name;
      const gpu = result.components.find(c => c.type === 'GPU')?.name;
      
      const analysisPromises: Promise<any>[] = [];

      if (cpu && gpu) {
        analysisPromises.push(handleCalculateBottleneck({ cpu, gpu }));
        analysisPromises.push(handleEstimateGamingPerformance({ cpu, gpu, gameName: 'Cyberpunk 2077' }));
      }
      
      const [bottleneckResult, gamingResult] = await Promise.allSettled(analysisPromises);
      
      if (bottleneckResult.status === 'fulfilled') setBottleneckReport(bottleneckResult.value);
      if (gamingResult.status === 'fulfilled') setGamingReport(gamingResult.value);

      setAnalysisLoading(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Generating Build",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'builder', content: `Error: ${errorMessage}` });
      setAnalysisLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const analysisLinks = useMemo(() => {
    if (!suggestion) return null;
    const cpu = suggestion.components.find(c => c.type.toLowerCase() === 'cpu')?.name;
    const gpu = suggestion.components.find(c => c.type.toLowerCase() === 'gpu')?.name;
    return { cpu, gpu };
  }, [suggestion]);


  return (
    <div className="space-y-8">
      <SectionTitle>AI PC Builder</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1">
          <GlassCardHeader>
            <GlassCardTitle>Configure Your Dream PC</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 80000" {...field} className="bg-background/50 rounded-full px-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desiredUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired Usage</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., High-end gaming, 4K video editing, streaming" {...field} className="bg-background/50 rounded-xl p-4 min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="chassisSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chassis Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 rounded-full px-4">
                              <SelectValue placeholder="Select a case size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Any">Any Size</SelectItem>
                            <SelectItem value="SFF">Small Form Factor (SFF)</SelectItem>
                            <SelectItem value="Mini-Tower">Mini-Tower</SelectItem>
                            <SelectItem value="Mid-Tower">Mid-Tower</SelectItem>
                            <SelectItem value="Full-Tower">Full-Tower</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                      control={form.control}
                      name="buildTheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Build Theme</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., All White, Black RGB" {...field} className="bg-background/50 rounded-full px-4" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <FormField
                  control={form.control}
                  name="includePeripherals"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-full border p-3 px-4 bg-background/20">
                      <div className="space-y-0.5">
                        <FormLabel>
                          Include Peripherals?
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Monitor, Keyboard & Mouse
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105">
                  {isLoading ? <LoadingSpinner /> : 'Generate Build'}
                </Button>
              </form>
            </Form>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="lg:col-span-2 min-h-[400px]">
          <GlassCardHeader>
            <GlassCardTitle>Build Suggestion & Analysis</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Crafting your build... this might take a moment.</p>
              </div>
            )}
            {!isLoading && !suggestion && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Bot size={48} className="text-primary mb-4" />
                <p className="text-muted-foreground">Your personalized PC build will appear here once generated.</p>
                <p className="text-sm text-muted-foreground/70 mt-2">Fill out the form and click "Generate Build".</p>
              </div>
            )}
            {suggestion && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold text-accent mb-1">Overall Performance: {suggestion.overallPerformance}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{suggestion.buildExplanation}</p>
                  <p className="text-2xl font-bold text-primary">Estimated Total Cost: ₹{suggestion.estimatedTotalCost.toFixed(2)}</p>
                </div>
                <ScrollArea className="h-[400px] pr-3">
                  <div className="space-y-4">
                    {suggestion.components.map((component, index) => (
                      <ComponentCard key={index} component={component} />
                    ))}
                  </div>
                </ScrollArea>
                
                 <div className="mt-4 space-y-4">
                  <h4 className="text-lg font-semibold text-primary">Build Analysis</h4>
                  {analysisLoading ? (
                    <div className="flex items-center justify-center py-6 bg-card/50 rounded-lg">
                      <LoadingSpinner />
                      <p className="ml-3 text-muted-foreground">Performing deep analysis on the build...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      <GlassCard className="p-4">
                          <GlassCardTitle className="text-lg mb-2 flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-accent" /> Compatibility</GlassCardTitle>
                          <div className="flex items-center gap-2">
                              <CheckCircle className="h-6 w-6 text-accent" />
                              <p className="font-semibold text-foreground">Build Pre-Verified</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">This build has been pre-checked for component compatibility by the AI.</p>
                      </GlassCard>
                      {bottleneckReport && <BottleneckReportCard report={bottleneckReport} />}
                      {gamingReport && <GamingReportCard report={gamingReport} />}
                    </div>
                  )}
                  {analysisLinks?.cpu && analysisLinks?.gpu && (
                    <Dialog open={isBenchmarkDialogOpen} onOpenChange={setIsBenchmarkDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline" className="w-full rounded-full border-primary text-primary hover:bg-primary/10">
                              <TestTube2 className="mr-2 h-4 w-4" /> Show Detailed Benchmarks
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                          <DialogHeader>
                              <DialogTitle>Benchmark Scores for {analysisLinks.cpu} & {analysisLinks.gpu}</DialogTitle>
                          </DialogHeader>
                          {isBenchmarkDialogOpen && (
                              <BenchmarkResults cpuName={analysisLinks.cpu} gpuName={analysisLinks.gpu} />
                          )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

function ComponentCard({ component }: { component: PCComponent }) {
    const componentTypeKey = component.type.toLowerCase();
    const Icon = componentIcons[componentTypeKey] || Bot;
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-card/50 hover:bg-card/80 transition-colors duration-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-accent shrink-0" />
            <div>
                <h4 className="font-semibold text-primary">{component.name} <span className="text-xs text-muted-foreground">({component.type})</span></h4>
                <p className="text-sm text-muted-foreground">{component.estimatedPerformance}</p>
            </div>
        </div>
        <p className="text-lg font-bold text-accent shrink-0 ml-2">₹{component.price.toFixed(2)}</p>
      </div>
      {component.link && (
        <a href={component.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
          <Button variant="link" size="sm" className="text-accent p-0 h-auto hover:text-accent/80 rounded-full">
            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Buy Now
          </Button>
        </a>
      )}
    </div>
  );
}

const BottleneckReportCard = ({ report }: { report: BottleneckInfo }) => {
  const getBottleneckColor = (percentage: number) => {
    const absPercentage = Math.abs(percentage);
    if (absPercentage > 20) return 'hsl(var(--destructive))';
    if (absPercentage > 10) return 'hsl(var(--chart-4))';
    return 'hsl(var(--accent))';
  };
  return (
    <GlassCard className="p-4">
      <GlassCardTitle className="text-lg mb-2 flex items-center"><Zap className="mr-2 h-5 w-5" /> Bottleneck</GlassCardTitle>
      <p
        className="text-3xl font-bold"
        style={{ color: getBottleneckColor(report.bottleneckPercentage) }}
      >
        {report.bottleneckPercentage.toFixed(1)}%
      </p>
      <Progress
        value={Math.abs(report.bottleneckPercentage)}
        className="w-full h-2 mt-1 rounded-full"
        style={{ '--indicator-color': getBottleneckColor(report.bottleneckPercentage) } as React.CSSProperties}
      />
      <p className="text-xs text-muted-foreground mt-1">{report.explanation}</p>
    </GlassCard>
  );
};

const GamingReportCard = ({ report }: { report: GamingPerformanceOutput }) => {
  return (
    <GlassCard className="p-4">
      <GlassCardTitle className="text-lg mb-2 flex items-center"><Gamepad2 className="mr-2 h-5 w-5" /> Gaming FPS</GlassCardTitle>
      <p className="text-xs text-muted-foreground mb-2">Estimated FPS for Cyberpunk 2077</p>
      <div className="space-y-1">
        {report.performance.map(p => (
          <div key={p.resolution} className="flex justify-between items-center text-sm">
            <span className="font-medium">{p.resolution}</span>
            <Badge variant="secondary" className="font-mono">{p.estimatedFps}</Badge>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
