import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CreditCard, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { KeyringItem } from '../types';
import { useCart } from '../context/CartContext';
import { useCanvas } from '../context/CanvasContext';
import { useSiteSettings } from '../context/SiteSettingsContext'; // ✅

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addItemToCanvas } = useCanvas();
  const { settings, getBorderStyle } = useSiteSettings(); // ✅
  const [product, setProduct] = useState<KeyringItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  const bgColor = settings?.global_bg_color || '#000000';
  const textColor = settings?.global_text_color || '#FFFFFF';
  const nameColor = settings?.product_text_color || '#FFFFFF'; 
  const borderStyle = getBorderStyle();

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    try {
      if (!id) return;
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      const formatted: KeyringItem = { ...data, image: data.image_url };
      setProduct(formatted);
      setActiveImage(formatted.image);
    } catch (error) { navigate('/'); } finally { setLoading(false); }
  };

  const handleAddToCart = () => { if (!product) return; addToCart({ id: product.id, name: product.name, price: product.sale_price || product.price, image: product.image, quantity: 1 }); alert('Added to Cart!'); };
  const handleOrder = () => { handleAddToCart(); navigate('/cart'); };
  const handleAddToDropZone = () => { if (!product) return; addItemToCanvas(product); };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>Loading...</div>;
  if (!product) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      <Header cartCount={0} />
      <div className="max-w-[1300px] mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 hover:opacity-80" style={{ color: textColor, opacity: 0.6 }}><ArrowLeft size={20} /> BACK</button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border flex items-center justify-center" style={{ borderColor: borderStyle.borderColor }}>
              <img src={activeImage} alt={product.name} className="w-full h-full object-contain" />
            </div>
            {product.gallery_images && (
              <div className="grid grid-cols-4 gap-4">
                <button onClick={() => setActiveImage(product.image)} className={`aspect-square rounded-lg overflow-hidden border bg-zinc-900 ${activeImage === product.image ? 'border-white' : 'border-zinc-800'}`}><img src={product.image} className="w-full h-full object-contain" /></button>
                {product.gallery_images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(img)} className={`aspect-square rounded-lg overflow-hidden border bg-zinc-900 ${activeImage === img ? 'border-white' : 'border-zinc-800'}`}><img src={img} className="w-full h-full object-contain" /></button>
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
                <span className="text-2xl font-bold text-[#34d399]">₩{(product.sale_price || product.price).toLocaleString()}</span>
                {product.sale_price && <span className="text-lg line-through opacity-50">₩{product.price.toLocaleString()}</span>}
              </div>
            </div>
            <div className="prose prose-invert max-w-none"><p className="leading-relaxed whitespace-pre-wrap" style={{ color: textColor, opacity: 0.8 }}>{product.description}</p></div>
            <div className="space-y-3 pt-6 border-t" style={{ borderColor: borderStyle.borderColor }}>
              <button onClick={handleAddToDropZone} disabled={product.status === 'soldout'} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 border border-zinc-700"><Plus size={20} /> ADD TO DROP ZONE</button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleAddToCart} disabled={product.status === 'soldout'} className="py-4 bg-transparent border hover:bg-white/5 rounded-lg font-bold flex items-center justify-center gap-2" style={borderStyle}><ShoppingCart size={20} /> ADD TO CART</button>
                <button onClick={handleOrder} disabled={product.status === 'soldout'} className="py-4 bg-[#34d399] hover:bg-[#2ebb88] text-black rounded-lg font-bold flex items-center justify-center gap-2"><CreditCard size={20} /> ORDER</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};