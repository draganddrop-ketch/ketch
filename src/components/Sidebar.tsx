import { KeyringItem } from '../types';
import { CATEGORIES } from '../data/mockData';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface SidebarProps {
  items: KeyringItem[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onItemSelect: (item: KeyringItem) => void;
}

export const Sidebar = ({ items, activeCategory, onCategoryChange, onItemSelect }: SidebarProps) => {
  const { settings } = useSiteSettings();
  const filteredItems = items.filter(item => {
    const itemCategory = (item.category || '').toLowerCase().trim();
    const filterCategory = (activeCategory || '').toLowerCase().trim();
    return itemCategory === filterCategory;
  });
  const primaryColor = settings?.primary_color || '#34d399';
  const brandName = settings?.brand_name || 'KETCH';

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-mono text-white tracking-wider">
          <span style={{ color: primaryColor }}>{brandName}</span>_BUILDER
        </h1>
        <p className="text-xs text-zinc-500 font-mono mt-1">v2.5.1_ALPHA</p>
      </div>

      <div className="flex border-b border-zinc-800">
        {CATEGORIES.map((category) => {
          const isActive = (activeCategory || '').toLowerCase().trim() === (category.id || '').toLowerCase().trim();

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-1 px-4 py-3 text-xs font-mono transition-colors border-r border-zinc-800 last:border-r-0 ${
                isActive
                  ? 'bg-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
              style={{
                color: isActive ? primaryColor : undefined,
                borderBottom: isActive ? `2px solid ${primaryColor}` : undefined,
              }}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemSelect(item)}
              className="group relative bg-zinc-900/50 border border-zinc-800 transition-all hover:bg-zinc-900 p-4 text-left"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = `${primaryColor}80`}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
            >
              <div className="aspect-square bg-zinc-800/50 mb-3 flex items-center justify-center border border-zinc-700 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-zinc-600 to-zinc-800 border-2 border-zinc-500" />
                )}
              </div>
              <h3 className="text-xs font-mono text-zinc-300 mb-1">{item.name}</h3>
              <p className="text-xs font-mono" style={{ color: primaryColor }}>
                ₩{item.price.toLocaleString()}
              </p>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-mono" style={{ color: primaryColor }}>
                  +ADD
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
