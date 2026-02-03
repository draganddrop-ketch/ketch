import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { KeyringItem } from '../types';

interface ProductCardProps {
  product: KeyringItem;
  onAddToCanvas: (product: KeyringItem) => void; // + 버튼 (드롭존 추가)
  onClick?: (product: KeyringItem) => void;      // 상세페이지 이동 (새로 추가)
}

export const ProductCard = ({ product, onAddToCanvas, onClick }: ProductCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onClick) {
      onClick(product); // Home에서 전달받은 상세페이지 이동 함수 실행
    } else {
      navigate(`/product/${product.id}`); // 비상용 기본 이동
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 상세페이지 이동 방지
    onAddToCanvas(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="border border-white/30 bg-black transition-all cursor-pointer group relative hover:border-opacity-50"
      style={{
        ['--hover-border' as any]: 'var(--accent-color, #34d399)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-color, #34d399)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
    >
      <button
        onClick={handleAddClick}
        className="absolute top-2 right-2 z-10 w-8 h-8 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundColor: 'var(--accent-color, #34d399)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
        }}
        title="Add to Canvas"
      >
        <Plus size={20} strokeWidth={3} />
      </button>

      <div className="p-3 pb-2">
        <div className="text-white font-bold text-base mb-1">
          {product.name}
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">
          {product.sub_category || product.category}
        </div>
      </div>

      <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
              product.status === 'soldout' ? 'opacity-50' : ''
            }`}
          />
        ) : (
          <div className="text-white/20 text-sm">NO IMAGE</div>
        )}
        {product.status === 'soldout' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-red-600 text-white px-6 py-2 font-bold text-sm tracking-wider">
              SOLD OUT
            </div>
          </div>
        )}
      </div>

      <div className="p-3 pt-2">
        {product.sale_price && product.sale_price < product.price ? (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 line-through">
              ₩{product.price.toLocaleString()}
            </div>
            <div className="font-semibold text-sm" style={{ color: 'var(--accent-color, #34d399)' }}>
              ₩{product.sale_price.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="font-semibold text-sm" style={{ color: 'var(--accent-color, #34d399)' }}>
            ₩{product.price.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};