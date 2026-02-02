import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, X, ZoomIn } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Header';

export const Cart = () => {
  const { settings } = useSiteSettings();
  const { cartItems, removeFromCart, getTotalPrice } = useCart();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const primaryColor = settings?.primary_color || '#34d399';

  const subtotal = getTotalPrice();
  const shipping = cartItems.length > 0 ? 3000 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag size={32} className="text-cyan-400" />
          <h2 className="text-3xl font-bold text-white uppercase tracking-wide">Your Cart</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="bg-zinc-900 border border-white/30 p-8 text-center">
                <div className="text-zinc-500 text-lg mb-4">Your cart is empty</div>
                <p className="text-zinc-600 text-sm mb-6">
                  Build your custom keyring on the builder page
                </p>
                <Link
                  to="/"
                  className="inline-block bg-cyan-400 text-black font-bold py-3 px-8 uppercase tracking-wide hover:bg-cyan-300 transition-colors"
                >
                  Start Building
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  if (!item || typeof item.price !== 'number' || !item.name || !item.id) {
                    console.warn('Invalid cart item:', item);
                    return null;
                  }
                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-900 border border-white/30 p-6 flex gap-6"
                    >
                      <div
                        className="w-32 h-32 bg-zinc-950 border border-white/20 flex-shrink-0 overflow-hidden relative group cursor-pointer"
                        onClick={() => setZoomedImage(item.image)}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn size={24} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2">{item.name}</h3>
                        <p className="text-zinc-400 text-sm mb-3">
                          {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''} included
                        </p>
                        <div className="text-cyan-400 font-bold text-xl">
                          ₩{item.price.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors self-start"
                        title="Remove from cart"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-white/30 p-6 sticky top-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>₩{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Shipping</span>
                  <span>₩{shipping.toLocaleString()}</span>
                </div>
                <div className="border-t border-white/30 pt-3 flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span style={{ color: primaryColor }}>₩{total.toLocaleString()}</span>
                </div>
              </div>

              <button
                disabled={cartItems.length === 0}
                className={`w-full font-bold py-3 uppercase tracking-wide transition-colors ${
                  cartItems.length === 0
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-cyan-400 text-black hover:bg-cyan-300'
                }`}
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-cyan-400 transition-colors z-10"
          >
            <X size={32} />
          </button>
          <div className="flex items-center justify-center max-w-[800px] max-h-[80vh]">
            <img
              src={zoomedImage}
              alt="Zoomed canvas"
              className="w-auto h-auto max-w-[800px] max-h-[80vh] object-contain bg-black border border-zinc-800 rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
