import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Trash2, RotateCcw, GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { useCanvas } from '../context/CanvasContext';
import { useSiteSettings } from '../context/SiteSettingsContext'; // ✅ 설정 가져오기

const PIXELS_PER_CM = 45;

interface CanvasBuilderProps { onItemsChange?: (items: any[]) => void; initialHeight?: number; }
export interface CanvasBuilderRef { setCapturing: (capturing: boolean) => void; getHeight: () => number; }

export const CanvasBuilder = forwardRef<CanvasBuilderRef, CanvasBuilderProps>(({ onItemsChange, initialHeight = 650 }, ref) => {
  const { canvasItems, setCanvasItems, clearCanvas, selectedId, selectItem } = useCanvas();
  const { settings, getBorderStyle } = useSiteSettings(); // ✅ 설정 및 테두리 함수 가져오기
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const activeSelectedId = selectedId ?? localSelectedId;
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [canvasHeight, setCanvasHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [scale, setScale] = useState(1);

  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ✅ 전역 스타일 변수
  const globalBg = settings?.global_bg_color || '#000000';
  const globalText = settings?.global_text_color || '#FFFFFF';
  const borderStyle = getBorderStyle();

  // 캔버스 내부 배경 (개별 설정 유지)
  const canvasBgColor = settings?.canvas_bg_color || '#FFFFFF';
  const canvasBgImage = settings?.canvas_bg_image;
  
  const backgroundStyle = canvasBgImage 
    ? { 
        backgroundColor: canvasBgColor,
        backgroundImage: `url(${canvasBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { 
        backgroundColor: canvasBgColor,
        backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)', 
        backgroundSize: '50px 50px' 
      };

  useImperativeHandle(ref, () => ({ setCapturing: setIsCapturing, getHeight: () => canvasHeight }));

  useEffect(() => {
    const updateScale = () => { if (canvasRef.current) { const currentWidth = canvasRef.current.clientWidth; if (currentWidth > 0) setScale(currentWidth / 450); } };
    updateScale();
    const observer = new ResizeObserver(() => { updateScale(); });
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSelect = (id: string | null) => { if (selectItem) selectItem(id); setLocalSelectedId(id); };
  
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
    const updatedItems = canvasItems.map((item) => item.canvasId === draggedItemId ? { ...item, x, y } : item);
    setCanvasItems(updatedItems);
    if (onItemsChange) onItemsChange(updatedItems);
  };

  const handleMouseUp = () => setDraggedItemId(null);

  const handleItemTouchStart = (e: React.TouchEvent, canvasId: string) => {
    e.stopPropagation();
    const item = canvasItems.find((i) => i.canvasId === canvasId);
    if (!item) return;
    handleSelect(canvasId);
    setDraggedItemId(canvasId);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    const scaleX = 450 / rect.width;
    const scaleY = canvasHeight / rect.height;
    setDragOffset({ x: (touch.clientX - rect.left) * scaleX - item.x, y: (touch.clientY - rect.top) * scaleY - item.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedItemId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = 450 / rect.width;
    const scaleY = canvasHeight / rect.height;
    let x = (touch.clientX - rect.left) * scaleX - dragOffset.x;
    let y = (touch.clientY - rect.top) * scaleY - dragOffset.y;
    const updatedItems = canvasItems.map((item) => item.canvasId === draggedItemId ? { ...item, x, y } : item);
    setCanvasItems(updatedItems);
    if (onItemsChange) onItemsChange(updatedItems);
  };

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

  const calculateDisplayWidth = (item: any) => {
    if (item.real_width_cm && item.object_px_width && item.image_width) {
      const targetObjectWidthPx = item.real_width_cm * PIXELS_PER_CM;
      const scaleFactor = targetObjectWidthPx / item.object_px_width;
      return `${item.image_width * scaleFactor}px`;
    }
    return '256px'; 
  };

  return (
    // ✅ 전체 배경: 전역 설정 연동
    <div className="flex flex-col w-full" style={{ backgroundColor: globalBg }}> 
      {/* ✅ 헤더: 전역 설정 연동 */}
      <div 
        className="h-12 px-6 border-b flex justify-between items-center flex-shrink-0" 
        style={{ 
          backgroundColor: globalBg, 
          borderColor: settings?.layout_border_color || 'rgba(255,255,255,0.1)' 
        }}
      >
        <span className="font-bold text-sm" style={{ color: globalText }}>DROP ZONE</span>
        {canvasItems.length > 0 && <button onClick={handleResetCanvas}><RotateCcw size={16} style={{ color: globalText }} className="hover:text-red-400"/></button>}
      </div>
      
      {/* 캔버스 영역 */}
      <div className="w-full relative overflow-hidden" style={{ height: `${canvasHeight}px`, transition: isResizing ? 'none' : 'height 0.2s' }}>
        <div 
           id="canvas-drop-zone"
           ref={canvasRef}
           className={`absolute inset-0 ${isCapturing ? 'is-capturing' : ''}`}
           onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
           onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}
           onClick={() => handleSelect(null)}
           style={backgroundStyle} // 캔버스 내부 배경은 별도 설정 유지
        >
           <div style={{ width: '450px', height: `${canvasHeight}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              {canvasItems.length === 0 && <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ color: '#9ca3af' }}>Drag items here</div>}
              {canvasItems.map((item, index) => (
                 <div 
                    key={item.canvasId} 
                    className="absolute flex items-center justify-center" 
                    style={{ 
                        left: item.x, 
                        top: item.y, 
                        width: calculateDisplayWidth(item),
                        height: 'auto',
                        zIndex: draggedItemId===item.canvasId ? 1000 : (activeSelectedId === item.canvasId ? 900 : index),
                        touchAction: 'none'
                    }} 
                    onClick={e=>{e.stopPropagation(); handleSelect(item.canvasId);}}
                 >
                    <div 
                        className="w-full h-full cursor-move" 
                        onMouseDown={e=>handleItemMouseDown(e, item.canvasId)}
                        onTouchStart={e=>handleItemTouchStart(e, item.canvasId)}
                        style={{ transform: `rotate(${item.rotation}deg)` }}
                    >
                       <img src={getImageUrl(item)} className="w-full h-auto object-contain pointer-events-none drop-shadow-xl" />
                    </div>
                    {activeSelectedId === item.canvasId && (
                      <div className="canvas-controls absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-50 w-max">
                        <div className="bg-black/80 border border-white/20 rounded-lg p-2 backdrop-blur-sm flex flex-col gap-2 items-center shadow-2xl">
                          <input type="range" min="-180" max="180" value={item.rotation} onChange={e=>handleRotationChange(item.canvasId, parseInt(e.target.value))} className="w-32 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400" onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}/>
                          <div className="flex gap-3 w-full justify-center items-center border-t border-white/10 pt-2 mt-1">
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
      {/* 리사이즈 핸들: 배경색을 캔버스 내부 배경과 맞추거나 전역 배경 사용 */}
      <div onMouseDown={handleResizeMouseDown} className={`h-4 hover:bg-cyan-400/20 cursor-row-resize flex items-center justify-center border-t flex-shrink-0 ${isResizing ? 'bg-cyan-400/40' : ''}`} style={{ backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }}><GripHorizontal size={16} className="text-gray-400" /></div>
    </div>
  );
});