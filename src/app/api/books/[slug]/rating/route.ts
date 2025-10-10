import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';

async function findBookBySlug(slug: string) {
  const all = await prisma.book.findMany();
  return all.find((b) => slugify(b.title) === slug) || null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [agg, my] = await Promise.all([
    prisma.bookRating.aggregate({
      where: { bookId: book.id },
      _avg: { score: true },
      _count: { _all: true },
    }),
    session?.user?.id ? prisma.bookRating.findUnique({ where: { userId_bookId: { userId: session.user.id, bookId: book.id } } }) : null,
  ]);
  const avg = agg._avg.score ? Number(agg._avg.score) : null;
  const count = agg._count._all || 0;
  const myScore = my?.score || 0;
  return NextResponse.json({ avg, count, myScore });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null) as { score?: number } | null;
  const score = body?.score;
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: 'Score inválido' }, { status: 400 });
  }
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.bookRating.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId: book.id } },
    create: { userId: session.user.id, bookId: book.id, score },
    update: { score },
  });

  const agg = await prisma.bookRating.aggregate({
    where: { bookId: book.id },
    _avg: { score: true },
    _count: { _all: true },
  });
  const avg = agg._avg.score ? Number(agg._avg.score) : null;
  const count = agg._count._all || 0;
  return NextResponse.json({ ok: true, avg, count, myScore: score });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.bookRating.deleteMany({ where: { userId: session.user.id, bookId: book.id } });
  const agg = await prisma.bookRating.aggregate({
    where: { bookId: book.id },
    _avg: { score: true },
    _count: { _all: true },
  });
  const avg = agg._avg.score ? Number(agg._avg.score) : null;
  const count = agg._count._all || 0;
  return NextResponse.json({ ok: true, avg, count, myScore: 0 });
}
