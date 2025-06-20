'use server';

/**
 * @fileOverview Calculates the bottleneck percentage between CPU and GPU.
 *
 * - calculateBottleneck - A function that calculates the bottleneck percentage.
 * - CalculateBottleneckInput - The input type for the calculateBottleneck function.
 * - CalculateBottleneckOutput - The return type for the calculateBottleneck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateBottleneckInputSchema = z.object({
  cpu: z.string().describe('The CPU model.'),
  gpu: z.string().describe('The GPU model.'),
});
export type CalculateBottleneckInput = z.infer<typeof CalculateBottleneckInputSchema>;

const CalculateBottleneckOutputSchema = z.object({
  bottleneckPercentage: z
    .number()
    .describe(
      'The bottleneck percentage between the CPU and GPU. A higher percentage indicates a more significant bottleneck.'
    ),
  explanation: z.string().describe('A brief explanation of the bottleneck and its potential impact.'),
});
export type CalculateBottleneckOutput = z.infer<typeof CalculateBottleneckOutputSchema>;

export async function calculateBottleneck(input: CalculateBottleneckInput): Promise<CalculateBottleneckOutput> {
  return calculateBottleneckFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateBottleneckPrompt',
  input: {schema: CalculateBottleneckInputSchema},
  output: {schema: CalculateBottleneckOutputSchema},
  prompt: `You are an expert PC hardware analyst. You are given the CPU and GPU of a PC build.
  You will calculate the bottleneck percentage between the CPU and GPU, and provide a brief explanation of the bottleneck and its potential impact on performance.

  CPU: {{{cpu}}}
  GPU: {{{gpu}}}

  Respond with a JSON object:
  {
    "bottleneckPercentage": number,
    "explanation": string
  }`,
});

const calculateBottleneckFlow = ai.defineFlow(
  {
    name: 'calculateBottleneckFlow',
    inputSchema: CalculateBottleneckInputSchema,
    outputSchema: CalculateBottleneckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
