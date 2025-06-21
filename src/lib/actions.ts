
"use server";

import { suggestPcBuild, SuggestPcBuildInput } from '@/ai/flows/generate-pc-build-suggestions';
import { getComponentDetails, GetComponentDetailsInput } from '@/ai/flows/get-component-details';
import { calculateBottleneck, CalculateBottleneckInput } from '@/ai/flows/calculate-bottleneck';
import { checkCompatibility, CheckCompatibilityInput } from '@/ai/flows/check-compatibility';
import { getCinebenchScores, GetCinebenchScoresInput } from '@/ai/flows/get-cinebench-scores';
import { get3dMarkScores, Get3dMarkScoresInput } from '@/ai/flows/get-3dmark-scores';
import { getFurMarkScores, GetFurMarkScoresInput } from '@/ai/flows/get-furmark-scores';
import { getPCMarkScores, GetPCMarkScoresInput } from '@/ai/flows/get-pcmark-scores';
import { getGeekbenchScores, GetGeekbenchScoresInput } from '@/ai/flows/get-geekbench-scores';
import { getAida64Scores, GetAida64ScoresInput } from '@/ai/flows/get-aida64-scores';
import { getUserBenchmarkScores, GetUserBenchmarkScoresInput } from '@/ai/flows/get-userbenchmark-scores';
import { compareComponents, CompareComponentsInput } from '@/ai/flows/compare-components';
import { estimateGamingPerformance, EstimateGamingPerformanceInput } from '@/ai/flows/estimate-gaming-performance';

import type { 
    BuildSuggestion, 
    BottleneckInfo, 
    ComponentDetails, 
    CompatibilityReport, 
    CinebenchScoresOutput, 
    Gpu3dMarkScoresOutput,
    FurMarkScoresOutput,
    PCMarkScoresOutput,
    GeekbenchScoresOutput,
    Aida64ScoresOutput,
    UserBenchmarkScoresOutput,
    CompareComponentsOutput,
    GamingPerformanceOutput
} from './types';

export async function handleSuggestPcBuild(input: SuggestPcBuildInput): Promise<BuildSuggestion> {
  try {
    const result = await suggestPcBuild(input);
    return result as BuildSuggestion;
  } catch (error) {
    console.error("Error in handleSuggestPcBuild:", error);
    throw new Error("Failed to generate PC build suggestions. Please try again.");
  }
}

export async function handleGetComponentDetails(input: GetComponentDetailsInput): Promise<ComponentDetails> {
  try {
    const result = await getComponentDetails(input);
    // Ensure relatedProducts is always an array
    if (result && result.relatedProducts && !Array.isArray(result.relatedProducts)) {
      result.relatedProducts = [];
    }
    if (result && result.relatedProducts) {
      result.relatedProducts.forEach(product => {
        if (product.shoppingLinks && !Array.isArray(product.shoppingLinks)) {
          product.shoppingLinks = [];
        }
        if (product.keySpecs && !Array.isArray(product.keySpecs)) {
          product.keySpecs = [];
        }
      });
    }
     if (result && result.shoppingLinks && !Array.isArray(result.shoppingLinks)) {
      result.shoppingLinks = [];
    }
    if (result && result.keyFeatures && !Array.isArray(result.keyFeatures)) {
      result.keyFeatures = [];
    }
    if (result && result.technicalCategories && !Array.isArray(result.technicalCategories)) {
      result.technicalCategories = [];
    }


    return result as ComponentDetails;
  } catch (error) {
    console.error("Error in handleGetComponentDetails:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve component details. The AI may have had trouble with the component name or the requested format. Please try a different component or phrasing.");
  }
}

export async function handleCalculateBottleneck(input: CalculateBottleneckInput): Promise<BottleneckInfo> {
  try {
    const result = await calculateBottleneck(input);
    return result as BottleneckInfo;
  } catch (error) {
    console.error("Error in handleCalculateBottleneck:", error);
    throw new Error("Failed to calculate bottleneck. Please try again.");
  }
}

export async function handleCheckCompatibility(input: CheckCompatibilityInput): Promise<CompatibilityReport> {
  try {
    const result = await checkCompatibility(input);
    // Ensure issues and warnings are always arrays
    if (result && !Array.isArray(result.issues)) {
      result.issues = [];
    }
    if (result && !Array.isArray(result.warnings)) {
      result.warnings = [];
    }
    return result as CompatibilityReport;
  } catch (error) {
    console.error("Error in handleCheckCompatibility:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to check PC part compatibility. The AI may have had trouble with the component descriptions or the requested format. Please ensure all fields are filled clearly.");
  }
}

export async function handleGetCinebenchScores(input: GetCinebenchScoresInput): Promise<CinebenchScoresOutput> {
  try {
    const result = await getCinebenchScores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as CinebenchScoresOutput;
  } catch (error) {
    console.error("Error in handleGetCinebenchScores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve Cinebench scores. Please try again.");
  }
}

export async function handleGet3dMarkScores(input: Get3dMarkScoresInput): Promise<Gpu3dMarkScoresOutput> {
  try {
    const result = await get3dMarkScores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as Gpu3dMarkScoresOutput;
  } catch (error) {
    console.error("Error in handleGet3dMarkScores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve 3DMark scores. Please try again.");
  }
}

export async function handleGetFurMarkScores(input: GetFurMarkScoresInput): Promise<FurMarkScoresOutput> {
  try {
    const result = await getFurMarkScores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as FurMarkScoresOutput;
  } catch (error) {
    console.error("Error in handleGetFurMarkScores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve FurMark scores. Please try again.");
  }
}

export async function handleGetPCMarkScores(input: GetPCMarkScoresInput): Promise<PCMarkScoresOutput> {
  try {
    const result = await getPCMarkScores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as PCMarkScoresOutput;
  } catch (error) {
    console.error("Error in handleGetPCMarkScores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve PCMark scores. Please try again.");
  }
}

export async function handleGetGeekbenchScores(input: GetGeekbenchScoresInput): Promise<GeekbenchScoresOutput> {
  try {
    const result = await getGeekbenchScores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as GeekbenchScoresOutput;
  } catch (error) {
    console.error("Error in handleGetGeekbenchScores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve Geekbench scores. Please try again.");
  }
}

export async function handleGetAida64Scores(input: GetAida64ScoresInput): Promise<Aida64ScoresOutput> {
  try {
    const result = await getAida64Scores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as Aida64ScoresOutput;
  } catch (error) {
    console.error("Error in handleGetAida64Scores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve AIDA64 scores. Please try again.");
  }
}

export async function handleGetUserBenchmarkScores(input: GetUserBenchmarkScoresInput): Promise<UserBenchmarkScoresOutput> {
  try {
    const result = await getUserBenchmarkScores(input);
    if (result && !Array.isArray(result.scores)) {
      result.scores = [];
    }
    return result as UserBenchmarkScoresOutput;
  } catch (error) {
    console.error("Error in handleGetUserBenchmarkScores:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to retrieve UserBenchmark scores. The AI may have had trouble interpreting the component name or the requested format. Please try again or refine your search term.");
  }
}

export async function handleCompareComponents(input: CompareComponentsInput): Promise<CompareComponentsOutput> {
    try {
      const result = await compareComponents(input);
      return result as CompareComponentsOutput;
    } catch (error) {
      console.error("Error in handleCompareComponents:", error);
      throw new Error("Failed to compare components. Please try again.");
    }
}
  
export async function handleEstimateGamingPerformance(input: EstimateGamingPerformanceInput): Promise<GamingPerformanceOutput> {
    try {
        const result = await estimateGamingPerformance(input);
        return result as GamingPerformanceOutput;
    } catch (error) {
        console.error("Error in handleEstimateGamingPerformance:", error);
        throw new Error("Failed to estimate gaming performance. Please try again.");
    }
}
