import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ShopBannerSliderProps {
  images: string[];
  transition?: 'slide' | 'fade';
  speed?: number;
  height?: string;
  aspectRatio?: string;
}

export const ShopBannerSlider = ({ images, transition = 'slide', speed = 3000, height, aspectRatio }: ShopBannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, speed);

    return () => clearInterval(interval);
  }, [images.length, speed]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (!images || images.length === 0) {
    return null;
  }

  const getAspectRatioClass = () => {
    if (!aspectRatio || aspectRatio === 'auto') return '';

    switch (aspectRatio) {
      case 'wide':
        return 'aspect-[2/1]';
      case 'standard':
        return 'aspect-video';
      case 'square':
        return 'aspect-square';
      default:
        return '';
    }
  };

  const aspectClass = getAspectRatioClass();

  const useNaturalSize = !aspectClass && !height;

  const containerClasses = aspectClass
    ? `relative w-full ${aspectClass} overflow-hidden bg-black`
    : height
    ? `relative w-full ${height} overflow-hidden bg-black`
    : `relative w-full overflow-hidden bg-black`;

  return (
    <div className={`group ${containerClasses}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`${useNaturalSize ? 'relative' : 'absolute inset-0'} transition-all duration-700 ${
            transition === 'fade'
              ? index === currentIndex
                ? 'opacity-100'
                : 'opacity-0'
              : index === currentIndex
              ? 'translate-x-0'
              : index < currentIndex
              ? '-translate-x-full'
              : 'translate-x-full'
          }${useNaturalSize && index !== currentIndex ? ' hidden' : ''}`}
        >
          <img
            src={image}
            alt={`Banner ${index + 1}`}
            className={useNaturalSize ? 'w-full h-auto' : 'w-full h-full object-cover'}
          />
        </div>
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
