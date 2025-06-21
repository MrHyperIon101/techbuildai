
"use client";

import React, { useState, useEffect } from 'react';
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
import { handleEstimateGamingPerformance } from '@/lib/actions';
import type { GamingPerformanceOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Gamepad2, AlertTriangle, Cpu, Video, CheckCircle, Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const performanceFormSchema = z.object({
  cpu: z.string().min(3, "CPU model must be at least 3 characters.").max(100),
  gpu: z.string().min(3, "GPU model must be at least 3 characters.").max(100),
  gameName: z.string().min(2, "Game name must be at least 2 characters.").max(100),
});

type PerformanceFormValues = z.infer<typeof performanceFormSchema>;

export default function GamingEstimatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<GamingPerformanceOutput | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();
  const searchParams = useSearchParams();

  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceFormSchema),
    defaultValues: {
      cpu: '',
      gpu: '',
      gameName: '',
    },
  });

  useEffect(() => {
    const cpu = searchParams.get('cpu');
    const gpu = searchParams.get('gpu');
    if (cpu) form.setValue('cpu', cpu);
    if (gpu) form.setValue('gpu', gpu);
  }, [searchParams, form]);


  const onSubmit: SubmitHandler<PerformanceFormValues> = async (data) => {
    setIsLoading(true);
    setReport(null);
    const userInputSummary = `CPU: ${data.cpu}, GPU: ${data.gpu}, Game: ${data.gameName}`;
    addMessage({ type: 'user', feature: 'gaming-estimator', content: `Estimating performance for: ${userInputSummary}` });
    try {
      const result = await handleEstimateGamingPerformance(data);
      setReport(result);
      addMessage({ type: 'ai', feature: 'gaming-estimator', content: `Performance estimate generated.`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Estimating Performance",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'gaming-estimator', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <SectionTitle>Gaming Performance Estimator</SectionTitle>
      <div className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Enter Build and Game</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="cpu" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU Model</FormLabel>
                      <FormControl><Input placeholder="e.g., AMD Ryzen 5 7600X" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gpu" render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPU Model</FormLabel>
                      <FormControl><Input placeholder="e.g., NVIDIA GeForce RTX 4060 Ti" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="gameName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Cyberpunk 2077" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105">
                  {isLoading ? <LoadingSpinner /> : <><Gamepad2 className="mr-2 h-5 w-5" /> Estimate FPS</>}
                </Button>
              </form>
            </Form>
          </GlassCardContent>
        </GlassCard>

        {(isLoading || report) && (
          <GlassCard className="min-h-[300px]">
            <GlassCardHeader>
              <GlassCardTitle>Performance Estimate</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <LoadingSpinner size={48} />
                  <p className="mt-4 text-muted-foreground">Analyzing performance data...</p>
                </div>
              )}
              {report && (
                <div className="animate-fade-in space-y-6">
                  {report.performance.length > 0 ? (
                    <>
                      <div className="p-4 rounded-lg bg-primary/10">
                        <h4 className="text-xl font-semibold text-primary mb-2">Overall Assessment</h4>
                        <p className="text-sm text-foreground/90">{report.overallAssessment}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report.performance.map((res, index) => (
                          <div key={index} className="p-4 rounded-lg border border-white/10 bg-card/50">
                            <h5 className="font-semibold text-accent text-lg">{res.resolution}</h5>
                            <p className="text-3xl font-bold text-primary my-2">{res.estimatedFps}</p>
                            <Badge variant="secondary" className="mb-2">{res.settings}</Badge>
                            <p className="text-xs text-muted-foreground">{res.commentary}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                        <AlertTriangle size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">{report.overallAssessment || `Could not generate a performance estimate for "${form.getValues('gameName')}". The game might be too new, old, or obscure.`}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground italic text-center pt-4 border-t border-white/10">
                    <Info className="inline h-3 w-3 mr-1"/>
                    Estimates are based on AI analysis of available benchmark data and can vary based on game updates, driver versions, and specific in-game scenes.
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}
        {!isLoading && !report && (
            <GlassCard className="min-h-[300px]">
                <GlassCardHeader>
                    <GlassCardTitle>Performance Estimate</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <Gamepad2 size={48} className="text-primary mb-4" />
                    <p className="text-muted-foreground">Enter a CPU, GPU, and game to get an FPS estimate.</p>
                </GlassCardContent>
            </GlassCard>
        )}
      </div>
    </div>
  );
}
