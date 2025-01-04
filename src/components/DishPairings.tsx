import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DishPairingsProps {
  dishName: string;
  cuisine: string;
}

interface ErrorDetails {
  message: string;
  type?: string;
  status?: number;
}

export function DishPairings({ dishName, cuisine }: DishPairingsProps) {
  const [pairings, setPairings] = useState<string[]>([]);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const { isLoading, suggestDishPairings } = useAI({
    onError: (error: any) => {
      const errorDetails = {
        message: error.message || 'Failed to get recommendations',
        type: error.type,
        status: error.status
      };
      setError(errorDetails);
      console.error('Failed to get pairings:', {
        error: errorDetails,
        dishName,
        cuisine
      });
    },
  });

  const loadPairings = async () => {
    try {
      setError(null);
      console.log('Requesting pairings for:', { dishName, cuisine });
      const suggestions = await suggestDishPairings(dishName, cuisine);
      console.log('Received suggestions:', suggestions);
      setPairings(suggestions);
    } catch (error: any) {
      const errorDetails = {
        message: error.message || 'Failed to load recommendations',
        type: error.type,
        status: error.status
      };
      setError(errorDetails);
      console.error('Error loading pairings:', {
        error: errorDetails,
        dishName,
        cuisine
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        <span className="ml-2 text-sm text-gray-600">Loading recommendations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-3">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm font-medium">Error: {error.message}</p>
          </div>
          {error.type && (
            <p className="text-xs ml-7">Type: {error.type}</p>
          )}
          {error.status && (
            <p className="text-xs ml-7">Status: {error.status}</p>
          )}
          <p className="text-xs ml-7 mt-2">
            Please check your API configuration or try again later.
            If the issue persists, ensure your OpenAI API key is valid.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadPairings}
          className="text-sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (pairings.length === 0) {
    return (
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={loadPairings}
          className="text-sm"
        >
          Show Recommended Pairings
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Pairings</h3>
      <div className="space-y-2">
        {pairings.map((pairing, index) => (
          <div
            key={index}
            className="bg-orange-50 text-orange-700 px-4 py-3 rounded-lg text-sm"
          >
            {pairing}
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={loadPairings}
        className="mt-3 text-sm"
      >
        Get More Suggestions
      </Button>
    </div>
  );
} 