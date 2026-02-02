import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  gallery_images: string[];
}

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProduct(data);
        setSelectedImage(data.image_url || '');
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCanvas = () => {
    if (product && (window as any).__addItemToCanvas) {
      (window as any).__addItemToCanvas({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image_url,
      });
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-700 text-sm mb-2">LOADING_PRODUCT...</div>
          <div className="text-zinc-800 text-xs">FETCHING_DETAILS</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-700 text-lg mb-4">PRODUCT_NOT_FOUND</div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-cyan-400 text-black font-medium hover:bg-cyan-300 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const allImages = [
    product.image_url,
    ...(product.gallery_images || []),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-black">
      <Header cartCount={0} />

      <div className="max-w-[1300px] mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="aspect-square bg-zinc-900 border border-white/30 flex items-center justify-center overflow-hidden">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-white/20 text-lg">NO IMAGE</div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square bg-zinc-900 border-2 transition-all overflow-hidden ${
                      selectedImage === img
                        ? 'border-cyan-400'
                        : 'border-white/30 hover:border-white/50'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-xs text-cyan-400 uppercase tracking-wider mb-2">
                {product.category}
              </div>
              <h1 className="text-4xl text-white font-bold mb-4">
                {product.name}
              </h1>
              <div className="text-3xl text-cyan-400 font-bold">
                ₩{product.price.toLocaleString()}
              </div>
            </div>

            {product.description && (
              <div className="border-t border-white/20 pt-6">
                <h2 className="text-white font-bold uppercase tracking-wider mb-3 text-sm">
                  DESCRIPTION
                </h2>
                <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <div className="border-t border-white/20 pt-6">
              <button
                onClick={handleAddToCanvas}
                className="w-full px-8 py-4 bg-cyan-400 text-black font-bold text-lg hover:bg-cyan-300 transition-colors uppercase tracking-wider"
              >
                Add to Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
