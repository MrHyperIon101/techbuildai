
'use server';
/**
 * @fileOverview Retrieves Geekbench scores for CPUs and GPUs.
 *
 * - getGeekbenchScores - A function to fetch Geekbench scores.
 * - GetGeekbenchScoresInput - The input type for the getGeekbenchScores function.
 * - GetGeekbenchScoresOutput - The return type for the getGeekbenchScores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GeekbenchScoresOutput, GeekbenchScoreEntry } from '@/lib/types';

const GetGeekbenchScoresInputSchema = z.object({
  componentName: z.string().optional().describe('The CPU or GPU model name (e.g., "AMD Ryzen 7 7800X3D", "NVIDIA GeForce RTX 4080"). If empty, a list of top/recent component scores will be provided.'),
});
export type GetGeekbenchScoresInput = z.infer<typeof GetGeekbenchScoresInputSchema>;

const GeekbenchScoreEntrySchema = z.object({
  componentName: z.string().describe('The full name of the CPU or GPU.'),
  version: z.string().describe('Geekbench version (e.g., "Geekbench 6", "Geekbench 5").'),
  platform: z.string().describe('Operating system or platform (e.g., "Windows", "macOS", "Linux", "Android").'),
  singleCoreScore: z.number().int().optional().describe('CPU Single-Core score. MUST be a number. Omit if not applicable (e.g., for GPU test) or not found.'),
  multiCoreScore: z.number().int().optional().describe('CPU Multi-Core score. MUST be a number. Omit if not applicable or not found.'),
  openClScore: z.number().int().optional().describe('GPU OpenCL Compute score. MUST be a number. Omit if not applicable or not found.'),
  vulkanScore: z.number().int().optional().describe('GPU Vulkan Compute score. MUST be a number. Omit if not applicable or not found.'),
  metalScore: z.number().int().optional().describe('GPU Metal Compute score (Apple devices). MUST be a number. Omit if not applicable or not found.'),
});

const GetGeekbenchScoresOutputSchema = z.object({
  scores: z.array(GeekbenchScoreEntrySchema).describe('A list of Geekbench score entries.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance.'),
});

export async function getGeekbenchScores(input: GetGeekbenchScoresInput): Promise<GeekbenchScoresOutput> {
  return getGeekbenchScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getGeekbenchScoresPrompt',
  input: {schema: GetGeekbenchScoresInputSchema},
  output: {schema: GetGeekbenchScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide Geekbench scores (preferably Geekbench 6, but Geekbench 5 is also acceptable).
All score fields (singleCoreScore, multiCoreScore, openClScore, vulkanScore, metalScore) MUST be NUMBERS (integers). They can be omitted or set to 0 if data for that specific score type is not found or not applicable.

{{#if componentName}}
For the component: "{{{componentName}}}"
- If it's a CPU, provide 'singleCoreScore' and 'multiCoreScore'.
- If it's a GPU, provide relevant compute scores like 'openClScore', 'vulkanScore', or 'metalScore'.
- Specify the Geekbench 'version' (e.g., "Geekbench 6") and 'platform' (e.g., "Windows").
If the exact component is not found or scores are not available, set scores to 0 or omit them. If the component cannot be identified, return an empty 'scores' array and explain in 'dataSourceNotes'.
Example for a CPU:
{
  "scores": [
    {
      "componentName": "AMD Ryzen 7 7800X3D",
      "version": "Geekbench 6",
      "platform": "Windows",
      "singleCoreScore": 2800,
      "multiCoreScore": 15000
    }
  ],
  "dataSourceNotes": "Geekbench scores can vary. Data interpreted by AI from public sources."
}
Example for a GPU:
{
  "scores": [
    {
      "componentName": "NVIDIA GeForce RTX 4080",
      "version": "Geekbench 6",
      "platform": "Windows",
      "openClScore": 240000,
      "vulkanScore": 230000
    }
  ],
  "dataSourceNotes": "Geekbench scores can vary. Data interpreted by AI from public sources."
}
{{else}}
Provide a list of Geekbench scores for approximately 3-5 recent and popular CPUs and GPUs.
For CPUs, include single-core and multi-core scores. For GPUs, include a relevant compute score (OpenCL or Vulkan).
Example for general list:
{
  "scores": [
    {
      "componentName": "Intel Core i9-14900K",
      "version": "Geekbench 6",
      "platform": "Windows",
      "singleCoreScore": 3100,
      "multiCoreScore": 22000
    },
    {
      "componentName": "NVIDIA GeForce RTX 4090",
      "version": "Geekbench 6",
      "platform": "Windows",
      "openClScore": 320000
    },
    {
      "componentName": "Apple M3 Max (GPU)",
      "version": "Geekbench 6",
      "platform": "macOS",
      "metalScore": 150000
    }
  ],
  "dataSourceNotes": "Geekbench scores are indicative. Data interpreted by AI from public sources."
}
IMPORTANT: If you cannot reliably generate scores for the component or a general list, return a valid JSON with an empty 'scores' array and explain in 'dataSourceNotes'.
{{/if}}
Ensure all score fields are integers. Do not invent scores.
`,
});

const getGeekbenchScoresFlow = ai.defineFlow(
  {
    name: 'getGeekbenchScoresFlow',
    inputSchema: GetGeekbenchScoresInputSchema,
    outputSchema: GetGeekbenchScoresOutputSchema,
  },
  async (input: GetGeekbenchScoresInput): Promise<GeekbenchScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
        const note = input.componentName
          ? `AI was unable to retrieve or correctly format Geekbench scores for "${input.componentName}".`
          : "AI was unable to generate or correctly format a list of Geekbench scores.";
        return { scores: [], dataSourceNotes: `${note} Please ensure the name is correct or try a general search. Data interpretation by AI based on public sources.` };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      const validatedScores: GeekbenchScoreEntry[] = rawScoresArray.map(score => ({
        componentName: String(score.componentName || 'Unknown Component'),
        version: String(score.version || 'Geekbench 6'),
        platform: String(score.platform || 'N/A'),
        singleCoreScore: Number.isFinite(Number(score.singleCoreScore)) ? Number(score.singleCoreScore) : undefined,
        multiCoreScore: Number.isFinite(Number(score.multiCoreScore)) ? Number(score.multiCoreScore) : undefined,
        openClScore: Number.isFinite(Number(score.openClScore)) ? Number(score.openClScore) : undefined,
        vulkanScore: Number.isFinite(Number(score.vulkanScore)) ? Number(score.vulkanScore) : undefined,
        metalScore: Number.isFinite(Number(score.metalScore)) ? Number(score.metalScore) : undefined,
      })).filter(entry => {
        const hasCpuScore = (entry.singleCoreScore && entry.singleCoreScore > 0) || (entry.multiCoreScore && entry.multiCoreScore > 0);
        const hasGpuScore = (entry.openClScore && entry.openClScore > 0) || (entry.vulkanScore && entry.vulkanScore > 0) || (entry.metalScore && entry.metalScore > 0);
        
        if (input.componentName && entry.componentName.toLowerCase().includes(input.componentName.toLowerCase())) {
            return true; // Keep if it matches query, even if scores are 0, notes will explain
        }
        if (!input.componentName) { // For general list, ensure some data exists
            return entry.componentName !== 'Unknown Component' && (hasCpuScore || hasGpuScore);
        }
        // For specific search, if not exact match, filter out Unknown unless it has scores.
        // This case is mostly handled by the includes check, but as a fallback.
        return entry.componentName !== 'Unknown Component' && (hasCpuScore || hasGpuScore);
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;
      if (input.componentName && validatedScores.length === 0 && !finalDataSourceNotes) {
        finalDataSourceNotes = `No specific Geekbench score data could be validated for "${input.componentName}".`;
      } else if (!input.componentName && validatedScores.length === 0 && !finalDataSourceNotes) {
        finalDataSourceNotes = "AI could not generate a list of Geekbench scores or data format was unusable.";
      } else if (!finalDataSourceNotes) {
        finalDataSourceNotes = "Geekbench scores can vary by system and test conditions. Data interpreted by AI from public sources.";
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI based on public sources. Scores and availability may vary."
      };

    } catch (error) {
      console.error("Unexpected error during getGeekbenchScoresFlow:", error, "Input:", input);
      const note = input.componentName ? `for '${input.componentName}'` : "general list";
      return {
          scores: [],
          dataSourceNotes: `An unexpected error occurred while fetching Geekbench scores ${note} from the AI. Please try again later. Data interpretation by AI based on public sources.`
      };
    }
  }
);
