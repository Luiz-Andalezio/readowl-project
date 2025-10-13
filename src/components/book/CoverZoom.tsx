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

  // Lock body scroll while open and close with ESC
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [open]);

  const openZoom = () => setOpen(true);
  const closeZoom = () => setOpen(false);

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
            className="absolute top-4 right-4 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Centered large image */}
          <div className="relative max-w-[min(92vw,900px)] max-h-[88vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full">
              <Image
                src={src}
                alt={alt}
                fill
                sizes="92vw"
                className="object-contain select-none"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
