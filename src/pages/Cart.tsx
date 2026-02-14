import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, X, ZoomIn, CreditCard } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { CanvasPreview } from '../components/CanvasPreview';
import { supabase } from '../lib/supabase';

declare global { interface Window { PortOne: any; } }

export const Cart = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { cartItems, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  
  const [zoomedItem, setZoomedItem] = useState<any | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const primaryColor = settings?.primary_color || '#34d399';
  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';
  const globalBorder = settings?.layout_border_color || 'rgba(255, 255, 255, 0.3)';

  const subtotal = getTotalPrice();
  const shipping = cartItems.length > 0 ? 3000 : 0;
  const total = subtotal + shipping;

  const handlePayment = async () => {
    if (!user) { alert('로그인이 필요한 서비스입니다.'); navigate('/login'); return; }
    if (cartItems.length === 0) return;
    setIsPaymentProcessing(true);
    try {
      const paymentId = `ord_${new Date().getTime()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderName = cartItems.length > 1 ? `${cartItems[0].name} 외 ${cartItems.length - 1}건` : cartItems[0].name;
      const response = await window.PortOne.requestPayment({
        storeId: 'store-7d613178-226c-45ea-b614-cbdf49a3ea05', 
        channelKey: 'channel-key-d8212d50-8ee1-489f-8fd0-a652e6a857b1', 
        paymentId: paymentId, orderName: orderName, totalAmount: total, currency: 'CURRENCY_KRW', payMethod: 'CARD',
        customer: { fullName: user.user_metadata?.full_name || '구매자', email: user.email, phoneNumber: '010-0000-0000' }
      });
      if (response.code != null) { alert(`결제 실패: ${response.message}`); setIsPaymentProcessing(false); return; }
      const { error } = await supabase.from('orders').insert({
        user_id: user.id, merchant_uid: paymentId, imp_uid: response.paymentId, status: 'PAID', total_price: total, items: cartItems, buyer_name: user.user_metadata?.full_name || '구매자', custom_image_url: cartItems[0].image || null
      });
      if (error) throw error;
      clearCart(); alert('결제가 성공적으로 완료되었습니다!'); navigate('/profile');
    } catch (error: any) { console.error('결제 처리 중 오류:', error); alert(`오류가 발생했습니다: ${error.message}`); } finally { setIsPaymentProcessing(false); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: globalBg, color: globalText }}>
      <Header />
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag size={32} className="text-cyan-400" />
          <h2 className="text-3xl font-bold uppercase tracking-wide">Your Cart</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="border p-12 text-center rounded-lg" style={{ borderColor: globalBorder, color: globalText, opacity: 0.7 }}>
                <p className="text-xl mb-4">장바구니가 비어있습니다.</p>
                <Link to="/" className="inline-block bg-cyan-400 text-black font-bold py-3 px-8 rounded-full uppercase hover:bg-cyan-300 transition-colors">쇼핑하러 가기</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="border p-6 flex gap-6 rounded-lg relative group" style={{ borderColor: globalBorder, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="w-32 h-32 bg-zinc-950 border border-white/20 flex-shrink-0 overflow-hidden relative cursor-pointer rounded-md" onClick={() => setZoomedItem(item)}>
                      {item.items && item.items.length > 0 ? (<CanvasPreview items={item.items} customScale={0.15} canvasHeight={item.canvasHeight || 700} />) : (<img src={item.image} className="w-full h-full object-cover" />)}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ZoomIn size={24} className="text-white" /></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm mb-2 opacity-60">{item.items ? `${item.items.length}개 부자재 조합` : '단품 상품'}</p>
                      <div className="text-cyan-400 font-bold text-xl">₩{item.price.toLocaleString()}</div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="opacity-50 hover:opacity-100 hover:text-red-400 absolute top-6 right-6 transition-all"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="border p-6 sticky top-24 rounded-lg" style={{ borderColor: globalBorder, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <h3 className="text-xl font-bold uppercase mb-6 flex items-center gap-2"><CreditCard size={20}/> Order Summary</h3>
              <div className="space-y-3 mb-6 text-sm opacity-80">
                <div className="flex justify-between"><span>상품 금액</span><span>₩{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>배송비</span><span>₩{shipping.toLocaleString()}</span></div>
                <div className="border-t pt-4 mt-2 flex justify-between font-bold text-xl" style={{ borderColor: globalBorder }}><span>총 결제금액</span><span style={{ color: primaryColor }}>₩{total.toLocaleString()}</span></div>
              </div>
              <button onClick={handlePayment} disabled={cartItems.length === 0 || isPaymentProcessing} className={`w-full font-bold py-4 uppercase rounded-lg transition-all flex items-center justify-center gap-2 ${cartItems.length === 0 || isPaymentProcessing ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-lg'}`}>{isPaymentProcessing ? '결제창 호출 중...' : 'CHECKOUT (결제하기)'}</button>
              <p className="text-xs text-zinc-500 mt-4 text-center">KG이니시스(테스트) 환경에서 결제가 진행됩니다.</p>
            </div>
          </div>
        </div>
      </div>
      {zoomedItem && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setZoomedItem(null)}>
          <button onClick={() => setZoomedItem(null)} className="absolute top-6 right-6 text-white hover:text-cyan-400 z-10 transition-colors"><X size={32} /></button>
          <div className="relative bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar p-1" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '450px', height: `${zoomedItem.canvasHeight || 700}px` }} className="mx-auto bg-black">
              {zoomedItem.items && zoomedItem.items.length > 0 ? (<CanvasPreview items={zoomedItem.items} isThumbnail={false} canvasHeight={zoomedItem.canvasHeight || 700} />) : (<img src={zoomedItem.image} className="w-full h-full object-contain" />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};