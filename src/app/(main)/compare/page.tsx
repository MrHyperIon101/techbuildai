
"use client";

import React, { useState, useEffect, Suspense } from 'react';
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
import { handleCompareComponents } from '@/lib/actions';
import type { CompareComponentsOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Cpu, Video, GitCompareArrows, ThumbsUp, Scale } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const comparisonFormSchema = z.object({
  componentA: z.string().min(3, "Component name must be at least 3 characters.").max(100),
  componentB: z.string().min(3, "Component name must be at least 3 characters.").max(100),
  componentType: z.enum(['CPU', 'GPU'], {
    required_error: "You need to select a component type.",
  }),
});

type ComparisonFormValues = z.infer<typeof comparisonFormSchema>;

function ComponentComparisonView() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompareComponentsOutput | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();
  const searchParams = useSearchParams();

  const form = useForm<ComparisonFormValues>({
    resolver: zodResolver(comparisonFormSchema),
    defaultValues: {
      componentA: '',
      componentB: '',
      componentType: 'CPU',
    },
  });

  useEffect(() => {
    const compA = searchParams.get('componentA');
    if (compA) {
      form.setValue('componentA', compA);
    }
  }, [searchParams, form]);


  const onSubmit: SubmitHandler<ComparisonFormValues> = async (data) => {
    setIsLoading(true);
    setReport(null);
    const userInputSummary = `${data.componentType}: ${data.componentA} vs ${data.componentB}`;
    addMessage({ type: 'user', feature: 'compare-components', content: `Comparing components: ${userInputSummary}` });
    try {
      const result = await handleCompareComponents(data);
      setReport(result);
      addMessage({ type: 'ai', feature: 'compare-components', content: `Comparison generated.`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Comparing Components",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'compare-components', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getWinnerBadge = (winner: string) => {
    switch(winner) {
      case 'Component A':
      case 'Component B':
        return 'bg-accent/20 text-accent-foreground border border-accent';
      case 'It depends':
        return 'bg-primary/20 text-primary-foreground border border-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Choose Components to Compare</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="componentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Component Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="CPU" /></FormControl>
                          <FormLabel className="font-normal flex items-center gap-2"><Cpu /> CPU</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="GPU" /></FormControl>
                          <FormLabel className="font-normal flex items-center gap-2"><Video /> GPU</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <FormField control={form.control} name="componentA" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Component A</FormLabel>
                    <FormControl><Input placeholder="e.g., Ryzen 7 7800X3D" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                  <FormField control={form.control} name="componentB" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Component B</FormLabel>
                    <FormControl><Input placeholder="e.g., Intel Core i7-13700K" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105">
                {isLoading ? <LoadingSpinner /> : <><GitCompareArrows className="mr-2 h-5 w-5" /> Compare</>}
              </Button>
            </form>
          </Form>
        </GlassCardContent>
      </GlassCard>

      {(isLoading || report) && (
        <GlassCard className="min-h-[300px]">
          <GlassCardHeader>
            <GlassCardTitle>Comparison Report</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Analyzing components...</p>
              </div>
            )}
            {report && (
              <div className="animate-fade-in space-y-6">
                <div className={`p-4 rounded-lg text-center ${getWinnerBadge(report.winner)}`}>
                    <h3 className="text-2xl font-semibold">Overall Winner: {report.winner}</h3>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-primary mb-2">Summary</h4>
                  <p className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none">{report.summary}</p>
                </div>
                
                <div>
                    <h4 className="text-xl font-semibold text-primary mb-2">Detailed Breakdown</h4>
                    <div className="space-y-2">
                      {report.comparisonPoints.map((point, index) => (
                        <div key={index} className="p-3 rounded-lg border border-white/10 bg-card/50">
                          <h5 className="font-semibold text-accent">{point.metric}</h5>
                          <div className="grid grid-cols-2 gap-4 mt-1 text-sm">
                            <div><strong className="text-muted-foreground">A: </strong>{point.valueA}</div>
                            <div><strong className="text-muted-foreground">B: </strong>{point.valueB}</div>
                          </div>
                          <p className="text-xs text-muted-foreground italic mt-2 pt-2 border-t border-white/5"><ThumbsUp className="inline-block h-3 w-3 mr-1" />{point.verdict}</p>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
      {!isLoading && !report && (
          <GlassCard className="min-h-[300px]">
              <GlassCardHeader>
                  <GlassCardTitle>Comparison Report</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <Scale size={48} className="text-primary mb-4" />
                  <p className="text-muted-foreground">Enter two components above to see a detailed comparison.</p>
              </GlassCardContent>
          </GlassCard>
      )}
    </div>
  );
}

export default function ComponentComparisonPage() {
  return (
    <div className="space-y-8">
      <SectionTitle>Component Comparison</SectionTitle>
      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size={48} />
        </div>
      }>
        <ComponentComparisonView />
      </Suspense>
    </div>
  );
}
