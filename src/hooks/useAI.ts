import { useState } from 'react';

interface UseAIOptions {
  onError?: (error: Error) => void;
}

type AIResponse = {
  result: string;
};

export function useAI(options: UseAIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const callAI = async <T extends Record<string, unknown>>(
    action: string,
    params: T
  ): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json() as AIResponse;
      return data.result;
    } catch (error) {
      console.error('Error calling AI:', error);
      if (error instanceof Error && options.onError) {
        options.onError(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateDishDescription = async (dishName: string, ingredients: string[]): Promise<string> => {
    return callAI('generateDescription', { dishName, ingredients });
  };

  const suggestDishPairings = async (dishName: string, cuisine: string): Promise<string> => {
    return callAI('suggestPairings', { dishName, cuisine });
  };

  const generateCookingTips = async (dishName: string): Promise<string> => {
    return callAI('generateTips', { dishName });
  };

  const generateCustomerResponse = async (query: string, context: string): Promise<string> => {
    return callAI('customerResponse', { query, context });
  };

  return {
    isLoading,
    generateDishDescription,
    suggestDishPairings,
    generateCookingTips,
    generateCustomerResponse,
  };
} 