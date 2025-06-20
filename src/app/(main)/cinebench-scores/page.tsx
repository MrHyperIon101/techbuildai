
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { handleGetCinebenchScores } from '@/lib/actions';
import type { CinebenchScoreEntry, CinebenchScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Cpu, Info, ArrowUpDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const searchSchema = z.object({
  cpuName: z.string().max(100, "CPU name is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKey = keyof CinebenchScoreEntry | '';
type SortOrder = 'asc' | 'desc';

export default function CinebenchScoresPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scoresOutput, setScoresOutput] = useState<CinebenchScoresOutput | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const [sortKey, setSortKey] = useState<SortKey>('multiCoreScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { cpuName: '' },
  });

  const fetchScores = async (data?: SearchFormValues) => {
    setIsLoading(true);
    setScoresOutput(null);
    const query = data?.cpuName || "general list";
    setSearchedQuery(query);
    addMessage({ type: 'user', feature: 'cinebench-scores', content: `Search Cinebench scores for: ${query}` });

    try {
      const result = await handleGetCinebenchScores({ cpuName: data?.cpuName });
      setScoresOutput(result);
      addMessage({ type: 'ai', feature: 'cinebench-scores', content: `Cinebench scores for ${query}:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'cinebench-scores', content: `Error: ${errorMessage}` });
      setScoresOutput({ scores: [], dataSourceNotes: errorMessage }); // Show error in notes
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch general list on initial load
    fetchScores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  const onSubmit: SubmitHandler<SearchFormValues> = (data) => {
    fetchScores(data);
  };

  const sortedScores = useMemo(() => {
    if (!scoresOutput?.scores) return [];
    const sorted = [...scoresOutput.scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof CinebenchScoreEntry];
        const valB = b[sortKey as keyof CinebenchScoreEntry];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return sorted;
  }, [scoresOutput?.scores, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc'); // Default to desc for new numeric columns like scores
    }
  };
  
  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 text-accent" /> : 
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent" />;
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Cinebench CPU Scores</SectionTitle>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search CPU Benchmarks</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="cpuName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>CPU Model (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Intel Core i9-13900K (leave blank for general list)" {...field} className="bg-background/50 rounded-full px-4" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoading ? <LoadingSpinner /> : 'Search Scores'}
              </Button>
            </form>
          </Form>
        </GlassCardContent>
      </GlassCard>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size={64} />
          <p className="mt-6 text-muted-foreground text-lg">
            {searchedQuery === "general list" ? "Fetching general list of Cinebench scores..." : `Fetching Cinebench scores for ${searchedQuery}...`}
          </p>
        </div>
      )}

      {!isLoading && scoresOutput && (
        <GlassCard className="mt-6">
          <GlassCardHeader>
            <GlassCardTitle>
              Benchmark Results {searchedQuery && searchedQuery !== "general list" ? `for ${searchedQuery}` : "(Popular CPUs)"}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {scoresOutput.scores && scoresOutput.scores.length > 0 ? (
              <ScrollArea className="max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('cpuName')}>
                        <div className="flex items-center">CPU Name {renderSortIcon('cpuName')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('singleCoreScore')}>
                        <div className="flex items-center">Single-Core {renderSortIcon('singleCoreScore')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('multiCoreScore')}>
                        <div className="flex items-center">Multi-Core {renderSortIcon('multiCoreScore')}</div>
                      </TableHead>
                      <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('cinebenchVersion')}>
                        <div className="flex items-center">Version {renderSortIcon('cinebenchVersion')}</div>
                      </TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedScores.map((score, index) => (
                      <TableRow key={index} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-primary">{score.cpuName}</TableCell>
                        <TableCell className="text-accent">{score.singleCoreScore.toLocaleString()}</TableCell>
                        <TableCell className="text-accent font-semibold">{score.multiCoreScore.toLocaleString()}</TableCell>
                        <TableCell>{score.cinebenchVersion}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{score.notes || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="py-10 text-center">
                <Cpu size={48} className="text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No Cinebench scores found for "{searchedQuery || 'your query'}".
                </p>
                 {scoresOutput.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{scoresOutput.dataSourceNotes}</p>}
              </div>
            )}
            {scoresOutput.dataSourceNotes && scoresOutput.scores && scoresOutput.scores.length > 0 && (
              <p className="text-xs text-muted-foreground italic mt-4 p-2 bg-muted/20 rounded-md">
                <Info size={14} className="inline mr-1.5 mb-0.5" />
                {scoresOutput.dataSourceNotes}
              </p>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
       {!isLoading && !scoresOutput && !form.formState.isSubmitted && ( // Initial empty state before any search
         <GlassCard className="mt-6">
           <GlassCardContent className="py-10 text-center">
            <BarChart3 size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">Enter a CPU name or leave blank for a general list.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">CPU benchmark scores will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}
