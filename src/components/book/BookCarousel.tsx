"use client";
import React, { useRef, useState, useEffect, useCallback } from 'react'; // Core React + hooks
import Link from 'next/link';
import { slugify } from '@/lib/slug';
import clsx from 'clsx';

// Minimal data needed to render a book card
export interface CarouselBook { id: string; title: string; coverUrl: string | null; }
// Component props (itemsPerView is a hint; layout recalculates responsively)
interface BookCarouselProps { books: CarouselBook[]; title: string; iconSrc: string; itemsPerView?: number; emptyMessage?: string; }

// Fallback image used when a book has no cover
const FALLBACK_COVER = '/img/svg/navbar/book1.svg';

// Helper to scroll horizontally honoring user reduced‑motion preference
function smoothScroll(el: HTMLElement, left: number, prefersReduced: boolean) {
    el.scrollTo({ left, behavior: prefersReduced ? 'auto' : 'smooth' });
}

export const BookCarousel: React.FC<BookCarouselProps> = ({ books, title, iconSrc, itemsPerView = 5, emptyMessage = 'Nenhuma obra registrada.' }) => {
    // Refs to DOM nodes we need for measuring / event binding
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Arrow enablement state
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    // Index of the leftmost (or snapped) card used for bullets
    const [activeIndex, setActiveIndex] = useState(0);
    // Whether autoplay is currently paused (hover / dragging)
    const [paused, setPaused] = useState(false);
    // Dynamic layout values
    const [cardWidth, setCardWidth] = useState(0);
    const [gap, setGap] = useState(18);
    const [visibleCount, setVisibleCount] = useState(itemsPerView);
    // Whether content is wider than the viewport and can scroll
    const [isScrollable, setIsScrollable] = useState(false);
    // Respect prefers-reduced-motion to avoid smooth animations & autoplay movement
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Compute responsive layout: how many cards fit, their width, and gap
    const computeLayout = useCallback(() => {
        if (!scrollRef.current) return;
        const w = scrollRef.current.clientWidth; // container width
        let target = itemsPerView;               // start from desired count
        // Breakpoints limiting how many cards we try to show
        if (w < 420) target = Math.min(3, itemsPerView);
        else if (w < 640) target = Math.min(3, itemsPerView);
        else if (w < 900) target = Math.min(4, itemsPerView);
        else target = itemsPerView;              // large screens use full requested
        // Gap scales slightly with viewport for visual balance
        const baseGap = w < 480 ? 10 : w < 640 ? 14 : w < 900 ? 18 : 22;
        // Available horizontal space after subtracting gaps + small padding tweak
        const available = w - baseGap * (target - 1) - 4;
        const rawWidth = available / target;     // provisional width per card
        // Clamp to avoid cards becoming too tiny or too large
        const clamped = Math.max(100, Math.min(rawWidth, 190));
        setCardWidth(clamped);                   // commit calculated width
        setGap(baseGap);                         // update gap
        setVisibleCount(target);                 // store actual count we will show
    }, [itemsPerView]);

    useEffect(() => {
        computeLayout(); // initial layout pass
        const ro = new ResizeObserver(() => computeLayout()); // react to width changes
        if (scrollRef.current) ro.observe(scrollRef.current);
        if (typeof window !== 'undefined') window.addEventListener('resize', computeLayout);
        return () => {
            ro.disconnect();
            if (typeof window !== 'undefined') window.removeEventListener('resize', computeLayout);
        };
    }, [computeLayout]);

    // Recalculate arrow enabled state + active snapped index
    const updateArrows = useCallback(() => {
        const el = scrollRef.current; if (!el) return;
        setCanPrev(el.scrollLeft > 4); // small threshold to hide prev near start
        setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4); // near end hide next
        setIsScrollable(el.scrollWidth > el.clientWidth + 4);
        const snap = cardWidth + gap;  // snap distance between cards
        if (snap > 0) {
            const idx = Math.round(el.scrollLeft / snap); // nearest snapped index
            if (idx !== activeIndex) setActiveIndex(Math.min(books.length - 1, Math.max(0, idx)));
        }
    }, [activeIndex, books.length, cardWidth, gap]);

    useEffect(() => { updateArrows(); }, [books.length, cardWidth, updateArrows]);

    // Scroll relative (dir = +1 forward, -1 backward)
    const scrollByCards = useCallback((dir: number) => {
        const el = scrollRef.current; if (!el) return;
        const delta = dir * (cardWidth + gap);
        smoothScroll(el, el.scrollLeft + delta, prefersReducedMotion);
    }, [cardWidth, gap, prefersReducedMotion]);

    // Scroll to an absolute snapped index (used by bullets)
    const scrollToIndex = useCallback((index: number) => {
        const el = scrollRef.current; if (!el) return;
        const snap = cardWidth + gap;
        smoothScroll(el, index * snap, prefersReducedMotion);
    }, [cardWidth, gap, prefersReducedMotion]);

    // Keyboard accessibility: arrow keys to navigate when section focused
    useEffect(() => {
        const el = containerRef.current; if (!el) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); scrollByCards(-1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); scrollByCards(1); }
        };
        el.addEventListener('keydown', onKey);
        return () => el.removeEventListener('keydown', onKey);
    });

    useEffect(() => {
        const el = scrollRef.current; if (!el) return;
        // Pointer drag state
    let isDown = false; let startX = 0; let startY = 0; let startLeft = 0; let lastT = 0; let didDrag = false;
        const DRAG_THRESHOLD = 6; // pixels before we treat as drag and cancel click
        const onDown = (e: PointerEvent) => {
            if (!isScrollable) return;
            if (e.button !== 0) return; // only primary button
            isDown = true; startX = e.clientX; startY = e.clientY; startLeft = el.scrollLeft; lastT = performance.now(); didDrag = false;
            el.setPointerCapture(e.pointerId); // ensure we keep getting events outside bounds
            setPaused(true); // pause autoplay while interacting
        };
        const onMove = (e: PointerEvent) => {
            if (!isDown) return;
            const dx = e.clientX - startX; const dy = e.clientY - startY;
            if (!didDrag && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
                return; // ignore micro movements so clicks still work
            }
            if (!didDrag) { didDrag = true; el.classList.add('dragging'); }
            e.preventDefault();
            el.scrollLeft = startLeft - dx; updateArrows();
            lastT = performance.now(); // track last movement time for velocity
        };
        const onUp = (e: PointerEvent) => {
            if (!isDown) return; isDown = false; el.releasePointerCapture(e.pointerId); el.classList.remove('dragging');
            if (didDrag) {
                const dx = e.clientX - startX; const dt = performance.now() - lastT; // distance & delta time
                const velocity = Math.abs(dx) / dt; // simple velocity heuristic
                // Swipe heuristic: velocity OR distance threshold triggers a page shift
                if (velocity > 0.45 || Math.abs(dx) > cardWidth * 0.4) { scrollByCards(dx < 0 ? 1 : -1); }
                else {
                    // Otherwise snap back to nearest card
                    const snap = cardWidth + gap; const index = Math.round(el.scrollLeft / snap);
                    smoothScroll(el, index * snap, prefersReducedMotion);
                }
            } else {
                // Not a drag: manually trigger click on the anchor under pointer
                const node = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
                const anchor = node?.closest('a');
                if (anchor && el.contains(anchor)) {
                    (anchor as HTMLAnchorElement).click();
                }
            }
            setTimeout(() => setPaused(false), 800); // small delay after interaction end for stability
        };
        const onWheel = (e: WheelEvent) => {
            if (!e.shiftKey) return; // only custom behavior when user holds Shift
            const el = scrollRef.current; if (!el) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY; // map vertical wheel to horizontal scroll
            updateArrows();
        };
        // Listeners
        el.addEventListener('pointerdown', onDown, { passive: true });
        el.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        el.addEventListener('scroll', updateArrows, { passive: true });
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            el.removeEventListener('scroll', updateArrows);
            el.removeEventListener('wheel', onWheel);
        };
    }, [cardWidth, gap, prefersReducedMotion, updateArrows, scrollByCards, isScrollable]);

    // Autoplay (pausa no hover / interação)
    // Autoplay cycle: every 4s move forward, loop to start. Disabled when:
    //  - user prefers reduced motion
    //  - there are <= 1 items
    //  - paused due to hover / drag
    useEffect(() => {
        if (prefersReducedMotion) return;
        if (books.length <= 1) return;
        if (paused) return;
        const interval = setInterval(() => {
            const el = scrollRef.current; if (!el) return;
            const snap = cardWidth + gap; if (snap <= 0) return;
            const idx = Math.round(el.scrollLeft / snap);
            if (idx >= books.length - 1) {
                smoothScroll(el, 0, prefersReducedMotion); // loop back
            } else {
                scrollByCards(1); // advance
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [books.length, cardWidth, gap, paused, prefersReducedMotion, scrollByCards]);

    // Hover pause handlers
    // Pause autoplay while hovering the scroll area, resume on leave
    useEffect(() => {
        const el = scrollRef.current; if (!el) return;
        const enter = () => setPaused(true);
        const leave = () => setPaused(false);
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
        return () => {
            el.removeEventListener('mouseenter', enter);
            el.removeEventListener('mouseleave', leave);
        };
    }, []);

    // Reusable 3-line clamp style (with ellipsis) for titles
    const clamp3: React.CSSProperties = {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
    };

    return (
        <section className="mt-8 w-full" ref={containerRef} tabIndex={0} aria-roledescription="carousel">
            <div className="relative">
                <div className="flex items-center justify-center gap-2 bg-readowl-purple-medium px-6 sm:px-8 py-2 text-white font-yusei text-lg select-none shadow mx-auto max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconSrc} alt="Icone" className="w-5 h-5 opacity-90" />
                    <h2 className="text-sm sm:text-base md:text-lg font-yusei tracking-wide">{title}</h2>
                </div>
            </div>

            {books.length === 0 && <div className="text-sm text-readowl-purple-extralight mt-6 px-2">{emptyMessage}</div>}

            {books.length > 0 && (
                <div className="relative mt-5">
                    <button
                        aria-label="Anterior"
                        disabled={!canPrev}
                        onClick={() => scrollByCards(-1)}
                        className={clsx('absolute z-20 left-0 top-1/2 -translate-y-1/2 pl-1 pr-2 py-2 text-readowl-purple-dark transition active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple', !canPrev && 'opacity-30 cursor-not-allowed')}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img/svg/generics/purple/chevron-left.svg" alt="Anterior" className="w-7 h-7 pointer-events-none select-none" />
                    </button>

                    <div
                        ref={scrollRef}
                        className={clsx(
                            'hide-scrollbar relative mx-9 flex overflow-x-auto scroll-smooth select-none',
                            isScrollable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                        )}
                        style={{ gap }}
                    >
            {books.map(b => (
                            <Link
                                key={b.id}
                href={`/library/books/${slugify(b.title)}`}
                                aria-label={b.title}
                                className="group relative flex-shrink-0 overflow-hidden shadow-md ring-1 ring-readowl-purple-light/40 hover:ring-readowl-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple-dark"
                                style={{ width: cardWidth, aspectRatio: '3 / 4' }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={b.coverUrl || FALLBACK_COVER}
                                    alt={b.title}
                                    draggable={false}
                                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 flex flex-col justify-end">
                                    <div className="pointer-events-none mt-auto w-full px-2 pb-1 pt-8 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                                        <p
                                            title={b.title}
                                            className="text-[11px] sm:text-xs font-medium text-white leading-snug drop-shadow-md text-center"
                                            style={clamp3}
                                        >
                                            {b.title}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    <button
                        aria-label="Próximo"
                        disabled={!canNext}
                        onClick={() => scrollByCards(1)}
                        className={clsx('absolute z-20 right-0 top-1/2 -translate-y-1/2 pr-1 pl-2 py-2 text-readowl-purple-dark transition active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple', !canNext && 'opacity-30 cursor-not-allowed')}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img/svg/generics/purple/chevron-right.svg" alt="Próximo" className="w-7 h-7 pointer-events-none select-none" />
                    </button>
                </div>
            )}

            {books.length > 0 && (() => {
                // Number of scroll positions (sliding window of visibleCount)
                const pages = Math.max(1, books.length > visibleCount ? (books.length - visibleCount + 1) : 1);
                if (pages <= 1) return null; // hide bullets if only one page
                const activePage = Math.min(pages - 1, activeIndex); // guard against overflow
                return (
                    <div className="mt-4 flex justify-center gap-2 flex-wrap" aria-label="Indicadores de posição">
                        {Array.from({ length: pages }).map((_, i) => (
                            <button
                                key={i}
                                aria-label={`Ir para posição ${i + 1}`}
                                aria-current={i === activePage}
                                onClick={() => scrollToIndex(i)}
                                className={clsx('h-2.5 transition-all', i === activePage ? 'bg-readowl-purple w-5' : 'bg-readowl-purple-light/50 w-2 hover:bg-readowl-purple-light/80')}
                            />
                        ))}
                    </div>
                );
            })()}

            {/* Global styles inside component for scrollbar hiding & snapping */}
            <style jsx global>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scroll-snap-type: x mandatory; }
        .hide-scrollbar > a { scroll-snap-align: center; }
        .hide-scrollbar.dragging { cursor: grabbing; }
        .hide-scrollbar > a { transition: transform 0.4s ease; }
        @media (prefers-reduced-motion: reduce) { .hide-scrollbar > a { transition: none; } }
      `}</style>
        </section>
    );
};

export default BookCarousel;
