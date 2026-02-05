import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart } from 'lucide-react';
import { KeyringItem } from '../types';

interface ProductCardProps {
  product: KeyringItem;
  onAddToCanvas: (product: KeyringItem) => void;
  onClick?: (product: KeyringItem) => void;
  mode?: 'SHOP' | 'BUILDER';
  customStyle?: {
    bg?: string;
    text?: string;
    subText?: string;
    accent?: string;
    // ✅ 폰트 사이즈 추가
    nameSize?: number;
    catSize?: number;
    priceSize?: number;
  };
}

export const ProductCard = ({ product, onAddToCanvas, onClick, mode = 'BUILDER', customStyle }: ProductCardProps) => {
  const navigate = useNavigate();
  
  // 스타일 기본값 설정
  const bgColor = customStyle?.bg || 'black';
  const textColor = customStyle?.text || 'white';
  const subTextColor = customStyle?.subText || '#9ca3af'; 
  const accentColor = customStyle?.accent || '#34d399';
  
  // ✅ 폰트 크기 적용 (기본값 설정)
  const nameSize = customStyle?.nameSize ? `${customStyle.nameSize}px` : '16px';
  const catSize = customStyle?.catSize ? `${customStyle.catSize}px` : '12px';
  const priceSize = customStyle?.priceSize ? `${customStyle.priceSize}px` : '14px';

  const handleCardClick = () => {
    if (onClick) onClick(product);
    else navigate(`/product/${product.id}`);
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onAddToCanvas(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="border border-white/30 transition-all cursor-pointer group relative hover:border-opacity-50"
      style={{ backgroundColor: bgColor, borderColor: 'rgba(255,255,255,0.3)' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
    >
      <button
        onClick={handleQuickAction}
        className="absolute top-2 right-2 z-10 w-8 h-8 text-black rounded-full flex items-center justify-center transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        style={{ backgroundColor: accentColor }}
      >
        {mode === 'SHOP' ? <ShoppingCart size={16} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={3} />}
      </button>

      <div className="p-3 pb-2">
        {/* ✅ 폰트 크기 적용됨 */}
        <div className="font-bold mb-1" style={{ color: textColor, fontSize: nameSize }}>
          {product.name}
        </div>
        <div className="uppercase tracking-wider" style={{ color: subTextColor, fontSize: catSize }}>
          {product.sub_category || product.category}
        </div>
      </div>

      <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform ${product.status === 'soldout' ? 'opacity-50' : ''}`}
          />
        ) : (
          <div className="text-white/20 text-sm">NO IMAGE</div>
        )}
        {product.status === 'soldout' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-red-600 text-white px-6 py-2 font-bold text-sm tracking-wider">SOLD OUT</div>
          </div>
        )}
      </div>

      <div className="p-3 pt-2">
        {product.sale_price && product.sale_price < product.price ? (
          <div className="flex items-center gap-2">
            <div className="text-xs line-through" style={{ color: subTextColor }}>
              ₩{product.price.toLocaleString()}
            </div>
            {/* ✅ 폰트 크기 적용됨 */}
            <div className="font-semibold" style={{ color: accentColor, fontSize: priceSize }}>
              ₩{product.sale_price.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="font-semibold" style={{ color: accentColor, fontSize: priceSize }}>
            ₩{product.price.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};