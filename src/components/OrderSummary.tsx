import { Heart, Share2, ShoppingCart, CreditCard } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

interface OrderSummaryProps {
  items: { id: string; name: string; price: number }[];
  onAddToCart: () => void;
  onCheckout: () => void;
  onSaveDesign: () => void;
  onShare: () => void;
}

export const OrderSummary = ({ items, onAddToCart, onCheckout, onSaveDesign, onShare }: OrderSummaryProps) => {
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const { selectItem, selectedId } = useCanvas();

  return (
    <div className="border border-white/30 bg-black p-6">
      <h2 className="text-white font-bold uppercase tracking-wider mb-2 text-sm">
        ORDER SUMMARY
      </h2>

      <div className="space-y-0.2 mb-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <p className="text-zinc-500 text-sm py-1">No items selected</p>
        ) : (
          items.map((item, index) => (
            <div 
              key={index} 
              onClick={() => selectItem(item.id)}
              // ★ 수정 포인트: 
              // 1. px-2 -mx-2 py-1 rounded : 모든 아이템에 미리 적용 (공간 확보)
              // 2. 선택되면 bg-white/10, 안 되면 hover:bg-white/5 (투명도 차이만 둠)
              className={`flex justify-between text-sm cursor-pointer transition-all px-2 -mx-2 py-1 rounded ${
                selectedId === item.id 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5 text-zinc-300'
              }`}
            >
              <span className={`truncate mr-4 ${selectedId === item.id ? 'text-white font-bold' : ''}`}>
                <span className="text-[#34d399] mr-2">{index + 1}.</span> 
                {item.name}
              </span>
              <span className="text-[#34d399] font-mono whitespace-nowrap font-bold">
                ₩{item.price.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/20 pt-4 mb-6">
        <div className="flex justify-between items-end">
          <span className="text-zinc-400 text-sm uppercase tracking-wider">ITEM PRICE</span>
          <span className="text-[#34d399] text-2xl font-bold font-mono">
            ₩{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onAddToCart}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 border border-zinc-700"
          >
            <ShoppingCart size={16} />
            ADD CART
          </button>
          <button
            onClick={onCheckout}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 bg-[#34d399] hover:bg-[#2ebb88] text-black text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <CreditCard size={16} />
            ORDER
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onSaveDesign}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 border border-blue-900/50 bg-[#0f172a] hover:bg-[#1e293b] text-blue-400 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Heart size={16} />
            SAVE DESIGN
          </button>
          <button
            onClick={onShare}
            disabled={items.length === 0}
            className="flex items-center justify-center gap-2 py-3 border border-blue-900/50 bg-[#0f172a] hover:bg-[#1e293b] text-blue-400 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            <Share2 size={16} />
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
};