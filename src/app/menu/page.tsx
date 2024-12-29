'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Dish, Category } from '@/types/database.types';
import FoodCard from '@/components/FoodCard';
import CategoryFilter from '@/components/CategoryFilter';
import SearchAndFilter from '@/components/SearchAndFilter';
import { useCart } from '@/contexts/CartContext';

export default function Menu() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 9;

  useEffect(() => {
    loadCategories();
    loadPriceRange();
  }, []);

  useEffect(() => {
    loadDishes();
  }, [selectedCategory, page, searchQuery, priceRange]);

  const loadPriceRange = async () => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('price')
        .order('price', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const prices = data.map(d => d.price);
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        setPriceRange({ min, max });
      }
    } catch (error) {
      console.error('Error loading price range:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    }
  };

  const loadDishes = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('dishes')
        .select(`
          *,
          category:categories(name)
        `)
        .gte('price', priceRange.min)
        .lte('price', priceRange.max)
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
        .order('name');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (page === 1) {
        setDishes(data || []);
      } else {
        setDishes(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === itemsPerPage);
    } catch (error) {
      console.error('Error loading dishes:', error);
      setError('Failed to load dishes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setPage(1);
    setDishes([]);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setDishes([]);
  }, []);

  const handlePriceRangeChange = useCallback((range: { min: number; max: number }) => {
    setPriceRange(range);
    setPage(1);
    setDishes([]);
  }, []);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-lg text-gray-600">Discover our delicious homemade dishes</p>
        </div>

        <SearchAndFilter
          onSearch={handleSearch}
          onPriceRangeChange={handlePriceRangeChange}
          minPrice={priceRange.min}
          maxPrice={priceRange.max}
        />

        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        {error && (
          <div className="text-center text-red-600 mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dishes.map((dish) => (
            <FoodCard
              key={dish.id}
              dish={dish}
            />
          ))}
        </div>

        {/* Load More Button */}
        {!isLoading && hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="bg-white text-orange-500 px-6 py-3 rounded-full shadow hover:shadow-md transition-shadow duration-200"
            >
              Load More
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && dishes.length === 0 && (
          <div className="text-center text-gray-600 mt-8">
            No dishes found with the current filters.
          </div>
        )}
      </div>
    </div>
  );
} 