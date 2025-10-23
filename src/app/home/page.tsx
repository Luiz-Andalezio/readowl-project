import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/navbar/Navbar";
import { Breadcrumb } from "@/components/ui/navbar/Breadcrumb";
import prisma from "@/lib/prisma";
import BannerCarousel from "@/components/sections/BannerCarousel";
import { AppRole } from "@/types/user";


export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    // Fetch banners server-side to hydrate the client carousel
    const banners = await prisma.banner.findMany({
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { name: true, imageUrl: true, linkUrl: true },
    });
    const isAdmin = session.user?.role === AppRole.ADMIN;

    return (
        <>
            <Navbar />
            {/* Breadcrumb below navbar, centered (offset for fixed header) */}
            <div className="w-full flex justify-center mt-14 sm:mt-16">
                <Breadcrumb items={[]} showHome anchor="static" />
            </div>
            <main className="min-h-screen flex flex-col gap-6">
                <div className="w-full max-w-6xl mx-auto px-3 sm:px-4">
                    <BannerCarousel initialBanners={banners} isAdmin={isAdmin} />
                </div>
            </main>
        </>
    );
}
