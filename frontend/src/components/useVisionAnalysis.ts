// hooks/useVisionAnalysis.ts
import { useState } from 'react';
import { VisionAnalysisResult, ItemSuggestion } from '../types/vision';

interface UseVisionAnalysisReturn {
  analyzeImage: (imageDataUrl: string) => Promise<{
    analysis: VisionAnalysisResult;
    suggestions: ItemSuggestion[];
  } | null>;
  isAnalyzing: boolean;
  error: string | null;
}

export const useVisionAnalysis = (): UseVisionAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return {
        analysis: data.analysis,
        suggestions: data.suggestions,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Vision analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeImage,
    isAnalyzing,
    error,
  };
};