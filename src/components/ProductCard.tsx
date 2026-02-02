import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { KeyringItem } from '../types';

interface ProductCardProps {
  product: KeyringItem;
  onAddToCanvas: (product: KeyringItem) => void;
}

export const ProductCard = ({ product, onAddToCanvas }: ProductCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCanvas(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="border border-white/30 bg-black transition-all cursor-pointer group relative hover:border-opacity-50"
      style={{
        ['--hover-border' as any]: 'var(--accent-color)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-color)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
    >
      <button
        onClick={handleAddClick}
        className="absolute top-2 right-2 z-10 w-8 h-8 text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundColor: 'var(--accent-color)',
        }}
        onMouseEnter={(e) => {
          const currentBg = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
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

      <div className="aspect-square bg-zinc-900 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="text-white/20 text-sm">NO IMAGE</div>
        )}
      </div>

      <div className="p-3 pt-2">
        <div className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>
          ₩{product.price.toLocaleString()}
        </div>
      </div>
    </div>
  );
};
