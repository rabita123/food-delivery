"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { DishPairings } from '@/components/DishPairings';
import { Minus, Plus, ShoppingCart } from 'lucide-react';

interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
}

interface DishDetailsProps {
  dish: Dish;
}

export function DishDetails({ dish }: DishDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: quantity,
      image_url: dish.image_url
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="grid md:grid-cols-2 gap-8 p-6">
        {/* Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={dish.image_url || '/default-dish.jpg'}
            alt={dish.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900">{dish.name}</h1>
          <p className="text-lg font-medium text-orange-600 mt-2">
            ${dish.price.toFixed(2)}
          </p>
          <p className="text-gray-600 mt-4">{dish.description}</p>

          {/* Quantity Selector */}
          <div className="flex items-center mt-6">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 rounded-md hover:bg-gray-100"
              disabled={!dish.is_available}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="mx-4 font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-2 rounded-md hover:bg-gray-100"
              disabled={!dish.is_available}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            className="mt-6 w-full"
            disabled={!dish.is_available}
            leftIcon={<ShoppingCart className="h-5 w-5" />}
          >
            {dish.is_available 
              ? `Add to Cart - $${(dish.price * quantity).toFixed(2)}`
              : 'Currently Unavailable'
            }
          </Button>

          {/* AI-Powered Dish Pairings */}
          <DishPairings dishName={dish.name} cuisine={dish.category_id} />
        </div>
      </div>
    </div>
  );
} 