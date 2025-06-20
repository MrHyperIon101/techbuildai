
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  feature: FeatureArea;
  content: string | React.ReactNode;
  timestamp: number;
  data?: any;
}

export type FeatureArea = 'builder' | 'components-db' | 'bottleneck-calculator' | 'general';

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
  icon: React.ElementType; // Changed from image/imageHint to icon
  details?: string[];
}
