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
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const volumes = await prisma.volume.findMany({ where: { bookId: book.id }, orderBy: { order: 'asc' } });
  return NextResponse.json({ volumes });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // owner or admin only
  const isOwner = session.user.id === book.authorId;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as { title?: string } | null;
  const title = (body?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
  // Disallow exact duplicate titles within the same book (case-sensitive, post-trim)
  const existingSame = await prisma.volume.findFirst({ where: { bookId: book.id, title } });
  if (existingSame) return NextResponse.json({ error: 'Já existe um volume com este título nesta obra.' }, { status: 409 });
  const maxOrder = await prisma.volume.aggregate({ where: { bookId: book.id }, _max: { order: true } });
  const order = (maxOrder._max.order ?? 0) + 1;
  const vol = await prisma.volume.create({ data: { title, bookId: book.id, order } });
  return NextResponse.json({ volume: vol }, { status: 201 });
}
