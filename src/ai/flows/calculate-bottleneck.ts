
'use server';

/**
 * @fileOverview Calculates the bottleneck percentage between CPU and GPU,
 * providing detailed analysis and recommendations.
 *
 * - calculateBottleneck - A function that calculates the bottleneck percentage and provides analysis.
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
      'The bottleneck percentage. Positive means GPU is bottlenecked by CPU, negative means CPU is bottlenecked by GPU. Near zero is balanced.'
    ),
  explanation: z.string().describe('A brief explanation of the bottleneck and its general impact.'),
  bottleneckComponent: z.enum(['CPU', 'GPU', 'Balanced', 'Unknown']).optional().describe('Identifies the primary bottleneck component or if the system is balanced.'),
  recommendedResolution: z.string().optional().describe('The optimal gaming resolution for this CPU/GPU pairing (e.g., 1080p, 1440p, 4K).'),
  potentialUpgradeSuggestions: z.array(z.string()).optional().describe('Specific component upgrade suggestions to alleviate the bottleneck (e.g., "Upgrade CPU to Intel Core i5-13600K", "Consider GPU NVIDIA RTX 4070"). Provide 1-2 suggestions if applicable.'),
  impactOnGaming: z.string().optional().describe('How this bottleneck might specifically affect gaming performance (e.g., "May experience stuttering in CPU-intensive games at 1080p", "GPU will not be fully utilized at 1440p leading to lower than potential FPS").'),
  impactOnWorkloads: z.string().optional().describe('How this bottleneck might affect non-gaming workloads like video editing, 3D rendering, etc. (e.g., "CPU might be a limiting factor in video encoding times", "GPU rendering tasks will be efficient").'),
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
  CPU: {{{cpu}}}
  GPU: {{{gpu}}}

  Analyze these components and provide a detailed bottleneck analysis.

  1.  Calculate 'bottleneckPercentage':
      *   Estimate the percentage. A positive value (e.g., 15%) means the GPU is bottlenecked by the CPU (CPU is too weak for GPU).
      *   A negative value (e.g., -10%) means the CPU is bottlenecked by the GPU (GPU is too weak for CPU).
      *   A value close to zero (e.g., -5% to 5%) indicates a relatively balanced system.

  2.  Provide an 'explanation': A concise summary of the bottleneck situation and its general performance impact.

  3.  Determine 'bottleneckComponent': State explicitly whether the 'CPU' or 'GPU' is the primary bottleneck, or if it's 'Balanced'. If unsure, use 'Unknown'.

  4.  Suggest 'recommendedResolution': Based on the pairing, what is the ideal gaming display resolution (e.g., 1080p, 1440p, 4K) where this combination would perform best?

  5.  Offer 'potentialUpgradeSuggestions': If a significant bottleneck exists, provide 1 or 2 specific, actionable upgrade suggestions for the limiting component. For example, "Upgrade CPU to Intel Core i5-13600K" or "Consider GPU like NVIDIA RTX 4070". If balanced, this can be omitted or state that upgrades might target other areas.

  6.  Describe 'impactOnGaming': Explain how this specific bottleneck (or balance) would likely affect gaming performance. Be specific about potential issues like stuttering, frame drops, or underutilization of a component.

  7.  Describe 'impactOnWorkloads': Explain how this bottleneck (or balance) might affect common non-gaming workloads such as video editing, 3D rendering, streaming, software development, etc.

  Respond with a JSON object adhering to the defined output schema.
  Ensure all fields are populated according to the analysis.
  For example:
  {
    "bottleneckPercentage": 15.5,
    "explanation": "The CPU is noticeably weaker than the GPU, which will limit the GPU's performance in many scenarios, especially at lower resolutions.",
    "bottleneckComponent": "CPU",
    "recommendedResolution": "1440p or 4K to better utilize the GPU",
    "potentialUpgradeSuggestions": ["Upgrade CPU to an AMD Ryzen 7 7800X3D for better gaming performance.", "Ensure RAM is at least 32GB DDR5 6000MHz CL30."],
    "impactOnGaming": "In CPU-intensive games or at 1080p, you may experience inconsistent frame rates and stuttering as the CPU struggles to keep up with the GPU. The GPU will likely not reach its full potential.",
    "impactOnWorkloads": "CPU-heavy tasks like video encoding, complex simulations, or software compilation will be slower. GPU-accelerated tasks will perform well, but overall system responsiveness in mixed workloads might be affected by the CPU."
  }
  `,
});

const calculateBottleneckFlow = ai.defineFlow(
  {
    name: 'calculateBottleneckFlow',
    inputSchema: CalculateBottleneckInputSchema,
    outputSchema: CalculateBottleneckOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to return valid bottleneck analysis.");
    }
    // Ensure bottleneckPercentage is a number, even if AI returns it as string in rare cases.
    if (typeof output.bottleneckPercentage === 'string') {
      output.bottleneckPercentage = parseFloat(output.bottleneckPercentage);
    }
    return output;
  }
);

