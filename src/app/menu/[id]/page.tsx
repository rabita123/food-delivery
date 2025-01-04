"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DishDetails } from '@/components/DishDetails';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
}

export default function DishPage({ params }: { params: { id: string } }) {
  const [dish, setDish] = useState<Dish | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchDish = async () => {
      try {
        console.log('Fetching dish with ID:', params.id);
        
        const { data, error } = await supabase
          .from('dishes')
          .select(`
            id,
            name,
            description,
            price,
            image_url,
            category_id,
            is_available
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          console.error('No dish found with ID:', params.id);
          throw new Error('Dish not found');
        }

        console.log('Fetched dish:', data);
        setDish(data);
      } catch (error) {
        console.error('Error in fetchDish:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dish details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDish();
  }, [params.id, supabase]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !dish) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || 'Dish not found'}</p>
        <Link
          href="/menu"
          className="text-blue-500 hover:text-blue-600"
        >
          Back to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DishDetails dish={dish} />
    </div>
  );
} 