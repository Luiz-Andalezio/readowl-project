import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/navbar/Navbar";
import { Breadcrumb } from "@/components/ui/navbar/Breadcrumb";
import BannerCarousel from "@/components/sections/BannerCarousel";
import prisma from "@/lib/prisma";


export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");
    const isAdmin = session.user?.role === 'ADMIN';
    // Load banners (best-effort; returns [] if table missing)
    let initialBanners: { name: string; imageUrl: string; linkUrl: string }[] = [];
    try {
        const rows = await prisma.$queryRaw<{ name: string; imageUrl: string; linkUrl: string; order: number }[]>`SELECT "name", "imageUrl", "linkUrl", "order" FROM "Banner" ORDER BY "order" ASC`;
        initialBanners = rows.map(r => ({ name: r.name, imageUrl: r.imageUrl, linkUrl: r.linkUrl }));
    } catch {
        initialBanners = [];
    }

    return (
        <>
            <Navbar />
            {/* Breadcrumb below navbar, centered (offset for fixed header) */}
            <div className="w-full flex justify-center mt-14 sm:mt-16">
                <Breadcrumb items={[]} showHome anchor="static" />
            </div>
            <main className="min-h-screen flex flex-col">
                <div className="mx-auto w-full max-w-6xl px-3 sm:px-4">
                    <BannerCarousel
                        isAdmin={isAdmin}
                        initialBanners={initialBanners}
                        className="mt-4"
                    />
                </div>
            </main>
        </>
    );
}
