"use client";
import Image from "next/image";
import { useSession } from "next-auth/react";
import ButtonWithIcon from "@/components/ui/button/ButtonWithIcon";
import { BookWithAuthorAndGenres } from "@/types/book";
import React from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";

type Props = {
    book: BookWithAuthorAndGenres;
    className?: string;
};

export default function BookActions({ book, className }: Props) {
    const { data: session } = useSession();
    const [following, setFollowing] = React.useState(false);
    const [loadingFollow, setLoadingFollow] = React.useState(false);
    const router = useRouter();
    const [loadingStart, setLoadingStart] = React.useState(false);
    // undefined: not checked yet; string: first chapter slug; null: no chapters
    const [firstChapterSlug, setFirstChapterSlug] = React.useState<string | null | undefined>(undefined);

    const isOwner = session?.user?.id === book.authorId;
    const isAdmin = session?.user?.role === "ADMIN";

    // Base style for the "Seguir" button
    const baseStyle =
        "flex-1 text-left font-yusei text-lg font-semibold py-2 px-6 border-2 transition-colors duration-300 flex items-center justify-start gap-2 w-full";

    // Fetch initial follow status
    React.useEffect(() => {
        const slug = slugify(book.title);
        fetch(`/api/books/${slug}/follow`)
            .then((r) => r.ok ? r.json() : Promise.reject(r))
            .then((data: { isFollowing: boolean }) => {
                setFollowing(data.isFollowing);
            })
            .catch(() => {
                // ignore errors silently for public view
            });
    }, [book.title]);

    // Prefetch first chapter slug to decide whether to show the Start button
    React.useEffect(() => {
        const slug = slugify(book.title);
        let aborted = false;
        fetch(`/api/books/${slug}/chapters/first`, { cache: 'no-store' })
            .then(async (r) => {
                if (aborted) return;
                if (r.ok) {
                    const data = await r.json();
                    if (!aborted) setFirstChapterSlug(typeof data?.slug === 'string' ? data.slug : null);
                } else if (r.status === 404) {
                    if (!aborted) setFirstChapterSlug(null);
                } else {
                    if (!aborted) setFirstChapterSlug(null);
                }
            })
            .catch(() => { if (!aborted) setFirstChapterSlug(null); });
        return () => { aborted = true; };
    }, [book.title]);

    async function toggleFollow() {
        const slug = slugify(book.title);
        if (loadingFollow) return;
        setLoadingFollow(true);
        const prevFollowing = following;
        // optimistic update
        setFollowing(!prevFollowing);
        // Optimistic count update via event
        try {
            window.dispatchEvent(new CustomEvent('book:followers:updated', {
                detail: { slug, delta: prevFollowing ? -1 : 1 }
            }));
        } catch {}
        try {
            const res = await fetch(`/api/books/${slug}/follow`, {
                method: prevFollowing ? "DELETE" : "POST",
            });
            if (res.status === 401) {
                // restore and redirect to login
                setFollowing(prevFollowing);
                try {
                    window.dispatchEvent(new CustomEvent('book:followers:updated', {
                        detail: { slug, delta: prevFollowing ? 1 : -1 }
                    }));
                } catch {}
                router.push("/login");
                return;
            }
            if (!res.ok) {
                // revert on error
                setFollowing(prevFollowing);
                try {
                    window.dispatchEvent(new CustomEvent('book:followers:updated', {
                        detail: { slug, delta: prevFollowing ? 1 : -1 }
                    }));
                } catch {}
            } else {
                // If API returns count, normalize UI with exact value
                try {
                    const data = await res.json();
                    if (typeof data?.count === 'number') {
                        window.dispatchEvent(new CustomEvent('book:followers:updated', {
                            detail: { slug, count: data.count }
                        }));
                    }
                } catch {}
            }
        } finally {
            setLoadingFollow(false);
        }
    }

    async function startReading() {
        if (loadingStart) return;
        setLoadingStart(true);
        const slug = slugify(book.title);
        try {
            // If we already know the first chapter slug, navigate immediately
            if (typeof firstChapterSlug === 'string' && firstChapterSlug.length > 0) {
                router.push(`/library/books/${slug}/${firstChapterSlug}`);
                return;
            }
            // Fallback: fetch on demand
            const res = await fetch(`/api/books/${slug}/chapters/first`, { cache: 'no-store' });
            if (!res.ok) return; // no chapters or error
            const data = await res.json();
            if (data?.slug) router.push(`/library/books/${slug}/${data.slug}`);
        } finally {
            setLoadingStart(false);
        }
    }

    return (
        <div
            className={`flex flex-col h-full justify-center items-center md:items-end gap-3 mt-4 md:mt-0 min-w-0 ${className || ""}`}
        >
            {(isOwner || isAdmin) && (
                <div className="flex flex-col gap-3 w-full justify-center items-center mt-7 max-w-[340px] mx-auto md:mx-0 md:w-[340px] md:self-end min-w-0">
                    <ButtonWithIcon
                        className="w-full justify-center items-center"
                        iconUrl="/img/svg/navbar/book1.svg"
                        variant="primary"
                        onClick={() => router.push(`/library/books/${slugify(book.title)}/edit`)}
                    >
                        Editar obra
                    </ButtonWithIcon>
                    <ButtonWithIcon
                        className="w-full justify-center items-center"
                        iconUrl="/img/svg/book/chapter.svg"
                        onClick={() => router.push(`/library/books/${slugify(book.title)}/post-chapter`)}
                    >
                        Adicionar capítulo
                    </ButtonWithIcon>
                </div>
            )}
            {/* Follow / Start row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full max-w-[340px] mx-auto md:mx-0 md:w-[340px] md:self-end min-w-0">
                <button
                    onClick={toggleFollow}
                    disabled={loadingFollow}
                    className={`${baseStyle} ${following
                            ? "bg-readowl-purple-dark text-readowl-purple-light border-readowl-purple rounded-md shadow-md"
                            : "bg-readowl-purple-light text-white border-readowl-purple rounded-md hover:bg-readowl-purple-hover shadow-md"
                        } ${loadingFollow ? "opacity-75 cursor-not-allowed" : ""}`}
                >
                    <Image
                        src="/img/svg/book/bookmark-purple.svg"
                        alt={following ? "Seguindo" : "Seguir"}
                        width={20}
                        height={20}
                        className={following ? "invert-0" : "invert-[100%] brightness-0"}
                    />
                    {following ? "Seguindo" : "Seguir"}
                </button>
                {typeof firstChapterSlug === 'string' ? (
                    <ButtonWithIcon
                        className={`flex-1 w-full justify-center items-center ${loadingStart ? 'opacity-75 cursor-not-allowed' : ''}`}
                        iconUrl="/img/svg/navbar/book1.svg"
                        onClick={startReading}
                    >
                        {loadingStart ? 'Abrindo...' : 'Iniciar'}
                    </ButtonWithIcon>
                ) : (
                    // Placeholder keeps Follow button width when Start is hidden (sm+ only)
                    <span className="hidden sm:block flex-1 w-full" aria-hidden="true" />
                )}
            </div>
        </div>
    );
}
