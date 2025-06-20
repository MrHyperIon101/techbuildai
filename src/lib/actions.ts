
"use server";

import { suggestPcBuild, SuggestPcBuildInput } from '@/ai/flows/generate-pc-build-suggestions';
import { getComponentDetails, GetComponentDetailsInput } from '@/ai/flows/get-component-details';
import { calculateBottleneck, CalculateBottleneckInput } from '@/ai/flows/calculate-bottleneck';
import { checkCompatibility, CheckCompatibilityInput } from '@/ai/flows/check-compatibility';

import type { BuildSuggestion, BottleneckInfo, ComponentDetails, CompatibilityReport } from './types';

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
    return result as CompatibilityReport;
  } catch (error) {
    console.error("Error in handleCheckCompatibility:", error);
    if (error instanceof Error && error.message.includes("AI response did not match")) {
        throw error;
    }
    throw new Error("Failed to check PC part compatibility. The AI may have had trouble with the component descriptions or the requested format. Please ensure all fields are filled clearly.");
  }
}
