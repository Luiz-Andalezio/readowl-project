import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/navbar/Navbar";
import ButtonWithIcon from "@/components/ui/button/ButtonWithIcon";
import BookCarousel from "@/components/book/BookCarousel";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import { BreadcrumbAuto } from "@/components/ui/Breadcrumb";

export default async function Library() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login?callbackUrl=/library");

    // Load books authored by current user
    const myBooks = await prisma.book.findMany({
        where: { authorId: session.user.id },
        orderBy: { createdAt: 'asc' }, // oldest first per requirement
        select: { id: true, title: true, coverUrl: true }
    });

    // Load books followed by current user
    const followed = await prisma.book.findMany({
        where: { followers: { some: { userId: session.user.id } } },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, coverUrl: true },
    });

    return (
        <>
            <Navbar />
            <main className="min-h-screen">
                <div className="w-full flex justify-center mt-14 sm:mt-16">
                    <BreadcrumbAuto anchor="static" base="/home" labelMap={{ library: "Biblioteca" }} />
                </div>
                <div className="flex justify-center items-start">
                    <Link href="/library/create">
                        <ButtonWithIcon
                            variant="primary"
                            iconUrl="/img/svg/book/checkbook.svg"
                            iconAlt="Livro"
                        >
                            Criar uma obra
                        </ButtonWithIcon>
                    </Link>
                </div>
                <div className="pb-6 md:px-10 max-w-7xl mx-auto">
                    <BookCarousel
                        books={myBooks}
                        title="Minha Autoria!"
                        iconSrc="/img/svg/book/author.svg"
                        itemsPerView={5}
                    />
                    <BookCarousel
                        books={followed}
                        title="Seguidos!"
                        iconSrc="/img/svg/generics/white/owl.svg"
                        itemsPerView={5}
                        emptyMessage="Nenhuma obra seguida."
                    />
                </div>
            </main>
        </>
    );
}
