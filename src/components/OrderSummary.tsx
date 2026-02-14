import { Heart, Share2, ShoppingCart, CreditCard } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { useSiteSettings } from '../context/SiteSettingsContext'; // ✅ 설정 가져오기

interface OrderSummaryProps {
  items: { id: string; name: string; price: number }[];
  onAddToCart: () => void;
  onCheckout: () => void;
  onSaveDesign: () => void;
  onShare: () => void;
}

export const OrderSummary = ({ items, onAddToCart, onCheckout, onSaveDesign, onShare }: OrderSummaryProps) => {
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const { selectItem, selectedId } = useCanvas();
  const { settings, getBorderStyle } = useSiteSettings(); // ✅ 설정 사용

  // ✅ 전역 스타일 적용
  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';
  const borderStyle = getBorderStyle();

  return (
    <div className="p-6 border" style={{ backgroundColor: globalBg, ...borderStyle }}>
      <h2 className="font-bold uppercase tracking-wider mb-2 text-sm" style={{ color: globalText }}>
        ORDER SUMMARY
      </h2>

      <div className="space-y-0.2 mb-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-sm py-1" style={{ color: globalText, opacity: 0.5 }}>No items selected</p>
        ) : (
          items.map((item, index) => (
            <div 
              key={index} 
              onClick={() => selectItem(item.id)}
              className={`flex justify-between text-sm cursor-pointer transition-all px-2 -mx-2 py-1 rounded ${
                selectedId === item.id 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
              style={{ color: globalText }}
            >
              <span className={`truncate mr-4 ${selectedId === item.id ? 'font-bold' : ''}`}>
                <span className="mr-2" style={{ color: 'var(--accent-color)' }}>{index + 1}.</span> 
                {item.name}
              </span>
              <span className="font-mono whitespace-nowrap font-bold" style={{ color: 'var(--accent-color)' }}>
                ₩{item.price.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-4 mb-6" style={{ borderColor: borderStyle.borderColor }}>
        <div className="flex justify-between items-end">
          <span className="text-sm uppercase tracking-wider" style={{ color: globalText, opacity: 0.7 }}>ITEM PRICE</span>
          <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent-color)' }}>
            ₩{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onAddToCart}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 border hover:bg-white/5"
            style={{ 
              color: globalText, 
              borderColor: borderStyle.borderColor,
              backgroundColor: 'transparent' 
            }}
          >
            <ShoppingCart size={16} />
            ADD CART
          </button>
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <CreditCard size={16} />
            ORDER
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onSaveDesign}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 border border-blue-900/50 bg-[#0f172a] hover:bg-[#1e293b] text-blue-400 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Heart size={16} />
            SAVE DESIGN
          </button>
          <button
            onClick={onShare}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 border border-blue-900/50 bg-[#0f172a] hover:bg-[#1e293b] text-blue-400 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Share2 size={16} />
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
};