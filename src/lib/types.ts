export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  feature: FeatureArea;
  content: string | React.ReactNode;
  timestamp: number;
  data?: any; // Optional: for structured AI responses like build suggestions
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

export interface ComponentDetails {
  summary: string;
}

export interface BuildGuideStep {
  id: number;
  title: string;
  description: string;
  image?: string;
  imageHint?: string;
  details?: string[];
}
