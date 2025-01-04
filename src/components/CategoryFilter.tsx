import { Category } from '@/types/database.types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-8">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-4 py-2 rounded-full ${
          selectedCategory === null
            ? 'bg-orange-500 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        } transition-colors duration-200`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-full ${
            selectedCategory === category.id
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } transition-colors duration-200`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
} 