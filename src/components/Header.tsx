import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User, UserPlus, X, LogOut, UserCircle } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
  const brandName = settings?.brand_name || 'KETCH';
  const cartCount = cartItems.length;
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <header className="w-full flex flex-col">
      <AnnouncementBar />
      <div className="w-full border-b border-white/30 bg-black">
        <div className="max-w-[1300px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex-1">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={brandName}
              className="cursor-pointer"
              style={{
                width: typeof settings.logo_width === 'number'
                  ? `${settings.logo_width}px`
                  : (settings.logo_width || '120px'),
                height: 'auto',
                maxHeight: '60px',
                maxWidth: 'none',
                objectFit: 'contain'
              }}
              onClick={handleLogoClick}
            />
          ) : (
            <h1
              className="text-3xl font-bold italic tracking-wider text-white cursor-pointer"
              onClick={handleLogoClick}
            >
              {brandName}
            </h1>
          )}
        </div>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-sm uppercase tracking-wide"
              >
                <UserCircle size={18} />
                <span>MY PAGE</span>
              </button>

              <button
                onClick={async () => {
                  await signOut();
                  navigate('/');
                }}
                className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-sm uppercase tracking-wide"
              >
                <LogOut size={18} />
                <span>LOGOUT</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-sm uppercase tracking-wide"
              >
                <User size={18} />
                <span>LOGIN</span>
              </button>

              <button
                onClick={() => navigate('/signup')}
                className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-sm uppercase tracking-wide"
              >
                <UserPlus size={18} />
                <span>SIGN-UP</span>
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-sm uppercase tracking-wide relative"
          >
            <ShoppingCart size={18} />
            <span>CART</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-cyan-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={handleSearchToggle}
            className="flex items-center gap-2 text-white hover:text-cyan-400 transition-colors text-sm uppercase tracking-wide"
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
            <span>{showSearch ? 'CLOSE' : 'SEARCH'}</span>
          </button>
        </nav>
        </div>

        {showSearch && (
          <div className="border-t border-white/30 bg-zinc-900">
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
    </header>
  );
};
