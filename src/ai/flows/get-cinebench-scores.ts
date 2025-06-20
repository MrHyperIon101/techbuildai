
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
  singleCoreScore: z.number().int().describe('The single-core score. MUST be a number. Can be 0 if not found.'),
  multiCoreScore: z.number().int().describe('The multi-core score. MUST be a number. Can be 0 if not found.'),
  notes: z.string().optional().describe('Brief relevant notes, e.g., "Typical score, may vary", or source if a single primary one was used, or if scores are not found.'),
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
**Your primary reference for score data should be information similar to what is found on https://nanoreview.net/en/cpu-list/cinebench-scores.**
Focus on Cinebench R23 scores as a primary reference. If R23 is unavailable for a specific CPU according to your knowledge based on sources like nanoreview.net, you may provide scores from another recent Cinebench version (e.g., Cinebench 2024) and clearly state the version.
The singleCoreScore and multiCoreScore fields MUST be NUMBERS (integers), not strings, when scores are provided. They can be 0 if not found.

{{#if cpuName}}
For the CPU: {{{cpuName}}}
- Provide its Cinebench R23 single-core score (as a number).
- Provide its Cinebench R23 multi-core score (as a number).
- Specify the Cinebench version if not R23.
- Add any brief, relevant notes.
If the exact CPU is not found, or R23 scores are not available for it based on your primary reference, state that clearly in the 'notes' field for that CPU's entry and set scores to 0. If the CPU itself cannot be identified or no information can be provided at all, then return an empty 'scores' array and explain in 'dataSourceNotes'.
The output should be a JSON object with a 'scores' array containing a single entry for this CPU (or an empty array if not found), and a 'dataSourceNotes' string.
Example for a specific CPU found:
{
  "scores": [
    {
      "cpuName": "Intel Core i9-13900K",
      "cinebenchVersion": "R23",
      "singleCoreScore": 2250,
      "multiCoreScore": 38000,
      "notes": "Typical R23 score."
    }
  ],
  "dataSourceNotes": "Cinebench scores can vary based on test conditions. Data interpreted by AI based on sources like nanoreview.net."
}
Example for specific CPU NOT found:
{
  "scores": [
    {
      "cpuName": "{{{cpuName}}}",
      "cinebenchVersion": "N/A",
      "singleCoreScore": 0,
      "multiCoreScore": 0,
      "notes": "Cinebench R23 scores not found for this CPU based on available data."
    }
  ],
  "dataSourceNotes": "Data interpreted by AI based on sources like nanoreview.net."
}
{{else}}
You are asked for a general list of top/recent CPUs.
Provide a list of approximately 5-7 recent and popular CPUs along with their Cinebench R23 single-core and multi-core scores, based on your knowledge from sources like nanoreview.net. Ensure all score fields are numbers (integers).
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
    }
  ],
  "dataSourceNotes": "Cinebench scores are indicative. This is a sample list, with data interpreted by AI based on sources like nanoreview.net. For precise, real-time data, consult the reference website directly."
}
IMPORTANT: If you cannot reliably generate this list of CPUs and their scores as requested, you MUST still return a valid JSON object according to the schema, with an empty 'scores' array and provide an explanation or alternative guidance in the 'dataSourceNotes' field. Do not return an error or malformed JSON.
{{/if}}

For all requests:
- Ensure all score fields (singleCoreScore, multiCoreScore) are integers. Scores can be 0 if data is not found.
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
          console.warn("AI output for Cinebench scores was null or undefined (likely due to Zod schema validation failure). Input:", input, "Usage:", usage);
          const note = input.cpuName
            ? `AI was unable to retrieve or correctly format Cinebench scores for "${input.cpuName}". Please ensure the name is correct or try a general search. Data interpretation is based on sources like nanoreview.net.`
            : "AI was unable to generate or correctly format a list of top CPU scores at this time. Please try again later or search for a specific CPU. Data interpretation is based on sources like nanoreview.net.";
          return {
              scores: [],
              dataSourceNotes: note
          };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      let validatedScores: CinebenchScoreEntry[];

      validatedScores = rawScoresArray.map(score => {
          const singleCore = Number(score.singleCoreScore);
          const multiCore = Number(score.multiCoreScore);
          return {
              cpuName: String(score.cpuName || 'Unknown CPU'),
              cinebenchVersion: String(score.cinebenchVersion || 'N/A'),
              singleCoreScore: isNaN(singleCore) ? 0 : singleCore, // Allow 0
              multiCoreScore: isNaN(multiCore) ? 0 : multiCore,   // Allow 0
              notes: score.notes ? String(score.notes) : undefined,
          };
      }).filter(score => {
        // Keep entry if specific CPU was searched, even if scores are 0 but has notes
        if (input.cpuName && score.cpuName.toLowerCase().includes(input.cpuName.toLowerCase())) {
            return true;
        }
        // For general list, only keep if it has a valid name and some score data or meaningful notes
        if (!input.cpuName) {
            return score.cpuName && score.cpuName !== 'Unknown CPU' && (score.multiCoreScore > 0 || score.singleCoreScore > 0 || (score.notes && score.notes.length > 5));
        }
        return false; // Default to filter out if it doesn't match above specific cases
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;

      if (input.cpuName) { 
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = `No specific Cinebench score data could be validated for "${input.cpuName}". The AI may not have found this CPU, or data was not in the expected format. Data is interpreted by AI based on sources like nanoreview.net.`;
        } else if (validatedScores.length > 0 && validatedScores[0].multiCoreScore === 0 && validatedScores[0].singleCoreScore === 0 && !validatedScores[0].notes) {
           validatedScores[0].notes = `No specific Cinebench R23 scores found for "${input.cpuName}" by the AI. Please verify the CPU name. Scores might be listed as 0 if not found.`;
           if (!finalDataSourceNotes) finalDataSourceNotes = "Data interpreted by AI based on sources like nanoreview.net.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
           finalDataSourceNotes = "Cinebench scores can vary. Data interpreted by AI based on sources like nanoreview.net.";
        }
      } else { 
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "AI could not generate a list of top CPU scores, or the data format was unusable. Data interpretation is based on sources like nanoreview.net.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "Cinebench scores are indicative. This is a sample list, with data interpreted by AI based on sources like nanoreview.net.";
        }
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI based on sources like nanoreview.net. Scores and availability may vary."
      };

    } catch (error) {
      console.error("Unexpected error during getCinebenchScoresFlow execution:", error, "Input was:", input);
      let defaultNote = "An unexpected error occurred while fetching Cinebench scores from the AI. Please try again later.";
      if (input.cpuName) {
        defaultNote += ` If searching for '${input.cpuName}', ensure the name is correct. Data interpretation is based on sources like nanoreview.net.`
      } else {
         defaultNote = "An unexpected error occurred while trying to generate a list of top CPU scores from the AI. Please try again later or search for a specific CPU. Data interpretation is based on sources like nanoreview.net."
      }
      return {
          scores: [],
          dataSourceNotes: defaultNote
      };
    }
  }
);

