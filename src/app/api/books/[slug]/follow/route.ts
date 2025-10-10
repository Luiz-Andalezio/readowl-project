import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';

async function findBookBySlug(slug: string) {
  // Since we don't have a slug column, fetch all titles and match
  const all = await prisma.book.findMany();
  return all.find((b) => slugify(b.title) === slug) || null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = session?.user?.id;
  const [count, isFollowing] = await Promise.all([
    prisma.bookFollow.count({ where: { bookId: book.id } }),
    userId
      ? prisma.bookFollow.findUnique({ where: { userId_bookId: { userId, bookId: book.id } } }).then(Boolean)
      : Promise.resolve(false),
  ]);
  return NextResponse.json({ count, isFollowing });
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Avoid following own book automatically? Allow following even if owner; no harm.
  try {
    await prisma.bookFollow.create({ data: { userId, bookId: book.id } });
  } catch {
    // If already exists, ignore (idempotent)
    // Prisma throws P2002 for unique violation
  }
  const count = await prisma.bookFollow.count({ where: { bookId: book.id } });
  return NextResponse.json({ ok: true, count, isFollowing: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.bookFollow.deleteMany({ where: { userId, bookId: book.id } });
  const count = await prisma.bookFollow.count({ where: { bookId: book.id } });
  return NextResponse.json({ ok: true, count, isFollowing: false });
}
