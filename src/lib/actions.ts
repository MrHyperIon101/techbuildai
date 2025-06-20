"use server";

import { suggestPcBuild, SuggestPcBuildInput, SuggestPcBuildOutput } from '@/ai/flows/generate-pc-build-suggestions';
import { getComponentDetails, GetComponentDetailsInput, GetComponentDetailsOutput } from '@/ai/flows/get-component-details';
import { calculateBottleneck, CalculateBottleneckInput, CalculateBottleneckOutput } from '@/ai/flows/calculate-bottleneck';
import type { BuildSuggestion, BottleneckInfo, ComponentDetails } from './types';

export async function handleSuggestPcBuild(input: SuggestPcBuildInput): Promise<BuildSuggestion> {
  try {
    const result = await suggestPcBuild(input);
    return result as BuildSuggestion; // Cast to ensure type compatibility if schema differs slightly
  } catch (error) {
    console.error("Error in handleSuggestPcBuild:", error);
    throw new Error("Failed to generate PC build suggestions. Please try again.");
  }
}

export async function handleGetComponentDetails(input: GetComponentDetailsInput): Promise<ComponentDetails> {
  try {
    const result = await getComponentDetails(input);
    return result as ComponentDetails;
  } catch (error) {
    console.error("Error in handleGetComponentDetails:", error);
    throw new Error("Failed to retrieve component details. Please try again.");
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
