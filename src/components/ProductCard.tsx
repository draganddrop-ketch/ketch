import { useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, Heart } from 'lucide-react';
import { KeyringItem } from '../types';
import { useLike } from '../context/LikeContext';

interface ProductCardProps {
  product: KeyringItem;
  onAddToCanvas: (product: KeyringItem) => void;
  onClick?: (product: KeyringItem) => void;
  mode?: 'SHOP' | 'BUILDER';
  /** * 'vertical': 기존 세로형 카드 (기본값)
   * 'horizontal': 롤링 리스트용 가로형 카드 
   */
  variant?: 'vertical' | 'horizontal'; 
  customStyle?: {
    bg?: string; text?: string; subText?: string; accent?: string;
    nameSize?: number; catSize?: number; priceSize?: number;
  };
}

export const ProductCard = ({ 
  product, 
  onAddToCanvas, 
  onClick, 
  mode = 'BUILDER', 
  variant = 'vertical', // 기본값은 세로형
  customStyle 
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { isLiked, toggleLike } = useLike();
  const liked = isLiked(product.id);
  
  // 스타일 정의
  const bgColor = customStyle?.bg || 'black';
  const textColor = customStyle?.text || 'white';
  const subTextColor = customStyle?.subText || '#9ca3af'; 
  const accentColor = customStyle?.accent || '#34d399';
  
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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(product.id);
  };

  // ✅ [Case 1] 롤링 리스트용 (가로형 디자인 - Horizontal)
  if (variant === 'horizontal') {
    return (
      <div
        onClick={handleCardClick}
        className="group relative flex gap-3 bg-transparent cursor-pointer p-2 rounded-lg transition-all hover:bg-white/5 h-full items-center"
      >
        {/* 이미지 (작게) */}
        <div className="w-[80px] h-[80px] flex-shrink-0 bg-zinc-900 rounded-md overflow-hidden relative border border-white/10 group-hover:border-white/30">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">NO IMG</div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <div className="text-[10px] uppercase tracking-wider truncate" style={{ color: subTextColor }}>
            {product.sub_category || product.category}
          </div>
          <div className="font-bold leading-tight truncate" style={{ color: textColor, fontSize: '14px' }}>
            {product.name}
          </div>
          <div className="font-bold" style={{ color: accentColor, fontSize: '13px' }}>
            ₩{product.sale_price?.toLocaleString() || product.price.toLocaleString()}
          </div>
          
          {/* 태그 */}
          <div className="flex gap-1 mt-1">
             <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">당일배송</span>
             {product.sale_price && <span className="text-[9px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded">SALE</span>}
          </div>
        </div>

        {/* 버튼들 (작게 세로 배치) */}
        <div className="flex flex-col gap-2">
          <button onClick={handleQuickAction} className="w-7 h-7 rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform shadow-lg" style={{ backgroundColor: accentColor }}>
            <ShoppingCart size={12} strokeWidth={3} />
          </button>
          <button onClick={handleLike} className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all hover:scale-110 shadow-lg ${liked ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'}`}>
            <Heart size={12} fill={liked ? "currentColor" : "none"} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // ✅ [Case 2] 일반 상품 목록용 (기존 세로형 디자인 - Vertical)
  // 기존 코드 구조 유지 + 하트 버튼 추가
  return (
    <div
      onClick={handleCardClick}
      className="border border-white/30 transition-all cursor-pointer group relative hover:border-opacity-50 flex flex-col h-full"
      style={{ backgroundColor: bgColor, borderColor: 'rgba(255,255,255,0.3)' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
    >
      {/* 우측 상단 플로팅 버튼 그룹 (장바구니 + 하트) */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
        <button
          onClick={handleQuickAction}
          className="w-8 h-8 text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: accentColor }}
        >
          {mode === 'SHOP' ? <ShoppingCart size={16} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={3} />}
        </button>
        
        {/* 추가된 하트 버튼 */}
        <button
          onClick={handleLike}
          className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg hover:scale-110 transition-transform ${
            liked ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'
          }`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-3 pb-2">
        <div className="font-bold mb-1 truncate" style={{ color: textColor, fontSize: nameSize }}>
          {product.name}
        </div>
        <div className="uppercase tracking-wider text-xs" style={{ color: subTextColor, fontSize: catSize }}>
          {product.sub_category || product.category}
        </div>
      </div>

      <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-contain p-4 group-hover:scale-105 transition-transform ${product.status === 'soldout' ? 'opacity-50' : ''}`}
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

      <div className="p-3 pt-2 mt-auto">
        {product.sale_price && product.sale_price < product.price ? (
          <div className="flex items-center gap-2">
            <div className="text-xs line-through" style={{ color: subTextColor }}>
              ₩{product.price.toLocaleString()}
            </div>
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