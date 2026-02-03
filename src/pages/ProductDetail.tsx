import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CreditCard, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { KeyringItem } from '../types';
import { useCart } from '../context/CartContext';
import { useCanvas } from '../context/CanvasContext';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addItemToCanvas } = useCanvas();
  const [product, setProduct] = useState<KeyringItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      if (!id) return;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const formattedProduct: KeyringItem = {
        id: data.id,
        name: data.name,
        category: data.category,
        price: data.price,
        sale_price: data.sale_price,
        image: data.image_url,
        description: data.description,
        gallery_images: data.gallery_images,
        status: data.status,
      };

      setProduct(formattedProduct);
      setActiveImage(formattedProduct.image);
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image: product.image,
      quantity: 1,
    });
    alert('Added to Cart!');
  };

  const handleOrder = () => {
    if (!product) return;
    handleAddToCart(); // 장바구니에 담고
    navigate('/cart'); // 바로 장바구니(결제예정) 페이지로 이동
  };

  const handleAddToDropZone = () => {
    if (!product) return;
    addItemToCanvas(product);
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header cartCount={0} onSearchChange={() => {}} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          BACK
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.gallery_images && product.gallery_images.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveImage(product.image)}
                  className={`aspect-square rounded-lg overflow-hidden border ${
                    activeImage === product.image ? 'border-white' : 'border-zinc-800'
                  }`}
                >
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </button>
                {product.gallery_images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden border ${
                      activeImage === img ? 'border-white' : 'border-zinc-800'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-gray-300">
                  {product.category}
                </span>
                {product.status === 'soldout' && (
                  <span className="px-3 py-1 bg-red-900/50 text-red-200 rounded-full text-xs font-medium border border-red-800">
                    SOLD OUT
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-4 font-mono">{product.name}</h1>
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold text-[#34d399]">
                  ₩{(product.sale_price || product.price).toLocaleString()}
                </span>
                {product.sale_price && (
                  <span className="text-lg text-gray-500 line-through">
                    ₩{product.price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                {product.description || "No description available."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-zinc-800">
              {/* 1. Add to Drop Zone Button */}
              <button
                onClick={handleAddToDropZone}
                disabled={product.status === 'soldout'}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                ADD TO DROP ZONE
              </button>

              <div className="grid grid-cols-2 gap-3">
                {/* 2. Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.status === 'soldout'}
                  className="py-4 bg-transparent border border-white/30 hover:border-white text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart size={20} />
                  ADD TO CART
                </button>

                {/* 3. Order Button */}
                <button
                  onClick={handleOrder}
                  disabled={product.status === 'soldout'}
                  className="py-4 bg-[#34d399] hover:bg-[#2ebb88] text-black rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard size={20} />
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