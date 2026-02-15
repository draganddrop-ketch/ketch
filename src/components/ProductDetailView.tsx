import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, CreditCard, Plus } from 'lucide-react';
import { KeyringItem } from '../types';
import { useCart } from '../context/CartContext';
import { useCanvas } from '../context/CanvasContext';
import { useSection } from '../context/SectionContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface ProductDetailViewProps {
  product: KeyringItem;
  onBack: () => void;
}

export const ProductDetailView = ({ product, onBack }: ProductDetailViewProps) => {
  const { addToCart } = useCart();
  const { addItemToCanvas } = useCanvas();
  const { currentSection } = useSection();
  const { settings, getBorderStyle } = useSiteSettings();
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const textColor = settings?.global_text_color || '#000000';
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';
  const borderStyle = getBorderStyle();

  useEffect(() => {
    setActiveImage(product.image);
  }, [product]);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.image,
      quantity: 1,
    });
    alert('Added to Cart!');
  };

  const handleAddToDropZone = () => {
    addItemToCanvas(product);
  };

  return (
    <div className="w-full animate-fade-in" style={{ color: textColor }}>
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 transition-opacity hover:opacity-80"
      >
        <ArrowLeft size={20} />
        BACK TO LIST
      </button>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이미지 섹션 (수정됨: 잘림 방지) */}
          <div className="space-y-4">
            <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
              <img
                src={activeImage}
                alt={product.name}
                // ✅ 수정됨: cover -> contain
                className="w-full h-full object-contain"
              />
            </div>
            {product.gallery_images && product.gallery_images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveImage(product.image)}
                  className={`aspect-square rounded-lg overflow-hidden border bg-zinc-900 ${
                    activeImage === product.image ? 'border-white' : 'border-zinc-800'
                  }`}
                >
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                </button>
                {product.gallery_images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden border bg-zinc-900 ${
                      activeImage === img ? 'border-white' : 'border-zinc-800'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 정보 섹션 */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-gray-600">
                  {product.category}
                </span>
                {/* 보조 카테고리 표시 */}
                {product.sub_category && (
                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs" style={{ color: accentColor }}>
                    {product.sub_category}
                  </span>
                )}
                {product.status === 'soldout' && (
                  <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs border border-red-900">
                    SOLD OUT
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2 font-mono">{product.name}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                  ₩{(product.sale_price || product.price).toLocaleString()}
                </span>
                {product.sale_price && (
                  <span className="text-base text-gray-500 line-through">
                    ₩{product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* 상세설명: HTML 렌더링 지원 (RichTextEditor 결과물) */}
            <div className="prose prose-sm max-w-none border-t pt-4" style={{ borderColor: borderStyle.borderColor }}>
              <div 
                className="leading-relaxed"
                style={{ color: textColor }}
                dangerouslySetInnerHTML={{ __html: product.description || "No description available." }}
              />
            </div>

            {/* 버튼 그룹 */}
            <div className="space-y-3 pt-4">
              {currentSection === 'BUILDER' && (
                <button
                  onClick={handleAddToDropZone}
                  disabled={product.status === 'soldout'}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-zinc-700 hover:border-zinc-500"
                >
                  <Plus size={18} />
                  ADD TO DROP ZONE
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.status === 'soldout'}
                  className="py-3 border border-gray-300 hover:border-gray-500 text-black rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingCart size={18} />
                  CART
                </button>
                <button
                  disabled={product.status === 'soldout'}
                  className="py-3 text-black rounded-lg font-bold flex items-center justify-center gap-2 transition hover:brightness-95"
                  style={{ backgroundColor: accentColor }}
                >
                  <CreditCard size={18} />
                  ORDER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
