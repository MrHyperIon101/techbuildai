
'use server';
/**
 * @fileOverview AI-powered gaming performance estimator.
 *
 * - estimateGamingPerformance - A function that estimates FPS for a given PC build in a specific game.
 * - EstimateGamingPerformanceInput - The input type for the function.
 * - EstimateGamingPerformanceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateGamingPerformanceInputSchema = z.object({
  cpu: z.string().min(3).describe('The CPU model.'),
  gpu: z.string().min(3).describe('The GPU model.'),
  gameName: z.string().min(2).describe('The name of the game.'),
});
export type EstimateGamingPerformanceInput = z.infer<typeof EstimateGamingPerformanceInputSchema>;

const PerformanceAtResolutionSchema = z.object({
    resolution: z.enum(['1080p', '1440p', '4K']).describe("The gaming resolution."),
    estimatedFps: z.string().describe("The estimated average frames per second, can be a range (e.g., '90-110 FPS')."),
    settings: z.string().describe("The likely in-game graphics settings used for this estimate (e.g., 'High', 'Ultra', 'Medium')."),
    commentary: z.string().describe("Brief commentary on the performance at this resolution, noting any potential bottlenecks or specific considerations (e.g., 'GPU will be fully utilized', 'CPU may limit performance in intense scenes').")
});

const EstimateGamingPerformanceOutputSchema = z.object({
  performance: z.array(PerformanceAtResolutionSchema).describe("An array of performance estimates for 1080p, 1440p, and 4K resolutions."),
  overallAssessment: z.string().describe("A summary of the expected gaming experience with this hardware combination for the specified game."),
});
export type EstimateGamingPerformanceOutput = z.infer<typeof EstimateGamingPerformanceOutputSchema>;


export async function estimateGamingPerformance(input: EstimateGamingPerformanceInput): Promise<GamingPerformanceOutput> {
  return estimateGamingPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateGamingPerformancePrompt',
  input: {schema: EstimateGamingPerformanceInputSchema},
  output: {schema: EstimateGamingPerformanceOutputSchema},
  prompt: `You are an expert PC gaming performance analyst. Given a CPU, GPU, and a game name, you must estimate the gaming performance at 1080p, 1440p, and 4K resolutions.

- CPU: {{{cpu}}}
- GPU: {{{gpu}}}
- Game: {{{gameName}}}

Your analysis should be based on your knowledge of real-world benchmarks, component capabilities, and how different games utilize hardware.

For EACH of the three resolutions (1080p, 1440p, 4K), provide:
1.  'estimatedFps': A realistic average frames-per-second range (e.g., "120-140 FPS").
2.  'settings': The likely graphics settings this estimate is based on (e.g., "High", "Ultra", "Medium with DLSS Quality").
3.  'commentary': A short analysis of performance at this resolution. Mention if it's CPU-bound, GPU-bound, or well-balanced.

Finally, provide an 'overallAssessment' summarizing the expected experience. For example, "This build is excellent for 1440p gaming in this title, providing a smooth, high-refresh-rate experience. 4K is playable, but may require some settings adjustments for a stable 60 FPS."

If the game is not found or is too obscure to provide a reliable estimate, the 'performance' array should be empty, and the 'overallAssessment' should explain that an estimate cannot be provided for this title.

Return the entire response as a single JSON object conforming to the output schema.
`,
});

const estimateGamingPerformanceFlow = ai.defineFlow(
  {
    name: 'estimateGamingPerformanceFlow',
    inputSchema: EstimateGamingPerformanceInputSchema,
    outputSchema: EstimateGamingPerformanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to return a valid performance estimate.");
    }
    return output;
  }
);
