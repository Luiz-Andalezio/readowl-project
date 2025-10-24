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

        // Novidades: most recent books
        const novidadesRaw = await prisma.book.findMany({ orderBy: { createdAt: "desc" }, take: LIMIT, select: { id: true, title: true, coverUrl: true } });
        const novidades = novidadesRaw.map(toCarousel);

        // Em destaque: weighted score over last 14 days
        const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        // aggregate helpers typed per query already
        // Views per book in period (from ChapterView -> Chapter -> Book)
        const viewsAgg = await prisma.$queryRaw<Array<{ bookId: string; views: bigint }>>`
            SELECT c."bookId" as "bookId", COUNT(*)::bigint as views
            FROM "ChapterView" v
            JOIN "Chapter" c ON v."chapterId" = c."id"
            WHERE v."createdAt" >= ${cutoff}
            GROUP BY c."bookId";
        `;
        const ratingsAgg = await prisma.$queryRaw<Array<{ bookId: string; ratings: bigint }>>`
            SELECT "bookId", COUNT(*)::bigint as ratings
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
        const followsAgg = await prisma.$queryRaw<Array<{ bookId: string; follows: bigint }>>`
            SELECT "bookId", COUNT(*)::bigint as follows
            FROM "BookFollow"
            WHERE "createdAt" >= ${cutoff}
            GROUP BY "bookId";
        `;
        // Build maps and find maxima for normalization
        const vMap = new Map<string, number>(); let vMax = 0;
        viewsAgg.forEach(r => { const n = Number(r.views); vMap.set(r.bookId, n); if (n > vMax) vMax = n; });
        const rMap = new Map<string, number>(); let rMax = 0;
        ratingsAgg.forEach(r => { const n = Number(r.ratings); rMap.set(r.bookId, n); if (n > rMax) rMax = n; });
        const cMap = new Map<string, number>(); let cMax = 0;
        commentsAgg.forEach(r => { const n = Number(r.comments); cMap.set(r.bookId, n); if (n > cMax) cMax = n; });
        const fMap = new Map<string, number>(); let fMax = 0;
        followsAgg.forEach(r => { const n = Number(r.follows); fMap.set(r.bookId, n); if (n > fMax) fMax = n; });
        // Candidate book ids that had any activity
        const candidateIds = new Set<string>([
            ...Array.from(vMap.keys()),
            ...Array.from(rMap.keys()),
            ...Array.from(cMap.keys()),
            ...Array.from(fMap.keys()),
        ]);
        // Compute weighted score
        const weights = { views: 0.5, ratings: 0.2, comments: 0.2, follows: 0.1 };
        const trendingScores: Array<{ bookId: string; score: number }> = Array.from(candidateIds).map(id => {
            const nv = vMax > 0 ? (vMap.get(id) ?? 0) / vMax : 0;
            const nr = rMax > 0 ? (rMap.get(id) ?? 0) / rMax : 0;
            const nc = cMax > 0 ? (cMap.get(id) ?? 0) / cMax : 0;
            const nf = fMax > 0 ? (fMap.get(id) ?? 0) / fMax : 0;
            const score = nv * weights.views + nr * weights.ratings + nc * weights.comments + nf * weights.follows;
            return { bookId: id, score };
        }).sort((a,b) => b.score - a.score).slice(0, LIMIT);
            const trendingBooksRaw = await prisma.book.findMany({
            where: { id: { in: trendingScores.map(s => s.bookId) } },
            select: { id: true, title: true, coverUrl: true },
        });
        // Preserve order by score
            const trendingMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(trendingBooksRaw.map(b => [b.id, b]));
            const trending = trendingScores
                .map(s => trendingMap.get(s.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b));

        // Mais avaliados: combine quantidade e média com Bayesian smoothing
        const ratingsAll = await prisma.$queryRaw<Array<{ bookId: string; count: bigint; avg: number }>>`
            SELECT "bookId", COUNT(*)::bigint as count, AVG("score")::float as avg
            FROM "BookRating"
            GROUP BY "bookId";
        `;
        const m = 5; // prior count
        // global mean
        const globalAvgRow = await prisma.$queryRaw<Array<{ avg: number }>>`SELECT AVG("score")::float as avg FROM "BookRating";`;
        const C = globalAvgRow[0]?.avg ?? 3.5;
        const byWeighted = ratingsAll
            .map(r => ({ bookId: r.bookId, v: Number(r.count), R: r.avg }))
            .map(({ bookId, v, R }) => ({ bookId, WR: (v/(v+m))*R + (m/(v+m))*C }))
            .sort((a,b) => b.WR - a.WR)
            .slice(0, LIMIT);
        const topRatedRaw = await prisma.book.findMany({ where: { id: { in: byWeighted.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const topRatedMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(topRatedRaw.map(b => [b.id, b]));
            const maisAvaliados = byWeighted
                .map(x => topRatedMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b));

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
                .map(b => toCarousel(b));

        // Mais comentados (all-time)
        const commentsAll = await prisma.$queryRaw<Array<{ bookId: string; cnt: bigint }>>`
            SELECT "bookId", COUNT(*)::bigint as cnt FROM "Comment" GROUP BY "bookId" ORDER BY cnt DESC LIMIT ${LIMIT};
        `;
        const mostCommentedRaw = await prisma.book.findMany({ where: { id: { in: commentsAll.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const mcMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(mostCommentedRaw.map(b => [b.id, b]));
            const maisComentados = commentsAll
                .map(x => mcMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b));

        // Mais seguidos (all-time)
        const followsAll = await prisma.$queryRaw<Array<{ bookId: string; cnt: bigint }>>`
            SELECT "bookId", COUNT(*)::bigint as cnt FROM "BookFollow" GROUP BY "bookId" ORDER BY cnt DESC LIMIT ${LIMIT};
        `;
        const mostFollowedRaw = await prisma.book.findMany({ where: { id: { in: followsAll.map(x => x.bookId) } }, select: { id: true, title: true, coverUrl: true } });
            const mfMap = new Map<string, { id: string; title: string; coverUrl: string | null }>(mostFollowedRaw.map(b => [b.id, b]));
            const maisSeguidos = followsAll
                .map(x => mfMap.get(x.bookId))
                .filter((b): b is { id: string; title: string; coverUrl: string | null } => Boolean(b))
                .map(b => toCarousel(b));

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
