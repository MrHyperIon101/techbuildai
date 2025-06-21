
"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
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
import { handleGet3dMarkScores } from '@/lib/actions';
import type { Gpu3dMarkScoreEntry, Gpu3dMarkScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChartHorizontalBig, Layers, Info, ArrowUpDown, ListChecks } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { useSearchParams } from 'next/navigation';

const searchSchema = z.object({
  gpuName: z.string().max(100, "GPU name is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKeyGpu = keyof Gpu3dMarkScoreEntry | '';
type SortOrderGpu = 'asc' | 'desc';

function TopGpuChart({ scores }: { scores: Gpu3dMarkScoreEntry[] }) {
    const timeSpyScores = useMemo(() => {
        return scores
            .filter(s => s.benchmarkName === "Time Spy Graphics" && s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10) // Show top 10 for clarity
            .map(s => ({ ...s, shortName: s.gpuName.replace(/NVIDIA|AMD|GeForce|Radeon/g, '').trim() }));
    }, [scores]);

    if (timeSpyScores.length === 0) return null;

    const chartConfig = {
        score: {
            label: "Time Spy Score",
            color: "hsl(var(--accent))",
        },
    } satisfies ChartConfig;

    return (
        <div className="mb-8">
             <h3 className="text-xl font-semibold text-center mb-4 text-primary">Top GPUs: Time Spy Graphics Score</h3>
            <ChartContainer config={chartConfig} className="w-full h-[300px] md:h-[400px]">
                <BarChart data={timeSpyScores} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" dataKey="score" />
                    <YAxis dataKey="shortName" type="category" width={120} tick={{ fontSize: 12 }} interval={0} />
                    <ChartTooltip cursor={{fill: 'hsla(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}

function SortableGpuScoreTable({ scores, dataSourceNotes, initialSortKey = 'score' }: { scores: Gpu3dMarkScoreEntry[], dataSourceNotes?: string, initialSortKey?: SortKeyGpu }) {
  const [sortKey, setSortKey] = useState<SortKeyGpu>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrderGpu>('desc');

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof Gpu3dMarkScoreEntry];
        const valB = b[sortKey as keyof Gpu3dMarkScoreEntry];

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
  }, [scores, sortKey, sortOrder]);

  const handleSort = (key: SortKeyGpu) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (key: SortKeyGpu) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 text-accent" /> :
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent" />;
  };

  if (sortedScores.length === 0) {
    return (
      <div className="py-6 text-center">
        <Layers size={48} className="text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">No 3DMark scores data available at the moment.</p>
        {dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-2">{dataSourceNotes}</p>}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('gpuName')}>
                <div className="flex items-center">GPU Name {renderSortIcon('gpuName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('benchmarkName')}>
                <div className="flex items-center">Benchmark {renderSortIcon('benchmarkName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('score')}>
                <div className="flex items-center">Score {renderSortIcon('score')}</div>
              </TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary">{item.gpuName}</TableCell>
                <TableCell>{item.benchmarkName}</TableCell>
                <TableCell className="text-accent font-semibold">{item.score > 0 ? item.score.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.notes || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {dataSourceNotes && (
        <p className="text-xs text-muted-foreground italic mt-4 p-2 bg-muted/20 rounded-md">
          <Info size={14} className="inline mr-1.5 mb-0.5" />
          {dataSourceNotes}
        </p>
      )}
    </>
  );
}

function ThreeDMarkScoresView() {
  const [isLoadingTopGpus, setIsLoadingTopGpus] = useState(false);
  const [topGpuScoresOutput, setTopGpuScoresOutput] = useState<Gpu3dMarkScoresOutput | null>(null);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchResultOutput, setSearchResultOutput] = useState<Gpu3dMarkScoresOutput | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addMessage } = useConversation();
  const searchParams = useSearchParams();
  const gpuQuery = searchParams.get('gpuName');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { gpuName: '' },
  });

  const onSearchSubmit: SubmitHandler<SearchFormValues> = useCallback(async (data) => {
    setIsLoadingSearch(true);
    setSearchResultOutput(null); 
    const queryInput = data?.gpuName?.trim() || "";
    
    if (!queryInput) {
        toast({
            title: "Empty Search",
            description: "Please enter a GPU name to search.",
            variant: "default"
        });
        setIsLoadingSearch(false);
        setSearchedQuery(null);
        return;
    }
    
    setSearchedQuery(queryInput);
    addMessage({ type: 'user', feature: '3dmark-scores', content: `Search 3DMark scores for: ${queryInput}` });

    try {
      const result = await handleGet3dMarkScores({ gpuName: queryInput });
      setSearchResultOutput(result);
      addMessage({ type: 'ai', feature: '3dmark-scores', content: `3DMark scores for ${queryInput}:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during search.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: '3dmark-scores', content: `Error: ${errorMessage}` });
      setSearchResultOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingSearch(false);
    }
  }, [addMessage, toast]);

  const fetchTopGpuScores = useCallback(async () => {
    setIsLoadingTopGpus(true);
    setTopGpuScoresOutput(null);
    addMessage({ type: 'user', feature: '3dmark-scores', content: `Fetching general list of top GPU 3DMark scores.` });
    try {
      const result = await handleGet3dMarkScores({ gpuName: undefined });
      setTopGpuScoresOutput(result);
      addMessage({ type: 'ai', feature: '3dmark-scores', content: `Top GPU 3DMark scores list:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching top GPU list.";
      toast({
        title: "Error Fetching Top GPU Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: '3dmark-scores', content: `Error: ${errorMessage}` });
      setTopGpuScoresOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingTopGpus(false);
    }
  }, [addMessage, toast]);
  
  useEffect(() => {
    if (gpuQuery) {
        form.setValue('gpuName', gpuQuery);
        onSearchSubmit({ gpuName: gpuQuery });
    } else {
        fetchTopGpuScores();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpuQuery]);
  
  return (
    <div className="space-y-8">
      <SectionTitle>3DMark GPU Scores</SectionTitle>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center">
            <ListChecks size={28} className="mr-3 text-accent" />
            Top GPUs - General 3DMark Scores
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoadingTopGpus && !gpuQuery && (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Fetching top GPU scores...</p>
            </div>
          )}
          {!isLoadingTopGpus && topGpuScoresOutput && (
            <>
              <TopGpuChart scores={topGpuScoresOutput.scores} />
              <SortableGpuScoreTable scores={topGpuScoresOutput.scores} dataSourceNotes={topGpuScoresOutput.dataSourceNotes} />
            </>
          )}
        </GlassCardContent>
      </GlassCard>
      
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search Specific GPU Benchmarks</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="gpuName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>GPU Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NVIDIA GeForce RTX 4080" {...field} className="bg-background/50 rounded-full px-4" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoadingSearch} className="w-full md:w-auto rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoadingSearch ? <LoadingSpinner /> : 'Search Scores'}
              </Button>
            </form>
          </Form>
        </GlassCardContent>
      </GlassCard>

      {(isLoadingSearch || searchResultOutput) && (
        <GlassCard className="mt-6">
          <GlassCardHeader>
            <GlassCardTitle>
              {searchedQuery ? `Benchmark Results for ${searchedQuery}` : "Search Results"}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoadingSearch && (
              <div className="flex flex-col items-center justify-center py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Fetching scores for {searchedQuery}...</p>
              </div>
            )}
            {!isLoadingSearch && searchResultOutput && (
                searchResultOutput.scores.length > 0 ? (
                    <SortableGpuScoreTable scores={searchResultOutput.scores} dataSourceNotes={searchResultOutput.dataSourceNotes} />
                ) : (
                    <div className="py-6 text-center">
                        <Layers size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                        No specific 3DMark scores found for "{searchedQuery || 'your query'}".
                        </p>
                        {searchResultOutput.dataSourceNotes && (
                            <p className="text-sm text-muted-foreground/70 mt-2">{searchResultOutput.dataSourceNotes}</p>
                        )}
                    </div>
                )
            )}
          </GlassCardContent>
        </GlassCard>
      )}
      
      {!isLoadingSearch && !searchResultOutput && form.formState.isSubmitted && searchedQuery && (
         <GlassCard className="mt-6">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <Layers size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No results found for "{searchedQuery}". Please check the GPU name or try another search.</p>
            {searchResultOutput?.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{searchResultOutput.dataSourceNotes}</p>}
          </GlassCardContent>
         </GlassCard>
      )}

       {!isLoadingSearch && !searchResultOutput && (!form.formState.isSubmitted || !searchedQuery) && !gpuQuery && ( 
         <GlassCard className="mt-6 opacity-70">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <BarChartHorizontalBig size={56} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Enter a GPU name above to search for its specific scores.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}


export default function ThreeDMarkScoresPage() {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size={48} />
        </div>
      }>
        <ThreeDMarkScoresView />
      </Suspense>
    );
}
