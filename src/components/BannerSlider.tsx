import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSliderProps {
  images: string[];
  title: string;
  autoPlayInterval?: number;
  showTitle?: boolean;
  titlePosition?: 'center' | 'bottom-left' | 'bottom-right';
  darkOverlay?: boolean;
}

export const BannerSlider = ({
  images,
  title,
  autoPlayInterval = 3000,
  showTitle = true,
  titlePosition = 'center',
  darkOverlay = true
}: BannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [images.length, autoPlayInterval, isHovered]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (titlePosition) {
      case 'bottom-left':
        return 'justify-start items-end pb-12 pl-12';
      case 'bottom-right':
        return 'justify-end items-end pb-12 pr-12';
      case 'center':
      default:
        return 'justify-center items-center';
    }
  };

  if (images.length === 1) {
    return (
      <div className="relative w-full rounded-lg overflow-hidden" style={{ height: 'var(--banner-height, 400px)' }}>
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover"
        />
        {(showTitle || darkOverlay) && (
          <div className={`absolute inset-0 flex ${getPositionClasses()} ${darkOverlay ? 'bg-black/40' : ''}`}>
            {showTitle && (
              <h2 className="text-white text-3xl md:text-5xl font-bold uppercase tracking-wider text-center px-4">
                {title}
              </h2>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden group"
      style={{ height: 'var(--banner-height, 400px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`${title} ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {(showTitle || darkOverlay) && (
        <div className={`absolute inset-0 flex ${getPositionClasses()} pointer-events-none ${darkOverlay ? 'bg-black/40' : ''}`}>
          {showTitle && (
            <h2 className="text-white text-3xl md:text-5xl font-bold uppercase tracking-wider text-center px-4">
              {title}
            </h2>
          )}
        </div>
      )}

      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
