import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSection } from '../context/SectionContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  section: 'SHOP' | 'BUILDER';
}

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (slug: string) => void;
}

export const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { currentSection, setCurrentSection } = useSection();

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

      console.log('CategoryTabs loaded categories:', data);
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const filteredCategories = categories.filter(
    (category) => category.section === currentSection
  );

  return (
    <div className="w-full border-b border-white/30 bg-black">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="flex items-center gap-8 overflow-x-auto">
          {currentSection === 'SHOP' && (
            <button
              onClick={() => onCategoryChange('all')}
              className={`py-4 text-sm font-medium uppercase tracking-widest whitespace-nowrap transition-colors relative ${
                activeCategory === 'all'
                  ? 'hover:text-white'
                  : 'text-white/70 hover:text-white'
              }`}
              style={activeCategory === 'all' ? { color: 'var(--accent-color)' } : {}}
            >
              ALL
              {activeCategory === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--accent-color)' }} />
              )}
            </button>
          )}

          {filteredCategories.map((category) => {
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
