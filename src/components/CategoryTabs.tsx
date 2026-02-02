import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      const allCategory = { id: 'all', name: 'MAIN', slug: 'all' };
      const categoriesWithAll = [allCategory, ...(data || [])];

      console.log('CategoryTabs loaded categories:', categoriesWithAll);
      setCategories(categoriesWithAll);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  return (
    <div className="w-full border-b border-white/30 bg-black">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="flex items-center gap-8 overflow-x-auto">
          {categories
            .filter(category => category.slug !== 'all')
            .map((category) => {
              const isActive = (activeCategory || '').toLowerCase().trim() === (category.slug || '').toLowerCase().trim();

              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.slug)}
                  className={`py-4 text-sm font-medium uppercase tracking-widest whitespace-nowrap transition-colors relative ${
                    isActive
                      ? 'hover:text-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={isActive ? { color: 'var(--accent-color)' } : {}}
                >
                  {category.name}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--accent-color)' }} />
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
