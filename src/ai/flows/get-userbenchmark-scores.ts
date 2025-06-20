
'use server';
/**
 * @fileOverview Retrieves UserBenchmark scores for components.
 *
 * - getUserBenchmarkScores - A function to fetch UserBenchmark scores.
 * - GetUserBenchmarkScoresInput - The input type for the getUserBenchmarkScores function.
 * - GetUserBenchmarkScoresOutput - The return type for the getUserBenchmarkScores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserBenchmarkScoresOutput, UserBenchmarkScoreEntry } from '@/lib/types';

const GetUserBenchmarkScoresInputSchema = z.object({
  componentName: z.string().optional().describe('The specific component model to search for (e.g., "Intel Core i5-13600K", "NVIDIA RTX 4070", "Samsung 980 Pro 1TB"). If empty, a list of example scores for various components will be provided.'),
});
export type GetUserBenchmarkScoresInput = z.infer<typeof GetUserBenchmarkScoresInputSchema>;

const UserBenchmarkScoreEntrySchema = z.object({
  componentName: z.string().describe('The full name of the component.'),
  componentType: z.enum(["CPU", "GPU", "SSD", "RAM", "Unknown"]).describe('The type of component.'),
  gamingPercentage: z.number().int().optional().describe('UserBenchmark Gaming Score (%). Omit if not applicable or not found.'),
  desktopPercentage: z.number().int().optional().describe('UserBenchmark Desktop Score (%). Omit if not applicable or not found.'),
  workstationPercentage: z.number().int().optional().describe('UserBenchmark Workstation Score (%). Omit if not applicable or not found.'),
  averageBench: z.number().int().optional().describe('UserBenchmark "Average Bench" score (%). Omit if not found.'),
  rank: z.string().optional().describe('UserBenchmark rank, if available (e.g., "15th / 1300").'),
  notes: z.string().optional().describe('Brief relevant notes, e.g., "Typical score", or if scores are not found.'),
});

const GetUserBenchmarkScoresOutputSchema = z.object({
  scores: z.array(UserBenchmarkScoreEntrySchema).describe('A list of UserBenchmark score entries.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source, e.g., "UserBenchmark scores should be interpreted with consideration of their methodology."'),
});

export async function getUserBenchmarkScores(input: GetUserBenchmarkScoresInput): Promise<UserBenchmarkScoresOutput> {
  return getUserBenchmarkScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getUserBenchmarkScoresPrompt',
  input: {schema: GetUserBenchmarkScoresInputSchema},
  output: {schema: GetUserBenchmarkScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide UserBenchmark scores for PC components (CPU, GPU, SSD, RAM).
Your primary reference for score data should be information reflecting UserBenchmark's own data and presentation.
Scores (gamingPercentage, desktopPercentage, workstationPercentage, averageBench) MUST be NUMBERS (integers). They can be omitted or set to 0 if data is not found or not applicable for a specific component type.

{{#if componentName}}
For the component: "{{{componentName}}}"
- Determine its 'componentType' (CPU, GPU, SSD, RAM, or Unknown).
- Provide its UserBenchmark 'gamingPercentage', 'desktopPercentage', 'workstationPercentage', and 'averageBench' scores if applicable and available.
- Include its 'rank' if prominently available.
- Add brief 'notes' if relevant (e.g., if specific scores are typical or if data is sparse).
If the exact component is not found, or scores are not available, return an entry with the 'componentName' as "{{{componentName}}}", 'componentType' as 'Unknown' (or best guess), and set unavailable/inapplicable scores to 0 or omit them. Provide a note explaining this. If the component cannot be identified at all, return an empty 'scores' array and explain in 'dataSourceNotes'.

Example for a specific component (CPU):
{
  "scores": [
    {
      "componentName": "Intel Core i5-13600K",
      "componentType": "CPU",
      "gamingPercentage": 105,
      "desktopPercentage": 108,
      "workstationPercentage": 107,
      "averageBench": 107,
      "rank": "#15 / 1400"
    }
  ],
  "dataSourceNotes": "UserBenchmark scores based on their public data. Interpret with consideration of their methodology."
}
{{else}}
Provide a list of UserBenchmark scores for approximately 3-5 diverse examples, covering different component types (e.g., a CPU, a GPU, an SSD).
For each entry, provide 'componentName', 'componentType', and relevant scores like 'averageBench' and context-specific percentages (e.g., gaming for GPU, general for SSD).

Example for general list:
{
  "scores": [
    {
      "componentName": "AMD Ryzen 7 7800X3D",
      "componentType": "CPU",
      "averageBench": 110,
      "gamingPercentage": 115,
      "notes": "Top-tier gaming CPU."
    },
    {
      "componentName": "NVIDIA RTX 4080",
      "componentType": "GPU",
      "averageBench": 240,
      "gamingPercentage": 250
    },
    {
      "componentName": "Samsung 980 Pro NVMe PCIe 4.0 M.2 1TB",
      "componentType": "SSD",
      "averageBench": 350,
      "notes": "High-performance NVMe SSD."
    }
  ],
  "dataSourceNotes": "Sample UserBenchmark scores. Interpret with consideration of their methodology. Data interpreted by AI."
}
IMPORTANT: If you cannot reliably generate this list, return a valid JSON object according to the schema, with an empty 'scores' array and provide an explanation in 'dataSourceNotes'. Do not return an error or malformed JSON.
{{/if}}
Ensure all score fields are numbers where applicable. Do not invent scores.
`,
});

const getUserBenchmarkScoresFlow = ai.defineFlow(
  {
    name: 'getUserBenchmarkScoresFlow',
    inputSchema: GetUserBenchmarkScoresInputSchema,
    outputSchema: GetUserBenchmarkScoresOutputSchema,
  },
  async (input: GetUserBenchmarkScoresInput): Promise<UserBenchmarkScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
        const note = input.componentName
          ? `AI was unable to retrieve or correctly format UserBenchmark scores for "${input.componentName}". This might be due to schema validation failure or an uninterpretable query.`
          : "AI was unable to generate or correctly format a list of UserBenchmark scores at this time. This might be due to schema validation failure.";
        return { 
            scores: [], 
            dataSourceNotes: `${note} Please ensure your query is clear or try a general search. UserBenchmark data interpreted by AI.` 
        };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      const validatedScores: UserBenchmarkScoreEntry[] = rawScoresArray.map(score => ({
        componentName: String(score.componentName || 'Unknown Component'),
        componentType: score.componentType && ["CPU", "GPU", "SSD", "RAM"].includes(score.componentType) ? score.componentType : "Unknown",
        gamingPercentage: Number.isFinite(Number(score.gamingPercentage)) ? Number(score.gamingPercentage) : undefined,
        desktopPercentage: Number.isFinite(Number(score.desktopPercentage)) ? Number(score.desktopPercentage) : undefined,
        workstationPercentage: Number.isFinite(Number(score.workstationPercentage)) ? Number(score.workstationPercentage) : undefined,
        averageBench: Number.isFinite(Number(score.averageBench)) ? Number(score.averageBench) : undefined,
        rank: score.rank ? String(score.rank) : undefined,
        notes: score.notes ? String(score.notes) : undefined,
      })).filter(entry => {
        if (input.componentName && entry.componentName !== 'Unknown Component') {
            return true; 
        }
        if (!input.componentName) {
            return entry.componentName !== 'Unknown Component' && entry.componentType !== 'Unknown' && 
                   (entry.averageBench !== undefined || entry.gamingPercentage !== undefined || entry.desktopPercentage !== undefined || entry.workstationPercentage !== undefined);
        }
        return false;
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;

      if (input.componentName) {
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = `No UserBenchmark score data could be validated or found for your query "${input.componentName}". The AI may not recognize this component or have data for it.`;
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
           finalDataSourceNotes = "UserBenchmark scores can vary and their methodology has been subject to discussion. Data interpreted by AI based on public UserBenchmark data.";
        }
      } else { 
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "AI could not generate a list of UserBenchmark scores, or the data format was unusable. Data interpreted by AI.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "UserBenchmark scores are indicative. This is a sample list, with data interpreted by AI. Interpret with consideration of their methodology.";
        }
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI. UserBenchmark scores should be considered alongside other benchmark sources."
      };

    } catch (error) {
      console.error("Unexpected error during getUserBenchmarkScoresFlow execution:", error, "Input was:", input);
      const note = input.componentName ? `for query '${input.componentName}'` : "general list";
      return {
          scores: [],
          dataSourceNotes: `An unexpected error occurred while fetching UserBenchmark scores ${note} from the AI. Please try again later. Data interpreted by AI.`
      };
    }
  }
);

    
