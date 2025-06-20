
'use server';
/**
 * @fileOverview Retrieves AIDA64 benchmark scores for CPUs and Memory.
 *
 * - getAida64Scores - A function to fetch AIDA64 scores.
 * - GetAida64ScoresInput - The input type for the getAida64Scores function.
 * - GetAida64ScoresOutput - The return type for the getAida64Scores function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Aida64ScoresOutput, Aida64ScoreEntry } from '@/lib/types';

const GetAida64ScoresInputSchema = z.object({
  componentQuery: z.string().optional().describe('The specific CPU model, memory kit, or test type to search for (e.g., "AMD Ryzen 7 7800X3D Memory Latency", "Intel Core i9-13900K CPU Queen", "DDR5 6000MHz CL30 Read"). If empty, a list of example scores for various components/tests will be provided.'),
});
export type GetAida64ScoresInput = z.infer<typeof GetAida64ScoresInputSchema>;

const Aida64ScoreEntrySchema = z.object({
  componentName: z.string().describe('The full name of the CPU or a description of the memory/system configuration tested.'),
  testName: z.string().describe('The specific AIDA64 test name (e.g., "Memory Read", "CPU Queen", "FPU Julia", "Memory Latency").'),
  score: z.number().describe('The benchmark score. MUST be a number. Can be 0 if not found.'),
  units: z.string().describe('The units for the score (e.g., "MB/s", "ns", "points", "GFLOPS"). This is crucial for AIDA64.'),
  notes: z.string().optional().describe('Brief relevant notes, e.g., "Typical score", "Lower is better for latency", or if scores are not found.'),
});

const GetAida64ScoresOutputSchema = z.object({
  scores: z.array(Aida64ScoreEntrySchema).describe('A list of AIDA64 score entries.'),
  dataSourceNotes: z.string().optional().describe('General notes about the data source or guidance, e.g., "AIDA64 scores are highly dependent on system configuration and specific test versions."'),
});

export async function getAida64Scores(input: GetAida64ScoresInput): Promise<Aida64ScoresOutput> {
  return getAida64ScoresFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAida64ScoresPrompt',
  input: {schema: GetAida64ScoresInputSchema},
  output: {schema: GetAida64ScoresOutputSchema},
  prompt: `You are a PC hardware data specialist. Your task is to provide AIDA64 benchmark scores.
Focus on common CPU and Memory benchmarks. The 'score' field MUST be a NUMBER. The 'units' field is CRITICAL and must be provided accurately.

Common AIDA64 Benchmarks to consider:
- Memory: Read, Write, Copy (MB/s); Latency (ns)
- CPU Integer: CPU Queen (points), CPU PhotoWorxx (MPixels/s), CPU ZLib (MB/s), CPU AES (MB/s)
- CPU Floating Point: FPU Julia (single-precision GFLOPS), FPU Mandel (double-precision GFLOPS), FPU SinJulia (extended-precision GFLOPS)
- You may also include GPGPU benchmarks if a specific GPU is clearly part of the query and relevant GPGPU tests are known.

{{#if componentQuery}}
For the component/query: "{{{componentQuery}}}"
- Identify the component(s) and specific AIDA64 test(s) implied by the query.
- Provide the 'componentName' (e.g., "Intel Core i9-13900K", "32GB DDR5 6000MHz CL30 System Average").
- Provide the 'testName' (e.g., "Memory Read", "CPU Queen").
- Provide the 'score' (numeric).
- Provide the 'units' (e.g., "MB/s", "ns", "points").
- Provide brief 'notes' if relevant (e.g., "Lower is better for latency").
If the exact query cannot be matched to a specific test or component, or scores are not available based on your knowledge from common tech review sites and AIDA64 result databases, provide an entry with 'score: 0' and explain in 'notes' for that entry. If the query itself is uninterpretable for AIDA64, return an empty 'scores' array and explain in 'dataSourceNotes'.

Example for a specific query ("Ryzen 7800X3D Memory Latency"):
{
  "scores": [
    {
      "componentName": "AMD Ryzen 7 7800X3D (typical DDR5 6000MHz CL30 setup)",
      "testName": "Memory Latency",
      "score": 65.2,
      "units": "ns",
      "notes": "Typical score for this CPU with optimized DDR5. Lower is better."
    }
  ],
  "dataSourceNotes": "AIDA64 scores can vary widely based on system configuration (RAM speed, timings, motherboard) and test version. Data interpreted by AI."
}
{{else}}
Provide a list of AIDA64 scores for approximately 3-5 diverse examples, covering different components and test types (e.g., a high-end CPU's CPU Queen score, a common RAM kit's Memory Read speed, another CPU's FPU Julia).
For each entry, provide: 'componentName', 'testName', 'score' (numeric), 'units', and optional 'notes'.

Example for general list:
{
  "scores": [
    {
      "componentName": "Intel Core i9-14900K",
      "testName": "CPU Queen",
      "score": 185000,
      "units": "points",
      "notes": "High score indicates strong integer performance."
    },
    {
      "componentName": "Typical 32GB DDR5 6000MHz CL30 Kit",
      "testName": "Memory Read",
      "score": 92000,
      "units": "MB/s"
    },
    {
      "componentName": "AMD Ryzen 5 7600X",
      "testName": "FPU Julia",
      "score": 120,
      "units": "GFLOPS",
      "notes": "Good floating-point performance for the class."
    }
  ],
  "dataSourceNotes": "AIDA64 scores are indicative and depend heavily on the full system configuration. This is a sample list. Data interpreted by AI."
}
IMPORTANT: If you cannot reliably generate this list, return a valid JSON object according to the schema, with an empty 'scores' array and provide an explanation in 'dataSourceNotes'. Do not return an error or malformed JSON.
{{/if}}
Ensure all score fields are numbers. Do not invent scores. Ensure units are provided for every score.
`,
});

const getAida64ScoresFlow = ai.defineFlow(
  {
    name: 'getAida64ScoresFlow',
    inputSchema: GetAida64ScoresInputSchema,
    outputSchema: GetAida64ScoresOutputSchema,
  },
  async (input: GetAida64ScoresInput): Promise<Aida64ScoresOutput> => {
    try {
      const {output, usage} = await prompt(input);

      if (!output) {
        const note = input.componentQuery
          ? `AI was unable to retrieve or correctly format AIDA64 scores for your query "${input.componentQuery}". This might be due to schema validation failure or an uninterpretable query by the AI.`
          : "AI was unable to generate or correctly format a list of AIDA64 scores at this time. This might be due to schema validation failure.";
        return { 
            scores: [], 
            dataSourceNotes: `${note} Please ensure your query is clear (e.g., 'CPU Name Test Name' or 'RAM Type Test Name') or try a general search. Data interpretation by AI.` 
        };
      }
      
      const rawScoresArray = (output.scores && Array.isArray(output.scores)) ? output.scores : [];
      const validatedScores: Aida64ScoreEntry[] = rawScoresArray.map(score => ({
        componentName: String(score.componentName || 'Unknown Component/System'),
        testName: String(score.testName || 'Unknown Test'),
        score: Number.isFinite(Number(score.score)) ? Number(score.score) : 0,
        units: String(score.units || 'N/A'),
        notes: score.notes ? String(score.notes) : undefined,
      })).filter(entry => {
        if (input.componentQuery && entry.componentName !== 'Unknown Component/System' && entry.testName !== 'Unknown Test') {
            // For specific query, include even if score is 0 but other details are present
            return true; 
        }
        if (!input.componentQuery) { // For general list, ensure some meaningful data exists
            return entry.componentName !== 'Unknown Component/System' && entry.testName !== 'Unknown Test' && entry.units !== 'N/A' && (entry.score !== 0 || (entry.notes && entry.notes.length > 0));
        }
        return false;
      });
      
      let finalDataSourceNotes = output.dataSourceNotes;

      if (input.componentQuery) {
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = `No specific AIDA64 score data could be validated or found for your query "${input.componentQuery}". The AI may not recognize this component/test combination or have data for it.`;
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
           finalDataSourceNotes = "AIDA64 scores can vary significantly based on the exact system configuration, software versions, and test parameters. Data interpreted by AI.";
        }
      } else { // General list request
        if (validatedScores.length === 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "AI could not generate a list of AIDA64 scores, or the data format was unusable. Data interpretation by AI.";
        } else if (validatedScores.length > 0 && !finalDataSourceNotes) {
          finalDataSourceNotes = "AIDA64 scores are indicative. This is a sample list of common benchmarks, with data interpreted by AI. Scores depend heavily on full system configuration.";
        }
      }
      
      return {
        scores: validatedScores,
        dataSourceNotes: finalDataSourceNotes || "Data interpreted by AI. AIDA64 scores are highly system-dependent and can vary."
      };

    } catch (error) {
      console.error("Unexpected error during getAida64ScoresFlow execution:", error, "Input was:", input);
      const note = input.componentQuery ? `for query '${input.componentQuery}'` : "general list";
      return {
          scores: [],
          dataSourceNotes: `An unexpected error occurred while fetching AIDA64 scores ${note} from the AI. Please try again later. Data interpretation by AI.`
      };
    }
  }
);

    