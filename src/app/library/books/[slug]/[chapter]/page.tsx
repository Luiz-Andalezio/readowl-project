import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import ReadChapterClient from './ui/ReadChapterClient';

interface PageProps { params: Promise<{ slug: string; chapter: string }> }

async function getBookBySlug(slug: string) {
  const books = await prisma.book.findMany({ include: { author: true, genres: true } });
  return books.find((b) => slugify(b.title) === slug) || null;
}

export default async function ReadChapterPage({ params }: PageProps) {
  const { slug, chapter } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return notFound();

  // Order chapters for navigation:
  // 1) Chapters inside volumes come first (by volume.order)
  // 2) Then chapters without volume (NULLS LAST)
  // 3) Inside a group, sort by chapter.order, then createdAt
  const [volumes, rawChapters] = await Promise.all([
    prisma.volume.findMany({ where: { bookId: book.id }, select: { id: true, order: true } }),
    prisma.chapter.findMany({
      where: { bookId: book.id },
      select: { id: true, title: true, content: true, createdAt: true, volumeId: true, order: true },
    }),
  ]);
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

  const index = chapters.findIndex((c) => slugify(c.title) === chapter);
  if (index === -1) return notFound();
  const current = chapters[index];

  // Determine previous/next available chapters based on the above ordering
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;

  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === book.authorId;
  const isAdmin = session?.user?.role === 'ADMIN';
  const canManage = !!session?.user?.id && (isOwner || isAdmin);

  // Resolve volume title if present
  const volumeTitle = current.volumeId
    ? (await prisma.volume.findUnique({ where: { id: current.volumeId }, select: { title: true } }))?.title || null
    : null;

  // DTO for client
  const payload = {
    book: { id: book.id, title: book.title },
    chapter: { id: current.id, title: current.title, content: current.content, createdAt: current.createdAt },
    prevSlug: prev ? slugify(prev.title) : null,
    nextSlug: next ? slugify(next.title) : null,
    volumeTitle,
  } as const;

  return <ReadChapterClient slug={slug} chapterSlug={chapter} payload={payload} canManage={canManage} />;
}

export const dynamic = 'force-dynamic';
