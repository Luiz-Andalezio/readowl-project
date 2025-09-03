"use client";
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

export interface CarouselBook {
  id: string;
  title: string;
  coverUrl: string | null;
}

interface BookCarouselProps {
  books: CarouselBook[];
  title: string;
  iconSrc: string;
  itemsPerView?: number; // default 5
}

// Use an existing asset as fallback (adjust if you add a dedicated placeholder later)
const FALLBACK_COVER = "/img/svg/library/book1.svg";

export const BookCarousel: React.FC<BookCarouselProps> = ({ books, title, iconSrc, itemsPerView = 5 }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement | null>(null); // whole carousel (arrows + track)
  const trackWrapperRef = useRef<HTMLDivElement | null>(null); // wraps the visible book items
  const leftBtnRef = useRef<HTMLButtonElement | null>(null);
  const rightBtnRef = useRef<HTMLButtonElement | null>(null);
  const [layout, setLayout] = useState<{ headerWidth: number | null; arrowTop: number; leftPad: number; rightPad: number }>({ headerWidth: null, arrowTop: 0, leftPad: 0, rightPad: 0 });
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canScroll = books.length > itemsPerView;
  const n = books.length;

  const visible = useMemo(() => {
    if (n === 0) return [] as CarouselBook[];
    if (!canScroll) return books; // show all if fewer than itemsPerView
    const arr: CarouselBook[] = [];
    for (let i = 0; i < itemsPerView; i++) arr.push(books[(startIndex + i + n) % n]);
    return arr;
  }, [books, startIndex, canScroll, itemsPerView, n]);

  const step = useCallback((delta: 1 | -1) => {
    if (!canScroll) return;
    setDirection(delta);
    if (!prefersReducedMotion) {
      setAnimating(true);
      // end animation shortly after
      setTimeout(() => setAnimating(false), 260);
    }
    setStartIndex(idx => (idx + delta + n) % n);
  }, [canScroll, n, prefersReducedMotion]);

  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  // Keyboard navigation when focused / hovered
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { prev(); }
      else if (e.key === 'ArrowRight') { next(); }
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [prev, next]);

  // Measure widths and compute arrow vertical center relative to cover (ignoring title text height).
  useEffect(() => {
    const measure = () => {
      if (!trackWrapperRef.current) return;
      const trackW = trackWrapperRef.current.offsetWidth;
      const leftW = leftBtnRef.current?.offsetWidth || 0;
      const rightW = rightBtnRef.current?.offsetWidth || 0;

      // Find first cover container
      let arrowTop = 0;
      if (containerRef.current) {
        const coverEl = containerRef.current.querySelector('[data-cover]') as HTMLElement | null;
        if (coverEl) {
          const rect = coverEl.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
            // center of cover relative to container top
          arrowTop = rect.top - containerRect.top + rect.height / 2;
        }
      }

      let headerWidth = trackW + leftW + rightW;
      if (typeof window !== 'undefined') headerWidth = Math.min(headerWidth, window.innerWidth - 24);
      setLayout({ headerWidth, arrowTop, leftPad: leftW + 4, rightPad: rightW + 4 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackWrapperRef.current) ro.observe(trackWrapperRef.current);
    if (typeof window !== 'undefined') window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      if (typeof window !== 'undefined') window.removeEventListener('resize', measure);
    };
  }, [visible.length]);

  return (
    <section className="mt-8 w-full">
      <div
        className="flex items-center gap-2 bg-readowl-purple-medium rounded-full px-4 sm:px-5 py-2 text-white font-yusei text-lg select-none shadow mx-auto transition-width duration-200"
        style={layout.headerWidth ? { width: layout.headerWidth } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} alt="Icone" className="w-5 h-5 opacity-90" />
        <h2 className="text-sm sm:text-base md:text-lg font-yusei tracking-wide">{title}</h2>
      </div>

      {n === 0 && (
        <div className="text-sm text-readowl-purple mt-6 px-2">Nenhum livro encontrado.</div>
      )}

      {n > 0 && (
        <div
          ref={containerRef}
          tabIndex={0}
          className="relative mt-5 outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple-dark rounded-lg mx-auto w-fit"
          style={{ paddingLeft: layout.leftPad, paddingRight: layout.rightPad }}
        >
          <button
            aria-label="Anterior"
            onClick={prev}
            disabled={!canScroll}
            ref={leftBtnRef}
            style={layout.arrowTop ? { top: layout.arrowTop, transform: 'translateY(-50%)' } : undefined}
            className={clsx(
              'group absolute left-0 z-10 p-1.5 rounded-full transition disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 text-readowl-purple-dark',
              !layout.arrowTop && 'invisible'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/svg/generics/chevron-left.svg" alt="Anterior" className="w-25 h-25" />
          </button>

          <div ref={trackWrapperRef} className="relative overflow-hidden">
            <div className={clsx(
              'flex justify-center gap-4 sm:gap-5',
              !prefersReducedMotion && animating && (direction === 1 ? 'animate-slide-left' : 'animate-slide-right')
            )}>
              {visible.map((b, idx) => (
                <div key={`${b.id}-${b.title}`} className="flex flex-col items-center w-[165px] sm:w-[170px] md:w-[176px] select-none">
                  <Link href={`/books/${b.id}`} className="group block relative w-full">
                    <div
                      data-cover={idx === 0 ? 'true' : undefined}
                      className="w-full aspect-[3/4] overflow-hidden rounded-lg shadow-md ring-1 ring-readowl-purple-light/40 group-hover:ring-readowl-purple group-hover:shadow-lg transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.coverUrl || FALLBACK_COVER}
                        alt={b.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
                        loading="lazy"
                      />
                      <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </Link>
                  <Link href={`/books/${b.id}`} className="mt-2 text-[11px] text-center leading-tight text-readowl-purple-dark hover:underline line-clamp-3">
                    {b.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <button
            aria-label="Próximo"
            onClick={next}
            disabled={!canScroll}
            ref={rightBtnRef}
            style={layout.arrowTop ? { top: layout.arrowTop, transform: 'translateY(-50%)' } : undefined}
            className={clsx(
              'group absolute right-0 z-10 p-1.5 rounded-full transition disabled:opacity-25 disabled:cursor-not-allowed active:scale-90 text-readowl-purple-dark',
              !layout.arrowTop && 'invisible'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/svg/generics/chevron-right.svg" alt="Próximo" className="w-25 h-25" />
          </button>
        </div>
      )}
    </section>
  );
};

export default BookCarousel;
