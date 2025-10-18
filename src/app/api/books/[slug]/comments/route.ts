import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';

async function findBookBySlug(slug: string) {
  const all = await prisma.book.findMany({ select: { id: true, title: true } });
  return all.find((b) => slugify(b.title) === slug) || null;
}

// List book-level comments (chapterId null) with counts and author
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;
  const { slug } = await ctx.params;
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });

  const comments = await prisma.comment.findMany({
    where: { bookId: book.id, chapterId: null },
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
  delete (base as Record<string, unknown>).likes; // remove likes arrays to reduce payload
    return base;
  }

  const mapped = comments.map(mapLiked);
  return NextResponse.json({ comments: mapped });
}

// Create book-level comment (or reply when parentId provided)
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { slug } = await ctx.params;
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const content = (body?.content || '').toString();
  const parentId = (body?.parentId || null) as string | null;
  if (!content.trim()) return NextResponse.json({ error: 'Conteúdo vazio' }, { status: 400 });

  // Ensure replying to a comment of this book
  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { id: true, bookId: true } });
    if (!parent || parent.bookId !== book.id) return NextResponse.json({ error: 'Comentário alvo inválido' }, { status: 400 });
  }

  const created = await prisma.comment.create({ data: { userId: session.user.id, bookId: book.id, content, parentId } });
  return NextResponse.json({ comment: created }, { status: 201 });
}
