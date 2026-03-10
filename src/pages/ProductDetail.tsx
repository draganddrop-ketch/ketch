import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CreditCard, Plus, Layers, Minus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { KeyringItem } from '../types';
import { useCart } from '../context/CartContext';
import { useCanvas } from '../context/CanvasContext';
import { useSection } from '../context/SectionContext';
import { useSiteSettings } from '../context/SiteSettingsContext'; // ✅
import { CanvasBuilder } from '../components/CanvasBuilder';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currentSection } = useSection();
  const { addItemToCanvas, canvasItems, setCanvasItems } = useCanvas();
  const { settings, getBorderStyle } = useSiteSettings(); // ✅
  const [product, setProduct] = useState<KeyringItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isDesktopDropzoneMinimized, setIsDesktopDropzoneMinimized] = useState(false);
  const [isMobileDropzoneOpen, setIsMobileDropzoneOpen] = useState(false);

  const bgColor = settings?.global_bg_color || '#000000';
  const textColor = settings?.global_text_color || '#000000';
  const nameColor = textColor;
  const accentColor = settings?.product_accent_color || settings?.accent_color || '#34d399';
  const borderStyle = getBorderStyle();

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    try {
      if (!id) return;
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      const thumbnailImage = data.image_url || data.image || '';
      const formatted: KeyringItem = {
        ...data,
        image: thumbnailImage,
        image_url: thumbnailImage,
        dropzone_image_url: data.dropzone_image_url || thumbnailImage
      };
      setProduct(formatted);
      setActiveImage(formatted.image);
    } catch (error) { navigate('/'); } finally { setLoading(false); }
  };

  const handleAddToCart = () => { if (!product) return; addToCart({ id: product.id, name: product.name, price: product.sale_price || product.price, image: product.image, quantity: 1 }); alert('Added to Cart!'); };
  const handleOrder = () => { handleAddToCart(); navigate('/cart'); };
  const handleAddToDropZone = () => { if (!product) return; addItemToCanvas(product); };
  const handleCanvasItemsChange = (items: any[]) => setCanvasItems(items as any);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>Loading...</div>;
  if (!product) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      <Header cartCount={0} />
      <div className="w-full px-4 md:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 hover:opacity-80" style={{ color: textColor, opacity: 0.6 }}><ArrowLeft size={20} /> BACK</button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden border flex items-center justify-center border-gray-200">
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
            </div>
            {product.gallery_images && (
              <div className="grid grid-cols-4 gap-4">
                <button onClick={() => setActiveImage(product.image)} className={`aspect-square rounded-lg overflow-hidden border bg-white ${activeImage === product.image ? 'border-gray-900' : 'border-gray-200'}`}><img src={product.image} className="w-full h-full object-contain" /></button>
                {product.gallery_images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(img)} className={`aspect-square rounded-lg overflow-hidden border bg-white ${activeImage === img ? 'border-gray-900' : 'border-gray-200'}`}><img src={img} className="w-full h-full object-contain" /></button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-gray-300">{product.category}</span>
                {product.status === 'soldout' && <span className="px-3 py-1 bg-red-900/50 text-red-200 rounded-full text-xs border border-red-800">SOLD OUT</span>}
              </div>
              <h1 className="text-4xl font-bold mb-4 font-mono" style={{ color: nameColor }}>{product.name}</h1>
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold" style={{ color: accentColor }}>₩{(product.sale_price || product.price).toLocaleString()}</span>
                {product.sale_price && <span className="text-lg line-through opacity-50">₩{product.price.toLocaleString()}</span>}
              </div>
            </div>
            <div className="prose max-w-none"><p className="leading-relaxed whitespace-pre-wrap" style={{ color: textColor }}>{product.description}</p></div>
            <div className="space-y-3 pt-6 border-t" style={{ borderColor: borderStyle.borderColor }}>
              {currentSection === 'BUILDER' && (
                <button onClick={handleAddToDropZone} disabled={product.status === 'soldout'} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 border border-zinc-700"><Plus size={20} /> ADD TO DROP ZONE</button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleAddToCart} disabled={product.status === 'soldout'} className="py-4 bg-transparent border hover:bg-white/5 rounded-lg font-bold flex items-center justify-center gap-2" style={borderStyle}><ShoppingCart size={20} /> ADD TO CART</button>
                <button onClick={handleOrder} disabled={product.status === 'soldout'} className="py-4 text-black rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-95 transition" style={{ backgroundColor: accentColor }}><CreditCard size={20} /> ORDER</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {currentSection === 'BUILDER' && (
        <>
          <div className="hidden lg:block fixed bottom-6 right-6 z-40">
            {isDesktopDropzoneMinimized ? (
              <button
                onClick={() => setIsDesktopDropzoneMinimized(false)}
                className="px-4 py-3 rounded-full bg-black text-white shadow-2xl flex items-center gap-2 border border-white/20"
              >
                <Layers size={16} />
                DROP ZONE ({canvasItems.length})
              </button>
            ) : (
              <div className="w-[380px] bg-white/95 backdrop-blur rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="h-11 px-4 flex items-center justify-between bg-black text-white">
                  <div className="text-xs font-bold tracking-wider">DROP ZONE ({canvasItems.length})</div>
                  <button
                    onClick={() => setIsDesktopDropzoneMinimized(true)}
                    className="p-1 rounded hover:bg-white/10"
                    aria-label="Dropzone minimize"
                  >
                    <Minus size={16} />
                  </button>
                </div>
                <div className="h-[430px] overflow-hidden">
                  <CanvasBuilder onItemsChange={handleCanvasItemsChange} initialHeight={420} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsMobileDropzoneOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-black text-white shadow-2xl border border-white/20 flex items-center justify-center"
            aria-label="Open dropzone"
          >
            <Layers size={22} />
            {canvasItems.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[var(--accent-color)] text-black text-[11px] font-bold flex items-center justify-center">
                {canvasItems.length}
              </span>
            )}
          </button>

          {isMobileDropzoneOpen && (
            <div className="lg:hidden fixed inset-0 z-[60] bg-black/60">
              <div className="absolute inset-x-0 bottom-0 h-[78vh] bg-white rounded-t-2xl overflow-hidden shadow-2xl">
                <div className="h-12 px-4 bg-black text-white flex items-center justify-between">
                  <div className="text-xs font-bold tracking-wider">DROP ZONE ({canvasItems.length})</div>
                  <button onClick={() => setIsMobileDropzoneOpen(false)} className="p-1 rounded hover:bg-white/10" aria-label="Close dropzone">
                    <X size={18} />
                  </button>
                </div>
                <div className="h-[calc(78vh-48px)] overflow-hidden">
                  <CanvasBuilder onItemsChange={handleCanvasItemsChange} initialHeight={420} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
