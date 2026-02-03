import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, X, ZoomIn } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Header';
import { CanvasPreview } from '../components/CanvasPreview';

export const Cart = () => {
  const { settings } = useSiteSettings();
  const { cartItems, removeFromCart, getTotalPrice } = useCart();
  const [zoomedItem, setZoomedItem] = useState<any | null>(null);
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
              <div className="bg-zinc-900 border border-white/30 p-8 text-center text-zinc-500">
                Your cart is empty <br />
                <Link to="/" className="inline-block mt-4 bg-cyan-400 text-black font-bold py-2 px-6 uppercase hover:bg-cyan-300">
                  Start Building
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  if (!item || !item.id) return null;
                  const itemHeight = item.canvasHeight || 700;
                  return (
                    <div key={item.id} className="bg-zinc-900 border border-white/30 p-6 flex gap-6">
                      <div
                        className="w-32 h-32 bg-zinc-950 border border-white/20 flex-shrink-0 overflow-hidden relative group cursor-pointer"
                        onClick={() => setZoomedItem(item)}
                      >
                        {/* 썸네일: 작게 축소해서(customScale) 전체 모습 보여주기 */}
                        {item.items && item.items.length > 0 ? (
                          <CanvasPreview items={item.items} customScale={0.15} canvasHeight={itemHeight} />
                        ) : (
                          <img src={item.image} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn size={24} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{item.name}</h3>
                        <p className="text-zinc-400 text-sm">{item.items?.length || 0} items</p>
                        <div className="text-cyan-400 font-bold text-xl">₩{item.price.toLocaleString()}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 self-start">
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
              <h3 className="text-xl font-bold text-white uppercase mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6 text-zinc-400">
                <div className="flex justify-between"><span>Subtotal</span><span>₩{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>₩{shipping.toLocaleString()}</span></div>
                <div className="border-t border-white/30 pt-3 flex justify-between text-white font-bold text-lg">
                  <span>Total</span><span style={{ color: primaryColor }}>₩{total.toLocaleString()}</span>
                </div>
              </div>
              <button disabled={cartItems.length === 0} className="w-full font-bold py-3 uppercase bg-cyan-400 text-black hover:bg-cyan-300 disabled:bg-zinc-700 disabled:text-zinc-500">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ★ 확대 모달 수정됨 */}
      {zoomedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8"
          onClick={() => setZoomedItem(null)}
        >
          <button
            onClick={() => setZoomedItem(null)}
            className="absolute top-6 right-6 text-white hover:text-cyan-400 z-10"
          >
            <X size={32} />
          </button>

          {/* 컨테이너: overflow-y-auto 추가 (높이가 화면보다 크면 스크롤 생김 -> 잘림 방지) */}
          <div 
            className="relative bg-[#09090b] border border-zinc-800 rounded-lg shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 내부 박스: 저장된 높이(canvasHeight) 그대로 적용 */}
            <div 
              style={{ 
                width: '450px', 
                height: `${zoomedItem.canvasHeight || 700}px` 
              }}
              className="mx-auto"
            >
              {zoomedItem.items && zoomedItem.items.length > 0 ? (
                // isThumbnail=false (원본 크기 1.0배)
                <CanvasPreview 
                  items={zoomedItem.items} 
                  isThumbnail={false} 
                  canvasHeight={zoomedItem.canvasHeight || 700} 
                />
              ) : (
                <img src={zoomedItem.image} className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};