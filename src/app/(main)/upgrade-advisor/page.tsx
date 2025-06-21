
"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { handleProposeUpgradePath } from '@/lib/actions';
import type { UpgradePath } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu, Video, MemoryStick, HardDrive, Power, HardDriveDownload, Trash2, Plus, TrendingUp, Bot, AlertTriangle, Lightbulb, ShoppingCart } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

const currentComponentSchema = z.object({
  type: z.enum(['CPU', 'GPU', 'RAM', 'Motherboard', 'PSU', 'Storage', 'Case']),
  name: z.string().min(3, "Component name is required."),
});

const upgradeAdvisorFormSchema = z.object({
  currentComponents: z.array(currentComponentSchema).min(3, "Please provide at least CPU, Motherboard, and RAM."),
  performanceGoal: z.string().min(10, "Please describe your performance goal.").max(300),
  budget: z.coerce.number().min(0, "Budget must be a positive number.").max(500000, "Budget seems too high."),
});

type UpgradeAdvisorFormValues = z.infer<typeof upgradeAdvisorFormSchema>;

const componentTypeIcons = {
  CPU: Cpu,
  GPU: Video,
  RAM: MemoryStick,
  Motherboard: HardDriveDownload,
  PSU: Power,
  Storage: HardDrive,
  Case: (props: any) => <div {...props} className="w-5 h-5 border-2 rounded-sm border-current" />,
};

export default function UpgradeAdvisorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<UpgradePath | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const form = useForm<UpgradeAdvisorFormValues>({
    resolver: zodResolver(upgradeAdvisorFormSchema),
    defaultValues: {
      currentComponents: [
        { type: 'CPU', name: 'Ryzen 5 3600' },
        { type: 'GPU', name: 'NVIDIA RTX 2060' },
        { type: 'RAM', name: '16GB DDR4 3200MHz' },
        { type: 'Motherboard', name: 'MSI B450 TOMAHAWK' },
      ],
      performanceGoal: 'Play modern AAA games at 1440p with high settings.',
      budget: 40000,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "currentComponents",
  });

  const onSubmit: SubmitHandler<UpgradeAdvisorFormValues> = async (data) => {
    setIsLoading(true);
    setReport(null);
    const userMessage = `Current build analysis requested. Goal: ${data.performanceGoal}, Budget: ₹${data.budget}`;
    addMessage({ type: 'user', feature: 'general', content: userMessage, data: data.currentComponents });

    try {
      const result = await handleProposeUpgradePath(data);
      setReport(result);
      addMessage({ type: 'ai', feature: 'general', content: 'Here is your upgrade path suggestion:', data: result });
      toast({
        title: "Upgrade Path Ready!",
        description: "The AI has analyzed your build and suggested upgrades.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Generating Upgrade Path",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'general', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle>AI Upgrade Advisor</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-1">
          <GlassCardHeader>
            <GlassCardTitle>Your Current PC & Goals</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <FormLabel>Current Components</FormLabel>
                  <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`currentComponents.${index}.type`}
                          render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-[150px] bg-background/50"><SelectValue /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.keys(componentTypeIcons).map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`currentComponents.${index}.name`}
                          render={({ field }) => (
                            <FormControl>
                              <Input {...field} placeholder="Component Name" className="bg-background/50" />
                            </FormControl>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ type: 'PSU', name: '' })} className="mt-2">
                    <Plus className="mr-2 h-4 w-4" /> Add Component
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="performanceGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance Goal</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Smooth 1440p gaming, faster video rendering..." {...field} className="bg-background/50 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upgrade Budget (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 40000" {...field} className="bg-background/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {isLoading ? <LoadingSpinner /> : 'Advise Upgrade'}
                </Button>
              </form>
            </Form>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="lg:col-span-2 min-h-[400px]">
          <GlassCardHeader>
            <GlassCardTitle>Upgrade Recommendation</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Analyzing your build for the best upgrade path...</p>
              </div>
            )}
            {!isLoading && !report && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Bot size={48} className="text-primary mb-4" />
                <p className="text-muted-foreground">Your personalized upgrade advice will appear here.</p>
              </div>
            )}
            {report && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-xl font-semibold text-accent mb-1">AI Analysis of Your Build</h3>
                  <p className="text-sm text-muted-foreground mb-3">{report.analysis}</p>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-accent mb-2">Suggested Upgrades</h3>
                    <p className="text-2xl font-bold text-primary mb-4">Total Cost: ₹{report.totalUpgradeCost.toFixed(2)}</p>
                    <div className="space-y-4">
                        {report.upgrades.map((item, index) => {
                            const Icon = componentTypeIcons[item.type as keyof typeof componentTypeIcons] || TrendingUp;
                            return (
                                <div key={index} className="p-4 rounded-lg border border-white/10 bg-card/50">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-6 h-6 text-accent shrink-0" />
                                            <div>
                                                <h4 className="font-semibold text-primary">{item.name} <span className="text-xs text-muted-foreground">({item.type})</span></h4>
                                                <p className="text-sm text-muted-foreground">{item.reason}</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-accent shrink-0">₹{item.price.toFixed(2)}</p>
                                    </div>
                                     <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                                        <Button variant="link" size="sm" className="text-accent p-0 h-auto hover:text-accent/80">
                                            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Buy Now
                                        </Button>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-accent mb-1">Expected Performance After Upgrade</h3>
                  <p className="text-sm text-muted-foreground">{report.performanceEstimateAfter}</p>
                </div>

                {report.warnings && report.warnings.length > 0 && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50">
                        <h3 className="text-lg font-semibold text-destructive mb-2 flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Important Warnings</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-destructive-foreground/90">
                           {report.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
                        </ul>
                    </div>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

