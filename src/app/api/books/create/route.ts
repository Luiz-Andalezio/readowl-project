import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { createBookSchema, normalizeCreateBookInput } from '@/types/book';
import { sanitizeSynopsisHtml } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = createBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten() }, { status: 400 });
  }
  const { title, synopsis, releaseFrequency, coverUrl, genres } = normalizeCreateBookInput(parsed.data);
  const cleanSynopsis = sanitizeSynopsisHtml(synopsis);

  try {
  const book = await prisma.book.create({
      data: {
        title,
  synopsis: cleanSynopsis,
        releaseFrequency: releaseFrequency || null,
        coverUrl: coverUrl || null,
        authorId: session.user.id,
        genres: {
          connectOrCreate: genres.map(name => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { genres: true },
    });
  return NextResponse.json({ book }, { status: 201 });
  } catch (e) {
    console.error('[BOOK_CREATE]', (e as Error).message);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}
