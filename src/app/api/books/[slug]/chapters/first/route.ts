import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';

async function findBookBySlug(slug: string) {
  const all = await prisma.book.findMany();
  return all.find((b) => slugify(b.title) === slug) || null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const book = await findBookBySlug(slug);
  if (!book) return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });

  // Match ordering used by the chapter reader page
  const [volumes, rawChapters] = await Promise.all([
    prisma.volume.findMany({ where: { bookId: book.id }, select: { id: true, order: true } }),
    prisma.chapter.findMany({
      where: { bookId: book.id },
      select: { id: true, title: true, createdAt: true, volumeId: true, order: true },
    }),
  ]);

  if (rawChapters.length === 0) return NextResponse.json({ error: 'Nenhum capítulo' }, { status: 404 });

  const volOrder = new Map<string, number>();
  for (const v of volumes) volOrder.set(v.id, v.order ?? Number.MAX_SAFE_INTEGER);

  const chapters = [...rawChapters].sort((a, b) => {
    const aHasVol = !!a.volumeId;
    const bHasVol = !!b.volumeId;
    if (aHasVol && !bHasVol) return -1;
    if (!aHasVol && bHasVol) return 1;
    if (aHasVol && bHasVol) {
      const ao = volOrder.get(a.volumeId as string) ?? Number.MAX_SAFE_INTEGER;
      const bo = volOrder.get(b.volumeId as string) ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
    }
    const ca = (a.order ?? Number.MAX_SAFE_INTEGER) as number;
    const cb = (b.order ?? Number.MAX_SAFE_INTEGER) as number;
    if (ca !== cb) return ca - cb;
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return ta - tb;
  });

  const first = chapters[0]!;
  const chapterSlug = slugify(first.title);
  return NextResponse.json({ slug: chapterSlug });
}
