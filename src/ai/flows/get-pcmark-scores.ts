
'use server';
/**
 * @fileOverview Retrieves PCMark scores for system configurations or components.
 *
 * - getPCMarkScores - A function to fetch PCMark scores.
 * - GetPCMarkScoresInput - The input type for the getPCMarkScores function.
 * - GetPCMarkScoresOutput - The return type for the getPCMarkScores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { PCMarkScoresOutput, PCMarkScoreEntry } from '@/lib/types';

const GetPCMarkScoresInputSchema = z.object({
  query: z.string().optional().describe('A description of the system or key component (e.g., "Gaming PC with RTX 4080", "Intel Core i5-13600K system", "Productivity Laptop"). If empty, a list of example system scores will be provided.'),
});
export type GetPCMarkScoresInput = z.infer<typeof GetPCMarkScoresInputSchema>;

const PCMarkScoreEntrySchema = z.object({
  systemIdentifier: z.string().describe('A description of the system or configuration tested (e.g., "High-end Gaming Desktop (Ryzen 9 7950X, RTX 4090)", "Typical Office Laptop (Core i5-12th Gen)").'),
  testVersion: z.string().describe('The PCMark test version (e.g., "PCMark 10", "PCMark 10 Applications").'),
  overallScore: z.number().int().describe('The overall PCMark score. MUST be a number. Can be 0 if not found.'),
  essentialsScore: z.number().int().optional().describe('PCMark Essentials score. MUST be a number. Can be 0 or omitted.'),
  productivityScore: z.number().int().optional().describe('PCMark Productivity score. MUST be a number. Can be 0 or omitted.'),
  contentCreationScore: z.number().int().optional().describe('PCMark Digital Content Creation score. MUST be a number. Can be 0 or omitted.'),
});

const GetPCMarkScoresOutputSchema = z.object({
  scores: z.array(PCMarkScoreEntrySchema).describe('A list of PCMark score entries.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance.'),
});

export async function getPCMarkScores(input: GetPCMarkScoresInput): Promise<PCMarkScoresOutput> {
  return getPCMarkScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPCMarkScoresPrompt',
  input: {schema: GetPCMarkScoresInputSchema},
  output: {schema: GetPCMarkScoresOutputSchema},
  prompt: `You are a PC benchmark analyst. Your task is to provide PCMark 10 scores.
Scores (overallScore, essentialsScore, productivityScore, contentCreationScore) MUST be NUMBERS (integers). They can be 0 or omitted if data is not found.

{{#if query}}
For the system/component query: "{{{query}}}"
- Provide relevant PCMark 10 scores (Overall, Essentials, Productivity, Digital Content Creation).
- The 'systemIdentifier' should clearly reflect the query or the type of system these scores represent.
If no specific scores are found for the query, provide scores for a representative system of that type if possible, or return an empty 'scores' array and explain in 'dataSourceNotes'.
Example for a specific query:
{
  "scores": [
    {
      "systemIdentifier": "System with NVIDIA GeForce RTX 4070 (e.g., with Core i7-13700K)",
      "testVersion": "PCMark 10 Extended",
      "overallScore": 9500,
      "essentialsScore": 10000,
      "productivityScore": 9000,
      "contentCreationScore": 11000
    }
  ],
  "dataSourceNotes": "PCMark scores are indicative of overall system performance. Data interpreted by AI."
}
{{else}}
Provide a list of PCMark 10 scores for approximately 3-5 diverse example system configurations (e.g., budget office PC, mid-range gaming, high-end workstation).
Example for general list:
{
  "scores": [
    {
      "systemIdentifier": "Mid-Range Gaming PC (e.g., Ryzen 5 7600X, RTX 4060 Ti)",
      "testVersion": "PCMark 10 Extended",
      "overallScore": 8000,
      "essentialsScore": 9500,
      "productivityScore": 8500,
      "contentCreationScore": 9000
    },
    {
      "systemIdentifier": "High-Performance Laptop (e.g., Core i7 H-series, RTX 4070 Mobile)",
      "testVersion": "PCMark 10",
      "overallScore": 7000,
      "essentialsScore": 9000,
      "productivityScore": 8000,
      "contentCreationScore": 7500
    }
  ],
  "dataSourceNotes": "PCMark scores are indicative. This is a sample list. Data interpreted by AI."
}
IMPORTANT: If you cannot reliably generate scores for the query or a general list, return a valid JSON with an empty 'scores' array and explain in 'dataSourceNotes'.
{{/if}}
Ensure all score fields are integers. Do not invent scores.
`,
});

const getPCMarkScoresFlow = ai.defineFlow(
  {
    name: 'getPCMarkScoresFlow',
    inputSchema: GetPCMarkScoresInputSchema,
    outputSchema: GetPCMarkScoresOutputSchema,
  },
  async (input: GetPCMarkScoresInput): Promise<PCMarkScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
        const note = input.query
          ? `AI was unable to retrieve or correctly format PCMark scores for your query "${input.query}".`
          : "AI was unable to generate or correctly format a list of PCMark scores.";
        return { scores: [], dataSourceNotes: `${note} Please try a different query or general search. Data interpretation by AI.` };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      const validatedScores: PCMarkScoreEntry[] = rawScoresArray.map(score => ({
        systemIdentifier: String(score.systemIdentifier || 'Unknown System'),
        testVersion: String(score.testVersion || 'PCMark 10'),
        overallScore: Number.isFinite(Number(score.overallScore)) ? Number(score.overallScore) : 0,
        essentialsScore: Number.isFinite(Number(score.essentialsScore)) ? Number(score.essentialsScore) : undefined,
        productivityScore: Number.isFinite(Number(score.productivityScore)) ? Number(score.productivityScore) : undefined,
        contentCreationScore: Number.isFinite(Number(score.contentCreationScore)) ? Number(score.contentCreationScore) : undefined,
      })).filter(entry => {
        if (input.query && entry.systemIdentifier.toLowerCase().includes(input.query.toLowerCase())) {
            return true;
        }
         if (!input.query) { // For general list, ensure some data exists
            return entry.systemIdentifier !== 'Unknown System' && entry.overallScore > 0;
        }
        // For query, if not directly matching, still include if it's not a placeholder and has a score
        return entry.systemIdentifier !== 'Unknown System' && entry.overallScore > 0;
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;
      if (input.query && validatedScores.length === 0 && !finalDataSourceNotes) {
        finalDataSourceNotes = `No specific PCMark score data could be validated for your query "${input.query}".`;
      } else if (!input.query && validatedScores.length === 0 && !finalDataSourceNotes) {
        finalDataSourceNotes = "AI could not generate a list of PCMark scores or data format was unusable.";
      } else if (!finalDataSourceNotes) {
        finalDataSourceNotes = "PCMark scores vary by system configuration. Data interpreted by AI.";
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI. Scores and availability may vary."
      };

    } catch (error) {
      console.error("Unexpected error during getPCMarkScoresFlow:", error, "Input:", input);
      const note = input.query ? `for query '${input.query}'` : "general list";
      return {
          scores: [],
          dataSourceNotes: `An unexpected error occurred while fetching PCMark scores ${note} from the AI. Please try again later. Data interpretation by AI.`
      };
    }
  }
);
