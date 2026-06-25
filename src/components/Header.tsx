import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, User, UserPlus, X, LogOut, UserCircle, Menu, ShoppingCart } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { AnnouncementBar } from './AnnouncementBar';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  cartCount?: number;
  onSearchChange?: (query: string) => void;
  onLogoClick?: () => void;
  categories?: { id: string; name: string; slug: string }[];
  activeCategory?: string;
  onCategoryChange?: (slug: string) => void;
  onCompactChange?: (compact: boolean) => void;
}

export const Header = ({ onSearchChange, onLogoClick, categories = [], activeCategory = '', onCategoryChange, onCompactChange }: HeaderProps) => {
  const headerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSiteSettings();
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();

  const brandName = settings?.brand_name || 'KETCH';
  const cartCount = cartItems.length;
  const logoWidthVal = settings?.logo_width || 120;
  const logoWidthStr = typeof logoWidthVal === 'number' ? `${logoWidthVal}px` : String(logoWidthVal);
  const globalBg = settings?.global_bg_color || '#000000';
  const headerBg = (settings as any)?.header_bg_color || '';
  const headerBgResolved = headerBg || 'transparent';
  const navColor = settings?.nav_text_color || '#FFFFFF';
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';
  const borderColor = settings?.layout_border_color || 'rgba(255,255,255,0.3)';
  const symbolUrl = (settings as any)?.symbol_url || '';
  const symbolSize = (settings as any)?.symbol_size || 28;
  const logoPaddingTop = (settings as any)?.logo_padding_top ?? 8;
  const logoPaddingBottom = (settings as any)?.logo_padding_bottom ?? 8;

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{ categoryName: string; categorySlug: string; section: string; products: any[] }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const isShopPage = location.pathname === '/';

  useEffect(() => {
    if (!isShopPage) { 
      if (isCompact) { setIsCompact(false); onCompactChange?.(false); }
      return; 
    }
    const onScroll = () => {
      const compact = window.scrollY > 80;
      setIsCompact(prev => {
        if (prev !== compact) onCompactChange?.(compact);
        return compact;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isShopPage]);

  useEffect(() => {
    const update = () => {
      if (headerRef.current)
        document.documentElement.style.setProperty('--header-offset', `${headerRef.current.offsetHeight}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [showSearch, settings?.announcement_height, isCompact]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
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
    setSearchResults(Object.entries(grouped).map(([key, prods]) => {
      const cat = allCategories.find((c: any) => c.id === key || c.slug === key);
      return { categoryName: cat?.name || key, categorySlug: cat?.slug || key, section: cat?.section || '', products: prods };
    }));
  }, [searchQuery, allProducts, allCategories]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false); setSearchQuery(''); setSearchResults([]);
      }
    };
    if (showSearch) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSearch]);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from('products').select('id,name,image,price,sale_price,category,category_ids,sub_category,status').order('display_order', { ascending: true }),
        supabase.from('categories').select('id,name,slug,section').order('display_order', { ascending: true }),
      ]);
      if (prods) setAllProducts(prods);
      if (cats) setAllCategories(cats);
    };
    fetch();
  }, []);

  const handleLogoClick = () => { navigate('/'); if (onLogoClick) onLogoClick(); };
  const handleSearchChange = (v: string) => { setSearchQuery(v); onSearchChange?.(v); };
  const handleSearchToggle = () => {
    if (showSearch) { setShowSearch(false); setSearchQuery(''); setSearchResults([]); onSearchChange?.(''); }
    else { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }
  };
  const handleResultClick = (product: any, categorySlug: string) => {
    setShowSearch(false); setSearchQuery(''); setSearchResults([]);
    navigate(`/?category=${categorySlug}&product=${product.id}`);
  };
  const handleMobileLinkClick = (path: string) => { navigate(path); setIsMobileMenuOpen(false); };

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
      <div className="w-full transition-all duration-300 relative z-10" style={{ backgroundColor: headerBgResolved, marginTop: '-1px' }}>
        <div
          className="w-full px-4 md:px-6 flex items-center justify-between transition-all duration-300"
          style={{
            paddingTop: `${logoPaddingTop}px`,
            paddingBottom: `${logoPaddingBottom}px`,
          }}
        >
          {/* 좌: 로고/심볼 */}
          <div className="shrink-0 flex items-center">
            <div className="cursor-pointer flex items-center" onClick={handleLogoClick}>
              {isCompact && (symbolUrl || settings?.logo_url) ? (
                <img
                  src={symbolUrl || settings?.logo_url}
                  alt={brandName}
                  className="object-contain"
                  style={{ height: `${symbolSize}px`, width: 'auto', transition: 'height 0.3s' }}
                />
              ) : settings?.logo_url ? (
                <>
                  <img
                    src={settings.logo_url}
                    alt={brandName}
                    className="object-contain responsive-logo"
                    style={{ height: 'auto', maxHeight: '60px', maxWidth: 'none', transition: 'max-height 0.3s' }}
                  />
                  <style>{`.responsive-logo { width: ${logoWidthStr}; } @media (max-width: 768px) { .responsive-logo { width: calc(${logoWidthStr} * 0.75) !important; } }`}</style>
                </>
              ) : (
                <h1
                  className="font-bold italic tracking-wider"
                  style={{ color: navColor, fontSize: isCompact ? '16px' : '24px', transition: 'font-size 0.3s' }}
                >
                  {brandName}
                </h1>
              )}
            </div>
          </div>

          {/* 가운데: 카테고리 중앙정렬 */}
          <div className="flex-1 flex justify-center items-center overflow-hidden px-4">
            {isShopPage && categories.length > 0 && (
              <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <style>{`.cat-scroll::-webkit-scrollbar{display:none}`}</style>
                <div className="cat-scroll flex items-center gap-0 overflow-x-auto">
                  {categories.map(cat => {
                    const isActive = activeCategory === cat.slug;
                    const catColor = isCompact ? 'var(--font-compact-cat-color)' : 'var(--font-category-color)';
                    return (
                      <button
                        key={cat.id}
                        onClick={() => onCategoryChange?.(cat.slug)}
                        className="shrink-0 px-3 py-2 uppercase whitespace-nowrap transition-colors duration-200"
                        style={{
                          color: isActive ? accentColor : catColor,
                          fontFamily: isCompact ? 'var(--font-compact-cat)' : 'var(--font-category)',
                          fontSize: isCompact ? 'var(--font-compact-cat-size)' : 'var(--font-category-size)',
                          fontWeight: isCompact ? 'var(--font-compact-cat-weight)' : 'var(--font-category-weight)',
                          letterSpacing: isCompact ? 'var(--font-compact-cat-spacing)' : 'var(--font-category-spacing)',
                        }}
                        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.color = accentColor; } }}
                        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.color = catColor; } }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 우: 카트 + 검색 + 메뉴 */}
          <div className="shrink-0 flex items-center z-20" ref={searchRef}>
            <div className="flex items-center gap-5 relative">
              {showSearch && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 flex items-center animate-fade-in" style={{ minWidth: '280px', maxWidth: '480px', width: '35vw' }}>
                  <div className="flex items-center w-full border px-3 py-1.5" style={{ backgroundColor: globalBg, borderColor }}>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') handleSearchToggle(); }}
                      placeholder="Search products..."
                      className="flex-1 bg-transparent focus:outline-none text-sm"
                      style={{ color: navColor }}
                    />
                    <button onClick={handleSearchToggle} style={{ color: navColor }} className="ml-2 opacity-60 hover:opacity-100 flex-shrink-0"><X size={16} /></button>
                  </div>
                  {searchQuery.trim() && (
                    <div className="absolute top-full right-0 left-0 mt-1 border overflow-y-auto z-[999] shadow-2xl" style={{ backgroundColor: globalBg, borderColor, maxHeight: '60vh' }}>
                      {searchResults.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm opacity-50" style={{ color: navColor }}>검색 결과가 없습니다</div>
                      ) : searchResults.map(group => (
                        <div key={group.categorySlug + group.section}>
                          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-b flex items-center gap-2" style={{ color: navColor, borderColor, opacity: 0.5 }}>
                            <span>{group.categoryName}</span>
                            <span className="ml-auto">{group.products.length}</span>
                          </div>
                          {group.products.map(product => (
                            <button key={product.id} onClick={() => handleResultClick(product, group.categorySlug)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:opacity-70"
                              style={{ backgroundColor: globalBg }}>
                              <div className="w-9 h-9 flex-shrink-0 overflow-hidden border" style={{ borderColor }}>
                                {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-contain" /> : <div className="w-full h-full opacity-20" style={{ backgroundColor: navColor }} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: navColor }}>{product.name}</div>
                                <div className="text-[11px] opacity-50 truncate" style={{ color: navColor }}>{product.sub_category || product.category}</div>
                              </div>
                              <div className="text-sm font-bold flex-shrink-0" style={{ color: accentColor }}>₩{(product.sale_price || product.price)?.toLocaleString()}</div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={handleSearchToggle} style={{ color: showSearch ? accentColor : navColor }} className="transition-colors"><Search size={29} /></button>
              <button onClick={() => navigate('/cart')} style={{ color: navColor }} className="relative transition-colors">
                <ShoppingCart size={29} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: accentColor, color: globalBg }}>{cartCount}</span>
                )}
              </button>
              <button onClick={() => setIsMobileMenuOpen(true)} style={{ color: navColor }}><Menu size={31} /></button>
            </div>
          </div>
        </div>
      </div>
      {menuOverlay && typeof document !== 'undefined' ? createPortal(menuOverlay, document.body) : null}
    </header>
  );
};
