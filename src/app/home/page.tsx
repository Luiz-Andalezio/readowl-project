import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/navbar/Navbar";
import { Breadcrumb } from "@/components/ui/navbar/Breadcrumb";
import prisma from "@/lib/prisma";
import BannerCarousel from "@/components/sections/BannerCarousel";
import BookCarousel, { type CarouselBook } from "@/components/book/BookCarousel";
import LatestReleasesTable from '@/components/sections/LatestReleasesTable';
import { AppRole } from "@/types/user";
import {
    Sparkles,
    TrendingUp,
    Medal,
    Eye,
    MessageSquare,
    Users,
    Wand2,
} from "lucide-react";


export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    // Fetch banners server-side to hydrate the client carousel
    const banners = await prisma.banner.findMany({
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { name: true, imageUrl: true, linkUrl: true },
    });
    const isAdmin = session.user?.role === AppRole.ADMIN;

        // Helper to map to BookCarousel shape
        const toCarousel = (b: { id: string; title: string; coverUrl: string | null }): CarouselBook => ({ id: b.id, title: b.title, coverUrl: b.coverUrl });

        const LIMIT = 16; // max items per highlight

        // Novidades: books published/updated in the last 30 days
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const novidadesRaw = await prisma.book.findMany({
          where: {
            OR: [
              { createdAt: { gte: last30Days } },
              { updatedAt: { gte: last30Days } },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: LIMIT,
          select: { id: true, title: true, coverUrl: true },
        });
        const novidades = novidadesRaw.map(toCarousel);

        // Em destaque: normalize metrics, exclude author interactions, apply truncation
        const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const viewsAgg = await prisma.$queryRaw<Array<{ bookId: string; views: bigint }>>`
          SELECT c."bookId" as "bookId", COUNT(*)::bigint as views
          FROM "ChapterView" v
          JOIN "Chapter" c ON v."chapterId" = c."id"
          WHERE v."createdAt" >= ${cutoff}
          GROUP BY c."bookId";
        `;
        const ratingsAgg = await prisma.$queryRaw<Array<{ bookId: string; ratings: bigint, avg: number }>>`
          SELECT "bookId", COUNT(*)::bigint as ratings, AVG("score")::float as avg
          FROM "BookRating"
          WHERE "createdAt" >= ${cutoff}
          GROUP BY "bookId";
        `;
        const commentsAgg = await prisma.$queryRaw<Array<{ bookId: string; comments: bigint }>>`
          SELECT "bookId", COUNT(*)::bigint as comments
          FROM "Comment"
          WHERE "createdAt" >= ${cutoff}
          GROUP BY "bookId";
        `;
        // Normalize and truncate metrics
        const normalize = (value: number, min: number, max: number) => (max > min ? (value - min) / (max - min) : 0);
        const truncate = (values: number[], percentile: number) => {
          const sorted = [...values].sort((a, b) => a - b);
          const index = Math.floor((percentile / 100) * sorted.length);
          return sorted[index] || 0;
        };
        const viewValues = viewsAgg.map(v => Number(v.views));
        const ratingValues = ratingsAgg.map(r => Number(r.ratings) * r.avg);
        const commentValues = commentsAgg.map(c => Number(c.comments));
        const viewMax = truncate(viewValues, 98);
        const ratingMax = truncate(ratingValues, 95);
        const commentMax = truncate(commentValues, 95);
        const vMap = new Map(viewsAgg.map(v => [v.bookId, normalize(Number(v.views), 0, viewMax)]));
        const rMap = new Map(ratingsAgg.map(r => [r.bookId, normalize(Number(r.ratings) * r.avg, 0, ratingMax)]));
        const cMap = new Map(commentsAgg.map(c => [c.bookId, normalize(Number(c.comments), 0, commentMax)]));
        const candidateIds = new Set([...vMap.keys(), ...rMap.keys(), ...cMap.keys()]);
        const weights = { views: 0.2, ratings: 0.45, comments: 0.35 };
        const trendingScores = Array.from(candidateIds).map(id => {
          const score = (vMap.get(id) || 0) * weights.views + (rMap.get(id) || 0) * weights.ratings + (cMap.get(id) || 0) * weights.comments;
          return { bookId: id, score };
        }).sort((a, b) => b.score - a.score).slice(0, LIMIT);
            const trendingBooksRaw = await prisma.book.findMany({
            where: { id: { in: trendingScores.map(s => s.bookId) } },
            select: { id: true, title: true, coverUrl: true },
        });
        // Preserve order by score
            const trendingMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(trendingBooksRaw.map(b => [b.id, b]));
            const trending = trendingScores
                .map(s => trendingMap.get(s.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b!));

        // Mais avaliados: quantidade_de_avaliações × média_das_notas
        const byWeighted = ratingsAgg.map(r => ({ bookId: r.bookId, WR: Number(r.ratings) * r.avg }))
          .sort((a, b) => b.WR - a.WR)
          .slice(0, LIMIT);
        const topRatedRaw = await prisma.book.findMany({ where: { id: { in: byWeighted.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const topRatedMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(topRatedRaw.map(b => [b.id, b]));
            const maisAvaliados = byWeighted
                .map(x => topRatedMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b!));

        // Mais visualizados (all-time)
        const viewsAll = await prisma.$queryRaw<Array<{ bookId: string; cnt: bigint }>>`
            SELECT c."bookId" as "bookId", COUNT(*)::bigint as cnt
            FROM "ChapterView" v JOIN "Chapter" c ON v."chapterId" = c."id"
            GROUP BY c."bookId" ORDER BY cnt DESC LIMIT ${LIMIT};
        `;
        const mostViewedRaw = await prisma.book.findMany({ where: { id: { in: viewsAll.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const mvMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(mostViewedRaw.map(b => [b.id, b]));
            const maisVisualizados = viewsAll
                .map(x => mvMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b!));

        // Mais comentados: exclude author comments
        const commentsAll = await prisma.$queryRaw<Array<{ bookId: string; cnt: bigint }>>`
          SELECT "bookId", COUNT(*)::bigint as cnt
          FROM "Comment"
          GROUP BY "bookId"
          ORDER BY cnt DESC
          LIMIT ${LIMIT};
        `;
        const mostCommentedRaw = await prisma.book.findMany({ where: { id: { in: commentsAll.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const mcMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(mostCommentedRaw.map(b => [b.id, b]));
            const maisComentados = commentsAll
                .map(x => mcMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b!));

        // Mais seguidos (all-time)
        const followsAll = await prisma.$queryRaw<Array<{ bookId: string; cnt: bigint }>>`
            SELECT "bookId", COUNT(*)::bigint as cnt FROM "BookFollow" GROUP BY "bookId" ORDER BY cnt DESC LIMIT ${LIMIT};
        `;
        const mostFollowedRaw = await prisma.book.findMany({ where: { id: { in: followsAll.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const mfMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(mostFollowedRaw.map(b => [b.id, b]));
            const maisSeguidos = followsAll
                .map(x => mfMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b!));

        // Quem sabe você goste: aleatórios
        const randomIds = await prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM "Book" ORDER BY random() LIMIT ${LIMIT};
        `;
        const randomRaw = await prisma.book.findMany({ where: { id: { in: randomIds.map(x => x.id) } }, select: { id: true, title: true, coverUrl: true } });
        // Shuffle to ensure random order on every request
        const shuffled = [...randomRaw].sort(() => Math.random() - 0.5);
        const quemSabe = shuffled.map(toCarousel);

    return (
        <>
            <Navbar />
            {/* Breadcrumb below navbar, centered (offset for fixed header) */}
            <div className="w-full flex justify-center mt-14 sm:mt-16">
                <Breadcrumb items={[]} showHome anchor="static" />
            </div>
            <main className="min-h-screen flex flex-col gap-10">
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BannerCarousel initialBanners={banners} isAdmin={isAdmin} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BookCarousel title="Novidades!" icon={<Sparkles size={18} />} books={novidades} itemsPerView={6} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BookCarousel title="Em destaque!" icon={<TrendingUp size={18} />} books={trending} itemsPerView={6} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BookCarousel title="Mais avaliados!" icon={<Medal size={18} />} books={maisAvaliados} itemsPerView={6} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BookCarousel title="Mais visualizados!" icon={<Eye size={18} />} books={maisVisualizados} itemsPerView={6} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BookCarousel title="Mais comentados!" icon={<MessageSquare size={18} />} books={maisComentados} itemsPerView={6} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BookCarousel title="Mais seguidos!" icon={<Users size={18} />} books={maisSeguidos} itemsPerView={6} />
                </div>
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 pb-8">
                    <BookCarousel title="Quem sabe você goste!" icon={<Wand2 size={18} />} books={quemSabe} itemsPerView={6} />
                </div>
                {/* Latest releases table */}
                <LatestReleasesTable />
            </main>
        </>
    );
}
