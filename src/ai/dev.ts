
import { config } from 'dotenv';
config();

import '@/ai/flows/calculate-bottleneck.ts';
import '@/ai/flows/get-component-details.ts';
import '@/ai/flows/generate-pc-build-suggestions.ts';
import '@/ai/flows/check-compatibility.ts';
import '@/ai/flows/get-cinebench-scores.ts';
import '@/ai/flows/get-3dmark-scores.ts';
