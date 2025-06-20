
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  feature: FeatureArea;
  content: string | React.ReactNode;
  timestamp: number;
  data?: any;
}

export type FeatureArea = 'builder' | 'components-db' | 'bottleneck-calculator' | 'general' | 'compatibility-checker' | 'cinebench-scores' | '3dmark-scores';

export interface PCComponent {
  name: string;
  type: string;
  price: number;
  estimatedPerformance: string;
  link: string;
}

export interface BuildSuggestion {
  components: PCComponent[];
  estimatedTotalCost: number;
  overallPerformance: string;
  buildExplanation: string;
}

export interface BottleneckInfo {
  bottleneckPercentage: number;
  explanation: string;
  bottleneckComponent?: 'CPU' | 'GPU' | 'Balanced' | 'Unknown';
  recommendedResolution?: string;
  potentialUpgradeSuggestions?: string[];
  impactOnGaming?: string;
  impactOnWorkloads?: string;
}

export interface ComponentSpec {
  spec: string;
  value: string;
}

export interface ComponentTechnicalCategory {
  category: string;
  specs: ComponentSpec[];
}

export interface ShoppingLink {
  store: string; // Expect "Google Search"
  url: string; // Expect a Google Search URL
  price?: string; // Should be omitted for Google Search links
}

export interface RelatedProduct {
  name: string;
  type: 'Laptop' | 'Pre-built PC';
  keySpecs?: string[];
  price?: string;
  shoppingLinks?: ShoppingLink[];
}

export interface ComponentDetails {
  componentNameFromAI?: string;
  overallSummary?: string;
  keyFeatures?: string[];
  technicalCategories?: ComponentTechnicalCategory[];
  shoppingLinks?: ShoppingLink[];
  relatedProducts?: RelatedProduct[];
  imageUrl?: string;
}

export interface BuildGuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details?: string[];
}

export interface CompatibilityInput {
  cpu: string;
  motherboard: string;
  ram: string;
  gpu?: string;
  psu: string;
  pcCase: string;
  storage?: string;
}

export interface CompatibilityIssue {
  componentA: string;
  componentB?: string;
  issueType: string;
  description: string;
  suggestion?: string;
}

export interface CompatibilityReport {
  isGenerallyCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: string[];
  overallAssessment: string;
  checkedComponents: {
    cpu?: string;
    motherboard?: string;
    ram?: string;
    gpu?: string;
    psu?: string;
    pcCase?: string;
    storage?: string;
  }
}

export interface CinebenchScoreEntry {
  cpuName: string;
  r23SingleCoreScore: number;
  r23MultiCoreScore: number;
  r24SingleCoreScore?: number;
  r24MultiCoreScore?: number;
}

export interface CinebenchScoresOutput {
  scores: CinebenchScoreEntry[];
  dataSourceNotes?: string;
}

export interface Gpu3dMarkScoreEntry {
  gpuName: string;
  benchmarkName: string; // e.g., "Time Spy Graphics", "Port Royal"
  score: number;
  notes?: string;
}

export interface Gpu3dMarkScoresOutput {
  scores: Gpu3dMarkScoreEntry[];
  dataSourceNotes?: string;
}

