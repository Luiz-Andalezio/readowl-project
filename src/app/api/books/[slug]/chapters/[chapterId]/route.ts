import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { getPlainTextLength } from '@/lib/sanitize';

async function findBookBySlug(slug: string) {
  const all = await prisma.book.findMany();
  return all.find((b) => slugify(b.title) === slug) || null;
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
  const isOwner = session.user.id === book.authorId; const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  const body = await req.json().catch(() => null) as { title?: string; content?: string; volumeId?: string | null } | null;
  const data: Record<string, unknown> = {};
  const incomingTitle = typeof body?.title === 'string' ? body.title.trim() : undefined;
  if (incomingTitle) {
    // Check for duplicate URL slug within the same book, excluding current chapter
    const newSlug = slugify(incomingTitle);
    const others = await prisma.chapter.findMany({ where: { bookId: book.id, NOT: { id: chapterId } }, select: { title: true } });
    const conflict = others.some((c) => slugify(c.title) === newSlug);
    if (conflict) return NextResponse.json({ error: 'O título informado gera uma URL já existente para esta obra.' }, { status: 409 });
    data.title = incomingTitle;
  }
  if (typeof body?.content === 'string') {
    if (getPlainTextLength(body.content) === 0) {
      return NextResponse.json({ error: 'Conteúdo obrigatório' }, { status: 400 });
    }
    data.content = body.content;
  }
  if (typeof body?.volumeId !== 'undefined') {
    // ensure volume belongs to the same book if provided; allow null to unassign
    if (body.volumeId) {
      const vol = await prisma.volume.findUnique({ where: { id: body.volumeId } });
      if (!vol || vol.bookId !== book.id) return NextResponse.json({ error: 'Volume inválido' }, { status: 400 });
      data.volumeId = body.volumeId;
    } else {
      data.volumeId = null;
    }
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });

  const chapter = await prisma.chapter.update({ where: { id: chapterId }, data });
  return NextResponse.json({ chapter });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
  const isOwner = session.user.id === book.authorId; const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

  await prisma.chapter.delete({ where: { id: chapterId } });
  return NextResponse.json({ ok: true });
}
