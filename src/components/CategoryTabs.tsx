import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSection } from '../context/SectionContext';
import { ChevronRight } from 'lucide-react'; // 화살표 아이콘 추가

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
    // sticky top-16 z-40: 헤더 바로 밑에 붙어 따라오도록 설정 (모바일 UX 강화)
    <div className="w-full border-b border-white/30 bg-black sticky top-14 md:top-16 z-40">
      <div className="max-w-[1300px] mx-auto px-6 relative group">
        
        {/* ★ 수정됨: no-scrollbar 클래스 추가 (스크롤바 숨김) + pr-8 (화살표 공간 확보) */}
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pr-8">
          
          {currentSection === 'SHOP' && (
            <button
              onClick={() => onCategoryChange('all')}
              // 원본 스타일 그대로 유지
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
                // 원본 스타일 그대로 유지
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

        {/* ★ 추가됨: 우측 화살표 (스크롤 힌트) - 모바일에서만 보이거나 자연스럽게 처리 */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none flex items-center justify-end pr-4 md:hidden">
          <ChevronRight className="text-white/50 animate-pulse" size={20} />
        </div>
      </div>

      {/* ★ 추가됨: 스크롤바 숨김 CSS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};