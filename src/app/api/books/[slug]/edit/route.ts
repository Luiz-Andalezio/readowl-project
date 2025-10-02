import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { Status } from '@prisma/client';
import { slugify } from '@/lib/slug';
import { normalizeUpdateBookInput, updateBookSchema } from '@/types/book';
import { sanitizeSynopsisHtml } from '@/lib/sanitize';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = updateBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = normalizeUpdateBookInput(parsed.data);
  const cleanSynopsis = sanitizeSynopsisHtml(data.synopsis);

  // Find by slug derived from title (no slug column yet)
  const { slug } = await ctx.params;
  const all = await prisma.book.findMany({ include: { genres: true } });
  const found = all.find((b) => slugify(b.title) === slug);
  if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isOwner = found.authorId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const updated = await prisma.book.update({
      where: { id: found.id },
      data: {
        title: data.title,
  synopsis: cleanSynopsis,
        releaseFrequency: data.releaseFrequency || null,
        coverUrl: data.coverUrl || null,
  status: data.status as Status,
        genres: {
          // Replace genres with provided list (connect or create)
          set: [],
          connectOrCreate: data.genres.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { genres: true },
    });
    return NextResponse.json({ book: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
