import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';

async function findBookBySlug(slug: string) {
  const all = await prisma.book.findMany();
  return all.find((b) => slugify(b.title) === slug) || null;
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string; volumeId: string }> }) {
  const { slug, volumeId } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isOwner = session.user.id === book.authorId;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as { title?: string } | null;
  const title = (body?.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });
  // Disallow an exact duplicate title (same book), excluding this volume
  const dup = await prisma.volume.findFirst({ where: { bookId: book.id, title, NOT: { id: volumeId } }, select: { id: true } });
  if (dup) return NextResponse.json({ error: 'Já existe um volume com este título nesta obra.' }, { status: 409 });
  const vol = await prisma.volume.update({ where: { id: volumeId }, data: { title } });
  return NextResponse.json({ volume: vol });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string; volumeId: string }> }) {
  const { slug, volumeId } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isOwner = session.user.id === book.authorId;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // Reassign chapters to no volume (volumeId null) implicitly due to onDelete: SetNull
  await prisma.chapter.updateMany({ where: { volumeId }, data: { volumeId: null } });
  await prisma.volume.delete({ where: { id: volumeId } });
  return NextResponse.json({ ok: true });
}
