"use client";
import React, { useRef, useState, useEffect, useCallback } from 'react'; // Core React + hooks
import Link from 'next/link';
import { slugify } from '@/lib/slug';
import clsx from 'clsx';
import { BookMarked, ChevronLeft, ChevronRight, Book } from 'lucide-react';

// Minimal data needed to render a book card
export interface CarouselBook { id: string; title: string; coverUrl: string | null; }
// Component props (itemsPerView is a hint; layout recalculates responsively)
interface BookCarouselProps { books: CarouselBook[]; title: string; icon?: React.ReactNode; itemsPerView?: number; emptyMessage?: string; storageKey?: string }

// Fallback placeholder used when a book has no cover
const FALLBACK_PLACEHOLDER = (
    <div className="w-full h-full flex items-center justify-center bg-readowl-purple-extralight text-readowl-purple-medium">
        <Book size={36} />
    </div>
);

// Helper to scroll horizontally honoring user reduced‑motion preference
function smoothScroll(el: HTMLElement, left: number, prefersReduced: boolean) {
    el.scrollTo({ left, behavior: prefersReduced ? 'auto' : 'smooth' });
}

export const BookCarousel: React.FC<BookCarouselProps> = ({ books, title, icon = <BookMarked size={20} />, itemsPerView = 5, emptyMessage = 'Nenhuma obra registrada.', storageKey }) => {
    // Refs to DOM nodes we need for measuring / event binding
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const didInitRef = useRef(false);
    // Arrow enablement state
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    // Index of the leftmost (or snapped) card used for bullets
    const [activeIndex, setActiveIndex] = useState(0);
    // Whether autoplay is currently paused (hover / dragging)
    const [paused, setPaused] = useState(false);
    const idleResumeTimer = useRef<number | null>(null);
    // Dynamic layout values
    const [cardWidth, setCardWidth] = useState(0);
    const [gap, setGap] = useState(18);
    const [visibleCount, setVisibleCount] = useState(itemsPerView);
    const [peekPrev, setPeekPrev] = useState(24); // px of previous item visible on the left
    const [peekNext, setPeekNext] = useState(20); // px of next items visible on the right
    // Whether content is wider than the viewport and can scroll
    const [isScrollable, setIsScrollable] = useState(false);
    // Respect prefers-reduced-motion to avoid smooth animations & autoplay movement
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Infinite looping with minimal edge clones to avoid visible duplicates
    const loopEnabled = books.length > visibleCount + 1;
    const cloneCount = loopEnabled ? Math.min(books.length, visibleCount + 2) : 0;

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
        // Peeks: show a bit of previous on the left and a hint of next on the right
        const prev = Math.round(clamped * (w < 480 ? 0.18 : w < 768 ? 0.22 : 0.26));
        const next = Math.round(clamped * (w < 480 ? 0.18 : w < 768 ? 0.2 : 0.24));
        setPeekPrev(prev);
        setPeekNext(next);
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
        const snap = cardWidth + gap;  // distance between cards
        // With edge clones, normalize when leaving the real range
        if (loopEnabled) {
            const baseOffset = cloneCount * snap;
            const min = 0;
            const max = baseOffset + (books.length - 1) * snap;
            const l = el.scrollLeft + peekPrev; // consider peek for right-aligned highlight
            if (l < min + snap * 0.5) {
                // jumped into left clones: send to equivalent on right side
                el.scrollLeft = baseOffset + (books.length - 1) * snap - peekPrev;
            } else if (l > max + snap * 0.5) {
                // jumped into right clones: send to equivalent on left side
                el.scrollLeft = baseOffset - peekPrev;
            }
        }

        // Arrows & scrollability
        const origScrollable = books.length > visibleCount;
        setIsScrollable(origScrollable);
        if (origScrollable && loopEnabled) {
            // Infinite: both arrows are always available
            setCanPrev(true);
            setCanNext(true);
        } else {
            // Non-infinite: compute edges normally
            setCanPrev(el.scrollLeft > 4);
            setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
        }

        // Active index relative to the middle set
        if (snap > 0) {
            // Highlight: first fully visible card at right edge
            if (loopEnabled) {
                const baseOffset = cloneCount * snap;
                const normalizedLeft = el.scrollLeft - baseOffset + peekPrev;
                const idx = Math.round(normalizedLeft / snap);
                const clamped = Math.min(books.length - 1, Math.max(0, idx));
                if (clamped !== activeIndex) setActiveIndex(clamped);
            } else {
                const normalizedLeft = el.scrollLeft + peekPrev;
                const idx = Math.round(normalizedLeft / snap);
                const clamped = Math.min(books.length - 1, Math.max(0, idx));
                if (clamped !== activeIndex) setActiveIndex(clamped);
            }
        }
    }, [activeIndex, books.length, cardWidth, gap, visibleCount, peekPrev, cloneCount, loopEnabled]);

    useEffect(() => { updateArrows(); }, [books.length, cardWidth, updateArrows]);

    // Scroll relative (dir = +1 forward, -1 backward)
    const scrollByCards = useCallback((dir: number) => {
        const el = scrollRef.current; if (!el) return;
        const snap = cardWidth + gap;
        if (loopEnabled) {
            // determine current logical index (relative to real set)
            const baseOffset = cloneCount * snap;
            const idx = Math.round((el.scrollLeft - baseOffset + peekPrev) / snap);
            // pre-position across boundary to keep motion direction coherent
            if (dir > 0 && idx >= books.length - 1) {
                el.scrollLeft = el.scrollLeft - books.length * snap;
            } else if (dir < 0 && idx <= 0) {
                el.scrollLeft = el.scrollLeft + books.length * snap;
            }
            smoothScroll(el, el.scrollLeft + dir * snap, prefersReducedMotion);
        } else {
            smoothScroll(el, el.scrollLeft + dir * snap, prefersReducedMotion);
        }
    }, [cardWidth, gap, prefersReducedMotion, loopEnabled, cloneCount, peekPrev, books.length]);

    // Scroll to an absolute snapped index (used by bullets)
    const scrollToIndex = useCallback((index: number) => {
        const el = scrollRef.current; if (!el) return;
        const snap = cardWidth + gap;
        if (loopEnabled) {
            const baseOffset = cloneCount * snap;
            // Keep direction coherent on wrap edges when selecting bullets
            const currentIdx = Math.round((el.scrollLeft - baseOffset + peekPrev) / snap);
            // going from last -> 0: pre-position to left clones so scroll goes rightwards
            if (currentIdx === books.length - 1 && index === 0) {
                el.scrollLeft = el.scrollLeft - books.length * snap;
            }
            // going from 0 -> last: pre-position to right clones so scroll goes leftwards
            if (currentIdx === 0 && index === books.length - 1) {
                el.scrollLeft = el.scrollLeft + books.length * snap;
            }
            const target = baseOffset + index * snap - peekPrev;
            smoothScroll(el, target, prefersReducedMotion);
        } else {
            smoothScroll(el, index * snap - peekPrev, prefersReducedMotion);
        }
    }, [cardWidth, gap, prefersReducedMotion, peekPrev, cloneCount, loopEnabled, books.length]);

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
                const velocity = Math.abs(dx) / Math.max(1, dt); // px per ms
                const dir = dx < 0 ? 1 : -1;
                const snap = cardWidth + gap;
                const loop = loopEnabled;
                const swipe = Math.abs(dx) > cardWidth * 0.35 || velocity > 0.4;
                if (swipe) {
                    // Momentum scroll: extend a bit further with ease-out
                    let remaining = snap * 0.6; // extra distance
                    const step = () => {
                        const delta = Math.min(remaining, Math.max(8, remaining * 0.2));
                        el.scrollLeft += dir * delta;
                        remaining -= delta;
                        updateArrows();
                        if (remaining > 2) requestAnimationFrame(step);
                        else {
                            // final snap to next page
                            scrollByCards(dir);
                        }
                    };
                    requestAnimationFrame(step);
                } else {
                    // Snap to nearest card
                    if (loop) {
                        const baseOffset = cloneCount * snap;
                        const index = Math.round((el.scrollLeft - baseOffset + peekPrev) / snap);
                        smoothScroll(el, baseOffset + index * snap - peekPrev, prefersReducedMotion);
                    } else {
                        const index = Math.round((el.scrollLeft + peekPrev) / snap);
                        smoothScroll(el, index * snap - peekPrev, prefersReducedMotion);
                    }
                }
            } else {
                // Not a drag: manually trigger click on the anchor under pointer
                const node = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
                const anchor = node?.closest('a');
                if (anchor && el.contains(anchor)) {
                    (anchor as HTMLAnchorElement).click();
                }
            }
            // resume autoplay after short idle
            if (idleResumeTimer.current) window.clearTimeout(idleResumeTimer.current);
            idleResumeTimer.current = window.setTimeout(() => setPaused(false), 3000);
        };
        const onWheel = (e: WheelEvent) => {
            if (!e.shiftKey) return; // only custom behavior when user holds Shift
            const el = scrollRef.current; if (!el) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY; // map vertical wheel to horizontal scroll
            updateArrows();
            // pause & schedule resume
            setPaused(true);
            if (idleResumeTimer.current) window.clearTimeout(idleResumeTimer.current);
            idleResumeTimer.current = window.setTimeout(() => setPaused(false), 3000);
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
    }, [books.length, visibleCount, cardWidth, gap, prefersReducedMotion, updateArrows, scrollByCards, isScrollable, peekPrev, loopEnabled, cloneCount]);

    // Autoplay (pausa no hover / interação)
    // Autoplay cycle: every 4s move forward, loop to start. Disabled when:
    //  - user prefers reduced motion
    //  - there are <= 1 items
    //  - paused due to hover / drag
    useEffect(() => {
        if (prefersReducedMotion) return;
        if (books.length <= 1) return;
        const canLoop = books.length > 1; // permitir loop mesmo com 2 itens
        if (!canLoop) return; // autoplay só faz sentido no modo infinito
        if (paused) return;
        const interval = setInterval(() => {
            scrollByCards(1); // always move forward; normalization keeps loop infinite
        }, 4000);
        return () => clearInterval(interval);
    }, [books.length, paused, prefersReducedMotion, scrollByCards]);

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

    // Build dataset using precomputed loopEnabled/cloneCount
    const leftClones = loopEnabled ? books.slice(books.length - cloneCount) : [];
    const rightClones = loopEnabled ? books.slice(0, cloneCount) : [];
    const dataset = loopEnabled ? [...leftClones, ...books, ...rightClones] : books;
    // Center on middle set at mount/layout changes
    useEffect(() => {
        const el = scrollRef.current; if (!el) return;
        const snap = cardWidth + gap; if (snap <= 0) return;
        if (!didInitRef.current) {
            // restore from memory if available
            const key = `bookCarousel:${storageKey || title}`;
            let initialIndex = 0;
            try { const saved = localStorage.getItem(key); if (saved) initialIndex = Math.max(0, Math.min(books.length - 1, parseInt(saved, 10) || 0)); } catch { }
            if (loopEnabled) {
                const baseOffset = cloneCount * snap;
                el.scrollLeft = baseOffset + initialIndex * snap - peekPrev; // align to start of real set
            } else {
                el.scrollLeft = initialIndex * snap - peekPrev;
            }
            didInitRef.current = true;
        }
    }, [books.length, visibleCount, cardWidth, gap, peekPrev, title, storageKey, cloneCount, loopEnabled]);

    // Persist position in memory whenever activeIndex changes
    useEffect(() => {
        try { localStorage.setItem(`bookCarousel:${storageKey || title}`, String(activeIndex)); } catch { }
    }, [activeIndex, title, storageKey]);

    return (
        <section className="mt-8 w-full" ref={containerRef} tabIndex={0} aria-roledescription="carousel">
            <div className="relative">
                <div className="flex items-center justify-center gap-2 bg-readowl-purple-medium px-6 sm:px-8 py-2 text-white font-ptserif text-lg select-none shadow mx-auto max-w-full">
                    <span className="w-5 h-5 inline-flex items-center justify-center">{icon}</span>
                    <h2 className="text-sm sm:text-base md:text-lg font-ptserif tracking-wide">{title}</h2>
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
                        <ChevronLeft className="w-7 h-7 pointer-events-none select-none text-readowl-purple-medium" />
                    </button>

                    <div
                        ref={scrollRef}
                        className={clsx(
                            'hide-scrollbar relative mx-9 flex overflow-x-auto scroll-smooth select-none',
                            isScrollable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                        )}
                        style={{ gap, paddingLeft: peekPrev, paddingRight: peekNext }}
                    >
                        {dataset.map((b, i) => {
                            // Map dataset index to original books index for highlight state
                            let localIndex = 0;
                            if (loopEnabled) {
                                if (i < cloneCount) localIndex = (books.length - cloneCount + i) % books.length;
                                else if (i >= cloneCount + books.length) localIndex = (i - (cloneCount + books.length)) % books.length;
                                else localIndex = i - cloneCount;
                            } else {
                                localIndex = i;
                            }
                            const isActive = localIndex === activeIndex;
                            const scaleCls = isActive ? 'opacity-100' : 'opacity-95';
                            return (
                                <Link
                                    key={`${b.id}-${i}`}
                                    href={`/library/books/${slugify(b.title)}`}
                                    aria-label={b.title}
                                    onClick={() => {
                                        // pause autoplay, schedule resume after idle
                                        setPaused(true);
                                        if (idleResumeTimer.current) window.clearTimeout(idleResumeTimer.current);
                                        idleResumeTimer.current = window.setTimeout(() => setPaused(false), 3000);
                                    }}
                                    className={`group relative flex-shrink-0 overflow-hidden shadow-md ring-1 ring-readowl-purple-light/40 hover:ring-readowl-purple focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple-dark transition-transform duration-300 ${scaleCls}`}
                                    style={{ width: cardWidth, aspectRatio: '3 / 4' }}
                                >
                                    {b.coverUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={b.coverUrl}
                                            alt={b.title}
                                            draggable={false}
                                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                                            loading="lazy"
                                        />
                                    ) : (
                                        FALLBACK_PLACEHOLDER
                                    )}
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
                            );
                        })}
                    </div>

                    <button
                        aria-label="Próximo"
                        disabled={!canNext}
                        onClick={() => scrollByCards(1)}
                        className={clsx('absolute z-20 right-0 top-1/2 -translate-y-1/2 pr-1 pl-2 py-2 text-readowl-purple-dark transition active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple', !canNext && 'opacity-30 cursor-not-allowed')}
                    >
                        <ChevronRight className="w-7 h-7 pointer-events-none select-none text-readowl-purple-medium" />
                    </button>
                </div>
            )}

            {books.length > 0 && (() => {
                // Number of scroll positions (sliding window of visibleCount)
                const pages = Math.max(1, books.length - 1 + 1); // highlight advances by one each time
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
                .hide-scrollbar > a { scroll-snap-align: start; }
                .hide-scrollbar.dragging { cursor: grabbing; }
                .hide-scrollbar > a { transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1); }
                @media (prefers-reduced-motion: reduce) { .hide-scrollbar > a { transition: none; } }
            `}</style>
        </section>
    );
};

export default BookCarousel;
