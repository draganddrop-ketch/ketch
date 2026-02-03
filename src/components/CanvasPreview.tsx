import { KeyringItem } from '../types';

interface CanvasItem extends KeyringItem {
  canvasId: string;
  x: number;
  y: number;
  rotation: number;
}

interface CanvasPreviewProps {
  items: CanvasItem[];
  isThumbnail?: boolean;
  canvasHeight?: number; // ★ 저장된 높이 받기
}

export const CanvasPreview = ({ items, isThumbnail = false, canvasHeight = 700 }: CanvasPreviewProps) => {
  return (
    // 부모 컨테이너: 항상 정중앙 정렬
    <div className="w-full h-full bg-[#09090b] relative overflow-hidden select-none pointer-events-none flex items-center justify-center">
      
      {/* 실제 내용을 담는 박스: 너비 450px 고정, 높이는 저장된 값(canvasHeight)
         썸네일이면: 0.42배로 축소 (요청하신 30% 덜 확대된 적당한 크기)
         상세보기면: 1.0배 (원본)
      */}
      <div 
        style={{ 
          width: '450px', 
          height: `${canvasHeight}px`, 
          position: 'relative',
          flexShrink: 0,
          transform: isThumbnail ? 'scale(0.42)' : 'scale(1)', 
          transformOrigin: 'center center' 
        }}
      >
         {/* 배경 패턴 */}
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
         
         {/* 아이템 렌더링 */}
         {items && items.map(item => (
           <div 
             key={item.canvasId} 
             className="absolute w-64 h-64 flex items-center justify-center" 
             style={{ left: item.x, top: item.y, zIndex: 10 }}
           >
             <div className="w-full h-full" style={{ transform: `rotate(${item.rotation}deg)` }}>
                <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-2xl" />
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};