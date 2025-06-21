
'use server';
/**
 * @fileOverview AI-powered PC upgrade advisor.
 *
 * - proposeUpgradePath - A function that analyzes a user's current PC and suggests upgrades based on a goal and budget.
 * - ProposeUpgradePathInput - The input type for the function.
 * - ProposeUpgradePathOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { compatibilityCheckTool } from './check-compatibility';

const CurrentComponentSchema = z.object({
  type: z.enum(['CPU', 'GPU', 'RAM', 'Motherboard', 'PSU', 'Storage', 'Case']),
  name: z.string().min(3),
});

const ProposeUpgradePathInputSchema = z.object({
  currentComponents: z.array(CurrentComponentSchema).min(3, "Please provide at least CPU, Motherboard, and RAM."),
  performanceGoal: z.string().min(10).describe("The user's desired performance goal (e.g., 'Play Cyberpunk 2077 at 1440p high settings', 'Faster video rendering in DaVinci Resolve')."),
  budget: z.number().min(0).describe('The budget for the upgrade in INR.'),
});
export type ProposeUpgradePathInput = z.infer<typeof ProposeUpgradePathInputSchema>;

const SuggestedUpgradeSchema = z.object({
    name: z.string().describe('The name of the component to purchase.'),
    type: z.string().describe("The type of component (e.g., CPU, GPU, RAM)."),
    price: z.number().describe('The estimated price of the component in INR.'),
    reason: z.string().describe("A brief explanation of why this upgrade is recommended."),
    link: z.string().url().describe('A link to buy the component from amazon.in or flipkart.com'),
});

const ProposeUpgradePathOutputSchema = z.object({
  analysis: z.string().describe("A detailed analysis of the user's current build in relation to their performance goal, clearly identifying the primary bottleneck(s)."),
  upgrades: z.array(SuggestedUpgradeSchema).describe("A list of suggested components to purchase for the upgrade. This list should be ordered by priority."),
  totalUpgradeCost: z.number().describe("The estimated total cost of all suggested upgrade components in INR. This MUST NOT exceed the user's budget."),
  performanceEstimateAfter: z.string().describe("A description of the expected performance or improvement the user can expect after performing the suggested upgrades."),
  warnings: z.array(z.string()).optional().describe("A list of important warnings or considerations for the user, such as 'Ensure your PSU has enough wattage for the new GPU' or 'A BIOS update may be required for the new CPU to work with your current motherboard.'"),
});
export type ProposeUpgradePathOutput = z.infer<typeof ProposeUpgradePathOutputSchema>;


export async function proposeUpgradePath(input: ProposeUpgradePathInput): Promise<ProposeUpgradePathOutput> {
  return proposeUpgradePathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proposeUpgradePathPrompt',
  tools: [compatibilityCheckTool],
  input: {schema: ProposeUpgradePathInputSchema},
  output: {schema: ProposeUpgradePathOutputSchema},
  prompt: `You are an expert PC hardware analyst and upgrade advisor. A user has provided their current PC components, a performance goal, and an upgrade budget.

Current Components:
{{#each currentComponents}}
- {{type}}: {{name}}
{{/each}}

Performance Goal: "{{performanceGoal}}"
Upgrade Budget: {{budget}} INR

Your task is to provide a detailed and actionable upgrade path.

1.  **Analyze Current Build:** First, analyze the user's current components. Identify the primary bottleneck that is preventing them from reaching their stated 'performanceGoal'. Explain this clearly in the 'analysis' field. For example, "Your RTX 2060 is the main bottleneck for 1440p gaming in modern titles. While your CPU is adequate, the GPU will struggle to maintain high frame rates at that resolution."

2.  **Identify Upgrade Path:** Based on the bottleneck and the user's budget, determine the most impactful component(s) to upgrade. Prioritize the component that offers the most significant performance gain for the specified goal.

3.  **Select New Components:**
    *   Choose specific, modern components for the upgrade.
    *   The total cost of all suggested upgrades MUST NOT exceed the user's 'budget'. This is a strict rule.
    *   For each suggested component, provide its name, type, estimated price (in INR), a shopping link (amazon.in or flipkart.com), and a brief 'reason' for the recommendation.

4.  **Verify Compatibility:** CRITICAL STEP. Before finalizing your suggestion, you MUST use the \`compatibilityCheckTool\`.
    *   Create a component list that includes the user's existing parts that are being kept (e.g., motherboard, case, PSU) and the NEW parts you are suggesting.
    *   Call the tool with this combined list.
    *   If the tool returns any compatibility issues, you MUST revise your component choice and re-verify. For example, if a new CPU isn't compatible with the old motherboard, you must either suggest a compatible CPU or, if the budget allows, suggest upgrading the motherboard as well.
    *   Your final suggested build *must* be compatible.

5.  **Formulate Output:**
    *   'analysis': Your detailed analysis of the current system's bottlenecks.
    *   'upgrades': The list of components to buy.
    *   'totalUpgradeCost': The sum of the prices of the new components.
    *   'performanceEstimateAfter': A clear description of what the user can expect after the upgrade. For example, "After upgrading to the RTX 4070, you can expect to play most modern games at 1440p on high settings with over 100 FPS."
    *   'warnings': Provide critical advice. If a CPU/motherboard combination might require a BIOS update, you MUST include a warning about it. If a new, powerful GPU is suggested, you MUST add a warning to double-check PSU wattage and connector availability.

Your response must be a single, valid JSON object adhering to the output schema.
`,
});

const proposeUpgradePathFlow = ai.defineFlow(
  {
    name: 'proposeUpgradePathFlow',
    inputSchema: ProposeUpgradePathInputSchema,
    outputSchema: ProposeUpgradePathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to return a valid upgrade path. Please check your input and try again.");
    }
    return output;
  }
);
