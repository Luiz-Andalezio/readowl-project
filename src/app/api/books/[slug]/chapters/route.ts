import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';
import { sanitizeSynopsisHtml } from '@/lib/sanitize';

async function findBookBySlug(slug: string) {
  const all = await prisma.book.findMany();
  return all.find((b) => slugify(b.title) === slug) || null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = session.user.id === book.authorId;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null) as { title?: string; content?: string; volumeId?: string | null } | null;
  const title = (body?.title || '').trim();
  const content = (body?.content || '').trim();
  const volumeId = body?.volumeId || null;
  if (!title) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
  if (!content) return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 });

  if (volumeId) {
    const vol = await prisma.volume.findFirst({ where: { id: volumeId, bookId: book.id } });
    if (!vol) return NextResponse.json({ error: 'Volume inválido' }, { status: 400 });
  }

  const maxOrder = await prisma.chapter.aggregate({ where: { bookId: book.id, ...(volumeId ? { volumeId } : {}) }, _max: { order: true } });
  const order = (maxOrder._max.order ?? 0) + 1;

  const safeHtml = sanitizeSynopsisHtml(content);
  const chapter = await prisma.chapter.create({ data: { title, content: safeHtml, order, bookId: book.id, volumeId } });
  return NextResponse.json({ chapter }, { status: 201 });
}
