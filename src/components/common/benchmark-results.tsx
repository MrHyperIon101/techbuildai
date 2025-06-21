"use client";

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  handleGetCinebenchScores,
  handleGetGeekbenchScores,
  handleGetAida64Scores,
  handleGetUserBenchmarkScores,
  handleGet3dMarkScores,
  handleGetFurMarkScores,
} from '@/lib/actions';
import type {
  CinebenchScoresOutput,
  GeekbenchScoresOutput,
  Aida64ScoresOutput,
  UserBenchmarkScoresOutput,
  Gpu3dMarkScoresOutput,
  FurMarkScoresOutput,
} from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Cpu, Video } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface BenchmarkResultsProps {
  cpuName: string;
  gpuName: string;
}

type AllScores = {
  cinebench: CinebenchScoresOutput | null;
  geekbenchCpu: GeekbenchScoresOutput | null;
  aida64: Aida64ScoresOutput | null;
  userbenchmarkCpu: UserBenchmarkScoresOutput | null;
  threeDMark: Gpu3dMarkScoresOutput | null;
  furMark: FurMarkScoresOutput | null;
  geekbenchGpu: GeekbenchScoresOutput | null;
  userbenchmarkGpu: UserBenchmarkScoresOutput | null;
};

export function BenchmarkResults({ cpuName, gpuName }: BenchmarkResultsProps) {
  const [scores, setScores] = useState<Partial<AllScores>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAllScores() {
      setIsLoading(true);
      setErrors([]);
      const promises = [
        handleGetCinebenchScores({ cpuName }).catch(e => ({ error: `Cinebench: ${e.message}` })),
        handleGetGeekbenchScores({ componentName: cpuName }).catch(e => ({ error: `Geekbench (CPU): ${e.message}` })),
        handleGetAida64Scores({ componentQuery: cpuName }).catch(e => ({ error: `AIDA64: ${e.message}` })),
        handleGetUserBenchmarkScores({ componentName: cpuName }).catch(e => ({ error: `UserBenchmark (CPU): ${e.message}` })),
        handleGet3dMarkScores({ gpuName }).catch(e => ({ error: `3DMark: ${e.message}` })),
        handleGetFurMarkScores({ gpuName }).catch(e => ({ error: `FurMark: ${e.message}` })),
        handleGetGeekbenchScores({ componentName: gpuName }).catch(e => ({ error: `Geekbench (GPU): ${e.message}` })),
        handleGetUserBenchmarkScores({ componentName: gpuName }).catch(e => ({ error: `UserBenchmark (GPU): ${e.message}` })),
      ];

      const results = await Promise.allSettled(promises);
      const newScores: Partial<AllScores> = {};
      const newErrors: string[] = [];
      
      const keyMap: (keyof AllScores)[] = ['cinebench', 'geekbenchCpu', 'aida64', 'userbenchmarkCpu', 'threeDMark', 'furMark', 'geekbenchGpu', 'userbenchmarkGpu'];

      results.forEach((result, index) => {
        const key = keyMap[index];
        if (result.status === 'fulfilled' && !(result.value as any).error) {
           newScores[key] = result.value as any;
        } else {
            const errorPayload = result.status === 'fulfilled' ? (result.value as any) : result;
            const errorMessage = (errorPayload as any).error || (errorPayload as any).reason?.message || `Failed to fetch data for ${key}`;
            const finalMessage = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
            newErrors.push(finalMessage);
            newScores[key] = null;
        }
      });
      
      setScores(newScores);
      setErrors(newErrors);
      setIsLoading(false);
    }

    if (cpuName && gpuName) {
        fetchAllScores();
    }
  }, [cpuName, gpuName]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-muted-foreground">Fetching all benchmark data...</p>
      </div>
    );
  }

  return (
    <div className="p-1">
      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Fetching Error</AlertTitle>
          <AlertDescription>
            Could not fetch data for all benchmarks. Some results may be missing.
            <ul className="text-xs list-disc pl-5 mt-1 max-h-20 overflow-y-auto">
                {errors.map((e,i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="cpu" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cpu"><Cpu className="mr-2 h-4 w-4"/>CPU Scores</TabsTrigger>
          <TabsTrigger value="gpu"><Video className="mr-2 h-4 w-4"/>GPU Scores</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[60vh] mt-2">
            <TabsContent value="cpu" className="space-y-4 pr-4">
                <BenchmarkSection title="Cinebench Scores">
                    {scores.cinebench?.scores?.length ? <CinebenchTable scores={scores.cinebench.scores} /> : <NoData />}
                </BenchmarkSection>
                <BenchmarkSection title="Geekbench CPU Scores">
                    {scores.geekbenchCpu?.scores?.length ? <GeekbenchTable scores={scores.geekbenchCpu.scores} /> : <NoData />}
                </BenchmarkSection>
                <BenchmarkSection title="UserBenchmark CPU">
                    {scores.userbenchmarkCpu?.scores?.length ? <UserBenchmarkTable scores={scores.userbenchmarkCpu.scores} /> : <NoData />}
                </BenchmarkSection>
                <BenchmarkSection title="AIDA64 Scores">
                     {scores.aida64?.scores?.length ? <Aida64Table scores={scores.aida64.scores} /> : <NoData />}
                </BenchmarkSection>
            </TabsContent>
            <TabsContent value="gpu" className="space-y-4 pr-4">
                <BenchmarkSection title="3DMark Scores">
                    {scores.threeDMark?.scores?.length ? <ThreeDMarkTable scores={scores.threeDMark.scores} /> : <NoData />}
                </BenchmarkSection>
                <BenchmarkSection title="FurMark Scores">
                    {scores.furMark?.scores?.length ? <FurMarkTable scores={scores.furMark.scores} /> : <NoData />}
                </BenchmarkSection>
                <BenchmarkSection title="Geekbench GPU Scores">
                    {scores.geekbenchGpu?.scores?.length ? <GeekbenchTable scores={scores.geekbenchGpu.scores} /> : <NoData />}
                </BenchmarkSection>
                 <BenchmarkSection title="UserBenchmark GPU">
                    {scores.userbenchmarkGpu?.scores?.length ? <UserBenchmarkTable scores={scores.userbenchmarkGpu.scores} /> : <NoData />}
                </BenchmarkSection>
            </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

const BenchmarkSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="p-4 rounded-lg border border-white/10 bg-card/50">
        <h4 className="font-semibold text-primary mb-2">{title}</h4>
        {children}
    </div>
);

const NoData = () => <p className="text-sm text-muted-foreground italic">No data available for this benchmark.</p>;

const CinebenchTable = ({ scores }: { scores: NonNullable<CinebenchScoresOutput['scores']>}) => (
    <Table><TableHeader><TableRow><TableHead>CPU</TableHead><TableHead>R23 Single</TableHead><TableHead>R23 Multi</TableHead><TableHead>R24 Single</TableHead><TableHead>R24 Multi</TableHead></TableRow></TableHeader>
        <TableBody>{scores.map((s, i) => <TableRow key={i}><TableCell>{s.cpuName}</TableCell><TableCell>{s.r23SingleCoreScore}</TableCell><TableCell>{s.r23MultiCoreScore}</TableCell><TableCell>{s.r24SingleCoreScore || 'N/A'}</TableCell><TableCell>{s.r24MultiCoreScore || 'N/A'}</TableCell></TableRow>)}</TableBody>
    </Table>
);

const GeekbenchTable = ({ scores }: { scores: NonNullable<GeekbenchScoresOutput['scores']>}) => (
    <Table><TableHeader><TableRow><TableHead>Component</TableHead><TableHead>Single-Core</TableHead><TableHead>Multi-Core</TableHead><TableHead>OpenCL</TableHead><TableHead>Vulkan</TableHead><TableHead>Metal</TableHead></TableRow></TableHeader>
        <TableBody>{scores.map((s, i) => <TableRow key={i}><TableCell>{s.componentName}</TableCell><TableCell>{s.singleCoreScore || 'N/A'}</TableCell><TableCell>{s.multiCoreScore || 'N/A'}</TableCell><TableCell>{s.openClScore || 'N/A'}</TableCell><TableCell>{s.vulkanScore || 'N/A'}</TableCell><TableCell>{s.metalScore || 'N/A'}</TableCell></TableRow>)}</TableBody>
    </Table>
);

const UserBenchmarkTable = ({ scores }: { scores: NonNullable<UserBenchmarkScoresOutput['scores']>}) => (
    <Table><TableHeader><TableRow><TableHead>Component</TableHead><TableHead>Avg Bench</TableHead><TableHead>Gaming</TableHead><TableHead>Desktop</TableHead><TableHead>Workstation</TableHead></TableRow></TableHeader>
        <TableBody>{scores.map((s, i) => <TableRow key={i}><TableCell>{s.componentName}</TableCell><TableCell>{s.averageBench}%</TableCell><TableCell>{s.gamingPercentage}%</TableCell><TableCell>{s.desktopPercentage}%</TableCell><TableCell>{s.workstationPercentage}%</TableCell></TableRow>)}</TableBody>
    </Table>
);

const Aida64Table = ({ scores }: { scores: NonNullable<Aida64ScoresOutput['scores']>}) => (
    <Table><TableHeader><TableRow><TableHead>Test</TableHead><TableHead>Score</TableHead><TableHead>Units</TableHead></TableRow></TableHeader>
        <TableBody>{scores.map((s, i) => <TableRow key={i}><TableCell>{s.testName}</TableCell><TableCell>{s.score}</TableCell><TableCell>{s.units}</TableCell></TableRow>)}</TableBody>
    </Table>
);

const ThreeDMarkTable = ({ scores }: { scores: NonNullable<Gpu3dMarkScoresOutput['scores']>}) => (
    <Table><TableHeader><TableRow><TableHead>Benchmark</TableHead><TableHead>Score</TableHead></TableRow></TableHeader>
        <TableBody>{scores.map((s, i) => <TableRow key={i}><TableCell>{s.benchmarkName}</TableCell><TableCell>{s.score}</TableCell></TableRow>)}</TableBody>
    </Table>
);

const FurMarkTable = ({ scores }: { scores: NonNullable<FurMarkScoresOutput['scores']>}) => (
    <Table><TableHeader><TableRow><TableHead>Preset</TableHead><TableHead>Score</TableHead><TableHead>Avg FPS</TableHead><TableHead>Max Temp</TableHead></TableRow></TableHeader>
        <TableBody>{scores.map((s, i) => <TableRow key={i}><TableCell>{s.preset}</TableCell><TableCell>{s.score}</TableCell><TableCell>{s.averageFPS || 'N/A'}</TableCell><TableCell>{s.maxTemperatureCelsius ? `${s.maxTemperatureCelsius}°C` : 'N/A'}</TableCell></TableRow>)}</TableBody>
    </Table>
);