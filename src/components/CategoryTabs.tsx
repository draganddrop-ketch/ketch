import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSection } from '../context/SectionContext';
import { useSiteSettings } from '../context/SiteSettingsContext'; // ✅
import { ChevronRight } from 'lucide-react';

interface Category { id: string; name: string; slug: string; section: 'SHOP' | 'BUILDER'; }
interface CategoryTabsProps { activeCategory: string; onCategoryChange: (slug: string) => void; }

export const CategoryTabs = ({ activeCategory, onCategoryChange }: CategoryTabsProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { currentSection } = useSection();
  const { settings } = useSiteSettings(); // ✅

  // ✅ 전역 스타일 연동
  const globalBg = settings?.global_bg_color || '#000000';
  const navColor = settings?.nav_text_color || '#FFFFFF'; // 메뉴 텍스트 컬러
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';

  const toRgba = (color: string, alpha: number) => {
    const c = (color || '').trim();
    if (c.startsWith('#')) {
      const hex = c.replace('#', '');
      const full = hex.length === 3 ? hex.split('').map(ch => ch + ch).join('') : hex;
      if (full.length === 6) {
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    if (c.startsWith('rgb')) {
      const nums = c.match(/[\d.]+/g);
      if (nums && nums.length >= 3) {
        const [r, g, b] = nums;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    return `rgba(0, 0, 0, ${alpha})`;
  };
  const tabBg = toRgba(globalBg, 0.5);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
      if(data) setCategories(data);
    } catch (err) { console.error(err); }
  };

  const filteredCategories = categories.filter(category => category.section === currentSection);

  return (
    // ✅ sticky 제거하여 스크롤 시 위로 사라짐
    // ✅ border-b 추가하여 하단 선 유지
    <div className="w-full border-b border-white/10 transition-colors duration-300" style={{ backgroundColor: tabBg }}>
      <div className="w-full px-4 md:px-6 relative group">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pr-8">
          {filteredCategories.map((category) => {
            const isActive = (activeCategory || '').toLowerCase().trim() === (category.slug || '').toLowerCase().trim();
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className="py-2 md:py-4 text-sm font-medium uppercase tracking-widest whitespace-nowrap transition-colors relative"
                style={{ color: isActive ? accentColor : navColor }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = accentColor; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = navColor; }}
              >
                {category.name}
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none flex items-center justify-end pr-4 md:hidden" style={{ background: `linear-gradient(to left, ${globalBg}, transparent)` }}>
          <ChevronRight size={20} style={{ color: navColor, opacity: 0.5 }} />
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};
