
'use server';
/**
 * @fileOverview Retrieves Cinebench R23 and R24 scores for CPUs.
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
  r23SingleCoreScore: z.number().int().describe('The Cinebench R23 single-core score. MUST be a number. Can be 0 if not found.'),
  r23MultiCoreScore: z.number().int().describe('The Cinebench R23 multi-core score. MUST be a number. Can be 0 if not found.'),
  r24SingleCoreScore: z.number().int().optional().describe('The Cinebench 2024 (R24) single-core score. MUST be a number. Can be 0 or omitted if not found/applicable.'),
  r24MultiCoreScore: z.number().int().optional().describe('The Cinebench 2024 (R24) multi-core score. MUST be a number. Can be 0 or omitted if not found/applicable.'),
  notes: z.string().optional().describe('Brief relevant notes, e.g., "Typical scores, may vary". If scores for a version are not found, provide a descriptive note here like "R24 scores not widely reported" or "CPU not found in benchmark lists". Do not just put "N/A" as the note content if an explanation is due.'),
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
You need to provide scores for both Cinebench R23 and Cinebench 2024 (R24) where available.
Specifically, for each CPU, provide:
- r23SingleCoreScore (integer)
- r23MultiCoreScore (integer)
- r24SingleCoreScore (integer, optional, can be 0 or omitted if not found)
- r24MultiCoreScore (integer, optional, can be 0 or omitted if not found)
All score fields MUST be NUMBERS (integers), not strings. They can be 0 if not found. 
Use the 'notes' field for any explanations if scores are missing or to provide context. If scores are unavailable, provide a descriptive note like "R24 data not found" or "CPU not listed in benchmarks". Do not use "N/A" as the sole content of a note if an explanation is intended.

{{#if cpuName}}
For the CPU: {{{cpuName}}}
- Provide its Cinebench R23 single-core score (r23SingleCoreScore).
- Provide its Cinebench R23 multi-core score (r23MultiCoreScore).
- Provide its Cinebench 2024 (R24) single-core score (r24SingleCoreScore), if available. If not, this can be 0 or omitted.
- Provide its Cinebench 2024 (R24) multi-core score (r24MultiCoreScore), if available. If not, this can be 0 or omitted.
- Add any brief, relevant 'notes'.
If the exact CPU is not found, or scores are not available for it based on your primary reference, set scores to 0 and provide a descriptive explanation in the 'notes' field for that CPU's entry. If the CPU itself cannot be identified, return an empty 'scores' array and explain in 'dataSourceNotes'.
Example for a specific CPU found:
{
  "scores": [
    {
      "cpuName": "Intel Core i9-13900K",
      "r23SingleCoreScore": 2250,
      "r23MultiCoreScore": 38000,
      "r24SingleCoreScore": 130,
      "r24MultiCoreScore": 2100,
      "notes": "Typical R23 and R24 scores."
    }
  ],
  "dataSourceNotes": "Cinebench scores can vary. Data interpreted by AI based on sources like nanoreview.net."
}
Example for specific CPU NOT found or scores missing:
{
  "scores": [
    {
      "cpuName": "{{{cpuName}}}",
      "r23SingleCoreScore": 0,
      "r23MultiCoreScore": 0,
      "notes": "Cinebench R23/R24 scores not found for this CPU based on available data from reference sources."
    }
  ],
  "dataSourceNotes": "Data interpreted by AI based on sources like nanoreview.net."
}
{{else}}
You are asked for a general list of top/recent CPUs.
Provide a list of approximately 5-7 recent and popular CPUs. For each CPU, include:
- cpuName
- r23SingleCoreScore
- r23MultiCoreScore
- r24SingleCoreScore (if available, otherwise 0 or omit)
- r24MultiCoreScore (if available, otherwise 0 or omit)
- notes (provide context if scores for a version are missing, e.g., "R24 scores pending widespread reporting")
Ensure all score fields are numbers (integers).
Example for general list:
{
  "scores": [
    {
      "cpuName": "AMD Ryzen 9 7950X",
      "r23SingleCoreScore": 2050,
      "r23MultiCoreScore": 38500,
      "r24SingleCoreScore": 120,
      "r24MultiCoreScore": 2050,
      "notes": "High-end performance CPU."
    },
    {
      "cpuName": "Intel Core i9-14900K",
      "r23SingleCoreScore": 2300,
      "r23MultiCoreScore": 39000,
      "r24SingleCoreScore": 135,
      "r24MultiCoreScore": 2200,
      "notes": "Top-tier gaming and productivity CPU."
    },
    {
      "cpuName": "AMD Ryzen 5 7600X",
      "r23SingleCoreScore": 1950,
      "r23MultiCoreScore": 15000,
      "r24SingleCoreScore": 110,
      "r24MultiCoreScore": 900,
      "notes": "Excellent mid-range value."
    }
  ],
  "dataSourceNotes": "Cinebench scores are indicative. This is a sample list, with data interpreted by AI based on sources like nanoreview.net. R24 scores are newer and may be less available."
}
IMPORTANT: If you cannot reliably generate this list of CPUs and their scores as requested, you MUST still return a valid JSON object according to the schema, with an empty 'scores' array and provide an explanation or alternative guidance in the 'dataSourceNotes' field. Do not return an error or malformed JSON.
{{/if}}

For all requests:
- Ensure all score fields are integers. Scores can be 0 if data is not found or not applicable (especially R24).
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
            ? `AI was unable to retrieve or correctly format Cinebench R23/R24 scores for "${input.cpuName}". Please ensure the name is correct or try a general search. Data interpretation is based on sources like nanoreview.net.`
            : "AI was unable to generate or correctly format a list of top CPU scores at this time. Please try again later or search for a specific CPU. Data interpretation is based on sources like nanoreview.net.";
          return {
              scores: [],
              dataSourceNotes: note
          };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      let validatedScores: CinebenchScoreEntry[];

      validatedScores = rawScoresArray.map(score => {
          const r23Single = Number(score.r23SingleCoreScore);
          const r23Multi = Number(score.r23MultiCoreScore);
          const r24Single = score.r24SingleCoreScore !== undefined ? Number(score.r24SingleCoreScore) : undefined;
          const r24Multi = score.r24MultiCoreScore !== undefined ? Number(score.r24MultiCoreScore) : undefined;
          
          return {
              cpuName: String(score.cpuName || 'Unknown CPU'),
              r23SingleCoreScore: isNaN(r23Single) ? 0 : r23Single,
              r23MultiCoreScore: isNaN(r23Multi) ? 0 : r23Multi,
              r24SingleCoreScore: r24Single === undefined || isNaN(r24Single) ? undefined : r24Single,
              r24MultiCoreScore: r24Multi === undefined || isNaN(r24Multi) ? undefined : r24Multi,
              notes: score.notes !== undefined ? String(score.notes) : undefined,
          };
      }).filter(score => {
        if (input.cpuName && score.cpuName.toLowerCase().includes(input.cpuName.toLowerCase())) {
            return true; // For specific search, keep if name matches, even if scores are 0 (notes will explain)
        }
        if (!input.cpuName) { // For general list
            return score.cpuName && score.cpuName !== 'Unknown CPU' && 
                   (score.r23MultiCoreScore > 0 || score.r23SingleCoreScore > 0 || 
                    (score.r24MultiCoreScore && score.r24MultiCoreScore > 0) || 
                    (score.r24SingleCoreScore && score.r24SingleCoreScore > 0) || 
                    (score.notes && score.notes.trim() !== "" && score.notes.trim().toLowerCase() !== "n/a"));
        }
        return false; 
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;

      if (input.cpuName) { 
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = `No specific Cinebench score data could be validated for "${input.cpuName}". The AI may not have found this CPU, or data was not in the expected format. Data is interpreted by AI based on sources like nanoreview.net.`;
        } else if (
          validatedScores.length === 1 &&
          validatedScores[0].cpuName.toLowerCase().includes(input.cpuName.toLowerCase()) &&
          validatedScores[0].r23MultiCoreScore === 0 && 
          validatedScores[0].r23SingleCoreScore === 0 &&
          (validatedScores[0].r24MultiCoreScore === undefined || validatedScores[0].r24MultiCoreScore === 0) &&
          (validatedScores[0].r24SingleCoreScore === undefined || validatedScores[0].r24SingleCoreScore === 0) &&
          (!validatedScores[0].notes || validatedScores[0].notes.trim() === "" || validatedScores[0].notes.trim().toLowerCase() === "n/a")
        ) {
           validatedScores[0].notes = `Cinebench R23/R24 scores not found or are zero for "${input.cpuName}". Please verify the CPU name or consult data source.`;
           if (!finalDataSourceNotes) finalDataSourceNotes = "Data interpreted by AI based on sources like nanoreview.net.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
           finalDataSourceNotes = "Cinebench scores can vary. Data interpreted by AI based on sources like nanoreview.net.";
        }
      } else { // General list
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "AI could not generate a list of top CPU scores, or the data format was unusable. Data interpretation is based on sources like nanoreview.net.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "Cinebench scores are indicative. This is a sample list, with data interpreted by AI based on sources like nanoreview.net. R24 scores are newer and may be less available.";
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

