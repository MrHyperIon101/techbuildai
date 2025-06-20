
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
import { handleGetPCMarkScores } from '@/lib/actions';
import type { PCMarkScoreEntry, PCMarkScoresOutput } from '@/lib/types';
import { useConversation } from '@/contexts/conversation-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Gauge, Layers, Info, ArrowUpDown, ListChecks, Laptop } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const searchSchema = z.object({
  query: z.string().max(150, "Query is too long.").optional(),
});
type SearchFormValues = z.infer<typeof searchSchema>;

type SortKeyPCMark = keyof PCMarkScoreEntry | '';
type SortOrderPCMark = 'asc' | 'desc';

function SortablePCMarkTable({ scores, dataSourceNotes, initialSortKey = 'overallScore' }: { scores: PCMarkScoreEntry[], dataSourceNotes?: string, initialSortKey?: SortKeyPCMark }) {
  const [sortKey, setSortKey] = useState<SortKeyPCMark>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrderPCMark>('desc');

  const sortedScores = useMemo(() => {
    const sorted = [...scores];
    if (sortKey) {
      sorted.sort((a, b) => {
        const valA = a[sortKey as keyof PCMarkScoreEntry];
        const valB = b[sortKey as keyof PCMarkScoreEntry];

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

  const handleSort = (key: SortKeyPCMark) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (key: SortKeyPCMark) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    return sortOrder === 'asc' ?
      <ArrowUpDown className="ml-2 h-3 w-3 transform rotate-180 text-accent" /> :
      <ArrowUpDown className="ml-2 h-3 w-3 text-accent" />;
  };

  if (sortedScores.length === 0) {
    return (
      <div className="py-6 text-center">
        <Gauge size={48} className="text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">No PCMark scores data available at the moment.</p>
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
              <TableHead className="cursor-pointer group hover:bg-muted/50 sticky left-0 bg-card z-10" onClick={() => handleSort('systemIdentifier')}>
                <div className="flex items-center">System/Component {renderSortIcon('systemIdentifier')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('testVersion')}>
                <div className="flex items-center">Test Version {renderSortIcon('testVersion')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('overallScore')}>
                <div className="flex items-center">Overall {renderSortIcon('overallScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('essentialsScore')}>
                <div className="flex items-center">Essentials {renderSortIcon('essentialsScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('productivityScore')}>
                <div className="flex items-center">Productivity {renderSortIcon('productivityScore')}</div>
              </TableHead>
              <TableHead className="cursor-pointer group hover:bg-muted/50" onClick={() => handleSort('contentCreationScore')}>
                <div className="flex items-center">Content Creation {renderSortIcon('contentCreationScore')}</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedScores.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary sticky left-0 bg-card z-0">{item.systemIdentifier}</TableCell>
                <TableCell>{item.testVersion}</TableCell>
                <TableCell className="text-accent font-semibold">{item.overallScore > 0 ? item.overallScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell>{item.essentialsScore && item.essentialsScore > 0 ? item.essentialsScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell>{item.productivityScore && item.productivityScore > 0 ? item.productivityScore.toLocaleString() : 'N/A'}</TableCell>
                <TableCell>{item.contentCreationScore && item.contentCreationScore > 0 ? item.contentCreationScore.toLocaleString() : 'N/A'}</TableCell>
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

export default function PCMarkScoresPage() {
  const [isLoadingTopSystems, setIsLoadingTopSystems] = useState(false);
  const [topSystemScoresOutput, setTopSystemScoresOutput] = useState<PCMarkScoresOutput | null>(null);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchResultOutput, setSearchResultOutput] = useState<PCMarkScoresOutput | null>(null);
  const [searchedQueryText, setSearchedQueryText] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addMessage } = useConversation();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  });

  const fetchTopSystemScores = async () => {
    setIsLoadingTopSystems(true);
    setTopSystemScoresOutput(null);
    addMessage({ type: 'user', feature: 'pcmark-scores', content: `Fetching general list of PCMark scores.` });
    try {
      const result = await handleGetPCMarkScores({ query: undefined });
      setTopSystemScoresOutput(result);
      addMessage({ type: 'ai', feature: 'pcmark-scores', content: `General PCMark scores list:`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred fetching top system scores.";
      toast({
        title: "Error Fetching Top System Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'pcmark-scores', content: `Error: ${errorMessage}` });
      setTopSystemScoresOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingTopSystems(false);
    }
  };
  
  useEffect(() => {
    fetchTopSystemScores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearchSubmit: SubmitHandler<SearchFormValues> = async (data) => {
    setIsLoadingSearch(true);
    setSearchResultOutput(null); 
    const queryInput = data?.query?.trim() || "";
    
    if (!queryInput) {
        toast({
            title: "Empty Search",
            description: "Please enter a system description or component name to search.",
            variant: "default"
        });
        setIsLoadingSearch(false);
        setSearchedQueryText(null);
        return;
    }
    
    setSearchedQueryText(queryInput);
    addMessage({ type: 'user', feature: 'pcmark-scores', content: `Search PCMark scores for: ${queryInput}` });

    try {
      const result = await handleGetPCMarkScores({ query: queryInput });
      setSearchResultOutput(result);
      addMessage({ type: 'ai', feature: 'pcmark-scores', content: `PCMark scores for "${queryInput}":`, data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during search.";
      toast({
        title: "Error Fetching Scores",
        description: errorMessage,
        variant: "destructive",
      });
      addMessage({ type: 'system', feature: 'pcmark-scores', content: `Error: ${errorMessage}` });
      setSearchResultOutput({ scores: [], dataSourceNotes: errorMessage });
    } finally {
      setIsLoadingSearch(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <SectionTitle>PCMark System Scores</SectionTitle>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center">
            <ListChecks size={28} className="mr-3 text-accent" />
            Example System PCMark Scores
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoadingTopSystems && (
            <div className="flex flex-col items-center justify-center py-10">
              <LoadingSpinner size={48} />
              <p className="mt-4 text-muted-foreground">Fetching example system scores...</p>
            </div>
          )}
          {!isLoadingTopSystems && topSystemScoresOutput && (
            <SortablePCMarkTable scores={topSystemScoresOutput.scores} dataSourceNotes={topSystemScoresOutput.dataSourceNotes} />
          )}
        </GlassCardContent>
      </GlassCard>
      
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Search PCMark Scores</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearchSubmit)} className="space-y-4 md:flex md:items-end md:space-y-0 md:space-x-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>System or Key Component</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gaming PC with RTX 4070, Office Laptop" {...field} className="bg-background/50 rounded-full px-4" />
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
              {searchedQueryText ? `PCMark Results for "${searchedQueryText}"` : "Search Results"}
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
                    <SortablePCMarkTable scores={searchResultOutput.scores} dataSourceNotes={searchResultOutput.dataSourceNotes} />
                ) : (
                    <div className="py-6 text-center">
                        <Layers size={48} className="text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">
                        No specific PCMark scores found for "{searchedQueryText || 'your query'}".
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
            <Gauge size={56} className="text-primary mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No results found for "{searchedQueryText}". Please check your query or try another search.</p>
            {searchResultOutput?.dataSourceNotes && <p className="text-sm text-muted-foreground/70 mt-1">{searchResultOutput.dataSourceNotes}</p>}
          </GlassCardContent>
         </GlassCard>
      )}

       {!isLoadingSearch && !searchResultOutput && (!form.formState.isSubmitted || !searchedQueryText) && ( 
         <GlassCard className="mt-6 opacity-70">
           <GlassCardHeader><GlassCardTitle>Search Results</GlassCardTitle></GlassCardHeader>
           <GlassCardContent className="py-10 text-center">
            <Laptop size={56} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Enter a system description or key component to search for PCMark scores.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Results will be displayed here.</p>
          </GlassCardContent>
         </GlassCard>
      )}
    </div>
  );
}
