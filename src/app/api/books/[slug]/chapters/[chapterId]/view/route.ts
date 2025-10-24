import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { isLikelyBot } from '@/lib/bot';
import { acquireOnce } from '@/lib/dedupeCache';
import { rateLimit, rateLimitHeaders } from '@/lib/rateLimitRedis';

async function findBookAndChapter(slug: string, chapterSlug: string) {
  const books = await prisma.book.findMany({ select: { id: true, title: true, authorId: true } });
  const book = books.find((b) => slugify(b.title) === slug) || null;
  if (!book) return { book: null, chapter: null } as const;
  const chapters = await prisma.chapter.findMany({ where: { bookId: book.id }, select: { id: true, title: true, bookId: true } });
  const chapter = chapters.find((c) => slugify(c.title) === chapterSlug) || null;
  return { book, chapter } as const;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  // Rate limit (soft)
  const rl = await rateLimit(req, 'chapter-view', 10, 20);
  if (!rl.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers: rateLimitHeaders(rl) });

  // Bot filter
  if (isLikelyBot(req.headers.get('user-agent'))) {
    return NextResponse.json({ skipped: 'bot' }, { status: 202 });
  }

  // Validate context (note: chapterId param is actually the chapter slug in this project)
  const { book, chapter } = await findBookAndChapter(slug, chapterId);
  if (!book || !chapter) return NextResponse.json({ error: 'Livro/capítulo não encontrado' }, { status: 404 });

  // Skip author's own view
  if (book.authorId === session.user.id) {
    return NextResponse.json({ skipped: 'author' }, { status: 202 });
  }

  // Deduplicate within 2 minutes per (chapterId, userId)
  const key = `view:${chapter.id}:${session.user.id}`;
  const ok = await acquireOnce(key, 2 * 60 * 1000);
  if (!ok) return NextResponse.json({ skipped: 'dedupe' }, { status: 202 });

  // Insert view
  await prisma.chapterView.create({ data: { chapterId: chapter.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
