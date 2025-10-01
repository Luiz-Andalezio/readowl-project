import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import ButtonWithIcon from "@/components/ui/ButtonWithIcon";
import BookCarousel from "@/components/ui/BookCarousel";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';

export default async function Library() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login?callbackUrl=/library");

    // Load books authored by current user
    const myBooks = await prisma.book.findMany({
        where: { authorId: session.user.id },
        orderBy: { createdAt: 'asc' }, // oldest first per requirement
        select: { id: true, title: true, coverUrl: true }
    });

    return (
        <>
            <Navbar />
            <main className="min-h-screen">
                <div className="flex justify-center items-start">
                    <Link href="/library/create">
                        <ButtonWithIcon
                            variant="primary"
                            iconUrl="/img/svg/book/checkbook.svg"
                            iconAlt="Livro"
                        >
                            Registrar uma obra
                        </ButtonWithIcon>
                    </Link>
                </div>
                <div className="px-4 md:px-10 max-w-7xl mx-auto">
                    <BookCarousel
                        books={myBooks}
                        title="Minha Autoria!"
                        iconSrc="/img/svg/book/author.svg"
                        itemsPerView={5}
                    />
                </div>
            </main>
        </>
    );
}
