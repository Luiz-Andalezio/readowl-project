import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(_req: NextRequest, ctx: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { commentId } = await ctx.params;
  try {
    await prisma.commentLike.create({ data: { userId: session.user.id, commentId } });
  } catch { /* unique constraint -> already liked */ }
  const count = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ liked: true, count });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { commentId } = await ctx.params;
  await prisma.commentLike.deleteMany({ where: { commentId, userId: session.user.id } });
  const count = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ liked: false, count });
}
