import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';

async function findBookAndChapter(slug: string, chapterSlug: string) {
  const books = await prisma.book.findMany({ select: { id: true, title: true } });
  const book = books.find((b) => slugify(b.title) === slug) || null;
  if (!book) return { book: null, chapter: null } as const;
  const chapters = await prisma.chapter.findMany({ where: { bookId: book.id }, select: { id: true, title: true } });
  const chapter = chapters.find((c) => slugify(c.title) === chapterSlug) || null;
  return { book, chapter } as const;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string; chapterId: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;
  const { slug, chapterId } = await ctx.params;
  const { book, chapter } = await findBookAndChapter(slug, chapterId);
  if (!book || !chapter) return NextResponse.json({ error: 'Livro/capítulo não encontrado' }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { bookId: book.id, chapterId: chapter.id },
    orderBy: [{ parentId: 'asc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true, image: true, role: true } },
      _count: { select: { likes: true, replies: true } },
      likes: userId ? { where: { userId }, select: { userId: true } } : false,
    },
  });

  function mapLiked(c: unknown) {
    const obj = c as Record<string, unknown> & { likes?: unknown; replies?: unknown[] };
    const likedByMe = Array.isArray(obj.likes) ? obj.likes.length > 0 : false;
    const base: Record<string, unknown> = { ...obj, likedByMe };
    if (Array.isArray(obj.replies)) {
      base.replies = obj.replies.map(mapLiked);
    }
    delete (base as Record<string, unknown>).likes;
    return base;
  }

  const mapped = comments.map(mapLiked);
  return NextResponse.json({ comments: mapped });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string; chapterId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { slug, chapterId } = await ctx.params;
  const { book, chapter } = await findBookAndChapter(slug, chapterId);
  if (!book || !chapter) return NextResponse.json({ error: 'Livro/capítulo não encontrado' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const content = (body?.content || '').toString();
  const parentId = (body?.parentId || null) as string | null;
  if (!content.trim()) return NextResponse.json({ error: 'Conteúdo vazio' }, { status: 400 });

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, chapterId: true } });
    if (!parent || parent.chapterId !== chapter.id) return NextResponse.json({ error: 'Comentário alvo inválido' }, { status: 400 });
  }

  const created = await prisma.comment.create({ data: { userId: session.user.id, bookId: book.id, chapterId: chapter.id, content, parentId } });
  return NextResponse.json({ comment: created }, { status: 201 });
}
