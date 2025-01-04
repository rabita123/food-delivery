import Image from 'next/image';
import Link from 'next/link';
import { Dish } from '@/types/database.types';
import { useCart } from '@/contexts/CartContext';

interface FoodCardProps {
  dish: Dish;
}

export default function FoodCard({ dish }: FoodCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking add to cart
    addToCart({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      quantity: 1,
      image_url: dish.image_url || '/default-dish.jpg'
    });
  };

  return (
    <Link href={`/menu/${dish.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="relative h-48">
          <Image
            src={dish.image_url || '/default-dish.jpg'}
            alt={dish.name}
            fill
            className="object-cover"
          />
          {!dish.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                Currently Unavailable
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {dish.name}
          </h3>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {dish.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-orange-500">
              ${dish.price.toFixed(2)}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={!dish.is_available}
              className={`px-4 py-2 rounded-full ${
                dish.is_available
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              } transition-colors duration-200`}
            >
              {dish.is_available ? 'Add to Cart' : 'Unavailable'}
            </button>
          </div>
          {dish.preparation_time && (
            <p className="text-sm text-gray-500 mt-2">
              Preparation time: {formatInterval(dish.preparation_time)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatInterval(interval: string): string {
  // PostgreSQL interval comes in various formats, we'll handle the common ones
  const minutes = interval.match(/(\d+):(\d+):(\d+)/); // matches HH:MM:SS format
  if (minutes) {
    const [_, hours, mins] = minutes;
    return `${hours}h ${mins}m`;
  }

  const minutesOnly = interval.match(/(\d+) minutes?/);
  if (minutesOnly) {
    return `${minutesOnly[1]} min`;
  }

  // If the format is not recognized, return the raw value
  return interval;
} 