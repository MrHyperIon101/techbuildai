
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardFooter } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { handleSuggestPcBuild } from '@/lib/actions';
import type { BuildSuggestion, PCComponent } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { AlertCircle, CheckCircle, ShoppingCart, BarChart3, Bot } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const builderFormSchema = z.object({
  budget: z.coerce.number().min(8000, "Budget must be at least ₹8,000").max(8000000, "Budget cannot exceed ₹8,000,000"),
  desiredUsage: z.string().min(10, "Please describe your needs in at least 10 characters.").max(500, "Description is too long."),
});

type BuilderFormValues = z.infer<typeof builderFormSchema>;

export default function AiPcBuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<BuildSuggestion | null>(null);
  const { toast } = useToast();
  const { addMessage, getMessagesByFeature } = useConversation();

  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      budget: 80000,
      desiredUsage: 'Gaming at 1440p and some light video editing.',
    },
  });

  const onSubmit: SubmitHandler<BuilderFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    addMessage({ type: 'user', feature: 'builder', content: `Budget: ₹${data.budget}, Usage: ${data.desiredUsage}` });
    try {
      const result = await handleSuggestPcBuild(data);
      setSuggestion(result);
      addMessage({ type: 'ai', feature: 'builder', content: 'Here is your PC build suggestion:', data: result });
      toast({
        title: "Build Suggestion Ready!",
        description: "We've generated a PC build based on your criteria.",
        variant: "default",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Generating Build",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'builder', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  const conversationMessages = getMessagesByFeature('builder');

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
                <Link href="/bottleneck-calculator" passHref>
                  <Button variant="outline" className="w-full rounded-full mt-4 border-primary text-primary hover:bg-primary/10">
                    <BarChart3 className="mr-2 h-4 w-4" /> Check for Bottlenecks
                  </Button>
                </Link>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
      
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Conversation Log</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ScrollArea className="h-[200px] p-1 pr-3">
            {conversationMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No conversation yet for the PC builder.</p>
            ) : (
              <div className="space-y-3">
                {conversationMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`text-sm p-3 rounded-lg max-w-[80%] ${
                      msg.type === 'user' 
                        ? 'bg-primary/10 text-primary ml-auto' 
                        : msg.type === 'ai' 
                          ? 'bg-accent/10 text-accent mr-auto' 
                          : 'bg-muted/20 text-muted-foreground text-center text-xs italic'
                    }`}
                  >
                    <strong className="font-semibold">{msg.type === 'user' ? 'You' : msg.type === 'ai' ? 'TechBuild AI' : 'System'}:</strong>
                    {typeof msg.content === 'string' ? <p className="whitespace-pre-wrap">{msg.content}</p> : msg.content}
                    {msg.data && msg.type === 'ai' && (
                       <p className="mt-1 text-xs text-muted-foreground/80 italic">AI provided structured data (view in results panel).</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

function ComponentCard({ component }: { component: PCComponent }) {
  return (
    <div className="p-4 rounded-lg border border-white/10 bg-card/50 hover:bg-card/80 transition-colors duration-200">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-primary">{component.name} <span className="text-xs text-muted-foreground">({component.type})</span></h4>
          <p className="text-sm text-muted-foreground">{component.estimatedPerformance}</p>
        </div>
        <p className="text-lg font-bold text-accent">₹{component.price.toFixed(2)}</p>
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

