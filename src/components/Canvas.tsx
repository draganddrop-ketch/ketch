import { X } from 'lucide-react';
import { SelectedItem } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface CanvasProps {
  selectedItems: SelectedItem[];
  onRemoveItem: (uniqueId: string) => void;
}

export const Canvas = ({ selectedItems, onRemoveItem }: CanvasProps) => {
  const { settings } = useSiteSettings();
  const primaryColor = settings?.primary_color || '#34d399';
  return (
    <div className="flex-1 bg-[#09090b] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="relative h-full flex flex-col items-center justify-start pt-12 overflow-y-auto">
        <div className="mb-4">
          <div className="text-xs font-mono text-zinc-600 text-center mb-2">[PREVIEW_MODE]</div>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-zinc-700 to-transparent mx-auto" />
        </div>

        {selectedItems.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-zinc-700 font-mono text-sm mb-2">NO_ITEMS_SELECTED</div>
            <div className="text-zinc-800 font-mono text-xs">SELECT_FROM_SIDEBAR &gt;&gt;</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0">
            {selectedItems.map((item, index) => (
              <div key={item.uniqueId} className="relative group">
                {index > 0 && (
                  <div className="w-px h-6 bg-gradient-to-b from-zinc-700 via-zinc-600 to-zinc-700 mx-auto" />
                )}
                <div className="relative p-6">
                  <div className="w-32 h-32 flex items-center justify-center relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-zinc-500 to-zinc-700 border-2 border-zinc-400" />
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <div className="text-xs font-mono text-zinc-400">{item.name}</div>
                    <div className="text-xs font-mono mt-1" style={{ color: primaryColor }}>
                      ₩{item.price.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.uniqueId)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/90 hover:bg-red-500 border border-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 text-xs font-mono text-zinc-700">
        ITEMS: {selectedItems.length.toString().padStart(2, '0')}
      </div>
    </div>
  );
};
