import { KeyringItem } from '../types';

// 📏 CanvasBuilder와 동일한 비율 상수 (10cm = 450px 기준)
const PIXELS_PER_CM = 45;

interface CanvasItem extends KeyringItem {
  canvasId: string;
  x: number;
  y: number;
  rotation: number;
  // 저장된 사이즈 정보가 있을 수 있음
  real_width_cm?: number;
  object_px_width?: number;
  image_width?: number;
}

interface CanvasPreviewProps {
  items: CanvasItem[];
  isThumbnail?: boolean;
  canvasHeight?: number;
  customScale?: number; // 카트 등에서 강제로 비율을 줄일 때 사용
}

export const CanvasPreview = ({ 
  items, 
  isThumbnail = false, 
  canvasHeight = 700,
  customScale
}: CanvasPreviewProps) => {

  // ✅ [핵심 로직] 저장된 정보를 바탕으로 표시 너비(px) 계산
  const calculateDisplayWidth = (item: CanvasItem) => {
    // 1. 실제 cm값과 분석된 픽셀 데이터가 모두 있는 경우
    if (item.real_width_cm && item.object_px_width && item.image_width) {
      // 목표 물체 크기(px) = 실제크기(cm) * 기준비율(px/cm)
      const targetObjectWidthPx = item.real_width_cm * PIXELS_PER_CM;
      
      // 이미지 전체 확대 비율 = 목표 물체 픽셀 / 현재 물체 픽셀
      const scaleFactor = targetObjectWidthPx / item.object_px_width;
      
      // 최종 이미지 너비 반환
      return `${item.image_width * scaleFactor}px`;
    }
    
    // 2. 정보가 없으면 기본값 (기존 256px = 16rem = w-64)
    return '256px'; 
  };

  // 썸네일일 경우 0.42배, 커스텀 스케일이 있으면 그 값, 아니면 1배
  const finalScale = customScale ? customScale : (isThumbnail ? 0.42 : 1);

  return (
    // 부모 컨테이너: 항상 정중앙 정렬
    <div className="w-full h-full relative overflow-hidden select-none pointer-events-none flex items-center justify-center bg-transparent">
      
      {/* 실제 내용을 담는 박스: 너비 450px 고정, 높이는 저장된 값(canvasHeight) */}
      <div 
        style={{ 
          width: '450px', 
          height: `${canvasHeight}px`, 
          position: 'relative',
          flexShrink: 0,
          transform: `scale(${finalScale})`, 
          transformOrigin: 'center center' 
        }}
      >
         {/* 배경 패턴 (옵션: 투명하게 하거나 유지) */}
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#555 1px, transparent 1px), linear-gradient(90deg, #555 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
         
         {/* 아이템 렌더링 */}
         {items && items.map(item => (
           <div 
             key={item.canvasId || item.id} 
             // 🔴 [수정] w-64 h-64 제거 -> flex와 style로 대체
             className="absolute flex items-center justify-center" 
             style={{ 
               left: item.x, 
               top: item.y, 
               zIndex: 10,
               // ✅ 저장된 비율대로 크기 복원
               width: calculateDisplayWidth(item),
               height: 'auto'
             }}
           >
             <div className="w-full h-full" style={{ transform: `rotate(${item.rotation}deg)` }}>
                {/* w-full로 부모 div 크기를 따라가게 설정 */}
                <img 
                  src={item.image || item.image_url} 
                  alt={item.name} 
                  className="w-full h-auto object-contain drop-shadow-2xl" 
                />
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};