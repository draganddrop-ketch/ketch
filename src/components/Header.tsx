import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { settings } = useSiteSettings();
  const { user, signOut } = useAuth();
  const { cartItems } = useCart();
  const { currentSection, setCurrentSection } = useSection();
  const brandName = settings?.brand_name || 'KETCH';
  const cartCount = cartItems.length;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 로고 너비 설정값 가져오기 (기본값 120px)
  const logoWidthVal = settings?.logo_width || 120;
  const logoWidthStr = typeof logoWidthVal === 'number' ? `${logoWidthVal}px` : logoWidthVal;

  const handleLogoClick = () => {
    navigate('/');
    if (onLogoClick) {
      onLogoClick();
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      if (onSearchChange) {
        onSearchChange('');
      }
    }
  };

  const handleMobileLinkClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full flex flex-col sticky top-0 z-50">
      <AnnouncementBar />
      <div className="w-full border-b border-white/30 bg-black">
        {/* ★ 수정됨: 모바일(기본) px-4 py-2 (50% 축소) / 데스크탑(md) px-6 py-4 (기존 유지) */}
        <div className="max-w-[1300px] mx-auto px-4 py-2 md:px-6 md:py-4 flex items-center justify-between">
          
          {/* 좌측 영역: 로고 + 메뉴 */}
          <div className="flex items-center">
            
            {/* 1. 로고 */}
            <div className="shrink-0 flex items-center">
              {settings?.logo_url ? (
                <>
                  <img
                    src={settings.logo_url}
                    alt={brandName}
                    className="cursor-pointer object-contain responsive-logo"
                    onClick={handleLogoClick}
                    style={{
                      height: 'auto',
                      maxHeight: '60px',
                      maxWidth: 'none',
                    }}
                  />
                  {/* 모바일에서만 75% 크기로 줄임 (calc 사용) */}
                  <style>{`
                    .responsive-logo {
                      width: ${logoWidthStr};
                    }
                    @media (max-width: 768px) {
                      .responsive-logo {
                        width: calc(${logoWidthStr} * 0.75) !important;
                      }
                    }
                  `}</style>
                </>
              ) : (
                <h1
                  className="text-2xl md:text-3xl font-bold italic tracking-wider text-white cursor-pointer"
                  onClick={handleLogoClick}
                >
                  {brandName}
                </h1>
              )}
            </div>

            {/* 2. SHOP | BUILDER 토글 */}
            {/* ★ 수정됨: 모바일 간격(gap, ml, pl)을 50% 축소 */}
            <div className="flex items-center gap-2 md:gap-4 py-1 border-l border-white/30 ml-3 pl-3 md:ml-6 md:pl-6 shrink-0 whitespace-nowrap">
              <button
                onClick={() => setCurrentSection('SHOP')}
                className={`text-[15px] md:text-lg font-bold uppercase tracking-wider transition-colors ${
                  currentSection === 'SHOP'
                    ? 'text-cyan-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                SHOP
              </button>
              <span className="text-white/30 text-[15px] md:text-lg">|</span>
              <button
                onClick={() => setCurrentSection('BUILDER')}
                className={`text-[15px] md:text-lg font-bold uppercase tracking-wider transition-colors ${
                  currentSection === 'BUILDER'
                    ? 'text-cyan-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                BUILDER
              </button>
            </div>
          </div>

          {/* 우측 영역 */}
          <div className="flex items-center shrink-0 z-20">
            {/* 데스크탑 메뉴 */}
            <nav className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-white hover:text-cyan-400 text-sm uppercase tracking-wide">
                    <UserCircle size={18} /> <span>MY PAGE</span>
                  </button>
                  <button onClick={async () => { await signOut(); navigate('/'); }} className="flex items-center gap-2 text-white hover:text-cyan-400 text-sm uppercase tracking-wide">
                    <LogOut size={18} /> <span>LOGOUT</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-white hover:text-cyan-400 text-sm uppercase tracking-wide">
                    <User size={18} /> <span>LOGIN</span>
                  </button>
                  <button onClick={() => navigate('/signup')} className="flex items-center gap-2 text-white hover:text-cyan-400 text-sm uppercase tracking-wide">
                    <UserPlus size={18} /> <span>SIGN-UP</span>
                  </button>
                </>
              )}
              <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-white hover:text-cyan-400 text-sm uppercase tracking-wide relative">
                <ShoppingCart size={18} /> <span>CART</span>
                {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-cyan-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
              </button>
              <button onClick={handleSearchToggle} className="flex items-center gap-2 text-white hover:text-cyan-400 text-sm uppercase tracking-wide">
                {showSearch ? <X size={18} /> : <Search size={18} />} <span>{showSearch ? 'CLOSE' : 'SEARCH'}</span>
              </button>
            </nav>

            {/* 모바일 햄버거 메뉴 */}
            <div className="flex items-center gap-4 md:hidden">
               <button onClick={handleSearchToggle} className="text-white hover:text-cyan-400">
                 <Search size={22} />
               </button>
               <button onClick={() => setIsMobileMenuOpen(true)} className="text-white hover:text-cyan-400">
                 <Menu size={24} />
               </button>
            </div>
          </div>
        </div>

        {/* 검색창 */}
        {showSearch && (
          <div className="border-t border-white/30 bg-zinc-900 animate-fade-in">
            <div className="max-w-[1300px] mx-auto px-6 py-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-black border border-white/30 text-white px-4 py-3 focus:outline-none focus:border-cyan-400 transition-colors"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* 모바일 슬라이드 메뉴 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md animate-fade-in md:hidden flex flex-col">
          <div className="flex justify-end p-6">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-red-500 transition-colors">
              <X size={32} />
            </button>
          </div>
          <div className="flex flex-col items-center gap-8 mt-4 px-6">
            {user ? (
              <>
                <button onClick={() => handleMobileLinkClick('/profile')} className="text-xl font-bold text-white hover:text-cyan-400 flex items-center gap-2"><UserCircle size={24} /> MY PAGE</button>
                <button onClick={() => handleMobileLinkClick('/cart')} className="text-xl font-bold text-white hover:text-cyan-400 flex items-center gap-2"><ShoppingCart size={24} /> CART ({cartCount})</button>
                <button onClick={async () => { await signOut(); setIsMobileMenuOpen(false); navigate('/'); }} className="text-xl font-bold text-zinc-500 hover:text-white flex items-center gap-2 mt-4"><LogOut size={24} /> LOGOUT</button>
              </>
            ) : (
              <>
                <button onClick={() => handleMobileLinkClick('/login')} className="text-xl font-bold text-white hover:text-cyan-400 flex items-center gap-2"><User size={24} /> LOGIN</button>
                <button onClick={() => handleMobileLinkClick('/signup')} className="text-xl font-bold text-white hover:text-cyan-400 flex items-center gap-2"><UserPlus size={24} /> SIGN UP</button>
                <button onClick={() => handleMobileLinkClick('/cart')} className="text-xl font-bold text-white hover:text-cyan-400 flex items-center gap-2 mt-4"><ShoppingCart size={24} /> CART ({cartCount})</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};