import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import EditBookForm from './ui/EditBookForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface PageProps { params: Promise<{ slug: string }> }

async function getBookBySlug(slug: string) {
  const books = await prisma.book.findMany({ include: { author: true, genres: true } });
  return books.find((b) => slugify(b.title) === slug) || null;
}

export default async function EditBookPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const book = await getBookBySlug(slug);
  if (!book) return notFound();
  const isOwner = session?.user?.id === book.authorId;
  const isAdmin = session?.user?.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    redirect('/library');
  }
  // Determine if current user has a local password (for delete confirmation UX)
  const me = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
    : null;
  const hasLocalPassword = !!me?.password;
  return (
    <main className="px-4 py-6 md:px-8">
      <EditBookForm book={book} slug={slug} hasLocalPassword={hasLocalPassword} />
    </main>
  );
}

export const dynamic = 'force-dynamic';
