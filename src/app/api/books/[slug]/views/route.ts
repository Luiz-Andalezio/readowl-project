import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const books = await prisma.book.findMany({ select: { id: true, title: true } });
  const book = books.find((b) => slugify(b.title) === slug) || null;
  if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
  const chapters = await prisma.chapter.findMany({ where: { bookId: book.id }, select: { id: true } });
  if (chapters.length === 0) return NextResponse.json({ count: 0 });
  const counts = await Promise.all(chapters.map((c) => prisma.chapterView.count({ where: { chapterId: c.id } })));
  const total = counts.reduce((a, b) => a + b, 0);
  return NextResponse.json({ count: total });
}
