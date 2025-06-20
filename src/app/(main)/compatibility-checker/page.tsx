
"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/common/glass-card';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { handleCheckCompatibility } from '@/lib/actions';
import type { CompatibilityInput, CompatibilityReport, CompatibilityIssue } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { ShieldCheck, AlertTriangle, CheckCircle, Puzzle, Info, MessageSquareWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const compatibilityFormSchema = z.object({
  cpu: z.string().min(5, "CPU model must be at least 5 characters.").max(100),
  motherboard: z.string().min(5, "Motherboard model must be at least 5 characters.").max(100),
  ram: z.string().min(5, "RAM details must be at least 5 characters (e.g., 16GB DDR5 6000MHz).").max(100),
  gpu: z.string().optional(),
  psu: z.string().min(3, "PSU details must be at least 3 characters (e.g., 750W Gold).").max(100),
  pcCase: z.string().min(3, "Case details must be at least 3 characters (e.g., ATX Mid Tower).").max(100),
  storage: z.string().optional(),
});

type CompatibilityFormValues = z.infer<typeof compatibilityFormSchema>;

export default function CompatibilityCheckerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const form = useForm<CompatibilityFormValues>({
    resolver: zodResolver(compatibilityFormSchema),
    defaultValues: {
      cpu: '',
      motherboard: '',
      ram: '',
      gpu: '',
      psu: '',
      pcCase: '',
      storage: '',
    },
  });

  const onSubmit: SubmitHandler<CompatibilityFormValues> = async (data) => {
    setIsLoading(true);
    setReport(null);
    const userInputSummary = `CPU: ${data.cpu}, Mobo: ${data.motherboard}, RAM: ${data.ram}, GPU: ${data.gpu || 'N/A'}, PSU: ${data.psu}, Case: ${data.pcCase}, Storage: ${data.storage || 'N/A'}`;
    addMessage({ type: 'user', feature: 'compatibility-checker', content: `Checking compatibility for: ${userInputSummary}` });
    try {
      const result = await handleCheckCompatibility(data);
      setReport(result);
      addMessage({ type: 'ai', feature: 'compatibility-checker', content: `Compatibility report generated.`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Checking Compatibility",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'compatibility-checker', content: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle>PC Part Compatibility Checker</SectionTitle>
      <div className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Enter Your Components</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="cpu" render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPU Model</FormLabel>
                      <FormControl><Input placeholder="e.g., AMD Ryzen 7 7800X3D" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="motherboard" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motherboard Model</FormLabel>
                      <FormControl><Input placeholder="e.g., MSI B650 TOMAHAWK WIFI" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ram" render={({ field }) => (
                    <FormItem>
                      <FormLabel>RAM Details</FormLabel>
                      <FormControl><Input placeholder="e.g., 32GB DDR5 6000MHz CL30" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gpu" render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPU Model (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., NVIDIA GeForce RTX 4080" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="psu" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PSU (Wattage & Model)</FormLabel>
                      <FormControl><Input placeholder="e.g., Corsair RM850x 850W Gold" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="pcCase" render={({ field }) => (
                    <FormItem>
                      <FormLabel>PC Case (Model or Form Factor)</FormLabel>
                      <FormControl><Input placeholder="e.g., NZXT H7 Flow ATX Mid Tower" {...field} className="bg-background/50 rounded-full px-4" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="storage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Devices (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., 1TB NVMe SSD, 4TB HDD" {...field} className="bg-background/50 rounded-xl p-4 min-h-[80px]" /></FormControl>
                    <FormDescription>List main storage devices, comma-separated.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 transform hover:scale-105">
                  {isLoading ? <LoadingSpinner /> : <><ShieldCheck className="mr-2 h-5 w-5" /> Check Compatibility</>}
                </Button>
              </form>
            </Form>
          </GlassCardContent>
        </GlassCard>

        {(isLoading || report) && (
          <GlassCard className="min-h-[300px]">
            <GlassCardHeader>
              <GlassCardTitle>Compatibility Analysis</GlassCardTitle>
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
                  <div className={`p-4 rounded-lg text-center ${report.isGenerallyCompatible ? 'bg-accent/10 text-accent-foreground' : 'bg-destructive/10 text-destructive-foreground'}`}>
                    {report.isGenerallyCompatible ? (
                      <CheckCircle size={32} className="mx-auto mb-2 text-accent" />
                    ) : (
                      <AlertTriangle size={32} className="mx-auto mb-2 text-destructive" />
                    )}
                    <h3 className="text-2xl font-semibold">{report.isGenerallyCompatible ? "Generally Compatible" : "Potential Issues Found"}</h3>
                    <p className="text-sm opacity-90">{report.overallAssessment}</p>
                  </div>

                  {report.issues && report.issues.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold text-destructive mb-2 flex items-center"><AlertTriangle className="mr-2"/> Compatibility Issues:</h4>
                      <div className="space-y-3">
                        {report.issues.map((issue, index) => (
                          <IssueCard key={index} issue={issue} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {report.warnings && report.warnings.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold text-primary mb-2 flex items-center"><MessageSquareWarning className="mr-2"/> Important Warnings:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-foreground/90 bg-primary/5 p-3 rounded-md">
                        {report.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.checkedComponents && (
                    <div>
                      <h4 className="text-xl font-semibold text-accent mb-2 flex items-center"><Info className="mr-2"/> Components Analyzed by AI:</h4>
                      <div className="text-sm bg-muted/20 p-3 rounded-md space-y-1">
                        {Object.entries(report.checkedComponents).map(([key, value]) => value ? (
                          <p key={key}><strong className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}:</strong> {value}</p>
                        ) : null)}
                      </div>
                    </div>
                  )}
                  <Separator className="my-4" />
                  <p className="text-xs text-muted-foreground italic text-center">
                    Disclaimer: This AI compatibility check is for informational purposes only and may not cover all specific scenarios or configurations. Always verify compatibility with manufacturer specifications and documentation before purchasing components.
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}
        {!isLoading && !report && (
            <GlassCard className="min-h-[300px]">
                <GlassCardHeader>
                    <GlassCardTitle>Compatibility Analysis</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <Puzzle size={48} className="text-primary mb-4" />
                    <p className="text-muted-foreground">Enter your PC components above to check for compatibility.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">The AI will analyze them and report potential issues here.</p>
                </GlassCardContent>
            </GlassCard>
        )}
      </div>
    </div>
  );
}

interface IssueCardProps {
  issue: CompatibilityIssue;
}

function IssueCard({ issue }: IssueCardProps) {
  return (
    <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
      <h5 className="font-semibold text-destructive flex items-center">
        <AlertTriangle size={18} className="mr-2"/> {issue.issueType}
      </h5>
      <p className="text-sm text-destructive-foreground/90 mt-1">{issue.description}</p>
      {issue.componentA && (
        <div className="text-xs text-destructive-foreground/70 mt-1">
          Concern between: <Badge variant="destructive" className="mr-1">{issue.componentA}</Badge> 
          {issue.componentB && <React.Fragment> and <Badge variant="destructive">{issue.componentB}</Badge></React.Fragment>}
        </div>
      )}
      {issue.suggestion && (
        <p className="text-sm text-destructive-foreground/80 mt-2 pt-2 border-t border-destructive/30">
          <strong className="text-destructive">Suggestion:</strong> {issue.suggestion}
        </p>
      )}
    </div>
  );
}

