import { Copy, Check } from 'lucide-react';
import { SelectedItem } from '../types';
import { useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface BillOfMaterialsProps {
  selectedItems: SelectedItem[];
}

export const BillOfMaterials = ({ selectedItems }: BillOfMaterialsProps) => {
  const { settings } = useSiteSettings();
  const [copied, setCopied] = useState(false);
  const primaryColor = settings?.primary_color || '#34d399';

  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleOrderNow = async () => {
    const orderText = `
KETCH KEYRING ORDER
==================
${selectedItems.map((item, i) => `${i + 1}. ${item.name} - ₩${item.price.toLocaleString()}`).join('\n')}
------------------
TOTAL: ₩${total.toLocaleString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="w-96 bg-zinc-950 border-l border-zinc-800 flex flex-col h-screen">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-lg font-mono text-white">BILL_OF_MATERIALS</h2>
        <p className="text-xs text-zinc-500 font-mono mt-1">ORDER_SUMMARY</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedItems.length === 0 ? (
          <div className="text-center mt-12">
            <div className="text-zinc-700 font-mono text-sm">EMPTY_CART</div>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedItems.map((item, index) => (
              <div
                key={item.uniqueId}
                className="bg-zinc-900/50 border border-zinc-800 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-mono text-zinc-600 mb-1">
                      #{index + 1}
                    </div>
                    <div className="text-sm font-mono text-zinc-300">
                      {item.name}
                    </div>
                    <div className="text-xs font-mono text-zinc-500 mt-1">
                      {item.category.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm font-mono" style={{ color: primaryColor }}>
                    ₩{item.price.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-6 space-y-4">
        <div className="flex justify-between items-center py-4 border-t border-b border-zinc-800">
          <div className="text-sm font-mono text-zinc-400">TOTAL_AMOUNT</div>
          <div className="text-2xl font-mono" style={{ color: primaryColor }}>
            ₩{total.toLocaleString()}
          </div>
        </div>

        <button
          onClick={handleOrderNow}
          disabled={selectedItems.length === 0}
          className="w-full text-black font-mono text-sm py-4 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            backgroundColor: selectedItems.length === 0 ? '#27272a' : primaryColor,
            color: selectedItems.length === 0 ? '#52525b' : 'black',
          }}
          onMouseEnter={(e) => selectedItems.length > 0 && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => selectedItems.length > 0 && (e.currentTarget.style.opacity = '1')}
        >
          {copied ? (
            <>
              <Check size={16} />
              COPIED_TO_CLIPBOARD
            </>
          ) : (
            <>
              <Copy size={16} />
              ORDER_NOW
            </>
          )}
        </button>

        <div className="text-xs font-mono text-zinc-600 text-center">
          CLICK_TO_COPY_ORDER_DETAILS
        </div>
      </div>
    </div>
  );
};
