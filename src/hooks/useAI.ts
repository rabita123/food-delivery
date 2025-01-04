import { useState } from 'react';

interface UseAIOptions {
  onError?: (error: Error) => void;
}

export function useAI(options: UseAIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const callAI = async (action: string, params: Record<string, any>) => {
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

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error calling AI:', error);
      options.onError?.(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateDishDescription = async (dishName: string, ingredients: string[]) => {
    return callAI('generateDescription', { dishName, ingredients });
  };

  const suggestDishPairings = async (dishName: string, cuisine: string) => {
    return callAI('suggestPairings', { dishName, cuisine });
  };

  const generateCookingTips = async (dishName: string) => {
    return callAI('generateTips', { dishName });
  };

  const generateCustomerResponse = async (query: string, context: string) => {
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