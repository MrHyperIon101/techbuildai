
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
import { handleGetCinebenchScores } from '@/lib/actions';
import type { CinebenchScoreEntry, CinebenchScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Cpu, Info, ArrowUpDown, ListChecks } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { useSearchParams } from 'next/navigation';


const searchSchema = z.object({
  cpuName: z.string().max(100, "CPU name is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKey = keyof Omit<CinebenchScoreEntry, 'notes'> | ''; // Exclude 'notes'
type SortOrder = 'asc' | 'desc';

function TopCpuChart({ scores }: { scores: CinebenchScoreEntry[] }) {
    const chartData = useMemo(() => {
        return scores
            .filter(s => s.r23MultiCoreScore > 0)
            .sort((a, b) => b.r23MultiCoreScore - a.r23MultiCoreScore)
            .slice(0, 10) // Show top 10 for clarity
            .map(s => ({ ...s, shortName: s.cpuName.replace(/Intel Core |AMD Ryzen /g, '') }));
    }, [scores]);

    if (chartData.length === 0) return null;

    const chartConfig = {
        r23MultiCoreScore: {
            label: "R23 Multi-Core",
            color: "hsl(var(--accent))",
        },
        r23SingleCoreScore: {
            label: "R23 Single-Core",
            color: "hsl(var(--primary))",
        }
    } satisfies ChartConfig;

    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold text-center mb-4 text-primary">Top CPUs: Cinebench R23 Multi-Core Score</h3>
            <ChartContainer config={chartConfig} className="w-full h-[300px] md:h-[400px]">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" dataKey="r23MultiCoreScore" />
                    <YAxis dataKey="shortName" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                    <ChartTooltip cursor={{fill: 'hsla(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="r23MultiCoreScore" fill="var(--color-r23MultiCoreScore)" radius={4} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}

function SortableScoreTable({ scores, dataSourceNotes, initialSortKey = 'r23MultiCoreScore' }: { scores: CinebenchScoreEntry[], dataSourceNotes?: string, initialSortKey?: SortKey }) {
  const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof Omit<CinebenchScoreEntry, 'notes'>] as number | string | undefined;
        const valB = b[sortKey as keyof Omit<CinebenchScoreEntry, 'notes'>] as number | string | undefined;

        const numA = typeof valA === 'number' ? valA : (sortOrder === 'asc' ? Infinity : -Infinity);
        const numB = typeof valB === 'number' ? valB : (sortOrder === 'asc' ? Infinity : -Infinity);

        if (typeof valA === 'number' || valA === undefined) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return sorted;
  }, [scores, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-1 h-3 w-3 transform rotate-180 text-accent" /> :
      <ArrowUpDown className="ml-1 h-3 w-3 text-accent" />;
  };

  if (sortedScores.length === 0) {
    return (
      <div className="py-6 text-center">
        <Cpu size={48} className="text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">No Cinebench scores data available at the moment.</p>
        {dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-2">{dataSourceNotes}</p>}
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="max-h-[60vh] w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer group hover:bg-muted/50 sticky left-0 bg-card z-10" onClick={() => handleSort('cpuName')}>
                <div className="flex items-center">CPU Name {renderSortIcon('cpuName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('r23SingleCoreScore')}>
                <div className="flex items-center">R23 Single {renderSortIcon('r23SingleCoreScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('r23MultiCoreScore')}>
                <div className="flex items-center">R23 Multi {renderSortIcon('r23MultiCoreScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('r24SingleCoreScore')}>
                <div className="flex items-center">R24 Single {renderSortIcon('r24SingleCoreScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('r24MultiCoreScore')}>
                <div className="flex items-center">R24 Multi {renderSortIcon('r24MultiCoreScore')}</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((score, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary sticky left-0 bg-card z-0">{score.cpuName}</TableCell>
                <TableCell className="text-accent">{score.r23SingleCoreScore > 0 ? score.r23SingleCoreScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent font-semibold">{score.r23MultiCoreScore > 0 ? score.r23MultiCoreScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent">{score.r24SingleCoreScore && score.r24SingleCoreScore > 0 ? score.r24SingleCoreScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent font-semibold">{score.r24MultiCoreScore && score.r24MultiCoreScore > 0 ? score.r24MultiCoreScore.toLocaleString() : 'N/A'}</TableCell>
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


function CinebenchScoresView() {
  const [isLoadingTopCpus, setIsLoadingTopCpus] = useState(false);
  const [topCpuScoresOutput, setTopCpuScoresOutput] = useState<CinebenchScoresOutput | null>(null);

  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchResultOutput, setSearchResultOutput] = useState<CinebenchScoresOutput | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);

  const { toast } = useToast();
  const { addMessage } = useConversation();
  const searchParams = useSearchParams();
  const cpuQuery = searchParams.get('cpuName');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { cpuName: '' },
  });

  const onSearchSubmit: SubmitHandler<SearchFormValues> = useCallback(async (data) => {
    setIsLoadingSearch(true);
    setSearchResultOutput(null);
    const queryInput = data?.cpuName?.trim() || "";

    if (!queryInput) {
        toast({
            title: "Empty Search",
            description: "Please enter a CPU name to search.",
            variant: "default"
        });
        setIsLoadingSearch(false);
        setSearchedQuery(null);
        return;
    }

    setSearchedQuery(queryInput);
    addMessage({ type: 'user', feature: 'cinebench-scores', content: `Search Cinebench scores for: ${queryInput}` });

    try {
      const result = await handleGetCinebenchScores({ cpuName: queryInput });
      setSearchResultOutput(result);
      addMessage({ type: 'ai', feature: 'cinebench-scores', content: `Cinebench scores for ${queryInput}:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during search.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'cinebench-scores', content: `Error: ${errorMessage}` });
      setSearchResultOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingSearch(false);
    }
  }, [addMessage, toast]);

  const fetchTopCpuScores = useCallback(async () => {
    setIsLoadingTopCpus(true);
    setTopCpuScoresOutput(null);
    addMessage({ type: 'user', feature: 'cinebench-scores', content: `Fetching general list of top CPU Cinebench scores.` });
    try {
      const result = await handleGetCinebenchScores({ cpuName: undefined });
      setTopCpuScoresOutput(result);
      addMessage({ type: 'ai', feature: 'cinebench-scores', content: `Top CPU Cinebench scores list:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching top CPU list.";
      toast({
        title: "Error Fetching Top CPU Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'cinebench-scores', content: `Error: ${errorMessage}` });
      setTopCpuScoresOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingTopCpus(false);
    }
  }, [addMessage, toast]);

  useEffect(() => {
    if (cpuQuery) {
        form.setValue('cpuName', cpuQuery);
        onSearchSubmit({ cpuName: cpuQuery });
    } else {
        fetchTopCpuScores();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpuQuery]);

  return (
    <div className="space-y-8">
      <SectionTitle>Cinebench CPU Scores (R23 & R24)</SectionTitle>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center">
            <ListChecks size={28} className="mr-3 text-accent" />
            Top CPUs - General Cinebench Scores
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoadingTopCpus && !cpuQuery && (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Fetching top CPU scores...</p>
            </div>
          )}
          {!isLoadingTopCpus && topCpuScoresOutput && (
            <>
              <TopCpuChart scores={topCpuScoresOutput.scores} />
              <SortableScoreTable scores={topCpuScoresOutput.scores} dataSourceNotes={topCpuScoresOutput.dataSourceNotes} initialSortKey="r23MultiCoreScore" />
            </>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search Specific CPU Benchmarks</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="cpuName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>CPU Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Intel Core i9-13900K" {...field} className="bg-background/50 rounded-full px-4" />
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
                    <SortableScoreTable scores={searchResultOutput.scores} dataSourceNotes={searchResultOutput.dataSourceNotes} initialSortKey="r23MultiCoreScore" />
                ) : (
                    <div className="py-6 text-center">
                        <Cpu size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                        No specific Cinebench scores found for "{searchedQuery || 'your query'}".
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
            <Cpu size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No results found for "{searchedQuery}". Please check the CPU name or try another search.</p>
            {searchResultOutput?.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{searchResultOutput.dataSourceNotes}</p>}
          </GlassCardContent>
         </GlassCard>
      )}

       {!isLoadingSearch && !searchResultOutput && (!form.formState.isSubmitted || !searchedQuery) && !cpuQuery && (
         <GlassCard className="mt-6 opacity-70">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <BarChart3 size={56} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Enter a CPU name above to search for its specific scores.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}

export default function CinebenchScoresPage() {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size={48} />
        </div>
      }>
        <CinebenchScoresView />
      </Suspense>
    );
}
