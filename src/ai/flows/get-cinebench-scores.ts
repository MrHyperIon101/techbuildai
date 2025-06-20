
'use server';
/**
 * @fileOverview Retrieves Cinebench scores for CPUs.
 *
 * - getCinebenchScores - A function to fetch Cinebench scores for a specific CPU or provide guidance for general lists.
 * - GetCinebenchScoresInput - The input type for the getCinebenchScores function.
 * - GetCinebenchScoresOutput - The return type for the getCinebenchScores function (matches CinebenchScoresOutput type from lib/types).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { CinebenchScoresOutput } from '@/lib/types';


const GetCinebenchScoresInputSchema = z.object({
  cpuName: z.string().optional().describe('The specific CPU model to search for (e.g., "AMD Ryzen 9 7950X", "Intel Core i9-13900K"). If empty, guidance on finding general lists will be provided.'),
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
  scores: z.array(CinebenchScoreEntrySchema).describe('A list of Cinebench score entries. Will be empty if no specific CPU is requested and guidance is provided instead.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance for finding general CPU lists.'),
});


export async function getCinebenchScores(input: GetCinebenchScoresInput): Promise<CinebenchScoresOutput> {
  return getCinebenchScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCinebenchScoresPrompt',
  input: {schema: GetCinebenchScoresInputSchema},
  output: {schema: GetCinebenchScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide Cinebench scores or guidance.
Focus on Cinebench R23 scores as a primary reference if providing specific CPU scores. If R23 is unavailable for a specific CPU, you may provide scores from another recent Cinebench version (e.g., Cinebench 2024) and clearly state the version.
The singleCoreScore and multiCoreScore fields MUST be NUMBERS (integers), not strings when scores are provided.

{{#if cpuName}}
For the CPU: {{{cpuName}}}
- Provide its Cinebench R23 single-core score (as a number).
- Provide its Cinebench R23 multi-core score (as a number).
- Specify the Cinebench version if not R23.
- Add any brief, relevant notes (e.g., common score range, or if data is from a specific prominent review site).
If the exact CPU is not found, state that clearly in the notes for that entry and do not attempt to guess.
The output should be a JSON object with a 'scores' array containing a single entry for this CPU, and a 'dataSourceNotes' string.
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
You are asked for a general list of top CPUs.
Instead of providing a list of scores directly, you should guide the user to reputable external resources.
Return an empty "scores" array.
Populate the "dataSourceNotes" field with a message like:
"For an up-to-date general overview of top CPU performance and 'best CPU' lists, please consult reputable tech review websites such as TechSpot, Tom's Hardware, AnandTech, PC Gamer, or similar. These sites regularly publish comprehensive CPU benchmark comparisons."
Ensure the output is a valid JSON object conforming to the GetCinebenchScoresOutputSchema with an empty scores array and the specified dataSourceNotes.
Example for empty cpuName (general list):
{
  "scores": [],
  "dataSourceNotes": "For an up-to-date general overview of top CPU performance and 'best CPU' lists, please consult reputable tech review websites such as TechSpot, Tom's Hardware, AnandTech, PC Gamer, or similar. These sites regularly publish comprehensive CPU benchmark comparisons."
}
{{/if}}

For all requests:
- If providing scores, ensure all score fields (singleCoreScore, multiCoreScore) are positive integers.
- If providing scores for a specific CPU and you cannot find reliable data, its entry in the 'scores' array should still be present but can indicate missing data in its 'notes' field, or return an empty 'scores' array with an explanation in 'dataSourceNotes'.
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
          return {
              scores: [],
              dataSourceNotes: "AI was unable to retrieve Cinebench scores or guidance in the expected format. Please try a different CPU or a general search."
          };
      }
      
      // Ensure scores is an array, even if AI messes up for a specific CPU search
      const scoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];

      const validatedScores = scoresArray.map(score => ({
        cpuName: String(score.cpuName || 'Unknown CPU'),
        cinebenchVersion: String(score.cinebenchVersion || 'N/A'),
        singleCoreScore: Number(score.singleCoreScore) || 0,
        multiCoreScore: Number(score.multiCoreScore) || 0,
        notes: score.notes ? String(score.notes) : undefined,
      })).filter(score => score.cpuName && score.cpuName !== 'Unknown CPU' && (input.cpuName ? score.multiCoreScore >= 0 : score.multiCoreScore > 0) ); // Allow 0 score if specific CPU asked and AI might return that

      return {
        scores: validatedScores,
        dataSourceNotes: output.dataSourceNotes || (input.cpuName ? "Data compiled from various sources. Accuracy may vary." : "Please consult tech review websites for general CPU performance lists.")
      };

    } catch (error) {
      console.error("Error during getCinebenchScoresFlow execution:", error, "Input was:", input);
      let defaultNote = "An error occurred while fetching Cinebench scores from the AI. Please try again later.";
      if (!input.cpuName) {
        defaultNote += " For general CPU lists, consider checking reputable tech review websites."
      } else {
        defaultNote += ` If searching for '${input.cpuName}', ensure the name is correct.`
      }
      return {
          scores: [],
          dataSourceNotes: defaultNote
      };
    }
  }
);
