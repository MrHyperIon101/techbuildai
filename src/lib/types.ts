
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  feature: FeatureArea;
  content: string | React.ReactNode;
  timestamp: number;
  data?: any;
}

export type FeatureArea = 
  | 'builder' 
  | 'components-db' 
  | 'bottleneck-calculator' 
  | 'general' 
  | 'compatibility-checker' 
  | 'cinebench-scores' 
  | '3dmark-scores'
  | 'furmark-scores'
  | 'pcmark-scores'
  | 'geekbench-scores'
  | 'aida64-scores'
  | 'userbenchmark-scores'
  | 'compare-components'
  | 'gaming-estimator'
  | 'build-guide';

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
  imageUrl: string;
  imageHint: string;
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

export interface FurMarkScoreEntry {
  gpuName: string;
  preset: string; // e.g., "1080p Preset", "1440p (QHD)"
  score: number;
  averageFPS?: number;
  maxTemperatureCelsius?: number;
}

export interface FurMarkScoresOutput {
  scores: FurMarkScoreEntry[];
  dataSourceNotes?: string;
}

export interface PCMarkScoreEntry {
  systemIdentifier: string; // e.g., "Ryzen 5 5600X System", "High-end Gaming PC"
  testVersion: string; // e.g., "PCMark 10"
  overallScore: number;
  essentialsScore?: number;
  productivityScore?: number;
  contentCreationScore?: number;
}

export interface PCMarkScoresOutput {
  scores: PCMarkScoreEntry[];
  dataSourceNotes?: string;
}

export interface GeekbenchScoreEntry {
  componentName: string; // CPU or GPU name
  version: string; // e.g., "Geekbench 6"
  platform: string; // e.g., "Windows", "macOS"
  singleCoreScore?: number;
  multiCoreScore?: number;
  openClScore?: number;
  vulkanScore?: number;
  metalScore?: number;
}

export interface GeekbenchScoresOutput {
  scores: GeekbenchScoreEntry[];
  dataSourceNotes?: string;
}

export interface Aida64ScoreEntry {
  componentName: string;
  testName: string;
  score: number;
  units: string;
  notes?: string;
}

export interface Aida64ScoresOutput {
  scores: Aida64ScoreEntry[];
  dataSourceNotes?: string;
}

export interface UserBenchmarkScoreEntry {
  componentName: string;
  componentType: string; // e.g., "CPU", "GPU", "SSD", "RAM"
  gamingPercentage?: number;
  desktopPercentage?: number;
  workstationPercentage?: number;
  averageBench?: number; // This is a key UserBenchmark metric
  rank?: string; // e.g., "15th / 1300"
  notes?: string;
}

export interface UserBenchmarkScoresOutput {
  scores: UserBenchmarkScoreEntry[];
  dataSourceNotes?: string;
}

export interface CompareComponentsInput {
    componentA: string;
    componentB: string;
    componentType: 'CPU' | 'GPU';
}
  
export interface ComparisonPoint {
    metric: string;
    valueA: string;
    valueB: string;
    verdict: string;
}
  
export interface CompareComponentsOutput {
    winner: 'Component A' | 'Component B' | 'It depends' | 'Inconclusive';
    summary: string;
    comparisonPoints: ComparisonPoint[];
}

export interface EstimateGamingPerformanceInput {
    cpu: string;
    gpu: string;
    gameName: string;
}

export interface PerformanceAtResolution {
    resolution: '1080p' | '1440p' | '4K';
    estimatedFps: string;
    settings: string;
    commentary: string;
}

export interface GamingPerformanceOutput {
    performance: PerformanceAtResolution[];
    overallAssessment: string;
}
