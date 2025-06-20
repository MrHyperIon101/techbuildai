
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  feature: FeatureArea;
  content: string | React.ReactNode;
  timestamp: number;
  data?: any;
}

export type FeatureArea = 'builder' | 'components-db' | 'bottleneck-calculator' | 'general' | 'compatibility-checker';

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
  store: string;
  url: string;
  price?: string;
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

// Types for Compatibility Checker
export interface CompatibilityInput {
  cpu: string;
  motherboard: string;
  ram: string; // e.g., "16GB DDR5 6000MHz"
  gpu?: string;
  psu: string; // e.g., "750W Gold" or "750W"
  pcCase: string; // e.g., "Mid Tower ATX" or "Fractal Design Meshify C"
  storage?: string; // e.g., "1TB NVMe SSD, 2TB HDD"
}

export interface CompatibilityIssue {
  componentA: string;
  componentB?: string;
  issueType: string; // e.g., "Socket Mismatch", "RAM Type", "Form Factor", "PSU Wattage"
  description: string;
  suggestion?: string;
}

export interface CompatibilityReport {
  isGenerallyCompatible: boolean;
  issues: CompatibilityIssue[];
  warnings: string[]; // For things like "PSU wattage is an estimate, ensure it's sufficient for all peripherals."
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
