import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { slugify } from '@/lib/slug';
import BookHeader from '../../../../components/book/BookHeader';
import RatingBox from '../../../../components/book/RatingBox';
import BookActions from '../../../../components/book/BookActions';
import BookTabs from '../../../../components/book/BookTabs';
import CoverZoom from '@/components/book/CoverZoom';
import type { BookWithAuthorAndGenres } from '@/types/book';
import { sanitizeSynopsisHtml } from '@/lib/sanitize';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

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
  const session = await getServerSession(authOptions);
  const canManage = !!session?.user?.id && (session.user.id === book.authorId || session.user.role === 'ADMIN');

  // Fetch followers count for the meta section
  const followersCount = await prisma.bookFollow.count({ where: { bookId: book.id } });
  // Fetch rating summary (avg and count)
  const ratingAgg = await prisma.bookRating.aggregate({
    where: { bookId: book.id },
    _avg: { score: true },
    _count: { _all: true },
  });
  const ratingAvg = ratingAgg._avg.score ? Number(ratingAgg._avg.score) : null;
  const ratingCount = ratingAgg._count._all || 0;

  return (
    <>
      <div className="w-full flex justify-center mt-14 sm:mt-16">
        <Breadcrumb
          anchor="static"
          items={[
            { label: 'Início', href: '/home' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Livros', href: '/library' },
            { label: book.title }
          ]}
        />
      </div>
      <main className="pb-6 md:px-8">
        <section className="relative bg-readowl-purple-medium p-4 md:p-6 text-white shadow-lg max-w-6xl mx-auto">
          {/* Two columns: left cover (smaller), right info list */}
          <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] items-stretch">
            <div>
              <div className="flex justify-center items-center h-full">
                {book.coverUrl ? (
                  <CoverZoom
                    src={book.coverUrl}
                    alt={`Capa de ${book.title}`}
                    width={300}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="w-full max-w-[250px] h-auto shadow-md"
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
                  <BookHeader book={book} mode="meta" followersCount={followersCount}
                    ratingAvg={ratingAvg} ratingCount={ratingCount}
                  />
                </div>
                <div className="flex min-h-full">
                  <BookActions book={book} className="ml-auto" />
                </div>
              </div>
            </div>
          </div>
          {/* Synopsis below both columns */}
          <div className="mt-4">
            <div
              className="prose prose-base prose-invert max-w-none prose-a:text-readowl-purple-extralight/90 prose-blockquote:border-l-readowl-purple-extralight/50 [--tw-prose-invert-body:255_255_255] [--tw-prose-invert-headings:255_255_255] [--tw-prose-invert-bold:255_255_255]
            [&_p[style*='text-align: center']]:text-center [&_p[style*='text-align: right']]:text-right
            [&_h2[style*='text-align: center']]:text-center [&_h2[style*='text-align: right']]:text-right
            [&_h3[style*='text-align: center']]:text-center [&_h3[style*='text-align: right']]:text-right
            [&_p[style*='text-align: center']>img]:block [&_p[style*='text-align: center']>img]:mx-auto
            [&_p[style*='text-align: center']>a>img]:block [&_p[style*='text-align: center']>a>img]:mx-auto
            [&_p[style*='text-align: right']>img]:block [&_p[style*='text-align: right']>img]:ml-auto
            [&_p[style*='text-align: right']>a>img]:block [&_p[style*='text-align: right']>a>img]:ml-auto
            [&_p[data-align='center']]:text-center [&_p[data-align='right']]:text-right
            [&_h2[data-align='center']]:text-center [&_h2[data-align='right']]:text-right
            [&_h3[data-align='center']]:text-center [&_h3[data-align='right']]:text-right
            [&_p[data-align='center']>img]:block [&_p[data-align='center']>img]:mx-auto
            [&_p[data-align='center']>a>img]:block [&_p[data-align='center']>a>img]:mx-auto
            [&_p[data-align='right']>img]:block [&_p[data-align='right']>img]:ml-auto
            [&_p[data-align='right']>a>img]:block [&_p[data-align='right']>a>img]:ml-auto"
              dangerouslySetInnerHTML={{ __html: sanitizeSynopsisHtml(book.synopsis) }}
            />
          </div>
          {/* Rating centered below synopsis */}
          <div className="mt-5 flex justify-center">
            <div className="w-full md:w-[600px]">
              <RatingBox bookId={book.id} slug={slug} />
            </div>
          </div>
          <div className="mt-6">
            <BookTabs canManage={canManage} />
          </div>
        </section>
      </main>
    </>
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
