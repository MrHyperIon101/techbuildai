
"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { handleCalculateBottleneck } from '@/lib/actions';
import type { BottleneckInfo } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Zap, AlertTriangle, Cpu, MonitorPlay, TrendingUp, Gamepad2, Briefcase, Layers, Lightbulb } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const bottleneckFormSchema = z.object({
  cpu: z.string().min(3, "CPU model must be at least 3 characters.").max(100, "CPU model name is too long."),
  gpu: z.string().min(3, "GPU model must be at least 3 characters.").max(100, "GPU model name is too long."),
});

type BottleneckFormValues = z.infer<typeof bottleneckFormSchema>;

export default function BottleneckCalculatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [bottleneck, setBottleneck] = useState<BottleneckInfo | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const form = useForm<BottleneckFormValues>({
    resolver: zodResolver(bottleneckFormSchema),
    defaultValues: {
      cpu: '',
      gpu: '',
    },
  });

  const onSubmit: SubmitHandler<BottleneckFormValues> = async (data) => {
    setIsLoading(true);
    setBottleneck(null);
    addMessage({ type: 'user', feature: 'bottleneck-calculator', content: `CPU: ${data.cpu}, GPU: ${data.gpu}` });
    try {
      const result = await handleCalculateBottleneck(data);
      setBottleneck(result);
      addMessage({ type: 'ai', feature: 'bottleneck-calculator', content: `Bottleneck analysis:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Calculating Bottleneck",
        description: errorMessage,
        variant: "destructive",
      });
       addMessage({ type: 'system', feature: 'bottleneck-calculator', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getBottleneckColor = (percentage: number) => {
    // Assuming positive is CPU bottleneck, negative is GPU bottleneck for this color logic
    const absPercentage = Math.abs(percentage);
    if (absPercentage > 20) return 'hsl(var(--destructive))'; 
    if (absPercentage > 10) return 'hsl(var(--chart-4))'; 
    return 'hsl(var(--accent))'; 
  };

  const getBottleneckComponentText = (component?: 'CPU' | 'GPU' | 'Balanced' | 'Unknown') => {
    if (component === 'CPU') return "CPU is the primary bottleneck.";
    if (component === 'GPU') return "GPU is the primary bottleneck.";
    if (component === 'Balanced') return "System is relatively balanced.";
    return "Bottleneck component analysis not available.";
  }

  return (
    <div className="space-y-8">
      <SectionTitle>Bottleneck Calculator</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Enter Components</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="cpu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Intel Core i7-13700K" {...field} className="bg-background/50 rounded-full px-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gpu"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPU Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., NVIDIA GeForce RTX 4070 Ti" {...field} className="bg-background/50 rounded-full px-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105">
                  {isLoading ? <LoadingSpinner /> : 'Calculate Bottleneck'}
                </Button>
              </form>
            </Form>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="min-h-[300px]">
          <GlassCardHeader>
            <GlassCardTitle>Analysis Results</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Analyzing components...</p>
              </div>
            )}
            {!isLoading && !bottleneck && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Zap size={48} className="text-primary mb-4" />
                <p className="text-muted-foreground">Enter CPU and GPU models to analyze potential bottlenecks.</p>
              </div>
            )}
            {bottleneck && (
              <div className="animate-fade-in space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Overall Bottleneck Score</p>
                   <p 
                    className="text-5xl md:text-6xl font-bold"
                    style={{ color: getBottleneckColor(bottleneck.bottleneckPercentage) }}
                  >
                    {bottleneck.bottleneckPercentage.toFixed(1)}%
                  </p>
                  <Progress 
                    value={Math.abs(bottleneck.bottleneckPercentage)} 
                    className="w-full h-3 mt-2 rounded-full" 
                    style={{ 
                      // @ts-ignore 
                      '--indicator-color': getBottleneckColor(bottleneck.bottleneckPercentage) 
                    }}
                  />
                   <p className="text-xs text-muted-foreground mt-1">
                    (Positive: GPU limited by CPU. Negative: CPU limited by GPU. Near 0: Balanced)
                  </p>
                </div>
                
                <InfoSection icon={Layers} title="Primary Bottleneck Component">
                   <Badge 
                     variant={bottleneck.bottleneckComponent === 'Balanced' ? 'default' : 'destructive'}
                     className={bottleneck.bottleneckComponent === 'Balanced' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}
                    >
                      {bottleneck.bottleneckComponent || 'N/A'}
                    </Badge>
                  <p className="text-sm text-foreground/90 mt-1">{getBottleneckComponentText(bottleneck.bottleneckComponent)}</p>
                </InfoSection>

                <InfoSection icon={AlertTriangle} title="Explanation">
                  <p className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none">{bottleneck.explanation}</p>
                </InfoSection>

                {bottleneck.recommendedResolution && (
                  <InfoSection icon={MonitorPlay} title="Recommended Gaming Resolution">
                    <p className="text-sm text-foreground/90">{bottleneck.recommendedResolution}</p>
                  </InfoSection>
                )}

                {bottleneck.impactOnGaming && (
                  <InfoSection icon={Gamepad2} title="Impact on Gaming">
                    <p className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none">{bottleneck.impactOnGaming}</p>
                  </InfoSection>
                )}

                {bottleneck.impactOnWorkloads && (
                  <InfoSection icon={Briefcase} title="Impact on Workloads">
                    <p className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none">{bottleneck.impactOnWorkloads}</p>
                  </InfoSection>
                )}
                
                {bottleneck.potentialUpgradeSuggestions && bottleneck.potentialUpgradeSuggestions.length > 0 && (
                  <InfoSection icon={Lightbulb} title="Upgrade Suggestions">
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90">
                      {bottleneck.potentialUpgradeSuggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </InfoSection>
                )}

                <p className="text-xs text-muted-foreground italic mt-4">
                  Note: Bottleneck calculations are estimates and can vary based on specific workloads, resolutions, game settings, and other system components like RAM speed.
                </p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

interface InfoSectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

function InfoSection({ icon: Icon, title, children }: InfoSectionProps) {
  return (
    <div>
      <h4 className="text-lg font-semibold text-accent flex items-center mb-1">
        <Icon size={20} className="mr-2" /> {title}
      </h4>
      {children}
    </div>
  );
}
