
'use server';
/**
 * @fileOverview AI-powered PC component compatibility checker.
 *
 * - checkCompatibility - A function that analyzes PC components for compatibility.
 * - CheckCompatibilityInput - The input type for the checkCompatibility function.
 * - CheckCompatibilityOutput - The return type for the checkCompatibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckCompatibilityInputSchema = z.object({
  cpu: z.string().min(3).describe('The CPU model (e.g., Intel Core i5-13600K, AMD Ryzen 7 7800X3D).'),
  motherboard: z.string().min(3).describe('The motherboard model (e.g., MSI B650 TOMAHAWK WIFI, ASUS ROG STRIX Z790-E).'),
  ram: z.string().min(3).describe('RAM details, including capacity, type, and speed (e.g., 32GB DDR5 6000MHz, 16GB DDR4 3200MHz CL16).'),
  gpu: z.string().optional().describe('The GPU model (e.g., NVIDIA GeForce RTX 4070, AMD Radeon RX 6800 XT).'),
  psu: z.string().min(3).describe('The PSU wattage and rating (e.g., 750W Gold, Corsair RM850x 850W).'),
  pcCase: z.string().min(3).describe('The PC case model or form factor (e.g., ATX Mid Tower, Lian Li O11 Dynamic, NZXT H510).'),
  storage: z.string().optional().describe('Storage device(s) (e.g., 1TB NVMe SSD, 2TB SATA HDD, Samsung 980 Pro 2TB).'),
});
export type CheckCompatibilityInput = z.infer<typeof CheckCompatibilityInputSchema>;

const CompatibilityIssueSchema = z.object({
  componentA: z.string().describe("The first component involved in the issue."),
  componentB: z.string().optional().describe("The second component involved, if applicable."),
  issueType: z.string().describe("A short category for the issue (e.g., CPU-Motherboard Socket, RAM-Motherboard Type, Form Factor, PSU Wattage, Physical Clearance)."),
  description: z.string().describe("A detailed explanation of the compatibility issue."),
  suggestion: z.string().optional().describe("A suggestion to resolve the issue, if applicable."),
});

const CheckCompatibilityOutputSchema = z.object({
  isGenerallyCompatible: z.boolean().describe("True if no major compatibility issues are found, false otherwise."),
  issues: z.array(CompatibilityIssueSchema).describe("A list of identified compatibility issues. Empty if no issues found."),
  warnings: z.array(z.string()).describe("A list of warnings or notes, e.g., 'PSU wattage is an estimate and might need adjustment based on specific GPU model and overclocking.'"),
  overallAssessment: z.string().describe("A brief summary of the compatibility check."),
  checkedComponents: z.object({
    cpu: z.string().optional().describe("CPU model as understood by AI."),
    motherboard: z.string().optional().describe("Motherboard model as understood by AI."),
    ram: z.string().optional().describe("RAM details as understood by AI."),
    gpu: z.string().optional().describe("GPU model as understood by AI."),
    psu: z.string().optional().describe("PSU details as understood by AI."),
    pcCase: z.string().optional().describe("PC Case details as understood by AI."),
    storage: z.string().optional().describe("Storage details as understood by AI."),
  }).describe("The components that were considered in the check, as interpreted by the AI.")
});
export type CheckCompatibilityOutput = z.infer<typeof CheckCompatibilityOutputSchema>;


export async function checkCompatibility(input: CheckCompatibilityInput): Promise<CheckCompatibilityOutput> {
  return checkCompatibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkCompatibilityPrompt',
  input: {schema: CheckCompatibilityInputSchema},
  output: {schema: CheckCompatibilityOutputSchema},
  prompt: `You are an expert PC hardware compatibility checker.
  Analyze the following list of PC components for potential compatibility issues:
  - CPU: {{{cpu}}}
  - Motherboard: {{{motherboard}}}
  - RAM: {{{ram}}}
  {{#if gpu}}- GPU: {{{gpu}}}{{/if}}
  - PSU: {{{psu}}}
  - Case: {{{pcCase}}}
  {{#if storage}}- Storage: {{{storage}}}{{/if}}

  Please check for the following types of compatibility issues:
  1.  **CPU-Motherboard Socket:** Ensure the CPU socket type (e.g., LGA1700, AM5) matches the motherboard socket.
  2.  **CPU-Motherboard Chipset:** Verify basic chipset compatibility with the CPU generation (e.g., Z790 with Intel 13th/14th gen, B650 with AMD Ryzen 7000 series).
  3.  **RAM-Motherboard Type:** Confirm RAM type (DDR4/DDR5) is supported by the motherboard.
  4.  **RAM-Motherboard Speed:** Check if the RAM speed is generally supported by the motherboard chipset (note if XMP/EXPO profile might be needed).
  5.  **GPU-Motherboard PCIe Slot:** Confirm the GPU can fit in a standard PCIe x16 slot on the motherboard (most modern combinations are fine).
  6.  **PSU Wattage:** Provide a *basic* estimate if the PSU wattage is severely insufficient or grossly excessive for the CPU and GPU. Mention that this is a rough estimate and depends on the exact models, overclocking, and peripherals. Do not give precise wattage recommendations, but flag clear under-powering.
  7.  **Motherboard-Case Form Factor:** Ensure the motherboard form factor (e.g., ATX, Micro-ATX, ITX) is compatible with the PC case's supported form factors.
  8.  **GPU-Case Physical Clearance (Basic):** If very high-end/large GPU and a very small case (e.g., ITX) are mentioned, raise a general warning about checking physical dimensions for GPU length and cooler height. Do not attempt to find exact dimensions.
  9.  **Storage-Motherboard Interface:** If NVMe SSD is mentioned, confirm the motherboard likely has M.2 slots. If SATA SSD/HDD, confirm SATA ports (almost all motherboards have these).

  For each identified issue:
  - Clearly state the 'componentA' and 'componentB' (if applicable).
  - Provide an 'issueType' (e.g., "CPU-Motherboard Socket Mismatch", "RAM Type Incompatibility").
  - Write a clear 'description' of the problem.
  - Offer a 'suggestion' for resolution if straightforward.

  Output:
  - 'isGenerallyCompatible': Set to 'false' if any critical issues are found, 'true' otherwise.
  - 'issues': An array of all identified compatibility problems. If none, this array should be empty.
  - 'warnings': An array for general advice, like the PSU wattage estimation caveat or the need to check specific component manuals for detailed RAM QVL or cooler clearance.
  - 'overallAssessment': A brief summary of the findings.
  - 'checkedComponents': Echo back the main components as you understood them for verification.

  Example of an issue:
  {
    "componentA": "Intel Core i9-14900K (LGA1700)",
    "componentB": "ASUS ROG Crosshair X670E Hero (AM5)",
    "issueType": "CPU-Motherboard Socket Mismatch",
    "description": "The Intel Core i9-14900K uses the LGA1700 socket, while the ASUS ROG Crosshair X670E Hero motherboard has an AM5 socket. These are not compatible.",
    "suggestion": "Choose a motherboard with an LGA1700 socket for the Intel CPU, or an AMD Ryzen CPU (e.g., 7000 series) for the AM5 motherboard."
  }

  If no major issues are found, the 'issues' array should be empty, and 'isGenerallyCompatible' should be true.
  The 'overallAssessment' should reflect this, e.g., "Components appear to be generally compatible. Always double-check manufacturer specifications and manuals before purchasing."
  Ensure all fields in the output schema are addressed.
  `,
});

const checkCompatibilityFlow = ai.defineFlow(
  {
    name: 'checkCompatibilityFlow',
    inputSchema: CheckCompatibilityInputSchema,
    outputSchema: CheckCompatibilityOutputSchema,
  },
  async input => {
    const {output, usage} = await prompt(input);
    if (!output) {
        console.error("AI failed to return valid output for checkCompatibility. Input was:", input, "Usage data:", usage);
        throw new Error("AI response did not match the expected schema or was empty. Please try different component descriptions or rephrase your query.");
    }
    // Ensure `issues` and `warnings` are always arrays, even if AI messes up
    output.issues = output.issues || [];
    output.warnings = output.warnings || [];
    return output;
  }
);
