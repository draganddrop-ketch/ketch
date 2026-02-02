import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Trash2, RotateCcw, GripHorizontal } from 'lucide-react';
import { KeyringItem } from '../types';

interface CanvasItem extends KeyringItem {
  canvasId: string;
  x: number;
  y: number;
  rotation: number;
}

interface CanvasBuilderProps {
  onItemsChange: (items: CanvasItem[]) => void;
  onAddItem?: (product: KeyringItem) => void;
  initialHeight?: number;
}

export interface CanvasBuilderRef {
  setCapturing: (capturing: boolean) => void;
}

export const CanvasBuilder = forwardRef<CanvasBuilderRef, CanvasBuilderProps>(({ onItemsChange, onAddItem, initialHeight = 700 }, ref) => {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    setCapturing: (capturing: boolean) => {
      setIsCapturing(capturing);
    },
  }));

  const addItemToCanvas = (product: KeyringItem) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2 - 128;
    const centerY = rect.height / 2 - 128;

    const newItem: CanvasItem = {
      ...product,
      canvasId: `${product.id}-${Date.now()}`,
      x: centerX,
      y: centerY,
      rotation: 0,
    };

    const updatedItems = [...canvasItems, newItem];
    setCanvasItems(updatedItems);
    onItemsChange(updatedItems);
    setSelectedItemId(newItem.canvasId);
  };

  (window as any).__addItemToCanvas = addItemToCanvas;

  const handleItemMouseDown = (e: React.MouseEvent, canvasId: string) => {
    e.stopPropagation();
    const item = canvasItems.find((i) => i.canvasId === canvasId);
    if (!item) return;

    setSelectedItemId(canvasId);
    setDraggedItemId(canvasId);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left - item.x,
      y: e.clientY - rect.top - item.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItemId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;

    x = Math.max(0, Math.min(x, rect.width - 256));
    y = Math.max(0, Math.min(y, rect.height - 256));

    const updatedItems = canvasItems.map((item) =>
      item.canvasId === draggedItemId ? { ...item, x, y } : item
    );
    setCanvasItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const handleMouseUp = () => {
    setDraggedItemId(null);
  };

  const handleRotationChange = (canvasId: string, rotation: number) => {
    const updatedItems = canvasItems.map((item) =>
      item.canvasId === canvasId ? { ...item, rotation } : item
    );
    setCanvasItems(updatedItems);
    onItemsChange(updatedItems);
  };

  const handleRemove = (canvasId: string) => {
    const updatedItems = canvasItems.filter((item) => item.canvasId !== canvasId);
    setCanvasItems(updatedItems);
    onItemsChange(updatedItems);
    if (selectedItemId === canvasId) {
      setSelectedItemId(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedItemId(null);
    }
  };

  const handleResetCanvas = () => {
    if (canvasItems.length === 0) return;

    if (window.confirm('Are you sure you want to clear all items from the canvas?')) {
      setCanvasItems([]);
      onItemsChange([]);
      setSelectedItemId(null);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = canvasHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - resizeStartY.current;
      const newHeight = Math.max(300, resizeStartHeight.current + deltaY);
      setCanvasHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b border-white/30 flex items-center justify-between">
        <h2 className="text-white font-bold uppercase tracking-wider text-sm">
          DROP ZONE
        </h2>
        {canvasItems.length > 0 && (
          <button
            onClick={handleResetCanvas}
            className="flex items-center gap-2 bg-zinc-900 text-white hover:text-red-400 px-3 py-2 rounded transition-colors border border-white/20 hover:border-red-400"
          >
            <RotateCcw size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">Reset</span>
          </button>
        )}
      </div>

      <div className="relative">
        <div
          id="canvas-drop-zone"
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          className={`bg-zinc-950 relative overflow-hidden ${isCapturing ? 'is-capturing' : ''}`}
          style={{ height: `${canvasHeight}px` }}
        >
          {canvasItems.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
              <div className="text-lg font-medium mb-2">CLICK TO ADD</div>
              <div className="text-xs">Click items from the list to add them here</div>
            </div>
          ) : (
            canvasItems.map((item) => (
              <div
                key={item.canvasId}
                className="absolute group canvas-item"
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  zIndex: draggedItemId === item.canvasId ? 1000 : selectedItemId === item.canvasId ? 50 : 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.canvasId);
                }}
              >
                <div
                  className="cursor-move"
                  onMouseDown={(e) => handleItemMouseDown(e, item.canvasId)}
                  style={{
                    transform: `rotate(${item.rotation}deg)`,
                  }}
                >
                  <img
                    src={item.image || ''}
                    alt={item.name}
                    className="w-64 h-64 object-contain pointer-events-none drop-shadow-2xl"
                    draggable={false}
                  />
                </div>

                {selectedItemId === item.canvasId && (
                  <div className="canvas-controls absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
                    {/* Rotation Slider Container */}
                    <div className="bg-black/90 border border-white/20 rounded px-3 py-2 flex items-center gap-2 shadow-xl backdrop-blur-sm">
                      <span className="text-[10px] text-gray-400 font-medium">L</span>
                      <div className="flex flex-col items-center">
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={item.rotation}
                          onChange={(e) => handleRotationChange(item.canvasId, parseInt(e.target.value))}
                          className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <span className="text-[9px] text-white/60 mt-1">{item.rotation}°</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">R</span>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.canvasId);
                      }}
                      className="bg-red-500/90 hover:bg-red-600 text-white text-xs px-3 py-1 rounded flex items-center gap-1 shadow-lg transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div
          onMouseDown={handleResizeMouseDown}
          className={`h-2 bg-zinc-800 hover:bg-cyan-400/50 cursor-row-resize flex items-center justify-center transition-colors border-t border-white/20 ${
            isResizing ? 'bg-cyan-400/70' : ''
          }`}
        >
          <GripHorizontal size={16} className="text-white/40" />
        </div>
      </div>
    </div>
  );
});
