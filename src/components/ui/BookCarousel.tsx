"use client";
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

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

const FALLBACK_COVER = "/img/svg/book/placeholder.svg"; // TODO: add a real placeholder if desired

export const BookCarousel: React.FC<BookCarouselProps> = ({ books, title, iconSrc, itemsPerView = 5 }) => {
  const [startIndex, setStartIndex] = useState(0);
  const canScroll = books.length > itemsPerView;
  const n = books.length;

  const visible = useMemo(() => {
    if (n === 0) return [] as CarouselBook[];
    if (!canScroll) return books; // show all if fewer than itemsPerView
    const arr: CarouselBook[] = [];
    for (let i = 0; i < itemsPerView; i++) {
      arr.push(books[(startIndex + i) % n]);
    }
    return arr;
  }, [books, startIndex, canScroll, itemsPerView, n]);

  const prev = () => { if (canScroll) setStartIndex((idx) => (idx - 1 + n) % n); };
  const next = () => { if (canScroll) setStartIndex((idx) => (idx + 1) % n); };

  return (
    <section className="mt-8 w-full">
      <div className="flex items-center gap-2 bg-readowl-purple rounded-full px-4 py-1 text-white font-yusei text-lg select-none w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} alt="Icone" className="w-5 h-5" />
        <h2 className="text-sm sm:text-base md:text-lg font-yusei">{title}</h2>
      </div>

      {n === 0 && (
        <div className="text-sm text-readowl-purple mt-6 px-2">Nenhum livro encontrado.</div>
      )}

      {n > 0 && (
        <div className="relative mt-4 flex items-center">
          <button
            aria-label="Anterior"
            onClick={prev}
            disabled={!canScroll}
            className={`p-2 rounded-full transition-colors text-readowl-purple-dark disabled:opacity-20 disabled:cursor-not-allowed hover:bg-readowl-purple-extralight`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/svg/generics/chevron-left.svg" alt="Anterior" className="w-20 h-20" />
          </button>

          <div className="flex flex-1 justify-start gap-6 overflow-hidden px-2">
            {visible.map(b => (
              <div key={`${b.id}-${b.title}`} className="flex flex-col items-center w-32 select-none">
                <Link href={`/books/${b.id}`} className="group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.coverUrl || FALLBACK_COVER}
                    alt={b.title}
                    className="w-32 h-42 aspect-[3/4] object-cover rounded shadow-md ring-1 ring-readowl-purple-light group-hover:ring-readowl-purple transition"
                  />
                </Link>
                <Link href={`/books/${b.id}`} className="mt-2 text-[11px] text-center leading-tight text-readowl-purple-dark hover:underline line-clamp-3">
                  {b.title}
                </Link>
              </div>
            ))}
          </div>

          <button
            aria-label="Próximo"
            onClick={next}
            disabled={!canScroll}
            className={`p-2 rounded-full transition-colors text-readowl-purple-dark disabled:opacity-20 disabled:cursor-not-allowed hover:bg-readowl-purple-extralight`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/svg/generics/chevron-right.svg" alt="Próximo" className="w-6 h-6" />
          </button>
        </div>
      )}
    </section>
  );
};

export default BookCarousel;
