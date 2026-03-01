"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Šířka přes celou obálku, výška v poměru 16:9
const VIEWPORT_WIDTH_PCT = 100;
const VIEWPORT_HEIGHT_PCT = 56.25; // 100 * 9/16
const CENTER_OFFSET_X = VIEWPORT_WIDTH_PCT / 2;
const CENTER_OFFSET_Y = VIEWPORT_HEIGHT_PCT / 2;
const MIN_X = CENTER_OFFSET_X;
const MAX_X = 100 - CENTER_OFFSET_X;
const MIN_Y = CENTER_OFFSET_Y;
const MAX_Y = 100 - CENTER_OFFSET_Y;

function clampPosition(x: number, y: number): [number, number] {
  return [
    Math.max(MIN_X, Math.min(MAX_X, x)),
    Math.max(MIN_Y, Math.min(MAX_Y, y)),
  ];
}

function positionToRect(positionX: number, positionY: number) {
  const left = positionX - CENTER_OFFSET_X;
  const top = positionY - CENTER_OFFSET_Y;
  return {
    left: Math.max(0, Math.min(100 - VIEWPORT_WIDTH_PCT, left)),
    top: Math.max(0, Math.min(100 - VIEWPORT_HEIGHT_PCT, top)),
  };
}

interface BookCoverCropModalProps {
  imageUrl: string;
  initialPositionX?: number;
  initialPositionY?: number;
  onSave: (positionX: number, positionY: number) => void;
  onClose: () => void;
}

export default function BookCoverCropModal({
  imageUrl,
  initialPositionX = 50,
  initialPositionY = 50,
  onSave,
  onClose,
}: BookCoverCropModalProps) {
  const [initial] = useState(() =>
    clampPosition(initialPositionX ?? 50, initialPositionY ?? 50)
  );
  const [positionX, setPositionX] = useState(initial[0]);
  const [positionY, setPositionY] = useState(initial[1]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const rect = positionToRect(positionX, positionY);

  const updateImageSize = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    if (w && h) setImageSize({ width: w, height: h });
  }, []);

  useEffect(() => {
    updateImageSize();
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) updateImageSize();
    else img.addEventListener("load", updateImageSize);
    const ro = new ResizeObserver(updateImageSize);
    ro.observe(img);
    return () => {
      img.removeEventListener("load", updateImageSize);
      ro.disconnect();
    };
  }, [imageUrl, updateImageSize]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: positionX,
      posY: positionY,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !imageSize.width || !imageSize.height) return;
    const dx = ((e.clientX - dragStart.current.x) / imageSize.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / imageSize.height) * 100;
    const [newX, newY] = clampPosition(
      dragStart.current.posX + dx,
      dragStart.current.posY + dy
    );
    setPositionX(newX);
    setPositionY(newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging) {
      setDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  const handleDone = () => {
    onSave(Math.round(positionX), Math.round(positionY));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={containerRef}
        className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-foreground">
            Zvolte oblast zobrazení obálky
          </h2>
          <p className="text-sm text-foreground/70 mt-1">
            Přetáhněte rámeček svisle. Rámeček je vždy na celou šířku obálky (poměr 16∶9).
          </p>
        </div>

        <div className="flex-1 min-h-0 p-6 pt-2 flex items-center justify-center overflow-auto">
          <div className="relative inline-block max-w-full max-h-[60vh] bg-black/5 rounded-xl overflow-hidden">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Obálka knihy"
              className="max-w-full max-h-[60vh] w-auto h-auto object-contain block align-top"
              draggable={false}
              style={{ touchAction: "none" }}
            />
            {/* Draggable viewport frame */}
            <div
              className="absolute border-2 border-white shadow-lg cursor-move flex items-center justify-center"
              style={{
                left: `${rect.left}%`,
                top: `${rect.top}%`,
                width: `${VIEWPORT_WIDTH_PCT}%`,
                height: `${VIEWPORT_HEIGHT_PCT}%`,
                boxSizing: "border-box",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              role="slider"
              aria-label="Pozice zobrazení obálky"
              tabIndex={0}
            >
              <span className="text-white text-xs font-semibold drop-shadow-md bg-black/40 px-2 py-1 rounded">
                Zobrazená oblast
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-black/10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-black/20 text-foreground font-semibold hover:bg-black/5 transition-colors"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
          >
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}
