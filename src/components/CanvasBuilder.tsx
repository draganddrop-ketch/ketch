import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Trash2, RotateCcw, GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';

interface CanvasBuilderProps { onItemsChange?: (items: any[]) => void; initialHeight?: number; }
export interface CanvasBuilderRef { setCapturing: (capturing: boolean) => void; getHeight: () => number; }

export const CanvasBuilder = forwardRef<CanvasBuilderRef, CanvasBuilderProps>(({ onItemsChange, initialHeight = 600 }, ref) => {
  const { canvasItems, setCanvasItems, clearCanvas, selectedId, selectItem } = useCanvas();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const activeSelectedId = selectedId ?? localSelectedId;
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ setCapturing: setIsCapturing, getHeight: () => canvasHeight }));

  const handleSelect = (id: string | null) => { if (selectItem) selectItem(id); setLocalSelectedId(id); };
  
  // 레이어 순서 변경
  const handleLayerChange = (id: string, direction: 'forward' | 'backward') => {
    const index = canvasItems.findIndex(i => i.canvasId === id);
    if (index === -1) return;
    const newItems = [...canvasItems];
    if (direction === 'backward' && index > 0) { [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]; } 
    else if (direction === 'forward' && index < newItems.length - 1) { [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]; }
    setCanvasItems(newItems);
    if (onItemsChange) onItemsChange(newItems);
  };

  const handleItemMouseDown = (e: React.MouseEvent, canvasId: string) => {
    e.stopPropagation();
    const item = canvasItems.find((i) => i.canvasId === canvasId);
    if (!item) return;
    handleSelect(canvasId);
    setDraggedItemId(canvasId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = 450 / rect.width;
    const scaleY = canvasHeight / rect.height;
    setDragOffset({ x: (e.clientX - rect.left) * scaleX - item.x, y: (e.clientY - rect.top) * scaleY - item.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedItemId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 450 / rect.width;
    const scaleY = canvasHeight / rect.height;
    let x = (e.clientX - rect.left) * scaleX - dragOffset.x;
    let y = (e.clientY - rect.top) * scaleY - dragOffset.y;
    x = Math.max(-100, Math.min(x, 450 - 100));
    y = Math.max(-100, Math.min(y, canvasHeight - 100));
    const updatedItems = canvasItems.map((item) => item.canvasId === draggedItemId ? { ...item, x, y } : item);
    setCanvasItems(updatedItems);
    if (onItemsChange) onItemsChange(updatedItems);
  };

  const handleMouseUp = () => setDraggedItemId(null);
  
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = canvasHeight;
    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - resizeStartY.current;
      const newHeight = Math.max(400, Math.min(1500, resizeStartHeight.current + deltaY));
      setCanvasHeight(newHeight);
    };
    const handleWindowMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
  };

  const handleRotationChange = (id: string, rot: number) => { const newItems = canvasItems.map(i => i.canvasId === id ? { ...i, rotation: rot } : i); setCanvasItems(newItems); if (onItemsChange) onItemsChange(newItems); };
  const handleRemove = (id: string) => { const newItems = canvasItems.filter(i => i.canvasId !== id); setCanvasItems(newItems); if (onItemsChange) onItemsChange(newItems); if (activeSelectedId === id) handleSelect(null); };
  const handleResetCanvas = () => { if(confirm('Clear canvas?')) { if(clearCanvas) clearCanvas(); else setCanvasItems([]); handleSelect(null); if(onItemsChange) onItemsChange([]); } };
  const getImageUrl = (item: any) => item.image || item.image_url || '';

  return (
    <div className="flex flex-col w-full h-full bg-zinc-950">
      <div className="p-4 border-b border-white/20 flex justify-between items-center bg-zinc-900 flex-shrink-0">
        <span className="text-white font-bold text-sm">DROP ZONE</span>
        {canvasItems.length > 0 && <button onClick={handleResetCanvas}><RotateCcw className="text-white hover:text-red-400" size={16}/></button>}
      </div>
      
      <div className="w-full relative overflow-hidden" style={{ height: `${canvasHeight}px`, transition: isResizing ? 'none' : 'height 0.2s' }}>
        <div 
           id="canvas-drop-zone"
           ref={canvasRef}
           className={`absolute inset-0 ${isCapturing ? 'is-capturing' : ''}`}
           onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={() => handleSelect(null)}
           style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '50px 50px' }}
        >
           <div style={{ width: '450px', height: `${canvasHeight}px`, transform: `scale(${canvasRef.current ? canvasRef.current.clientWidth / 450 : 1})`, transformOrigin: 'top left' }}>
              {canvasItems.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-white/30 pointer-events-none">Drag items here</div>}
              {canvasItems.map((item, index) => (
                 <div key={item.canvasId} className="absolute w-64 h-64" style={{ left: item.x, top: item.y, zIndex: draggedItemId===item.canvasId ? 1000 : (activeSelectedId === item.canvasId ? 900 : index) }} onClick={e=>{e.stopPropagation(); handleSelect(item.canvasId);}}>
                    <div className="w-full h-full cursor-move" onMouseDown={e=>handleItemMouseDown(e, item.canvasId)} style={{ transform: `rotate(${item.rotation}deg)` }}>
                       <img src={getImageUrl(item)} className="w-full h-full object-contain pointer-events-none drop-shadow-xl" />
                    </div>
                    
                    {/* ★ UI 통합: 이미지 위에 컨트롤바 배치 */}
                    {activeSelectedId === item.canvasId && (
                      <div className="canvas-controls absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center z-50">
                        <div className="bg-black/90 border border-white/20 rounded-lg p-2 backdrop-blur-sm flex flex-col gap-2 items-center shadow-2xl">
                          {/* 회전 슬라이더 */}
                          <input type="range" min="-180" max="180" value={item.rotation} onChange={e=>handleRotationChange(item.canvasId, parseInt(e.target.value))} className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400" onMouseDown={e=>e.stopPropagation()}/>
                          
                          {/* 순서 변경 및 삭제 버튼 한 줄 배치 */}
                          <div className="flex gap-4 w-full justify-center items-center border-t border-white/10 pt-2">
                             <div className="flex gap-1">
                               <button onClick={(e)=>{e.stopPropagation(); handleLayerChange(item.canvasId, 'backward')}} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded" title="Send Backward"><ArrowDown size={14} /></button>
                               <button onClick={(e)=>{e.stopPropagation(); handleLayerChange(item.canvasId, 'forward')}} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded" title="Bring Forward"><ArrowUp size={14} /></button>
                             </div>
                             <div className="w-px h-3 bg-white/20"></div>
                             <button onClick={e=>{e.stopPropagation(); handleRemove(item.canvasId);}} className="text-red-400 hover:text-red-300 p-1 hover:bg-white/10 rounded" title="Delete"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>
      <div onMouseDown={handleResizeMouseDown} className={`h-4 bg-zinc-800 hover:bg-cyan-400/20 cursor-row-resize flex items-center justify-center border-t border-white/10 flex-shrink-0 ${isResizing ? 'bg-cyan-400/40' : ''}`}><GripHorizontal size={16} className="text-white/40" /></div>
    </div>
  );
});