
'use server';
/**
 * @fileOverview Retrieves Cinebench scores for CPUs.
 *
 * - getCinebenchScores - A function to fetch Cinebench scores for a specific CPU or provide a list of top CPUs.
 * - GetCinebenchScoresInput - The input type for the getCinebenchScores function.
 * - GetCinebenchScoresOutput - The return type for the getCinebenchScores function (matches CinebenchScoresOutput type from lib/types).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CinebenchScoresOutput, CinebenchScoreEntry } from '@/lib/types';


const GetCinebenchScoresInputSchema = z.object({
  cpuName: z.string().optional().describe('The specific CPU model to search for (e.g., "AMD Ryzen 9 7950X", "Intel Core i9-13900K"). If empty, a list of top/recent CPUs will be provided.'),
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
  scores: z.array(CinebenchScoreEntrySchema).describe('A list of Cinebench score entries. Can be multiple entries if no specific CPU is requested (general list).'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance.'),
});


export async function getCinebenchScores(input: GetCinebenchScoresInput): Promise<CinebenchScoresOutput> {
  return getCinebenchScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCinebenchScoresPrompt',
  input: {schema: GetCinebenchScoresInputSchema},
  output: {schema: GetCinebenchScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide Cinebench scores.
Focus on Cinebench R23 scores as a primary reference. If R23 is unavailable for a specific CPU, you may provide scores from another recent Cinebench version (e.g., Cinebench 2024) and clearly state the version.
The singleCoreScore and multiCoreScore fields MUST be NUMBERS (integers), not strings, when scores are provided.

{{#if cpuName}}
For the CPU: {{{cpuName}}}
- Provide its Cinebench R23 single-core score (as a number).
- Provide its Cinebench R23 multi-core score (as a number).
- Specify the Cinebench version if not R23.
- Add any brief, relevant notes (e.g., common score range, or if data is from a specific prominent review site).
If the exact CPU is not found, state that clearly in the notes for that entry and do not attempt to guess. Return an empty 'scores' array and explain in 'dataSourceNotes' if no data is found for "{{{cpuName}}}".
The output should be a JSON object with a 'scores' array containing a single entry for this CPU (or an empty array if not found), and a 'dataSourceNotes' string.
Example for a specific CPU:
{
  "scores": [
    {
      "cpuName": "Intel Core i9-13900K",
      "cinebenchVersion": "R23",
      "singleCoreScore": 2250,
      "multiCoreScore": 38000,
      "notes": "Typical score, may vary."
    }
  ],
  "dataSourceNotes": "Cinebench scores can vary based on test conditions, system configuration (RAM, cooling), and software. Data compiled from publicly available information and tech reviews."
}
{{else}}
You are asked for a general list of top/recent CPUs.
Provide a list of approximately 5-7 recent and popular CPUs along with their Cinebench R23 single-core and multi-core scores. Ensure all score fields are positive integers.
The output should be a JSON object with a 'scores' array, where each entry conforms to the CinebenchScoreEntrySchema.
Example for general list:
{
  "scores": [
    {
      "cpuName": "AMD Ryzen 9 7950X",
      "cinebenchVersion": "R23",
      "singleCoreScore": 2050,
      "multiCoreScore": 38500,
      "notes": "High-end performance CPU."
    },
    {
      "cpuName": "Intel Core i9-14900K",
      "cinebenchVersion": "R23",
      "singleCoreScore": 2300,
      "multiCoreScore": 39000,
      "notes": "Top-tier gaming and productivity CPU."
    },
    {
      "cpuName": "AMD Ryzen 7 7800X3D",
      "cinebenchVersion": "R23",
      "singleCoreScore": 1850,
      "multiCoreScore": 18800,
      "notes": "Excellent gaming CPU with 3D V-Cache."
    },
    {
      "cpuName": "Intel Core i5-14600K",
      "cinebenchVersion": "R23",
      "singleCoreScore": 2000,
      "multiCoreScore": 24000,
      "notes": "Great mid-range all-rounder."
    },
    {
      "cpuName": "AMD Ryzen 5 7600X",
      "cinebenchVersion": "R23",
      "singleCoreScore": 1950,
      "multiCoreScore": 15200,
      "notes": "Solid entry to AM5 platform."
    }
  ],
  "dataSourceNotes": "Cinebench scores are indicative and can vary based on system configuration, cooling, and test conditions. Data compiled from publicly available information and tech reviews. This is a sample list of recent/popular CPUs."
}
IMPORTANT: If you cannot reliably generate this list of CPUs and their scores as requested, you MUST still return a valid JSON object according to the schema, with an empty 'scores' array and provide an explanation or alternative guidance in the 'dataSourceNotes' field. Do not return an error or malformed JSON.
{{/if}}

For all requests:
- If providing scores, ensure all score fields (singleCoreScore, multiCoreScore) are positive integers.
- If providing scores for a specific CPU and you cannot find reliable data, its entry in the 'scores' array can indicate missing data in its 'notes' field, or return an empty 'scores' array with an explanation in 'dataSourceNotes'.
- Do not invent scores.
`,
});

const getCinebenchScoresFlow = ai.defineFlow(
  {
    name: 'getCinebenchScoresFlow',
    inputSchema: GetCinebenchScoresInputSchema,
    outputSchema: GetCinebenchScoresOutputSchema,
  },
  async (input: GetCinebenchScoresInput): Promise<CinebenchScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
          console.warn("AI output for Cinebench scores was null or undefined. Input:", input, "Usage:", usage);
          const note = input.cpuName 
            ? `AI was unable to retrieve Cinebench scores for "${input.cpuName}". Please ensure the name is correct or try a general search.`
            : "AI was unable to generate a list of top CPU scores at this time. Please try again later or search for a specific CPU.";
          return {
              scores: [],
              dataSourceNotes: note
          };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];

      const validatedScores: CinebenchScoreEntry[] = rawScoresArray
        .map(score => {
          const singleCore = Number(score.singleCoreScore);
          const multiCore = Number(score.multiCoreScore);
          return {
            cpuName: String(score.cpuName || 'Unknown CPU'),
            cinebenchVersion: String(score.cinebenchVersion || 'N/A'),
            singleCoreScore: isNaN(singleCore) ? 0 : singleCore,
            multiCoreScore: isNaN(multiCore) ? 0 : multiCore,
            notes: score.notes ? String(score.notes) : undefined,
          };
        })
        .filter(score => score.cpuName && score.cpuName !== 'Unknown CPU' && score.multiCoreScore > 0);


      let finalDataSourceNotes = output.dataSourceNotes;

      if (!input.cpuName) { // General list case
        if (validatedScores.length > 0) {
          finalDataSourceNotes = output.dataSourceNotes || "Cinebench scores are indicative and can vary based on system configuration, cooling, and test conditions. Data compiled from publicly available information. This is a sample list of recent/popular CPUs.";
        } else {
          finalDataSourceNotes = output.dataSourceNotes || "AI attempted to generate a list of top CPU scores but could not find sufficient data at this time. Please try searching for a specific CPU or check reputable review sites for general comparisons.";
        }
      } else { // Specific CPU search case
        if (validatedScores.length > 0) {
           finalDataSourceNotes = output.dataSourceNotes || "Cinebench scores can vary based on test conditions, system configuration (RAM, cooling), and software. Data compiled from publicly available information and tech reviews.";
        } else {
            finalDataSourceNotes = output.dataSourceNotes || `No specific Cinebench score data found for "${input.cpuName}". Ensure the name is correct, the CPU might be too old/new for common listings, or the AI could not retrieve the data.`;
        }
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes
      };

    } catch (error) {
      console.error("Error during getCinebenchScoresFlow execution:", error, "Input was:", input);
      let defaultNote = "An error occurred while fetching Cinebench scores from the AI. Please try again later.";
      if (input.cpuName) {
        defaultNote += ` If searching for '${input.cpuName}', ensure the name is correct.`
      } else {
         defaultNote = "An error occurred while trying to generate a list of top CPU scores from the AI. Please try again later or search for a specific CPU."
      }
      return {
          scores: [],
          dataSourceNotes: defaultNote
      };
    }
  }
);

