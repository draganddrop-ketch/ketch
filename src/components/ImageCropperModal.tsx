import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const ImageCropperModal = ({
  open,
  imageSrc,
  aspect = 1,
  title = '이미지 편집',
  onCancel,
  onSave
}: ImageCropperModalProps) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewSurfaceRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    baseOffsetX: number;
    baseOffsetY: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    baseOffsetX: 0,
    baseOffsetY: 0
  });
  const cropDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    mode: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se';
    startX: number;
    startY: number;
    startRect: { x: number; y: number; width: number; height: number };
  }>({
    active: false,
    pointerId: null,
    mode: 'move',
    startX: 0,
    startY: 0,
    startRect: { x: 0, y: 0, width: 100, height: 100 }
  });
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [cropRect, setCropRect] = useState({ x: 60, y: 60, width: 240, height: 240 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 720 : window.innerHeight
  }));
  const safeAspect = useMemo(() => (aspect > 0 ? aspect : 1), [aspect]);
  const previewSize = useMemo(() => {
    const maxWidth = Math.max(260, Math.min(720, viewport.width - 96));
    const maxHeight = Math.max(220, Math.min(420, viewport.height - 420));
    let width = maxWidth;
    let height = Math.round(width / safeAspect);

    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * safeAspect);
    }

    return { width, height };
  }, [safeAspect, viewport.width, viewport.height]);

  const previewWidth = previewSize.width;
  const previewHeight = previewSize.height;

  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

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
    setIsDragging(false);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const width = Math.max(120, Math.round(previewWidth * 0.8));
    const height = Math.max(120, Math.round(previewHeight * 0.8));
    setCropRect({
      x: Math.round((previewWidth - width) / 2),
      y: Math.round((previewHeight - height) / 2),
      width,
      height
    });
  }, [open, imageSrc, previewWidth, previewHeight]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);

    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseOffsetX: offsetX,
      baseOffsetY: offsetY
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = (e.clientX - dragRef.current.startX) / rect.width;
    const deltaY = (e.clientY - dragRef.current.startY) / rect.height;

    setOffsetX(clamp(dragRef.current.baseOffsetX + deltaX, -1, 1));
    setOffsetY(clamp(dragRef.current.baseOffsetY + deltaY, -1, 1));
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    try {
      if (dragRef.current.pointerId !== null) {
        e.currentTarget.releasePointerCapture(dragRef.current.pointerId);
      }
    } catch {
      // ignore release errors
    }
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setIsDragging(false);
  };

  const beginCropDrag = (
    e: ReactPointerEvent<HTMLElement>,
    mode: 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    cropDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...cropRect }
    };
  };

  const handleCropPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!cropDragRef.current.active || !previewSurfaceRef.current) return;
    const rect = previewSurfaceRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = (e.clientX - cropDragRef.current.startX) * (previewWidth / rect.width);
    const dy = (e.clientY - cropDragRef.current.startY) * (previewHeight / rect.height);
    const minSize = 60;
    const s = cropDragRef.current.startRect;

    if (cropDragRef.current.mode === 'move') {
      setCropRect({
        x: clamp(s.x + dx, 0, previewWidth - s.width),
        y: clamp(s.y + dy, 0, previewHeight - s.height),
        width: s.width,
        height: s.height
      });
      return;
    }

    if (cropDragRef.current.mode === 'resize-nw') {
      const x = clamp(s.x + dx, 0, s.x + s.width - minSize);
      const y = clamp(s.y + dy, 0, s.y + s.height - minSize);
      setCropRect({
        x,
        y,
        width: s.x + s.width - x,
        height: s.y + s.height - y
      });
      return;
    }

    if (cropDragRef.current.mode === 'resize-ne') {
      const y = clamp(s.y + dy, 0, s.y + s.height - minSize);
      setCropRect({
        x: s.x,
        y,
        width: clamp(s.width + dx, minSize, previewWidth - s.x),
        height: s.y + s.height - y
      });
      return;
    }

    if (cropDragRef.current.mode === 'resize-sw') {
      const x = clamp(s.x + dx, 0, s.x + s.width - minSize);
      setCropRect({
        x,
        y: s.y,
        width: s.x + s.width - x,
        height: clamp(s.height + dy, minSize, previewHeight - s.y)
      });
      return;
    }

    if (cropDragRef.current.mode === 'resize-se') {
      setCropRect({
        x: s.x,
        y: s.y,
        width: clamp(s.width + dx, minSize, previewWidth - s.x),
        height: clamp(s.height + dy, minSize, previewHeight - s.y)
      });
    }
  };

  const handleCropPointerEnd = (e: ReactPointerEvent<HTMLElement>) => {
    if (!cropDragRef.current.active) return;
    try {
      if (cropDragRef.current.pointerId !== null) {
        e.currentTarget.releasePointerCapture(cropDragRef.current.pointerId);
      }
    } catch {
      // ignore release errors
    }
    cropDragRef.current.active = false;
    cropDragRef.current.pointerId = null;
  };

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
      const renderScale = 3;
      const renderedCanvas = document.createElement('canvas');
      renderedCanvas.width = Math.max(1, Math.round(previewWidth * renderScale));
      renderedCanvas.height = Math.max(1, Math.round(previewHeight * renderScale));
      const renderedCtx = renderedCanvas.getContext('2d');
      if (!renderedCtx) throw new Error('Canvas context not available');
      drawImageWithTransform(
        renderedCtx,
        loadedImage,
        renderedCanvas.width,
        renderedCanvas.height,
        zoom,
        rotation,
        offsetX,
        offsetY
      );

      const cropX = clamp(Math.round(cropRect.x * renderScale), 0, renderedCanvas.width - 1);
      const cropY = clamp(Math.round(cropRect.y * renderScale), 0, renderedCanvas.height - 1);
      const cropW = clamp(Math.round(cropRect.width * renderScale), 1, renderedCanvas.width - cropX);
      const cropH = clamp(Math.round(cropRect.height * renderScale), 1, renderedCanvas.height - cropY);

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = cropW;
      outputCanvas.height = cropH;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error('Canvas context not available');
      outputCtx.drawImage(renderedCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

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
      <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto">
          <div className="w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-700 p-3">
            <div className="w-full flex justify-center">
              <div
                ref={previewSurfaceRef}
                className="relative"
                style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="rounded bg-black"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    touchAction: 'none',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                  onLostPointerCapture={handlePointerEnd}
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute bg-black/45" style={{ left: 0, top: 0, width: '100%', height: `${cropRect.y}px` }} />
                  <div
                    className="absolute bg-black/45"
                    style={{ left: 0, top: `${cropRect.y}px`, width: `${cropRect.x}px`, height: `${cropRect.height}px` }}
                  />
                  <div
                    className="absolute bg-black/45"
                    style={{
                      left: `${cropRect.x + cropRect.width}px`,
                      top: `${cropRect.y}px`,
                      width: `${Math.max(0, previewWidth - (cropRect.x + cropRect.width))}px`,
                      height: `${cropRect.height}px`
                    }}
                  />
                  <div
                    className="absolute bg-black/45"
                    style={{
                      left: 0,
                      top: `${cropRect.y + cropRect.height}px`,
                      width: '100%',
                      height: `${Math.max(0, previewHeight - (cropRect.y + cropRect.height))}px`
                    }}
                  />
                </div>
                <div
                  className="absolute border-2 border-white/95 rounded-sm"
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.width}px`,
                    height: `${cropRect.height}px`,
                    cursor: 'move'
                  }}
                  onPointerDown={(e) => beginCropDrag(e, 'move')}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerEnd}
                  onPointerCancel={handleCropPointerEnd}
                  onLostPointerCapture={handleCropPointerEnd}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-white/70" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/70" />
                  <div className="absolute inset-y-0 left-0 w-px bg-white/70" />
                  <div className="absolute inset-y-0 right-0 w-px bg-white/70" />

                  <button
                    type="button"
                    className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-white border border-gray-600 cursor-nwse-resize"
                    onPointerDown={(e) => beginCropDrag(e, 'resize-nw')}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerEnd}
                    onPointerCancel={handleCropPointerEnd}
                    onLostPointerCapture={handleCropPointerEnd}
                  />
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-white border border-gray-600 cursor-nesw-resize"
                    onPointerDown={(e) => beginCropDrag(e, 'resize-ne')}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerEnd}
                    onPointerCancel={handleCropPointerEnd}
                    onLostPointerCapture={handleCropPointerEnd}
                  />
                  <button
                    type="button"
                    className="absolute -left-2 -bottom-2 w-4 h-4 rounded-full bg-white border border-gray-600 cursor-nesw-resize"
                    onPointerDown={(e) => beginCropDrag(e, 'resize-sw')}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerEnd}
                    onPointerCancel={handleCropPointerEnd}
                    onLostPointerCapture={handleCropPointerEnd}
                  />
                  <button
                    type="button"
                    className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-white border border-gray-600 cursor-nwse-resize"
                    onPointerDown={(e) => beginCropDrag(e, 'resize-se')}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerEnd}
                    onPointerCancel={handleCropPointerEnd}
                    onLostPointerCapture={handleCropPointerEnd}
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-300 mt-2">이미지는 캔버스 드래그로 이동하고, 흰색 크롭 박스는 드래그/모서리 핸들로 자유롭게 조절됩니다.</p>
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
                min={-180}
                max={180}
                step={0.1}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                min={-180}
                max={180}
                step={0.1}
                value={rotation}
                onChange={(e) => setRotation(clamp(Number(e.target.value) || 0, -180, 180))}
                className="w-20 text-xs text-gray-700 text-right border border-gray-200 rounded px-1.5 py-1"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRotation((r) => clamp(r - 15, -180, 180))}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1"
              >
                <RotateCcw size={14} /> -15°
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => clamp(r + 15, -180, 180))}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs flex items-center gap-1"
              >
                <RotateCw size={14} /> +15°
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 text-xs text-gray-500">좌우</div>
              <input
                type="range"
                min={-1}
                max={1}
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
                min={-1}
                max={1}
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
                setCropRect({
                  x: Math.round(previewWidth * 0.1),
                  y: Math.round(previewHeight * 0.1),
                  width: Math.max(120, Math.round(previewWidth * 0.8)),
                  height: Math.max(120, Math.round(previewHeight * 0.8))
                });
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
