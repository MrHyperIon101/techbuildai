
'use server';
/**
 * @fileOverview Retrieves FurMark scores for GPUs.
 *
 * - getFurMarkScores - A function to fetch FurMark scores for a specific GPU or provide a list for top GPUs.
 * - GetFurMarkScoresInput - The input type for the getFurMarkScores function.
 * - GetFurMarkScoresOutput - The return type for the getFurMarkScores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { FurMarkScoresOutput, FurMarkScoreEntry } from '@/lib/types';

const GetFurMarkScoresInputSchema = z.object({
  gpuName: z.string().optional().describe('The specific GPU model to search for (e.g., "NVIDIA GeForce RTX 4080"). If empty, a list of top/recent GPUs will be provided.'),
});
export type GetFurMarkScoresInput = z.infer<typeof GetFurMarkScoresInputSchema>;

const FurMarkScoreEntrySchema = z.object({
  gpuName: z.string().describe('The full name of the GPU.'),
  preset: z.string().describe('The FurMark preset used (e.g., "1080p Preset", "1440p (QHD)", "2160p (4K/UHD)").'),
  score: z.number().int().describe('The FurMark score. MUST be a number. Can be 0 if not found.'),
  averageFPS: z.number().int().optional().describe('The average FPS achieved during the test. MUST be a number. Can be 0 or omitted if not found.'),
  maxTemperatureCelsius: z.number().int().optional().describe('The maximum GPU temperature recorded in Celsius. MUST be a number. Can be 0 or omitted if not found.'),
});

const GetFurMarkScoresOutputSchema = z.object({
  scores: z.array(FurMarkScoreEntrySchema).describe('A list of FurMark score entries.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance.'),
});

export async function getFurMarkScores(input: GetFurMarkScoresInput): Promise<FurMarkScoresOutput> {
  return getFurMarkScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getFurMarkScoresPrompt',
  input: {schema: GetFurMarkScoresInputSchema},
  output: {schema: GetFurMarkScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide FurMark benchmark scores for GPUs.
Focus on standard presets like 1080p, 1440p (QHD), and 2160p (4K/UHD).
The 'score', 'averageFPS', and 'maxTemperatureCelsius' fields MUST be NUMBERS (integers). They can be 0 or omitted if data is not found.

{{#if gpuName}}
For the GPU: {{{gpuName}}}
- Provide its FurMark score, average FPS, and max temperature for common presets (e.g., 1080p, 1440p).
If the exact GPU is not found, or scores are not available, set scores to 0. If the GPU cannot be identified, return an empty 'scores' array and explain in 'dataSourceNotes'.
Example for a specific GPU:
{
  "scores": [
    {
      "gpuName": "NVIDIA GeForce RTX 4070",
      "preset": "1080p Preset",
      "score": 12000,
      "averageFPS": 200,
      "maxTemperatureCelsius": 70
    },
    {
      "gpuName": "NVIDIA GeForce RTX 4070",
      "preset": "1440p (QHD)",
      "score": 8500,
      "averageFPS": 142,
      "maxTemperatureCelsius": 72
    }
  ],
  "dataSourceNotes": "FurMark scores can vary. Data interpreted by AI."
}
{{else}}
Provide a list of FurMark scores for approximately 3-5 recent and popular GPUs, covering at least one common preset (e.g., 1080p or 1440p) for each.
Example for general list:
{
  "scores": [
    {
      "gpuName": "NVIDIA GeForce RTX 4080",
      "preset": "1440p (QHD)",
      "score": 15000,
      "averageFPS": 250,
      "maxTemperatureCelsius": 75
    },
    {
      "gpuName": "AMD Radeon RX 7900 XT",
      "preset": "1440p (QHD)",
      "score": 14000,
      "averageFPS": 230,
      "maxTemperatureCelsius": 78
    }
  ],
  "dataSourceNotes": "FurMark scores are indicative. Data interpreted by AI."
}
IMPORTANT: If you cannot reliably generate the list or specific GPU scores, return a valid JSON with an empty 'scores' array and explain in 'dataSourceNotes'.
{{/if}}
Ensure all score fields are integers. Do not invent scores.
`,
});

const getFurMarkScoresFlow = ai.defineFlow(
  {
    name: 'getFurMarkScoresFlow',
    inputSchema: GetFurMarkScoresInputSchema,
    outputSchema: GetFurMarkScoresOutputSchema,
  },
  async (input: GetFurMarkScoresInput): Promise<FurMarkScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
        const note = input.gpuName
          ? `AI was unable to retrieve or correctly format FurMark scores for "${input.gpuName}".`
          : "AI was unable to generate or correctly format a list of FurMark scores.";
        return { scores: [], dataSourceNotes: `${note} Please ensure the name is correct or try a general search. Data interpretation by AI.` };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      const validatedScores: FurMarkScoreEntry[] = rawScoresArray.map(score => ({
        gpuName: String(score.gpuName || 'Unknown GPU'),
        preset: String(score.preset || 'N/A'),
        score: Number.isFinite(Number(score.score)) ? Number(score.score) : 0,
        averageFPS: Number.isFinite(Number(score.averageFPS)) ? Number(score.averageFPS) : undefined,
        maxTemperatureCelsius: Number.isFinite(Number(score.maxTemperatureCelsius)) ? Number(score.maxTemperatureCelsius) : undefined,
      })).filter(entry => {
        if (input.gpuName && entry.gpuName.toLowerCase().includes(input.gpuName.toLowerCase())) {
            return true;
        }
        if (!input.gpuName) { // For general list, ensure some data exists
            return entry.gpuName !== 'Unknown GPU' && entry.preset !== 'N/A' && entry.score > 0;
        }
        return false;
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;
      if (input.gpuName && validatedScores.length === 0 && !finalDataSourceNotes) {
        finalDataSourceNotes = `No specific FurMark score data could be validated for "${input.gpuName}".`;
      } else if (!input.gpuName && validatedScores.length === 0 && !finalDataSourceNotes) {
        finalDataSourceNotes = "AI could not generate a list of FurMark scores or data format was unusable.";
      } else if (!finalDataSourceNotes) {
        finalDataSourceNotes = "FurMark scores can vary. Data interpreted by AI.";
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI. Scores and availability may vary."
      };

    } catch (error) {
      console.error("Unexpected error during getFurMarkScoresFlow:", error, "Input:", input);
      const note = input.gpuName ? `for '${input.gpuName}'` : "general list";
      return {
          scores: [],
          dataSourceNotes: `An unexpected error occurred while fetching FurMark scores ${note} from the AI. Please try again later. Data interpretation by AI.`
      };
    }
  }
);
