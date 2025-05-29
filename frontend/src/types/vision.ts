// types/vision.ts
export interface DetectedObject {
    name: string;
    confidence: number;
    category?: string;
    suggestedPrice?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }
  
  export interface VisionAnalysisResult {
    objects: DetectedObject[];
    labels: Array<{
      description: string;
      score: number;
    }>;
    dominantColors?: Array<{
      color: { red: number; green: number; blue: number };
      score: number;
    }>;
  }
  
  export interface ItemSuggestion {
    itemName: string;
    category: string;
    suggestedPrice: number;
    confidence: number;
    alternativeNames: string[];
  }