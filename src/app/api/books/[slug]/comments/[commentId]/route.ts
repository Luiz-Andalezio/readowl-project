import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { commentId } = await ctx.params;
  const c = await prisma.comment.findUnique({ where: { id: commentId }, include: { user: true } });
  if (!c) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
  const isOwner = c.userId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Proibido' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const content = (body?.content || '').toString();
  if (!content.trim()) return NextResponse.json({ error: 'Conteúdo vazio' }, { status: 400 });
  const updated = await prisma.comment.update({ where: { id: commentId }, data: { content } });
  return NextResponse.json({ comment: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const { commentId } = await ctx.params;
  const c = await prisma.comment.findUnique({ where: { id: commentId }, include: { user: true } });
  if (!c) return NextResponse.json({ error: 'Comentário não encontrado' }, { status: 404 });
  const isOwner = c.userId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Proibido' }, { status: 403 });
  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
