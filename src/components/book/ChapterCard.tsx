"use client";
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { slugify } from '@/lib/slug';

export type ChapterView = {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date;
};

type Props = {
  slug: string; // book slug
  chapter: ChapterView;
  standalone?: boolean; // larger card for chapters without volume
  canManage?: boolean; // owner or admin
  onEditChapter?: (chapterId: string) => void;
  onDeleteChapter?: (chapterId: string) => void;
};

function wordsCountFromHtml(html: string): number {
  const text = (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export default function ChapterCard({ slug, chapter, standalone = false, canManage = false, onEditChapter, onDeleteChapter }: Props) {
  const dateStr = (() => {
    const d = new Date(chapter.createdAt);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  })();
  const timeStr = (() => {
    const d = new Date(chapter.createdAt);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  })();
  const words = wordsCountFromHtml(chapter.content);
  const chapterSlug = slugify(chapter.title);

  return (
    <div
      className={`relative bg-readowl-purple-extradark text-white border border-readowl-purple/30 transition-transform duration-200 ${standalone ? 'p-4 rounded md:p-5' : 'p-3 rounded'} hover:scale-[1.01]`}
    >
      {canManage && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <button
            aria-label="Editar capítulo"
            className="p-1 hover:bg-white/30 rounded"
            onClick={() => onEditChapter?.(chapter.id)}
          >
            <Image src="/img/svg/book/edit-chapter.svg" alt="Editar" width={18} height={18} />
          </button>
          <button
            aria-label="Excluir capítulo"
            className="p-1 hover:bg-white/30 rounded"
            onClick={() => onDeleteChapter?.(chapter.id)}
          >
            <Image src="/img/svg/generics/white/delete.svg" alt="Excluir" width={18} height={18} />
          </button>
        </div>
      )}
      <Link href={`/library/books/${slug}/${chapterSlug}`} className="block pr-16">
        <h4 className={`truncate ${standalone ? 'text-lg md:text-xl font-bold' : 'text-base md:text-lg font-bold'}`}>{chapter.title}</h4>
      </Link>
      <div className="text-sm opacity-90 mt-1">{dateStr} · {timeStr}</div>
      <div className="text-sm opacity-90">{words.toLocaleString('pt-BR')} palavras</div>
    </div>
  );
}
