
'use server';
/**
 * @fileOverview Retrieves Cinebench scores for CPUs.
 *
 * - getCinebenchScores - A function to fetch Cinebench scores for a specific CPU or a list of popular CPUs.
 * - GetCinebenchScoresInput - The input type for the getCinebenchScores function.
 * - GetCinebenchScoresOutput - The return type for the getCinebenchScores function (matches CinebenchScoresOutput type from lib/types).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CinebenchScoresOutput } from '@/lib/types';


const GetCinebenchScoresInputSchema = z.object({
  cpuName: z.string().optional().describe('The specific CPU model to search for (e.g., "AMD Ryzen 9 7950X", "Intel Core i9-13900K"). If empty, a general list of popular CPUs will be returned.'),
});
export type GetCinebenchScoresInput = z.infer<typeof GetCinebenchScoresInputSchema>;

const CinebenchScoreEntrySchema = z.object({
  cpuName: z.string().describe('The full name of the CPU.'),
  cinebenchVersion: z.string().describe('The version of Cinebench used for the score (e.g., "R23", "2024"). Prioritize R23 if available.'),
  singleCoreScore: z.number().int().positive().describe('The single-core score.'),
  multiCoreScore: z.number().int().positive().describe('The multi-core score.'),
  notes: z.string().optional().describe('Brief relevant notes, e.g., "Typical score, may vary", or source if a single primary one was used.'),
});

const GetCinebenchScoresOutputSchema = z.object({
  scores: z.array(CinebenchScoreEntrySchema).describe('A list of Cinebench score entries.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source, e.g., "Scores compiled from various tech review sites. Performance can vary based on system configuration and test conditions."'),
});
// We use the imported type for the function signature for consistency with other flows
// export type GetCinebenchScoresOutput = z.infer<typeof GetCinebenchScoresOutputSchema>;


export async function getCinebenchScores(input: GetCinebenchScoresInput): Promise<CinebenchScoresOutput> {
  return getCinebenchScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCinebenchScoresPrompt',
  input: {schema: GetCinebenchScoresInputSchema},
  output: {schema: GetCinebenchScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide Cinebench scores.
Focus on Cinebench R23 scores as a primary reference. If R23 is unavailable for a specific CPU, you may provide scores from another recent Cinebench version (e.g., Cinebench 2024) and clearly state the version.

{{#if cpuName}}
For the CPU: {{{cpuName}}}
- Provide its Cinebench R23 single-core score.
- Provide its Cinebench R23 multi-core score.
- Specify the Cinebench version if not R23.
- Add any brief, relevant notes (e.g., common score range, or if data is from a specific prominent review site).
If the exact CPU is not found, state that clearly in the notes for that entry and do not attempt to guess.
Return a single entry in the 'scores' array.
{{else}}
Provide a list of Cinebench R23 scores for 5-7 popular and relatively recent desktop CPUs from both Intel (e.g., Core i5, i7, i9 series) and AMD (e.g., Ryzen 5, 7, 9 series).
For each CPU:
- Provide its full name.
- Provide its Cinebench R23 single-core score.
- Provide its Cinebench R23 multi-core score.
- Specify the Cinebench version if not R23 for any particular CPU.
Return these as multiple entries in the 'scores' array.
{{/if}}

For all requests:
- Ensure scores are positive integers.
- The 'dataSourceNotes' field should contain a general disclaimer like "Cinebench scores can vary based on test conditions, system configuration (RAM, cooling), and software. Data compiled from publicly available information and tech reviews."
- If you cannot find reliable data for a specific CPU, you can omit it or return an empty scores array with a dataSourceNote explaining the difficulty.
- Do not invent scores. If data is sparse or conflicting for a less common CPU, it's better to indicate that.
`,
});

const getCinebenchScoresFlow = ai.defineFlow(
  {
    name: 'getCinebenchScoresFlow',
    inputSchema: GetCinebenchScoresInputSchema,
    outputSchema: GetCinebenchScoresOutputSchema,
  },
  async (input: GetCinebenchScoresInput): Promise<CinebenchScoresOutput> => {
    const {output, usage} = await prompt(input);
    if (!output || !output.scores) {
        console.error("AI failed to return valid Cinebench scores. Input was:", input, "Usage data:", usage);
        // Provide a default empty state that matches the schema to avoid downstream errors
        return {
            scores: [],
            dataSourceNotes: "AI was unable to retrieve Cinebench scores for the given input. Please try a different CPU or a general search."
        };
    }
    // Ensure scores is always an array, even if AI returns something else.
    output.scores = Array.isArray(output.scores) ? output.scores : [];
    return output;
  }
);
