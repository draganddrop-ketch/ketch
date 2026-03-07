import { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw, X } from 'lucide-react';

type ImageCropperModalProps = {
  open: boolean;
  imageSrc: string;
  aspect?: number;
  title?: string;
  onCancel: () => void;
  onSave: (file: File, previewUrl: string) => void;
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const drawImageWithTransform = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  zoom: number,
  rotation: number,
  offsetX: number,
  offsetY: number
) => {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const fitScale = Math.min(width / image.width, height / image.height);
  const radian = (rotation * Math.PI) / 180;
  const translatedX = width / 2 + offsetX * width;
  const translatedY = height / 2 + offsetY * height;

  ctx.translate(translatedX, translatedY);
  ctx.rotate(radian);
  ctx.scale(fitScale * zoom, fitScale * zoom);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.restore();
};

export const ImageCropperModal = ({
  open,
  imageSrc,
  aspect = 1,
  title = '이미지 편집',
  onCancel,
  onSave
}: ImageCropperModalProps) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const safeAspect = useMemo(() => (aspect > 0 ? aspect : 1), [aspect]);
  const previewWidth = 720;
  const previewHeight = useMemo(() => Math.max(240, Math.round(previewWidth / safeAspect)), [safeAspect]);

  useEffect(() => {
    if (!open || !imageSrc) return;
    let isMounted = true;
    createImage(imageSrc)
      .then((img) => {
        if (!isMounted) return;
        setLoadedImage(img);
      })
      .catch((error) => {
        console.error('이미지 로드 실패:', error);
        if (isMounted) setLoadedImage(null);
      });
    return () => {
      isMounted = false;
    };
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
    setRotation(0);
    setOffsetX(0);
    setOffsetY(0);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open || !loadedImage || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawImageWithTransform(ctx, loadedImage, previewWidth, previewHeight, zoom, rotation, offsetX, offsetY);
  }, [open, loadedImage, zoom, rotation, offsetX, offsetY, previewWidth, previewHeight]);

  const handleSave = async () => {
    if (!loadedImage) return;
    setIsProcessing(true);
    try {
      const outputWidth = 1200;
      const outputHeight = Math.max(200, Math.round(outputWidth / safeAspect));
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = outputWidth;
      outputCanvas.height = outputHeight;
      const outputCtx = outputCanvas.getContext('2d');

      if (!outputCtx) throw new Error('Canvas context not available');

      drawImageWithTransform(outputCtx, loadedImage, outputWidth, outputHeight, zoom, rotation, offsetX, offsetY);

      const { file, url } = await new Promise<{ file: File; url: string }>((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const file = new File([blob], `cropped-${Date.now()}.png`, { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            resolve({ file, url });
          },
          'image/png',
          1
        );
      });
      onSave(file, url);
    } catch (error) {
      console.error('이미지 편집 실패:', error);
      alert('이미지 편집에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-700 p-3">
            <div className="w-full flex justify-center">
              <canvas ref={previewCanvasRef} className="w-full h-auto rounded bg-black" />
            </div>
            <p className="text-[11px] text-gray-300 mt-2">미리보기 영역 기준으로 크롭 결과가 저장됩니다.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-500">줌</div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-xs text-gray-500 text-right">{zoom.toFixed(1)}x</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-500">회전</div>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-xs text-gray-500 text-right">{rotation}°</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1"
              >
                <RotateCcw size={14} /> -90°
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1"
              >
                <RotateCw size={14} /> +90°
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-500">좌우</div>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-xs text-gray-500 text-right">{Math.round(offsetX * 100)}%</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-500">상하</div>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-xs text-gray-500 text-right">{Math.round(offsetY * 100)}%</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setOffsetX(0);
                setOffsetY(0);
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs"
            >
              초기화
            </button>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {isProcessing ? '처리 중...' : '적용'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
