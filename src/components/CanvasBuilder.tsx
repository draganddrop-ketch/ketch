import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Trash2, RotateCcw, GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

interface CanvasBuilderProps {
  onItemsChange?: (items: any[]) => void;
  initialHeight?: number;
}

export interface CanvasBuilderRef {
  setCapturing: (capturing: boolean) => void;
}

export const CanvasBuilder = forwardRef<CanvasBuilderRef, CanvasBuilderProps>(({ onItemsChange, initialHeight = 700 }, ref) => {
  // ★ selectedId, selectItem 가져오기
  const { canvasItems, setCanvasItems, selectedId, selectItem } = useCanvas();
  
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
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

  const handleItemMouseDown = (e: React.MouseEvent, canvasId: string) => {
    e.stopPropagation();
    const item = canvasItems.find((i) => i.canvasId === canvasId);
    if (!item) return;

    selectItem(canvasId); // ★ 전역 함수 사용
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

    const updatedItems = canvasItems.map((item) =>
      item.canvasId === draggedItemId ? { ...item, x, y } : item
    );
    setCanvasItems(updatedItems);
  };

  const handleMouseUp = () => {
    setDraggedItemId(null);
  };

  const handleRotationChange = (canvasId: string, rotation: number) => {
    const updatedItems = canvasItems.map((item) =>
      item.canvasId === canvasId ? { ...item, rotation } : item
    );
    setCanvasItems(updatedItems);
  };

  const handleRemove = (canvasId: string) => {
    const updatedItems = canvasItems.filter((item) => item.canvasId !== canvasId);
    setCanvasItems(updatedItems);
    if (selectedId === canvasId) {
      selectItem(null); // ★ 전역 함수 사용
    }
  };

  const handleLayerChange = (e: React.MouseEvent, direction: 'up' | 'down') => {
    e.stopPropagation();
    if (!selectedId) return;

    const index = canvasItems.findIndex(item => item.canvasId === selectedId);
    if (index === -1) return;

    const newItems = [...canvasItems];

    if (direction === 'up' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    } else if (direction === 'down' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    }

    setCanvasItems(newItems);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectItem(null); // ★ 바탕 클릭 시 선택 해제
    }
  };

  const handleResetCanvas = () => {
    if (canvasItems.length === 0) return;
    if (window.confirm('Are you sure you want to clear all items from the canvas?')) {
      setCanvasItems([]);
      selectItem(null);
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

  const getImageUrl = (item: any) => item.image || item.image_url || '';

  return (
    <div className="flex flex-col">
      <div className="h-12 px-3 border-b border-white/30 flex items-center justify-between bg-zinc-950 shrink-0">
        <h2 className="text-white font-bold uppercase tracking-wider text-sm pl-1">
          DROP ZONE
        </h2>
        
        {canvasItems.length > 0 && (
          <button
            onClick={handleResetCanvas}
            className="text-white/40 hover:text-red-500 transition-colors p-1 flex items-center justify-center"
            title="Reset Canvas"
          >
            <RotateCcw size={20} strokeWidth={2.5} />
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
                className="absolute group canvas-item w-64 h-64"
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  zIndex: draggedItemId === item.canvasId ? 1000 : selectedId === item.canvasId ? 50 : 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectItem(item.canvasId); // ★ 클릭 시 선택
                }}
              >
                <div
                  className="cursor-move w-full h-full"
                  onMouseDown={(e) => handleItemMouseDown(e, item.canvasId)}
                  style={{
                    transform: `rotate(${item.rotation}deg)`,
                  }}
                >
                  <img
                    src={getImageUrl(item)}
                    alt={item.name}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-2xl max-w-none"
                    draggable={false}
                  />
                </div>

                {/* ★ 전역 변수 selectedId와 비교해서 컨트롤러 표시 */}
                {selectedId === item.canvasId && (
                  <div className="canvas-controls absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
                    <div className="bg-black/90 border border-white/20 rounded px-3 py-2 flex items-center gap-2 shadow-xl backdrop-blur-sm">
                      <span className="text-[10px] text-gray-400 font-medium">L</span>
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
                      <span className="text-[10px] text-gray-400 font-medium">R</span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleLayerChange(e, 'down')}
                        className="bg-black/80 hover:bg-zinc-700 text-white p-2 rounded border border-white/20 shadow-lg backdrop-blur-sm"
                        title="Send Backward"
                      >
                        <ArrowDown size={14} />
                      </button>
                      
                      <button
                        onClick={(e) => handleLayerChange(e, 'up')}
                        className="bg-black/80 hover:bg-zinc-700 text-white p-2 rounded border border-white/20 shadow-lg backdrop-blur-sm"
                        title="Bring Forward"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <div className="w-px bg-white/20 mx-1 h-auto"></div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.canvasId);
                        }}
                        className="bg-black/80 hover:bg-red-900/50 text-red-400 p-2 rounded border border-white/20 shadow-lg backdrop-blur-sm"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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