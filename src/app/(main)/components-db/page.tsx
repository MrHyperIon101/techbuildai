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
import { handleGetComponentDetails } from '@/lib/actions';
import type { ComponentDetails } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu } from 'lucide-react';

const componentSearchSchema = z.object({
  componentName: z.string().min(2, "Component name must be at least 2 characters.").max(100, "Component name is too long."),
});

type ComponentSearchValues = z.infer<typeof componentSearchSchema>;

export default function ComponentDetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState<ComponentDetails | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const form = useForm<ComponentSearchValues>({
    resolver: zodResolver(componentSearchSchema),
    defaultValues: {
      componentName: '',
    },
  });

  const onSubmit: SubmitHandler<ComponentSearchValues> = async (data) => {
    setIsLoading(true);
    setDetails(null);
    addMessage({ type: 'user', feature: 'components-db', content: `Search for component: ${data.componentName}` });
    try {
      const result = await handleGetComponentDetails(data);
      setDetails(result);
      addMessage({ type: 'ai', feature: 'components-db', content: `Details for ${data.componentName}:`, data: result });
      toast({
        title: "Component Details Fetched!",
        description: `Successfully retrieved information for ${data.componentName}.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Fetching Details",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'components-db', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Component Database</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Search Component</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="componentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Component Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., RTX 4080, Ryzen 7 7800X3D" {...field} className="bg-background/50 rounded-full px-4" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105">
                  {isLoading ? <LoadingSpinner /> : 'Get Details'}
                </Button>
              </form>
            </Form>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="min-h-[300px]">
          <GlassCardHeader>
            <GlassCardTitle>Component Information</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Fetching component details...</p>
              </div>
            )}
            {!isLoading && !details && (
               <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <Cpu size={48} className="text-primary mb-4" />
                <p className="text-muted-foreground">Enter a component name to see its details.</p>
              </div>
            )}
            {details && (
              <ScrollArea className="h-[400px] pr-2">
                <div className="animate-fade-in space-y-3">
                  <h3 className="text-xl font-semibold text-accent">{form.getValues("componentName")} Summary</h3>
                  <div 
                    className="prose prose-sm prose-invert max-w-none text-foreground/90 font-body"
                    dangerouslySetInnerHTML={{ __html: details.summary.replace(/\n/g, '<br />') }}
                  />
                </div>
              </ScrollArea>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
