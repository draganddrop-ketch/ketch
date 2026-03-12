import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, User, UserPlus, X, LogOut, UserCircle, Menu } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSection } from '../context/SectionContext';
import { AnnouncementBar } from './AnnouncementBar';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  cartCount?: number;
  onSearchChange?: (query: string) => void;
  onLogoClick?: () => void;
}

export const Header = ({ onSearchChange, onLogoClick }: HeaderProps) => {
  const headerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();
  const { currentSection, setCurrentSection } = useSection();
  const brandName = settings?.brand_name || 'KETCH';
  const cartCount = cartItems.length;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{ categoryName: string; categorySlug: string; section: string; products: any[] }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const logoWidthVal = settings?.logo_width || 120;
  const logoWidthStr = typeof logoWidthVal === 'number' ? `${logoWidthVal}px` : logoWidthVal;

  const globalBg = settings?.global_bg_color || '#000000';
  const navColor = settings?.nav_text_color || '#FFFFFF';
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';
  const borderColor = settings?.layout_border_color || 'rgba(255, 255, 255, 0.3)';

  const handleLogoClick = () => { navigate('/'); if (onLogoClick) onLogoClick(); };
  const handleSectionChange = (section: 'SHOP' | 'BUILDER') => { setCurrentSection(section); if (location.pathname !== '/') navigate('/'); };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (onSearchChange) onSearchChange(value);
    if (!value.trim()) { setSearchResults([]); return; }
    const q = value.toLowerCase();
    const grouped: { [key: string]: any[] } = {};
    allProducts.forEach(p => {
      if (p.status === 'hidden') return;
      if (!p.name.toLowerCase().includes(q) && !(p.sub_category || '').toLowerCase().includes(q)) return;
      const catIds: string[] = p.category_ids || (p.category ? [p.category] : []);
      catIds.forEach(slug => {
        const cat = allCategories.find((c: any) => c.slug === slug);
        const key = cat ? cat.id : slug;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(p);
      });
    });
    const results = Object.entries(grouped).map(([key, prods]) => {
      const cat = allCategories.find((c: any) => c.id === key || c.slug === key);
      return { categoryName: cat?.name || key, categorySlug: cat?.slug || key, section: cat?.section || '', products: prods };
    });
    setSearchResults(results);
  }, [allProducts, allCategories, onSearchChange]);

  const handleSearchToggle = () => {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      if (onSearchChange) onSearchChange('');
    } else {
      setShowSearch(true);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  const handleResultClick = (product: any, categorySlug: string, section: string) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    const sectionParam = section === 'BUILDER' ? 'builder' : 'shop';
    setCurrentSection(section as any);
    navigate(`/?section=${sectionParam}&category=${categorySlug}&product=${product.id}`);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { handleSearchToggle(); }
  };
  const handleMobileLinkClick = (path: string) => { navigate(path); setIsMobileMenuOpen(false); };

  // 외부 클릭 시 검색창 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    if (showSearch) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch]);

  // 상품 및 카테고리 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from('products').select('id, name, image, price, sale_price, category, category_ids, sub_category, status').order('display_order', { ascending: true }),
        supabase.from('categories').select('id, name, slug, section').order('display_order', { ascending: true }),
      ]);
      if (products) setAllProducts(products);
      if (categories) setAllCategories(categories);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const updateHeaderOffset = () => {
      if (!headerRef.current) return;
      document.documentElement.style.setProperty('--header-offset', `${headerRef.current.offsetHeight}px`);
    };
    updateHeaderOffset();
    const onResize = () => updateHeaderOffset();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [showSearch, settings?.announcement_height]);

  const menuOverlay = isMobileMenuOpen ? (
    <div className="fixed inset-0 z-[9999] flex animate-fade-in">
      <div className="flex-1 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
      <div className="h-full w-[50vw] md:w-[30vw] bg-black text-white shadow-2xl flex flex-col">
        <div className="flex justify-end p-5 border-b border-white/10">
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-white"><X size={26} /></button>
        </div>
        <div className="flex flex-col gap-6 p-6">
          {user ? (
            <>
              <button onClick={() => handleMobileLinkClick('/profile')} className="text-lg font-bold flex items-center gap-2"><UserCircle size={20} /> MY PAGE</button>
              <button onClick={async () => { await signOut(); setIsMobileMenuOpen(false); navigate('/'); }} className="text-lg font-bold flex items-center gap-2"><LogOut size={20} /> LOGOUT</button>
            </>
          ) : (
            <>
              <button onClick={() => handleMobileLinkClick('/login')} className="text-lg font-bold flex items-center gap-2"><User size={20} /> LOGIN</button>
              <button onClick={() => handleMobileLinkClick('/signup')} className="text-lg font-bold flex items-center gap-2"><UserPlus size={20} /> SIGN UP</button>
            </>
          )}
          <button onClick={() => handleMobileLinkClick('/cart')} className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart size={20} /> CART {cartCount > 0 ? `(${cartCount})` : ''}
          </button>
          <button onClick={() => { handleSearchToggle(); setIsMobileMenuOpen(false); }} className="text-lg font-bold flex items-center gap-2">
            <Search size={20} /> {showSearch ? 'CLOSE SEARCH' : 'SEARCH'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <header ref={headerRef} className="w-full flex flex-col sticky top-0 z-50">
      <AnnouncementBar />
      
      {/* ✅ [수정] 
          1. backgroundColor: globalBg (투명도 없는 완전한 색상)
          2. backdropFilter 제거
          3. 선 제거 및 위치 보정 유지
      */}
      <div 
        className="w-full transition-colors duration-300 relative z-10" 
        style={{ 
          backgroundColor: globalBg, 
          marginTop: '-1px',         // 알림바 하단 선 가림
          borderTop: 'none',
          borderBottom: 'none'       // 헤더 하단 선 제거
        }}
      >
        <div className="w-full px-4 py-2 md:px-6 md:py-4 flex items-center justify-between">
          
          <div className="flex items-center">
            <div className="shrink-0 flex items-center">
              {settings?.logo_url ? (
                <>
                  <img src={settings.logo_url} alt={brandName} className="cursor-pointer object-contain responsive-logo" onClick={handleLogoClick} style={{ height: 'auto', maxHeight: '60px', maxWidth: 'none' }} />
                  <style>{`.responsive-logo { width: ${logoWidthStr}; } @media (max-width: 768px) { .responsive-logo { width: calc(${logoWidthStr} * 0.75) !important; } }`}</style>
                </>
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold italic tracking-wider cursor-pointer" style={{ color: navColor }} onClick={handleLogoClick}>{brandName}</h1>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4 py-1 ml-3 pl-3 md:ml-6 md:pl-6 shrink-0 whitespace-nowrap">
              <button onClick={() => handleSectionChange('SHOP')} className="text-[15px] md:text-lg font-bold uppercase tracking-wider transition-colors" style={{ color: currentSection === 'SHOP' ? accentColor : navColor }}>SHOP</button>
              <span className="text-[15px] md:text-lg" style={{ color: navColor }}>|</span>
              <button onClick={() => handleSectionChange('BUILDER')} className="text-[15px] md:text-lg font-bold uppercase tracking-wider transition-colors" style={{ color: currentSection === 'BUILDER' ? accentColor : navColor }}>BUILDER</button>
            </div>
          </div>

          <div className="flex items-center shrink-0 z-20" ref={searchRef}>
            <div className="flex items-center gap-4 relative">
              {/* 검색창 - 돋보기 왼쪽에 인라인으로 표시 */}
              {showSearch && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 flex items-center animate-fade-in" style={{ minWidth: '280px', maxWidth: '480px', width: '35vw' }}>
                  <div className="flex items-center w-full border px-3 py-1.5" style={{ backgroundColor: globalBg, borderColor: borderColor }}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onKeyDown={handleSearchSubmit}
                      placeholder="Search products..."
                      className="flex-1 bg-transparent focus:outline-none text-sm"
                      style={{ color: navColor }}
                    />
                    <button onClick={handleSearchToggle} style={{ color: navColor }} className="ml-2 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0">
                      <X size={16} />
                    </button>
                  </div>

                  {/* 검색 결과 드롭다운 */}
                  {searchQuery.trim() && (
                    <div className="absolute top-full right-0 left-0 mt-1 border overflow-y-auto z-[999] shadow-2xl" style={{ backgroundColor: globalBg, borderColor: borderColor, maxHeight: '60vh' }}>
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm opacity-50" style={{ color: navColor }}>검색 결과가 없습니다</div>
                      ) : (
                        searchResults.map(group => (
                          <div key={group.categorySlug + group.section}>
                            {/* 카테고리 헤더 */}
                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b flex items-center gap-2" style={{ color: navColor, borderColor: borderColor, opacity: 0.5 }}>
                              <span className="opacity-60">{group.section}</span>
                              <span>·</span>
                              <span>{group.categoryName}</span>
                              <span className="ml-auto opacity-60">{group.products.length}</span>
                            </div>
                            {/* 상품 목록 */}
                            {group.products.map(product => (
                              <button
                                key={product.id}
                                onClick={() => handleResultClick(product, group.categorySlug, group.section)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:opacity-70"
                                style={{ backgroundColor: globalBg }}
                              >
                                <div className="w-9 h-9 flex-shrink-0 overflow-hidden border" style={{ borderColor: borderColor }}>
                                  {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="w-full h-full opacity-20" style={{ backgroundColor: navColor }} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate" style={{ color: navColor }}>{product.name}</div>
                                  <div className="text-[11px] opacity-50 truncate" style={{ color: navColor }}>{product.sub_category || product.category}</div>
                                </div>
                                <div className="text-sm font-bold flex-shrink-0" style={{ color: accentColor }}>
                                  ₩{(product.sale_price || product.price)?.toLocaleString()}
                                </div>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
               <button onClick={handleSearchToggle} style={{ color: showSearch ? accentColor : navColor }} className="transition-colors"><Search size={22} /></button>
               <button onClick={() => setIsMobileMenuOpen(true)} style={{ color: navColor }}><Menu size={24} /></button>
            </div>
          </div>
        </div>

      </div>

      {menuOverlay && typeof document !== 'undefined' ? createPortal(menuOverlay, document.body) : null}
    </header>
  );
};
