import { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, CreditCard, Plus, Minus, Share2, Heart } from 'lucide-react';
import { KeyringItem } from '../types';
import { useCart } from '../context/CartContext';
import { useCanvas } from '../context/CanvasContext';
import { useSection } from '../context/SectionContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLike } from '../context/LikeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ProductTabs } from './ProductTabs.tsx';
import { ShareModal } from './ShareModal';

interface ProductDetailViewProps {
  product: KeyringItem;
  onBack: () => void;
}

export const ProductDetailView = ({ product, onBack }: ProductDetailViewProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addItemToCanvas } = useCanvas();
  const { currentSection } = useSection();
  const { settings, getBorderStyle } = useSiteSettings();
  const { user } = useAuth();
  const { isLiked, toggleLike } = useLike();
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [quantity, setQuantity] = useState(1);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const textColor = settings?.global_text_color || '#000000';
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';
  const borderStyle = getBorderStyle();
  const s = settings as any;
  const detailPaddingTop = s?.detail_page_padding_top ?? 32;
  const detailMaxWidth = s?.detail_page_max_width ?? 1300;
  const detailPriceFont = s?.detail_price_font || null;
  const detailPriceSize = s?.detail_price_size || 24;
  const detailPriceColor = s?.detail_price_color || accentColor;
  const detailPriceWeight = s?.detail_price_weight || '700';
  const detailCatFont = s?.detail_category_font || null;
  const detailCatSize = s?.detail_category_size || 12;
  const detailCatColor = s?.detail_category_color || '#888';

  useEffect(() => {
    setActiveImage(product.image);
  }, [product]);
  useEffect(() => {
    setQuantity(1);
  }, [product.id]);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.image,
      quantity
    });
    alert('Added to Cart!');
  };

  const handleAddToDropZone = () => {
    addItemToCanvas(product);
  };

  const handleOrder = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleLike = () => {
    if (!user) {
      alert('로그인이 필요한 기능입니다.');
      navigate('/login');
      return;
    }
    toggleLike(product.id);
  };

  const summaryText = (product.short_description || '').trim();
  const liked = isLiked(product.id);
  const shareTitle = product.name;
  const shareDescription = summaryText || settings?.share_description || '';
  const shareImage = product.image || settings?.share_image_url || settings?.logo_url || '';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="w-full animate-fade-in" style={{ color: textColor }}>
      <div className="w-full mx-auto" style={{ maxWidth: `${detailMaxWidth}px`, paddingTop: `${detailPaddingTop}px` }}>


        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 이미지 섹션 (수정됨: 잘림 방지) */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
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
                  className={`aspect-square rounded-lg overflow-hidden border bg-white ${
                    activeImage === product.image ? 'border-gray-900' : 'border-gray-200'
                  }`}
                >
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                </button>
                {product.gallery_images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden border bg-white ${
                      activeImage === img ? 'border-gray-900' : 'border-gray-200'
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
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-zinc-800 rounded" style={{ color: detailCatColor, fontSize: `${detailCatSize}px`, fontFamily: detailCatFont ? `'${detailCatFont}', sans-serif` : 'inherit' }}>
                  {product.category}
                </span>
                {/* 보조 카테고리 표시 */}
                {product.sub_category && (
                  <span className="px-2 py-1 bg-zinc-800 rounded" style={{ color: accentColor, fontSize: `${detailCatSize}px`, fontFamily: detailCatFont ? `'${detailCatFont}', sans-serif` : 'inherit' }}>
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Share product"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={handleLike}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${liked ? 'bg-red-500 border-red-500 text-white' : 'border-gray-200 text-gray-500 hover:text-red-500'}`}
                    aria-label="Like product"
                  >
                    <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <span style={{ color: detailPriceColor, fontSize: `${detailPriceSize}px`, fontWeight: detailPriceWeight, fontFamily: detailPriceFont ? `'${detailPriceFont}', sans-serif` : 'inherit' }}>
                  ₩{(product.sale_price || product.price).toLocaleString()}
                </span>
                {product.sale_price && (
                  <span className="line-through" style={{ color: textColor, opacity: 0.5, fontSize: `${Math.max(detailPriceSize - 6, 12)}px` }}>
                    ₩{product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: textColor }}>
              {summaryText || '상품 설명이 없습니다.'}
            </div>

            <div className="flex items-center justify-between border rounded-lg px-4 py-3" style={borderStyle}>
              <span className="text-sm font-semibold">수량</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="w-14 text-center border border-gray-200 rounded-md py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="space-y-3 pt-4">
              {product.product_type === 'BUILDER' && (
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
                  onClick={handleOrder}
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
        <ProductTabs product={product} />
      </div>
      <ShareModal
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={shareTitle}
        description={shareDescription}
        image={shareImage}
        url={shareUrl}
        kakaoKey={settings?.kakao_js_key || ''}
      />
    </div>
  );
};