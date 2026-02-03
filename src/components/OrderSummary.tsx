import { ShoppingCart, CreditCard, Heart, Share2 } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  onAddToCart: () => void;
  onCheckout: () => void;
  onSaveDesign?: () => void;
  onShare?: () => void;
}

export const OrderSummary = ({ items, onAddToCart, onCheckout, onSaveDesign, onShare }: OrderSummaryProps) => {
  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="bg-black border border-white/30 p-6">
      <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-sm">
        ORDER SUMMARY
      </h3>

      <div className="space-y-3 mb-6 max-h-40 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-white/40 text-xs italic">No items added yet</div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="flex justify-between items-start text-xs">
              <div className="text-white/70 flex-1">
                <span className="mr-2" style={{ color: 'var(--accent-color)' }}>{index + 1}.</span>
                {item.name}
              </div>
              <div className="font-semibold ml-3" style={{ color: 'var(--accent-color)' }}>
                ₩{item.price.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/30 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-white/70 uppercase text-sm tracking-wide">
            ITEM PRICE
          </span>
          <span className="text-2xl font-bold" style={{ color: 'var(--accent-color)' }}>
            ₩{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onAddToCart}
          disabled={items.length === 0}
          className="bg-white/10 text-white border border-white/30 py-3 px-4 uppercase text-sm font-semibold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onMouseEnter={(e) => {
            if (items.length > 0) {
              e.currentTarget.style.backgroundColor = 'rgba(var(--accent-color-rgb), 0.2)';
              e.currentTarget.style.borderColor = 'var(--accent-color)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          <ShoppingCart size={16} />
          ADD CART
        </button>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="text-black py-3 px-4 uppercase text-sm font-bold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--accent-color)',
          }}
          onMouseEnter={(e) => {
            if (items.length > 0) {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          <CreditCard size={16} />
          ORDER
        </button>

        <button
          onClick={onSaveDesign}
          disabled={items.length === 0}
          className="bg-blue-600/20 text-blue-400 border border-blue-500/50 py-3 px-4 uppercase text-sm font-semibold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-600/30 hover:border-blue-400"
        >
          <Heart size={16} />
          SAVE DESIGN
        </button>
        <button
          onClick={onShare}
          disabled={items.length === 0}
          className="bg-blue-600/20 text-blue-400 border border-blue-500/50 py-3 px-4 uppercase text-sm font-semibold tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-blue-600/30 hover:border-blue-400"
        >
          <Share2 size={16} />
          SHARE
        </button>
      </div>
    </div>
  );
};
