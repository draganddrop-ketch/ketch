import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShopBannerSliderProps {
  images: string[];
  transition?: string; // 'slide' | 'fade' | 'zoom' | 'blur' | 'flip'
  speed?: number;
}

export const ShopBannerSlider = ({ images, transition = 'slide', speed = 3000 }: ShopBannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 자동 슬라이드
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, speed);
    return () => clearInterval(interval);
  }, [images.length, speed]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    // ✅ 높이 고정(h-[300px] 등) 삭제 -> w-full만 남김
    <div className="relative w-full overflow-hidden group bg-zinc-900">
      
      {/* 🚀 [핵심 해결책] 높이 확보용 투명 이미지 (Spacer)
         - 이 이미지는 화면에 보이지 않지만(invisible), 
         - 원본 이미지의 비율대로 공간을 차지하여 부모 div의 높이를 자동으로 늘려줍니다.
         - 덕분에 모바일/PC 어디서든 원본 비율이 유지됩니다.
      */}
      <img 
        src={images[currentIndex]} 
        alt="Spacer"
        className="w-full h-auto invisible pointer-events-none relative z-0" 
      />

      {/* 실제 슬라이더 영역 (absolute로 위에 겹침) */}
      <div className="absolute inset-0 w-full h-full z-10">
        {images.map((img, index) => {
          const isActive = index === currentIndex;
          
          // 기본 스타일
          let className = "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ";
          
          // 효과별 스타일
          if (transition === 'fade') {
            className += isActive ? "opacity-100 z-10" : "opacity-0 z-0";
          } else if (transition === 'zoom') {
            className += isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-110 z-0";
          } else if (transition === 'blur') {
            className += isActive ? "opacity-100 blur-0 z-10" : "opacity-0 blur-sm z-0";
          } else if (transition === 'flip') {
             className += isActive ? "opacity-100 rotate-x-0 z-10" : "opacity-0 rotate-x-90 z-0";
          } else {
            // Slide (기본값)
            className += `transform transition-transform duration-500 ease-in-out ${
              index === currentIndex ? "translate-x-0" : "translate-x-full hidden"
            }`;
          }

          if (transition === 'slide') {
            return (
               <div 
                 key={index}
                 className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out`}
                 style={{ transform: `translateX(${100 * (index - currentIndex)}%)` }}
               >
                 <img src={img} alt={`Banner ${index}`} className="w-full h-full object-cover" />
               </div>
            );
          }

          return (
            <img
              key={index}
              src={img}
              alt={`Banner ${index}`}
              className={className}
            />
          );
        })}
      </div>

      {/* 화살표 버튼 */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <ChevronRight size={24} />
          </button>

          {/* 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};