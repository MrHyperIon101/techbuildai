
'use server';
/**
 * @fileOverview Retrieves 3DMark scores for GPUs.
 *
 * - get3dMarkScores - A function to fetch 3DMark scores for a specific GPU or provide a list for top GPUs.
 * - Get3dMarkScoresInput - The input type for the get3dMarkScores function.
 * - Get3dMarkScoresOutput - The return type for the get3dMarkScores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Gpu3dMarkScoresOutput, Gpu3dMarkScoreEntry } from '@/lib/types';

const Get3dMarkScoresInputSchema = z.object({
  gpuName: z.string().optional().describe('The specific GPU model to search for (e.g., "NVIDIA GeForce RTX 4080", "AMD Radeon RX 7900 XTX"). If empty, a list of top/recent GPUs will be provided.'),
});
export type Get3dMarkScoresInput = z.infer<typeof Get3dMarkScoresInputSchema>;

const Gpu3dMarkScoreEntrySchema = z.object({
  gpuName: z.string().describe('The full name of the GPU.'),
  benchmarkName: z.string().describe('The name of the 3DMark benchmark (e.g., "Time Spy Graphics", "Port Royal", "Fire Strike Graphics"). Prioritize Time Spy Graphics and Port Royal scores.'),
  score: z.number().int().describe('The benchmark score. MUST be a number. Can be 0 if not found.'),
  notes: z.string().optional().describe('Brief relevant notes, e.g., "Typical score, may vary", or if scores are not found.'),
});

const Get3dMarkScoresOutputSchema = z.object({
  scores: z.array(Gpu3dMarkScoreEntrySchema).describe('A list of 3DMark score entries. Can be multiple entries if no specific GPU is requested or if multiple benchmarks are reported for one GPU.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance.'),
});

export async function get3dMarkScores(input: Get3dMarkScoresInput): Promise<Gpu3dMarkScoresOutput> {
  return get3dMarkScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'get3dMarkScoresPrompt',
  input: {schema: Get3dMarkScoresInputSchema},
  output: {schema: Get3dMarkScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide 3DMark scores for GPUs.
**Your primary reference for score data should be information similar to what is found on reputable tech review sites (e.g., TechSpot, Tom's Hardware, Guru3D, UL Benchmarks own database if accessible via your knowledge).**
Focus on 3DMark Time Spy Graphics scores as a primary reference. Also include Port Royal scores if available for ray tracing performance. You can also include Fire Strike Graphics scores if prominent.
The 'score' field MUST be a NUMBER (integer), not a string, when scores are provided. It can be 0 if not found.

{{#if gpuName}}
For the GPU: {{{gpuName}}}
- Provide its 3DMark Time Spy Graphics score (as a number).
- Provide its 3DMark Port Royal score (as a number), if applicable and data is available.
- You may provide other relevant 3DMark scores like Fire Strike Graphics if they are commonly cited for this GPU.
- For each score, specify the 'benchmarkName'.
- Add any brief, relevant notes for each entry.
If the exact GPU is not found, or scores are not available for it based on your primary references, state that clearly in the 'notes' field for that GPU's entry and set scores to 0. If the GPU itself cannot be identified or no information can be provided at all, then return an empty 'scores' array and explain in 'dataSourceNotes'.
The output should be a JSON object with a 'scores' array containing entries for this GPU (or an empty array if not found), and a 'dataSourceNotes' string.
Example for a specific GPU found:
{
  "scores": [
    {
      "gpuName": "NVIDIA GeForce RTX 4080",
      "benchmarkName": "Time Spy Graphics",
      "score": 28000,
      "notes": "Typical Time Spy Graphics score."
    },
    {
      "gpuName": "NVIDIA GeForce RTX 4080",
      "benchmarkName": "Port Royal",
      "score": 17500,
      "notes": "Typical Port Royal ray tracing score."
    }
  ],
  "dataSourceNotes": "3DMark scores can vary based on test conditions and system configuration. Data interpreted by AI based on common tech review sources."
}
Example for specific GPU NOT found:
{
  "scores": [
    {
      "gpuName": "{{{gpuName}}}",
      "benchmarkName": "N/A",
      "score": 0,
      "notes": "3DMark scores not found for this GPU based on available data."
    }
  ],
  "dataSourceNotes": "Data interpreted by AI based on common tech review sources."
}
{{else}}
You are asked for a general list of top/recent GPUs.
Provide a list of approximately 5-7 recent and popular GPUs along with their 3DMark Time Spy Graphics scores and Port Royal scores (if applicable), based on your knowledge from sources like major tech review sites. Ensure all score fields are numbers (integers).
The output should be a JSON object with a 'scores' array, where each entry conforms to the Gpu3dMarkScoreEntrySchema.
Example for general list:
{
  "scores": [
    {
      "gpuName": "NVIDIA GeForce RTX 4090",
      "benchmarkName": "Time Spy Graphics",
      "score": 36000,
      "notes": "Top-tier performance GPU."
    },
    {
      "gpuName": "NVIDIA GeForce RTX 4090",
      "benchmarkName": "Port Royal",
      "score": 25000,
      "notes": "Excellent ray tracing."
    },
    {
      "gpuName": "AMD Radeon RX 7900 XTX",
      "benchmarkName": "Time Spy Graphics",
      "score": 29000,
      "notes": "High-end AMD GPU."
    }
  ],
  "dataSourceNotes": "3DMark scores are indicative. This is a sample list, with data interpreted by AI based on common tech review sources. For precise, real-time data, consult reference websites directly."
}
IMPORTANT: If you cannot reliably generate this list of GPUs and their scores as requested, you MUST still return a valid JSON object according to the schema, with an empty 'scores' array and provide an explanation or alternative guidance in the 'dataSourceNotes' field. Do not return an error or malformed JSON.
{{/if}}

For all requests:
- Ensure the 'score' field is an integer. Scores can be 0 if data is not found.
- Do not invent scores.
`,
});

const get3dMarkScoresFlow = ai.defineFlow(
  {
    name: 'get3dMarkScoresFlow',
    inputSchema: Get3dMarkScoresInputSchema,
    outputSchema: Get3dMarkScoresOutputSchema,
  },
  async (input: Get3dMarkScoresInput): Promise<Gpu3dMarkScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
          console.warn("AI output for 3DMark scores was null or undefined (likely due to Zod schema validation failure). Input:", input, "Usage:", usage);
          const note = input.gpuName
            ? `AI was unable to retrieve or correctly format 3DMark scores for "${input.gpuName}". Please ensure the name is correct or try a general search. Data interpretation is based on common tech review sources.`
            : "AI was unable to generate or correctly format a list of top GPU 3DMark scores at this time. Please try again later or search for a specific GPU. Data interpretation is based on common tech review sources.";
          return {
              scores: [],
              dataSourceNotes: note
          };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      let validatedScores: Gpu3dMarkScoreEntry[];

      validatedScores = rawScoresArray.map(score => {
          const numericScore = Number(score.score);
          return {
              gpuName: String(score.gpuName || 'Unknown GPU'),
              benchmarkName: String(score.benchmarkName || 'N/A'),
              score: isNaN(numericScore) ? 0 : numericScore,
              notes: score.notes ? String(score.notes) : undefined,
          };
      }).filter(entry => {
        if (input.gpuName && entry.gpuName.toLowerCase().includes(input.gpuName.toLowerCase())) {
            return true;
        }
        if (!input.gpuName) {
            return entry.gpuName && entry.gpuName !== 'Unknown GPU' && entry.benchmarkName !== 'N/A' && (entry.score > 0 || (entry.notes && entry.notes.length > 5));
        }
        return false;
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;

      if (input.gpuName) { 
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = `No specific 3DMark score data could be validated for "${input.gpuName}". The AI may not have found this GPU, or data was not in the expected format. Data is interpreted by AI based on common tech review sources.`;
        } else if (validatedScores.length > 0 && validatedScores.every(s => s.score === 0) && !validatedScores.some(s => s.notes)) {
           validatedScores[0].notes = `No specific 3DMark scores found for "${input.gpuName}" by the AI. Please verify the GPU name. Scores might be listed as 0 if not found.`;
           if (!finalDataSourceNotes) finalDataSourceNotes = "Data interpreted by AI based on common tech review sources.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
           finalDataSourceNotes = "3DMark scores can vary. Data interpreted by AI based on common tech review sources.";
        }
      } else { 
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "AI could not generate a list of top GPU 3DMark scores, or the data format was unusable. Data interpretation is based on common tech review sources.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "3DMark scores are indicative. This is a sample list, with data interpreted by AI based on common tech review sources.";
        }
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI based on common tech review sources. Scores and availability may vary."
      };

    } catch (error) {
      console.error("Unexpected error during get3dMarkScoresFlow execution:", error, "Input was:", input);
      let defaultNote = "An unexpected error occurred while fetching 3DMark scores from the AI. Please try again later.";
      if (input.gpuName) {
        defaultNote += ` If searching for '${input.gpuName}', ensure the name is correct. Data interpretation is based on common tech review sources.`
      } else {
         defaultNote = "An unexpected error occurred while trying to generate a list of top GPU 3DMark scores from the AI. Please try again later or search for a specific GPU. Data interpretation is based on common tech review sources."
      }
      return {
          scores: [],
          dataSourceNotes: defaultNote
      };
    }
  }
);
