
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
}

// Updated ComponentDetails for richer information
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

export interface ComponentDetails {
  componentNameFromAI?: string; 
  overallSummary: string;
  keyFeatures?: string[];
  technicalCategories?: ComponentTechnicalCategory[];
  shoppingLinks?: ShoppingLink[];
  imageUrl?: string;
}

export interface BuildGuideStep {
  id: number;
  title: string;
  description: string;
  image?: string;
  imageHint?: string;
  details?: string[];
}

