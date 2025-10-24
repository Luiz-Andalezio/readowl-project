import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slug';

/**
 * Returns up to 20 books with their most recent chapter and a count of additional
 * chapters published during the same window (i.e. number of chapters for that
 * book that appear in the overall latest set after de-duplication).
 */
export async function GET() {
  // Fetch the most recent chapters across all books, newest first.
  // We'll take a reasonably large window and then reduce per-book to latest one.
  const recentChapters = await prisma.chapter.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      title: true,
      createdAt: true,
      bookId: true,
      book: { select: { id: true, title: true, coverUrl: true, authorId: true, author: { select: { id: true, name: true } } } },
    },
  });

  // Group by bookId preserving order: first occurrence is latest chapter
  const seen = new Map<string, { bookId: string; bookTitle: string; bookCover?: string | null; authorName?: string | null; latestChapterId: string; latestChapterTitle: string; latestChapterCreatedAt: Date; extraCount: number; chapterSlug: string }>();
  for (const ch of recentChapters) {
    const b = ch.book;
    if (!seen.has(ch.bookId)) {
      seen.set(ch.bookId, {
        bookId: ch.bookId,
        bookTitle: b.title,
        bookCover: b.coverUrl ?? null,
        authorName: b.author?.name ?? null,
        latestChapterId: ch.id,
        latestChapterTitle: ch.title,
        latestChapterCreatedAt: ch.createdAt,
        extraCount: 0,
        chapterSlug: slugify(ch.title),
      });
    } else {
      // increments extraCount for subsequent chapters of the same book
      const cur = seen.get(ch.bookId)!;
      cur.extraCount += 1;
    }
  }

  // Take up to 20 books ordered by the latest chapter timestamp
  const items = Array.from(seen.values())
    .sort((a, b) => b.latestChapterCreatedAt.getTime() - a.latestChapterCreatedAt.getTime())
    .slice(0, 20)
    .map(i => ({
      bookId: i.bookId,
      bookTitle: i.bookTitle,
      bookCover: i.bookCover,
      authorName: i.authorName,
      latestChapterTitle: i.latestChapterTitle,
      latestChapterCreatedAt: i.latestChapterCreatedAt,
      extraCount: i.extraCount,
      chapterSlug: i.chapterSlug,
    }));

  return NextResponse.json({ items });
}
