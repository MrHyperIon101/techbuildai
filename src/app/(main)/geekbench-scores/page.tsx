
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
import { handleGetGeekbenchScores } from '@/lib/actions';
import type { GeekbenchScoreEntry, GeekbenchScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Brain, Layers, Info, ArrowUpDown, ListChecks, Cpu } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';

const searchSchema = z.object({
  componentName: z.string().max(100, "Component name is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKeyGeekbench = keyof GeekbenchScoreEntry | '';
type SortOrderGeekbench = 'asc' | 'desc';

function SortableGeekbenchTable({ scores, dataSourceNotes, initialSortKey = 'multiCoreScore' }: { scores: GeekbenchScoreEntry[], dataSourceNotes?: string, initialSortKey?: SortKeyGeekbench }) {
  const [sortKey, setSortKey] = useState<SortKeyGeekbench>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrderGeekbench>('desc');

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof GeekbenchScoreEntry];
        const valB = b[sortKey as keyof GeekbenchScoreEntry];

        // Handle undefined scores by pushing them to the bottom when sorting descending, top for ascending
        if (valA === undefined && valB !== undefined) return sortOrder === 'asc' ? -1 : 1;
        if (valA !== undefined && valB === undefined) return sortOrder === 'asc' ? 1 : -1;
        if (valA === undefined && valB === undefined) return 0;


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

  const handleSort = (key: SortKeyGeekbench) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (key: SortKeyGeekbench) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 text-accent" /> :
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent" />;
  };

  if (sortedScores.length === 0) {
    return (
      <div className="py-6 text-center">
        <Brain size={48} className="text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">No Geekbench scores data available at the moment.</p>
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
              <TableHead className="cursor-pointer group hover:bg-muted/50 sticky left-0 bg-card z-10" onClick={() => handleSort('componentName')}>
                <div className="flex items-center">Component {renderSortIcon('componentName')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('version')}>
                <div className="flex items-center">Version {renderSortIcon('version')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('platform')}>
                <div className="flex items-center">Platform {renderSortIcon('platform')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('singleCoreScore')}>
                <div className="flex items-center">Single-Core {renderSortIcon('singleCoreScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('multiCoreScore')}>
                <div className="flex items-center">Multi-Core {renderSortIcon('multiCoreScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('openClScore')}>
                <div className="flex items-center">OpenCL {renderSortIcon('openClScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('vulkanScore')}>
                <div className="flex items-center">Vulkan {renderSortIcon('vulkanScore')}</div>
              </TableHead>
               <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('metalScore')}>
                <div className="flex items-center">Metal {renderSortIcon('metalScore')}</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary sticky left-0 bg-card z-0">{item.componentName}</TableCell>
                <TableCell>{item.version}</TableCell>
                <TableCell>{item.platform}</TableCell>
                <TableCell className="text-accent">{item.singleCoreScore && item.singleCoreScore > 0 ? item.singleCoreScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent font-semibold">{item.multiCoreScore && item.multiCoreScore > 0 ? item.multiCoreScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent">{item.openClScore && item.openClScore > 0 ? item.openClScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent">{item.vulkanScore && item.vulkanScore > 0 ? item.vulkanScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell className="text-accent">{item.metalScore && item.metalScore > 0 ? item.metalScore.toLocaleString() : 'N/A'}</TableCell>
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

function GeekbenchScoresView() {
  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [topScoresOutput, setTopScoresOutput] = useState<GeekbenchScoresOutput | null>(null);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchResultOutput, setSearchResultOutput] = useState<GeekbenchScoresOutput | null>(null);
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addMessage } = useConversation();
  const searchParams = useSearchParams();
  const componentQuery = searchParams.get('componentName');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { componentName: '' },
  });

  const onSearchSubmit: SubmitHandler<SearchFormValues> = useCallback(async (data) => {
    setIsLoadingSearch(true);
    setSearchResultOutput(null); 
    const queryInput = data?.componentName?.trim() || "";
    
    if (!queryInput) {
        toast({
            title: "Empty Search",
            description: "Please enter a component name to search.",
            variant: "default"
        });
        setIsLoadingSearch(false);
        setSearchedQuery(null);
        return;
    }
    
    setSearchedQuery(queryInput);
    addMessage({ type: 'user', feature: 'geekbench-scores', content: `Search Geekbench scores for: ${queryInput}` });

    try {
      const result = await handleGetGeekbenchScores({ componentName: queryInput });
      setSearchResultOutput(result);
      addMessage({ type: 'ai', feature: 'geekbench-scores', content: `Geekbench scores for ${queryInput}:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during search.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'geekbench-scores', content: `Error: ${errorMessage}` });
      setSearchResultOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingSearch(false);
    }
  }, [addMessage, toast]);
  
  const fetchTopScores = useCallback(async () => {
    setIsLoadingTop(true);
    setTopScoresOutput(null);
    addMessage({ type: 'user', feature: 'geekbench-scores', content: `Fetching general list of Geekbench scores.` });
    try {
      const result = await handleGetGeekbenchScores({ componentName: undefined });
      setTopScoresOutput(result);
      addMessage({ type: 'ai', feature: 'geekbench-scores', content: `General Geekbench scores list:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching top scores.";
      toast({
        title: "Error Fetching Top Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'geekbench-scores', content: `Error: ${errorMessage}` });
      setTopScoresOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingTop(false);
    }
  }, [addMessage, toast]);
  
  useEffect(() => {
    if (componentQuery) {
        form.setValue('componentName', componentQuery);
        onSearchSubmit({ componentName: componentQuery });
    } else {
        fetchTopScores();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentQuery]);
  
  return (
    <div className="space-y-8">
      <SectionTitle>Geekbench Scores (CPU & GPU)</SectionTitle>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center">
            <ListChecks size={28} className="mr-3 text-accent" />
            Popular Components - Geekbench Scores
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoadingTop && !componentQuery && (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Fetching popular component scores...</p>
            </div>
          )}
          {!isLoadingTop && topScoresOutput && (
            <SortableGeekbenchTable scores={topScoresOutput.scores} dataSourceNotes={topScoresOutput.dataSourceNotes} />
          )}
        </GlassCardContent>
      </GlassCard>
      
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search Specific Component Geekbench Scores</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="componentName"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Component Model (CPU or GPU)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ryzen 7 7800X3D or RTX 4080" {...field} className="bg-background/50 rounded-full px-4" />
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
              {searchedQuery ? `Geekbench Results for ${searchedQuery}` : "Search Results"}
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
                    <SortableGeekbenchTable scores={searchResultOutput.scores} dataSourceNotes={searchResultOutput.dataSourceNotes} />
                ) : (
                    <div className="py-6 text-center">
                        <Layers size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                        No specific Geekbench scores found for "{searchedQuery || 'your query'}".
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
            <Brain size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No results found for "{searchedQuery}". Please check the component name or try another search.</p>
            {searchResultOutput?.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{searchResultOutput.dataSourceNotes}</p>}
          </GlassCardContent>
         </GlassCard>
      )}

       {!isLoadingSearch && !searchResultOutput && (!form.formState.isSubmitted || !searchedQuery) && !componentQuery &&( 
         <GlassCard className="mt-6 opacity-70">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <Cpu size={56} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Enter a component name (CPU or GPU) to search for its Geekbench scores.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}


export default function GeekbenchScoresPage() {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner size={48} />
        </div>
      }>
        <GeekbenchScoresView />
      </Suspense>
    );
}
