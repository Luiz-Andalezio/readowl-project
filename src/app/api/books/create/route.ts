import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface Body {
  title?: string;
  synopsis?: string;
  releaseFrequency?: string;
  coverUrl?: string;
  genres?: string[]; // names
}

const TITLE_MAX = 200;
const SYNOPSIS_MAX = 1000;
const FREQ_MAX = 50;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, synopsis, releaseFrequency, coverUrl, genres } = body;

  if (!title || !synopsis) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (title.length > TITLE_MAX) return NextResponse.json({ error: 'Title too long' }, { status: 400 });
  if (synopsis.length > SYNOPSIS_MAX) return NextResponse.json({ error: 'Synopsis too long' }, { status: 400 });
  if (releaseFrequency && releaseFrequency.length > FREQ_MAX) return NextResponse.json({ error: 'Frequency too long' }, { status: 400 });
  if (!genres || !Array.isArray(genres) || genres.length === 0) return NextResponse.json({ error: 'At least one genre required' }, { status: 400 });

  try {
    const book = await prisma.book.create({
      data: {
        title,
        synopsis,
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
