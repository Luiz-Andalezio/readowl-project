import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import { BreadcrumbAuto } from '@/components/ui/Breadcrumb';
import EditChapterClient from './ui/EditChapterClient';

interface PageProps { params: Promise<{ slug: string; chapter: string }> }

async function getBySlug(slug: string) {
  const books = await prisma.book.findMany();
  return books.find(b => slugify(b.title) === slug) || null;
}

export default async function EditChapterPage({ params }: PageProps) {
  const { slug, chapter } = await params;
  const book = await getBySlug(slug);
  if (!book) return notFound();
  const session = await getServerSession(authOptions);
  const isOwner = session?.user?.id === book.authorId;
  const isAdmin = session?.user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    redirect(`/library/books/${slug}`);
  }
  const chapters = await prisma.chapter.findMany({ where: { bookId: book.id } });
  const ch = chapters.find(c => slugify(c.title) === chapter);
  if (!ch) return notFound();
  const initial = { id: ch.id, title: ch.title, content: ch.content, volumeId: ch.volumeId };
  return (
    <>
      <div className="w-full flex justify-center mt-14 sm:mt-16">
        <BreadcrumbAuto
          anchor="static"
          base="/home"
          labelMap={{ library: 'Biblioteca', books: 'Livros', 'edit-chapter': 'Editar capítulo' }}
        />
      </div>
      <EditChapterClient
        slug={slug}
        bookTitle={book.title}
        initialChapter={initial}
      />
    </>
  );
}

export const dynamic = 'force-dynamic';