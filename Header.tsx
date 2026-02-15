import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, User, UserPlus, X, LogOut, UserCircle, Menu } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSection } from '../context/SectionContext';
import { AnnouncementBar } from './AnnouncementBar';

interface HeaderProps {
  cartCount?: number;
  onSearchChange?: (query: string) => void;
  onLogoClick?: () => void;
}

export const Header = ({ onSearchChange, onLogoClick }: HeaderProps) => {
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

  const logoWidthVal = settings?.logo_width || 120;
  const logoWidthStr = typeof logoWidthVal === 'number' ? `${logoWidthVal}px` : logoWidthVal;

  const globalBg = settings?.global_bg_color || '#000000';
  const navColor = settings?.nav_text_color || '#FFFFFF';
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';
  const borderColor = settings?.layout_border_color || 'rgba(255, 255, 255, 0.3)';

  const handleLogoClick = () => { navigate('/'); if (onLogoClick) onLogoClick(); };
  const handleSectionChange = (section: 'SHOP' | 'BUILDER') => { setCurrentSection(section); if (location.pathname !== '/') navigate('/'); };
  const handleSearchChange = (value: string) => { setSearchQuery(value); if (onSearchChange) onSearchChange(value); };
  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { navigate(`/?search=${encodeURIComponent(searchQuery)}`); setShowSearch(false); } };
  const handleSearchToggle = () => { setShowSearch(!showSearch); if (showSearch) { setSearchQuery(''); if (onSearchChange) onSearchChange(''); } };
  const handleMobileLinkClick = (path: string) => { navigate(path); setIsMobileMenuOpen(false); };

  return (
    <header className="w-full flex flex-col sticky top-0 z-50">
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
        <div className="max-w-[1300px] mx-auto px-4 py-2 md:px-6 md:py-4 flex items-center justify-between">
          
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

          <div className="flex items-center shrink-0 z-20">
            <div className="flex items-center gap-4">
               <button onClick={handleSearchToggle} style={{ color: navColor }}><Search size={22} /></button>
               <button onClick={() => setIsMobileMenuOpen(true)} style={{ color: navColor }}><Menu size={24} /></button>
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="border-t animate-fade-in" style={{ backgroundColor: globalBg, borderColor: borderColor }}>
            <div className="max-w-[1300px] mx-auto px-6 py-4">
              <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onKeyDown={handleSearchSubmit} placeholder="Search products..." className="w-full border px-4 py-3 focus:outline-none transition-colors" style={{ backgroundColor: 'transparent', color: navColor, borderColor: borderColor }} autoFocus />
            </div>
          </div>
        )}
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex animate-fade-in">
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
      )}
    </header>
  );
};
