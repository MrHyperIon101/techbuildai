
'use server';
/**
 * @fileOverview AI-powered PC component comparator.
 *
 * - compareComponents - A function that compares two components (CPU or GPU).
 * - CompareComponentsInput - The input type for the compareComponents function.
 * - CompareComponentsOutput - The return type for the compareComponents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CompareComponentsInputSchema = z.object({
  componentA: z.string().min(3).describe('The first component model to compare.'),
  componentB: z.string().min(3).describe('The second component model to compare.'),
  componentType: z.enum(['CPU', 'GPU']).describe('The type of components being compared.'),
});
export type CompareComponentsInput = z.infer<typeof CompareComponentsInputSchema>;

const ComparisonPointSchema = z.object({
    metric: z.string().describe("The metric being compared (e.g., 'Clock Speed', 'Cores/Threads', 'TDP', 'Gaming Performance (1440p)', 'Multi-Core Score')."),
    valueA: z.string().describe("The value of the metric for component A."),
    valueB: z.string().describe("The value of the metric for component B."),
    verdict: z.string().describe("A brief verdict on this specific metric (e.g., 'Component A is faster', 'Component B has more cores', 'Roughly equivalent')."),
});

export const CompareComponentsOutputSchema = z.object({
  winner: z.enum(['Component A', 'Component B', 'It depends', 'Inconclusive']).describe("The overall winner of the comparison. Use 'It depends' if the winner varies by use case. Use 'Inconclusive' if a definitive comparison cannot be made."),
  summary: z.string().describe("A detailed summary explaining the comparison, the nuances, and the rationale for the 'winner' choice. Should mention key strengths and weaknesses of each component and for what use cases one might be better than the other."),
  comparisonPoints: z.array(ComparisonPointSchema).describe("A list of structured, point-by-point comparisons of key metrics."),
});
export type CompareComponentsOutput = z.infer<typeof CompareComponentsOutputSchema>;


export async function compareComponents(input: CompareComponentsInput): Promise<CompareComponentsOutput> {
  return compareComponentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareComponentsPrompt',
  input: {schema: CompareComponentsInputSchema},
  output: {schema: CompareComponentsOutputSchema},
  prompt: `You are an expert PC hardware analyst. Compare the two following components in detail.

- Component A: {{{componentA}}}
- Component B: {{{componentB}}}
- Component Type: {{{componentType}}}

Based on your knowledge from benchmarks (like Cinebench, 3DMark, Geekbench, and real-world gaming tests), specifications, and market positioning, provide a detailed comparison.

1.  **Comparison Points**: Create a structured list of key comparison points. For each point:
    -   Identify the 'metric' (e.g., for CPUs: 'Cores/Threads', 'Clock Speed (Boost)', 'Cinebench R23 Multi-Core', 'Power Consumption (TDP)'; for GPUs: 'VRAM', 'Memory Bandwidth', '3DMark Time Spy Score', 'Gaming Performance at 1440p (Avg FPS)', 'Ray Tracing Performance').
    -   Provide the objective 'valueA' and 'valueB' for each component.
    -   Write a short, clear 'verdict' for that metric.

2.  **Summary**: Write a comprehensive summary of the comparison. Explain which component is better for different scenarios (e.g., gaming, productivity, budget builds). Discuss value for money if relevant. This should justify your overall 'winner' choice.

3.  **Winner**: Declare an overall winner.
    -   'Component A' or 'Component B' if one is clearly superior overall or for the most common use cases of this component type.
    -   'It depends' if the choice is highly dependent on the user's specific needs (e.g., one is better for gaming, the other for productivity, and they are similarly priced).
    -   'Inconclusive' if the components are too similar, data is lacking, or one of the component names is unrecognized.

If you cannot identify one or both of the components, set 'winner' to 'Inconclusive', leave the 'comparisonPoints' array empty, and explain the issue in the 'summary'.

Ensure the entire response is a single JSON object conforming to the output schema.
`,
});

const compareComponentsFlow = ai.defineFlow(
  {
    name: 'compareComponentsFlow',
    inputSchema: CompareComponentsInputSchema,
    outputSchema: CompareComponentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to return a valid comparison.");
    }
    return output;
  }
);
