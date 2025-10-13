"use client";
import React from 'react';
import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
};

export default function CoverZoom({ src, alt, width = 300, height = 400, sizes, className = '' }: Props) {
  const [open, setOpen] = React.useState(false);
  const [zoomed, setZoomed] = React.useState(false);
  const EXTRA_SCALE = 2.5; // reduced extra zoom factor
  const [dragging, setDragging] = React.useState(false);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const lastPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const movedRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [vp, setVp] = React.useState({ w: 0, h: 0 }); // viewport size

  // Lock body scroll while open and close with ESC
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('keydown', onKey);
      const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
      onResize();
      window.addEventListener('resize', onResize);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
      };
    }
  }, [open]);

  const openZoom = () => {
    setOpen(true);
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
  };
  const closeZoom = () => {
    setOpen(false);
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
  };

  // Compute displayed size keeping the cover aspect and fitting within viewport
  const baseW = width;
  const baseH = height;
  const maxW = Math.min(vp.w * 0.92, 900);
  const maxH = vp.h * 0.88;
  const fitScale = vp.w && vp.h ? Math.min(maxW / baseW, maxH / baseH) : 1;
  const dispW = baseW * fitScale * (zoomed ? EXTRA_SCALE : 1);
  const dispH = baseH * fitScale * (zoomed ? EXTRA_SCALE : 1);

  // Clamp panning relative to viewport and current displayed size
  const clampOffset = React.useCallback((next: { x: number; y: number }) => {
    const maxX = Math.max(0, (dispW - vp.w) / 2);
    const maxY = Math.max(0, (dispH - vp.h) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }, [dispW, dispH, vp.w, vp.h]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!zoomed) return;
    e.preventDefault();
    setDragging(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !zoomed || !lastPosRef.current) return;
    e.preventDefault();
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    if (!movedRef.current && Math.hypot(dx, dy) > 3) movedRef.current = true;
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
  };
  const onMouseUpLeave = () => {
    setDragging(false);
    lastPosRef.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!zoomed) return;
    const t = e.touches[0];
    lastPosRef.current = { x: t.clientX, y: t.clientY };
    movedRef.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!zoomed || !lastPosRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastPosRef.current.x;
    const dy = t.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: t.clientX, y: t.clientY };
    if (!movedRef.current && Math.hypot(dx, dy) > 3) movedRef.current = true;
    setOffset((prev) => clampOffset({ x: prev.x + dx, y: prev.y + dy }));
  };
  const onTouchEnd = () => {
    lastPosRef.current = null;
  };

  const onImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent backdrop close when clicking on the image area
    e.stopPropagation();
    if (movedRef.current) { movedRef.current = false; return; }
    // Toggle extra zoom; when enabling, center the clicked point
    setZoomed((z) => {
      const next = !z;
      if (next) {
        const el = containerRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const dx = (cx - clickX) * (EXTRA_SCALE - 1);
          const dy = (cy - clickY) * (EXTRA_SCALE - 1);
          setOffset(clampOffset({ x: dx, y: dy }));
        }
      } else {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={openZoom}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openZoom(); } }}
        className={`relative group cursor-zoom-in ${className}`}
        aria-label="Ampliar capa"
        title="Ampliar capa"
      >
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} className="w-full h-auto object-cover" />
        {/* Lens icon on hover */}
        <span className="pointer-events-none absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="bg-black/35 text-white rounded-full p-2">
            {/* magnifying glass icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-magic-in"
          onClick={closeZoom}
          aria-modal="true"
          role="dialog"
          aria-label="Capa ampliada"
        >
          {/* Close button */}
          <button
            aria-label="Fechar"
            onClick={(e) => { e.stopPropagation(); closeZoom(); }}
            type="button"
            title="Fechar"
            className="group absolute top-4 right-4 cursor-pointer text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 shadow-sm backdrop-blur-sm transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 hover:scale-110 active:scale-95"
          >
            <svg className="transition-transform duration-200 ease-out group-hover:rotate-90" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Centered image; extra zoom uses scale and may exceed viewport. Pan to explore. */}
          <div
            className="relative w-full h-full flex items-center justify-center"
          >
            <div
              ref={containerRef}
              className="relative select-none"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUpLeave}
              onMouseLeave={onMouseUpLeave}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              role="button"
              aria-label={zoomed ? 'Reduzir zoom' : 'Ampliar zoom'}
              title={zoomed ? 'Clique para reduzir' : 'Clique para ampliar'}
              onDoubleClick={onImageClick}
              onClick={onImageClick}
              style={{ cursor: zoomed ? (dragging ? 'grabbing' as const : 'grab' as const) : 'zoom-in' }}
            >
              <div
                style={{
                  width: dispW ? `${dispW}px` : undefined,
                  height: dispH ? `${dispH}px` : undefined,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  transition: dragging ? 'none' : 'transform 150ms ease-out',
                }}
                className="relative"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="98vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
