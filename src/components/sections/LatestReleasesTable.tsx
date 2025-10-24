"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { slugify } from '@/lib/slug';

type Item = {
  bookId: string;
  bookTitle: string;
  bookCover?: string | null;
  authorName?: string | null;
  latestChapterTitle: string;
  latestChapterCreatedAt: string;
  extraCount: number;
  chapterSlug: string;
};

export default function LatestReleasesTable(): React.ReactElement {
  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    try {
      const res = await fetch('/api/chapters/latest');
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.items || []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto px-3 sm:px-4 pb-6">
      <div className="bg-readowl-purple-extradark overflow-hidden">
        <div className="px-4 py-3 bg-readowl-purple-medium text-white">
          <h3 className="font-semibold text-lg">ÚLTIMOS LANÇAMENTOS</h3>
        </div>
        <div className="divide-y">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Nenhum capítulo recente encontrado.</div>
          ) : (
            items.map((it: Item) => {
              const bookSlug = it.bookTitle ? slugify(it.bookTitle) : it.bookId;
              return (
                <article key={it.bookId} className="p-3 flex gap-4 items-start hover:bg-readowl-purple-dark/50 transition-transform duration-300 ease-out rounded-sm">
                  <Link href={`/library/books/${bookSlug}`} className="flex-shrink-0">
                  <div className="relative w-16 h-20 rounded-md overflow-hidden shadow-sm transform transition hover:scale-105">
                    <Image src={it.bookCover ?? '/img/mascot/book-placeholder.png'} alt={`Capa de ${it.bookTitle}`} width={64} height={88} className="object-cover" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/library/books/${bookSlug}`} className="font-semibold text-readowl-purple-extralight hover:text-white text-lg truncate">
                      {it.bookTitle}
                    </Link>
                    <time className="text-xs text-white">{new Date(it.latestChapterCreatedAt).toLocaleString()}</time>
                  </div>
                  <div className="text-xs text-white mt-1">por {it.authorName ?? '—'}</div>
                  <div className="mt-2">
                    <Link href={`/library/books/${bookSlug}/${encodeURIComponent(it.chapterSlug)}`} className="text-sm text-readowl-purple-extralight hover:text-white hover:underline truncate">
                      {it.latestChapterTitle}
                      {it.extraCount > 0 && <span className="ml-2 text-xs text-white">(+{it.extraCount})</span>}
                    </Link>
                  </div>
                </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
