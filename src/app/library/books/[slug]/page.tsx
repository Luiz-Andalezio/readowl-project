import { notFound } from 'next/navigation';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { slugify } from '@/lib/slug';
import BookHeader from '../../../../components/book/BookHeader';
import RatingBox from '../../../../components/book/RatingBox';
import BookActions from '../../../../components/book/BookActions';
import BookTabs from '../../../../components/book/BookTabs';
import type { BookWithAuthorAndGenres } from '@/types/book';

interface PageProps { params: Promise<{ slug: string }> }

async function getBookBySlug(slug: string) {
  // No slug column yet; derive from title for SSR match.
  const books = await prisma.book.findMany({ include: { author: true, genres: true } });
  return books.find((b) => slugify(b.title) === slug) || null;
}

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;
  const book = (await getBookBySlug(slug)) as BookWithAuthorAndGenres | null;
  if (!book) return notFound();

  return (
    <main className="px-4 py-6 md:px-8">
  <section className="relative bg-readowl-purple-medium rounded-2xl p-4 md:p-6 text-white shadow-lg max-w-6xl mx-auto">
  {/* Two columns: left cover (smaller), right info list */}
        <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] items-stretch">
          <div>
            <div className="flex justify-center items-center h-full">
                {book.coverUrl ? (
                    <Image
                        src={book.coverUrl}
                        alt={`Capa de ${book.title}`}
                        width={300}
                        height={400}
                        sizes="(max-width: 768px) 100vw, 300px"
                        className="rounded-xl w-full max-w-[250px] h-auto object-cover shadow-md"
                    />
                ) : null}
            </div>
          </div>
          <div className="flex flex-col">
            {/* Title + genres in their own block so long genre lists don't push buttons */}
            <div>
              <BookHeader book={book} mode="title-genres" />
            </div>
            {/* Shared row for infos + buttons, stretched to match the cover height */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="min-h-full">
                <BookHeader book={book} mode="meta" />
              </div>
              <div className="flex min-h-full">
                <BookActions book={book} className="ml-auto" />
              </div>
            </div>
          </div>
        </div>
        {/* Synopsis below both columns */}
        <div className="mt-4">
          <p className="text-readowl-purple-extralight/95 font-semibold leading-relaxed">{book.synopsis}</p>
        </div>
        {/* Rating centered below synopsis */}
        <div className="mt-5 flex justify-center">
          <div className="w-full md:w-[600px]">
            <RatingBox bookId={book.id} />
          </div>
        </div>
        <div className="mt-6">
          <BookTabs />
        </div>
      </section>
    </main>
  );
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) return {};
  return {
    title: `${book.title} | Readowl`,
    description: book.synopsis,
  };
}
