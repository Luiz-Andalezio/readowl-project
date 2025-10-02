import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';
import { compare } from 'bcrypt';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  // Since we don't have a slug column, fetch all titles and match
  const all = await prisma.book.findMany({ include: { author: true, genres: true } });
  const match = all.find((b) => slugify(b.title) === slug);
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Access control: owner or admin only
  const isOwner = session?.user?.id === match.authorId;
  const isAdmin = session?.user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json({ book: match });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let payload: { titleConfirm?: string; password?: string } = {};
  try {
    payload = await req.json();
  } catch {
    // allow no body, but we'll enforce later
  }
  const all = await prisma.book.findMany();
  const match = all.find((b) => slugify(b.title) === slug);
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const isOwner = session.user.id === match.authorId;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Strong verification: exact title + (password OR recent step-up reauth)
  const { titleConfirm, password } = payload || {};
  if (titleConfirm !== match.title) {
    return NextResponse.json({ error: 'Nome da obra não confere.' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const hasLocalPassword = !!user?.password;
  const now = Date.now();
  const stepUpAt = (session as { stepUpAt?: number }).stepUpAt;
  const stepUpFresh = typeof stepUpAt === 'number' && now - stepUpAt <= 5 * 60 * 1000; // 5 min window

  if (hasLocalPassword) {
    if (!password) return NextResponse.json({ error: 'Senha é obrigatória.' }, { status: 400 });
    const ok = await compare(password, user!.password!);
    if (!ok) return NextResponse.json({ error: 'Senha inválida.' }, { status: 401 });
  } else {
    // No local password: require recent step-up via provider (e.g., Google)
  if (!stepUpFresh || (session as { authProvider?: string }).authProvider !== 'google') {
      return NextResponse.json({ error: 'Reautentique-se com o Google para concluir.', code: 'STEP_UP_REQUIRED' }, { status: 401 });
    }
  }
  await prisma.book.delete({ where: { id: match.id } });
  return NextResponse.json({ ok: true });
}
