
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
import { handleGetUserBenchmarkScores } from '@/lib/actions';
import type { UserBenchmarkScoreEntry, UserBenchmarkScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Layers, Info, ArrowUpDown, ListChecks, Percent } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const searchSchema = z.object({
  componentName: z.string().max(100, "Component name is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKeyUserBenchmark = keyof UserBenchmarkScoreEntry | '';
type SortOrderUserBenchmark = 'asc' | 'desc';

function SortableUserBenchmarkTable({ scores, dataSourceNotes, initialSortKey = 'averageBench' }: { scores: UserBenchmarkScoreEntry[], dataSourceNotes?: string, initialSortKey?: SortKeyUserBenchmark }) {
  const [sortKey, setSortKey] = useState<SortKeyUserBenchmark>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrderUserBenchmark>('desc');

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof UserBenchmarkScoreEntry];
        const valB = b[sortKey as keyof UserBenchmarkScoreEntry];

        if (valA === undefined && valB !== undefined) return sortOrder === 'asc' ? -1 : 1;
        if (valA !== undefined && valB === undefined) return sortOrder === 'asc' ? 1 : -1;
        if (valA === undefined && valB === undefined) return 0;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          // Special handling for rank if it's in "X / Y" format
          if (sortKey === 'rank') {
            const rankA = parseInt(valA.split('/')[0], 10);
            const rankB = parseInt(valB.split('/')[0], 10);
            if (!isNaN(rankA) && !isNaN(rankB)) {
              return sortOrder === 'asc' ? rankA - rankB : rankB - rankA;
            }
          }
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return sorted;
  }, [scores, sortKey, sortOrder]);

  const handleSort = (key: SortKeyUserBenchmark) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'rank' ? 'asc' : 'desc'); // Ranks are better lower
    }
  };

  const renderSortIcon = (key: SortKeyUserBenchmark) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 text-accent" /> :
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent" />;
  };

  if (sortedScores.length === 0) {
    return (
      <div className="py-6 text-center">
        <Users size={48} className="text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">No UserBenchmark scores data available at the moment.</p>
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
              <TableHead className="cursor-pointer group hover:bg-muted/50 sticky left-0 bg-card z-10 min-w-[200px]" onClick={() => handleSort('componentName')}>
                <div className="flex items-center">Component {renderSortIcon('componentName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('componentType')}>
                <div className="flex items-center">Type {renderSortIcon('componentType')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('averageBench')}>
                <div className="flex items-center">Avg Bench {renderSortIcon('averageBench')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('gamingPercentage')}>
                <div className="flex items-center">Gaming {renderSortIcon('gamingPercentage')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('desktopPercentage')}>
                <div className="flex items-center">Desktop {renderSortIcon('desktopPercentage')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[120px]" onClick={() => handleSort('workstationPercentage')}>
                <div className="flex items-center">Workstation {renderSortIcon('workstationPercentage')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('rank')}>
                <div className="flex items-center">Rank {renderSortIcon('rank')}</div>
              </TableHead>
              <TableHead className="min-w-[150px]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary sticky left-0 bg-card z-0">{item.componentName}</TableCell>
                <TableCell><Badge variant="secondary">{item.componentType}</Badge></TableCell>
                <TableCell className="text-accent font-semibold">{item.averageBench !== undefined ? `${item.averageBench}%` : 'N/A'}</TableCell>
                <TableCell>{item.gamingPercentage !== undefined ? `${item.gamingPercentage}%` : 'N/A'}</TableCell>
                <TableCell>{item.desktopPercentage !== undefined ? `${item.desktopPercentage}%` : 'N/A'}</TableCell>
                <TableCell>{item.workstationPercentage !== undefined ? `${item.workstationPercentage}%` : 'N/A'}</TableCell>
                <TableCell>{item.rank || 'N/A'}</TableCell>
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

export default function UserBenchmarkScoresPage() {
  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [topScoresOutput, setTopScoresOutput] = useState<UserBenchmarkScoresOutput | null>(null);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchResultOutput, setSearchResultOutput] = useState<UserBenchmarkScoresOutput | null>(null);
  const [searchedQueryText, setSearchedQueryText] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { componentName: '' },
  });

  const fetchTopScores = async () => {
    setIsLoadingTop(true);
    setTopScoresOutput(null);
    addMessage({ type: 'user', feature: 'userbenchmark-scores', content: `Fetching general list of UserBenchmark scores.` });
    try {
      const result = await handleGetUserBenchmarkScores({ componentName: undefined });
      setTopScoresOutput(result);
      addMessage({ type: 'ai', feature: 'userbenchmark-scores', content: `General UserBenchmark scores list:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching top scores.";
      toast({
        title: "Error Fetching Example Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'userbenchmark-scores', content: `Error: ${errorMessage}` });
      setTopScoresOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingTop(false);
    }
  };
  
  useEffect(() => {
    fetchTopScores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchSubmit: SubmitHandler<SearchFormValues> = async (data) => {
    setIsLoadingSearch(true);
    setSearchResultOutput(null); 
    const queryInput = data?.componentName?.trim() || "";
    
    if (!queryInput) {
        toast({
            title: "Empty Search",
            description: "Please enter a component name (CPU, GPU, SSD, RAM).",
            variant: "default"
        });
        setIsLoadingSearch(false);
        setSearchedQueryText(null);
        return;
    }
    
    setSearchedQueryText(queryInput);
    addMessage({ type: 'user', feature: 'userbenchmark-scores', content: `Search UserBenchmark scores for: ${queryInput}` });

    try {
      const result = await handleGetUserBenchmarkScores({ componentName: queryInput });
      setSearchResultOutput(result);
      addMessage({ type: 'ai', feature: 'userbenchmark-scores', content: `UserBenchmark scores for "${queryInput}":`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during search.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'userbenchmark-scores', content: `Error: ${errorMessage}` });
      setSearchResultOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingSearch(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <SectionTitle>UserBenchmark Component Scores</SectionTitle>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center">
            <ListChecks size={28} className="mr-3 text-accent" />
            Example UserBenchmark Scores
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoadingTop && (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Fetching example scores...</p>
            </div>
          )}
          {!isLoadingTop && topScoresOutput && (
            <SortableUserBenchmarkTable scores={topScoresOutput.scores} dataSourceNotes={topScoresOutput.dataSourceNotes} />
          )}
        </GlassCardContent>
      </GlassCard>
      
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search Specific Component Scores</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="componentName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Component Name (CPU, GPU, SSD, RAM)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Intel Core i5-13600K, NVIDIA RTX 4070" {...field} className="bg-background/50 rounded-full px-4" />
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
              {searchedQueryText ? `UserBenchmark Results for "${searchedQueryText}"` : "Search Results"}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {isLoadingSearch && (
              <div className="flex flex-col items-center justify-center py-10">
                <LoadingSpinner size={48} />
                <p className="mt-4 text-muted-foreground">Fetching scores for {searchedQueryText}...</p>
              </div>
            )}
            {!isLoadingSearch && searchResultOutput && (
                searchResultOutput.scores.length > 0 ? (
                    <SortableUserBenchmarkTable scores={searchResultOutput.scores} dataSourceNotes={searchResultOutput.dataSourceNotes} />
                ) : (
                    <div className="py-6 text-center">
                        <Layers size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                        No specific UserBenchmark scores found for "{searchedQueryText || 'your query'}".
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
      
      {!isLoadingSearch && !searchResultOutput && form.formState.isSubmitted && searchedQueryText && (
         <GlassCard className="mt-6">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <Users size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No results found for "{searchedQueryText}". Please refine your query or try another search.</p>
            {searchResultOutput?.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{searchResultOutput.dataSourceNotes}</p>}
          </GlassCardContent>
         </GlassCard>
      )}

       {!isLoadingSearch && !searchResultOutput && (!form.formState.isSubmitted || !searchedQueryText) && ( 
         <GlassCard className="mt-6 opacity-70">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <Percent size={56} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Enter a component name to search UserBenchmark scores.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}

    
