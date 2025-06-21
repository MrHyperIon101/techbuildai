
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
import { handleGetAida64Scores } from '@/lib/actions';
import type { Aida64ScoreEntry, Aida64ScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardList, Layers, Info, ArrowUpDown, ListChecks, Cpu } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';

const searchSchema = z.object({
  componentQuery: z.string().max(150, "Query is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKeyAida64 = keyof Aida64ScoreEntry | '';
type SortOrderAida64 = 'asc' | 'desc';

function SortableAida64Table({ scores, dataSourceNotes, initialSortKey = 'score' }: { scores: Aida64ScoreEntry[], dataSourceNotes?: string, initialSortKey?: SortKeyAida64 }) {
  const [sortKey, setSortKey] = useState<SortKeyAida64>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrderAida64>('desc');

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof Aida64ScoreEntry];
        const valB = b[sortKey as keyof Aida64ScoreEntry];

        if (typeof valA === 'number' && typeof valB === 'number') {
          // For 'Memory Latency', lower is better, so reverse typical numeric sort for that specific test
          if (sortKey === 'score' && (a.testName?.toLowerCase().includes('latency') || b.testName?.toLowerCase().includes('latency'))) {
            return sortOrder === 'asc' ? valB - valA : valA - valB; // Reversed logic
          }
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

  const handleSort = (key: SortKeyAida64) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Default to 'desc' for most scores, but 'asc' for latency
      if (key === 'score' && scores.some(s => s.testName?.toLowerCase().includes('latency'))) {
        setSortOrder('asc');
      } else {
        setSortOrder('desc');
      }
    }
  };

  const renderSortIcon = (key: SortKeyAida64) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 text-accent" /> :
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent" />;
  };

  if (sortedScores.length === 0) {
    return (
      <div className="py-6 text-center">
        <ClipboardList size={48} className="text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">No AIDA64 scores data available at the moment.</p>
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
                <div className="flex items-center">Component/System {renderSortIcon('componentName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[150px]" onClick={() => handleSort('testName')}>
                <div className="flex items-center">Test Name {renderSortIcon('testName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[100px]" onClick={() => handleSort('score')}>
                <div className="flex items-center">Score {renderSortIcon('score')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50 min-w-[80px]" onClick={() => handleSort('units')}>
                <div className="flex items-center">Units {renderSortIcon('units')}</div>
              </TableHead>
              <TableHead className="min-w-[150px]">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary sticky left-0 bg-card z-0">{item.componentName}</TableCell>
                <TableCell>{item.testName}</TableCell>
                <TableCell className="text-accent font-semibold">{item.score !== 0 || item.testName.toLowerCase().includes("latency") ? item.score.toLocaleString() : 'N/A'}</TableCell>
                <TableCell>{item.units}</TableCell>
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

function Aida64ScoresView() {
  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [topScoresOutput, setTopScoresOutput] = useState<Aida64ScoresOutput | null>(null);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchResultOutput, setSearchResultOutput] = useState<Aida64ScoresOutput | null>(null);
  const [searchedQueryText, setSearchedQueryText] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addMessage } = useConversation();
  const searchParams = useSearchParams();
  const componentQuery = searchParams.get('componentQuery');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { componentQuery: '' },
  });

  const onSearchSubmit: SubmitHandler<SearchFormValues> = useCallback(async (data) => {
    setIsLoadingSearch(true);
    setSearchResultOutput(null); 
    const queryInput = data?.componentQuery?.trim() || "";
    
    if (!queryInput) {
        toast({
            title: "Empty Search",
            description: "Please enter a component, system, or test query.",
            variant: "default"
        });
        setIsLoadingSearch(false);
        setSearchedQueryText(null);
        return;
    }
    
    setSearchedQueryText(queryInput);
    addMessage({ type: 'user', feature: 'aida64-scores', content: `Search AIDA64 scores for: ${queryInput}` });

    try {
      const result = await handleGetAida64Scores({ componentQuery: queryInput });
      setSearchResultOutput(result);
      addMessage({ type: 'ai', feature: 'aida64-scores', content: `AIDA64 scores for "${queryInput}":`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during search.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'aida64-scores', content: `Error: ${errorMessage}` });
      setSearchResultOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingSearch(false);
    }
  }, [addMessage, toast]);

  const fetchTopScores = useCallback(async () => {
    setIsLoadingTop(true);
    setTopScoresOutput(null);
    addMessage({ type: 'user', feature: 'aida64-scores', content: `Fetching general list of AIDA64 scores.` });
    try {
      const result = await handleGetAida64Scores({ componentQuery: undefined });
      setTopScoresOutput(result);
      addMessage({ type: 'ai', feature: 'aida64-scores', content: `General AIDA64 scores list:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching top scores.";
      toast({
        title: "Error Fetching Example Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'aida64-scores', content: `Error: ${errorMessage}` });
      setTopScoresOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingTop(false);
    }
  }, [addMessage, toast]);
  
  useEffect(() => {
    if (componentQuery) {
        form.setValue('componentQuery', componentQuery);
        onSearchSubmit({ componentQuery: componentQuery });
    } else {
        fetchTopScores();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentQuery]);
  
  return (
    <div className="space-y-8">
      <SectionTitle>AIDA64 Benchmark Scores</SectionTitle>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center">
            <ListChecks size={28} className="mr-3 text-accent" />
            Example AIDA64 Benchmark Scores
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoadingTop && !componentQuery && (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Fetching example scores...</p>
            </div>
          )}
          {!isLoadingTop && topScoresOutput && (
            <SortableAida64Table scores={topScoresOutput.scores} dataSourceNotes={topScoresOutput.dataSourceNotes} />
          )}
        </GlassCardContent>
      </GlassCard>
      
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search Specific AIDA64 Scores</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="componentQuery"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Component, System, or Test Query</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ryzen 7800X3D Memory Read, Intel 13900K CPU Queen" {...field} className="bg-background/50 rounded-full px-4" />
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
              {searchedQueryText ? `AIDA64 Results for "${searchedQueryText}"` : "Search Results"}
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
                    <SortableAida64Table scores={searchResultOutput.scores} dataSourceNotes={searchResultOutput.dataSourceNotes} />
                ) : (
                    <div className="py-6 text-center">
                        <Layers size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                        No specific AIDA64 scores found for "{searchedQueryText || 'your query'}".
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
            <ClipboardList size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No results found for "{searchedQueryText}". Please refine your query or try another search.</p>
            {searchResultOutput?.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{searchResultOutput.dataSourceNotes}</p>}
          </GlassCardContent>
         </GlassCard>
      )}

       {!isLoadingSearch && !searchResultOutput && (!form.formState.isSubmitted || !searchedQueryText) && !componentQuery && ( 
         <GlassCard className="mt-6 opacity-70">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <Cpu size={56} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Enter a query (e.g., component, system, specific test) to search AIDA64 scores.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}

export default function Aida64ScoresPage() {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size={48} />
        </div>
      }>
        <Aida64ScoresView />
      </Suspense>
    );
}
