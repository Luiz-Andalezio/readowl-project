"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ButtonWithIcon from '@/components/ui/button/ButtonWithIcon';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useSession } from 'next-auth/react';
import CommentInput from '@/components/comment/CommentInput';
import CommentsList, { type CommentDto } from '@/components/comment/CommentsList';
import { Eye, SunMedium, Moon, ArrowLeft, ArrowRight, BookText, Pencil, FilePlus2, FilePenLine } from 'lucide-react';

type Payload = {
  book: { id: string; title: string; authorName?: string | null };
  chapter: { id: string; title: string; content: string; createdAt: string | Date };
  prevSlug: string | null;
  nextSlug: string | null;
  volumeTitle: string | null;
};

export default function ReadChapterClient({ slug, chapterSlug, payload, canManage = false }: { slug: string; chapterSlug: string; payload: Payload; canManage?: boolean }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || '';
  const [dark, setDark] = React.useState(true); // default to dark to match app background

  // Read preference from namespaced key (per user) or anon fallback; default is dark
  React.useEffect(() => {
    function loadPreferred() {
      try {
        const keyBase = 'readowl:chapter:theme';
        const key = userId ? `${keyBase}:u:${userId}` : `${keyBase}:anon`;
        const saved = localStorage.getItem(key)
          // legacy fallback (older versions)
          || localStorage.getItem(keyBase);
        if (saved === 'light') { setDark(false); return; }
        // default and any other value → dark
        setDark(true);
      } catch {
        // keep default (dark)
        setDark(true);
      }
    }
    loadPreferred();
  }, [userId]);

  const toggleTheme = React.useCallback(() => {
    setDark((d) => {
      const next = !d;
      try {
        const keyBase = 'readowl:chapter:theme';
        const key = userId ? `${keyBase}:u:${userId}` : `${keyBase}:anon`;
        localStorage.setItem(key, next ? 'dark' : 'light');
      } catch {}
      return next;
    });
  }, [userId]);

  const indexHref = `/library/books/${slug}`;
  const prevHref = payload.prevSlug ? `/library/books/${slug}/${payload.prevSlug}` : null;
  const nextHref = payload.nextSlug ? `/library/books/${slug}/${payload.nextSlug}` : null;

  // Keyboard navigation: Left/Right arrows
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' && prevHref) router.push(prevHref);
      if (e.key === 'ArrowRight' && nextHref) router.push(nextHref);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevHref, nextHref, router]);

  // Typography: force pt-serif for text content; invert color in dark mode
  const containerClass = dark
    ? 'prose prose-invert max-w-4xl mx-auto font-ptserif'
    : 'prose max-w-4xl mx-auto font-ptserif';

  // Views: POST a view on mount (auth-only) and fetch count
  const [views, setViews] = React.useState<number | null>(null);
  const [canSeeViews, setCanSeeViews] = React.useState<boolean>(true);
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // Fire-and-forget view record; ignore errors
        await fetch(`/api/books/${slug}/chapters/${chapterSlug}/view`, { method: 'POST' });
      } catch {}
      try {
        const r = await fetch(`/api/books/${slug}/chapters/${chapterSlug}/views`, { cache: 'no-store' });
        if (r.status === 403) { if (!ignore) setCanSeeViews(false); return; }
        if (!r.ok) return;
        const data = await r.json();
        if (!ignore) { setViews(Number(data?.count || 0)); setCanSeeViews(true); }
      } catch {}
    })();
    return () => { ignore = true; };
  }, [slug, chapterSlug]);

  // Comments for this chapter
  const [comments, setComments] = React.useState<CommentDto[]>([]);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const r = await fetch(`/api/books/${slug}/chapters/${chapterSlug}/comments`, { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        if (!ignore) {
          setComments(data.comments || []);
          setCount((data.comments || []).length + (data.comments || []).reduce((acc: number, it: CommentDto) => acc + (it.replies?.length || 0), 0));
        }
      } catch { }
    }
    load();
    return () => { ignore = true; };
  }, [slug, chapterSlug]);

  async function refetch() {
    const r = await fetch(`/api/books/${slug}/chapters/${chapterSlug}/comments`, { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    setComments(data.comments || []);
    setCount((data.comments || []).length + (data.comments || []).reduce((acc: number, it: CommentDto) => acc + (it.replies?.length || 0), 0));
  }


  return (
    <section className={`${dark ? 'bg-readowl-purple-dark text-white' : 'bg-white text-readowl-purple-extradark'} w-full`}>
      {/* Breadcrumb and CRUD area with tone-aware text */}
      <div className="mt-14 sm:mt-16">
        <div className="container mx-auto px-3 md:px-6">
          <div className="flex justify-center">
            <Breadcrumb
              anchor="static"
              tone={dark ? 'dark' : 'light'}
              items={[
                { label: 'Início', href: '/home' },
                { label: 'Biblioteca', href: '/library' },
                { label: 'Livros', href: '/library' },
                { label: payload.book.title, href: `/library/books/${slug}` },
                { label: payload.chapter.title }
              ]}
            />
          </div>
          {canManage && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href={`/library/books/${slug}/edit`} className="inline-flex items-center">
                <span className="sr-only">Editar obra</span>
                <span className="font-yusei text-lg font-semibold py-2 px-6 border-2 border-readowl-purple rounded-md shadow-md transition-colors duration-300 flex items-center gap-2 bg-readowl-purple-light text-white hover:bg-readowl-purple-hover">
                  <Pencil size={18} />
                  Editar obra
                </span>
              </a>
              <a href={`/library/books/${slug}/${chapterSlug}/edit-chapter`} className="inline-flex items-center">
                <span className="font-yusei text-lg font-semibold py-2 px-6 border-2 border-readowl-purple rounded-md shadow-md transition-colors duration-300 flex items-center gap-2 bg-readowl-purple-light text-white hover:bg-readowl-purple-hover">
                  <FilePenLine size={18} />
                  Editar capítulo
                </span>
              </a>
              <a href={`/library/books/${slug}/post-chapter`} className="inline-flex items-center">
                <span className="font-yusei text-lg font-semibold py-2 px-6 border-2 border-readowl-purple rounded-md shadow-md transition-colors duration-300 flex items-center gap-2 bg-readowl-purple-light text-white hover:bg-readowl-purple-hover">
                  <FilePlus2 size={18} />
                  Adicionar capítulo
                </span>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto pb-3 md:px-6 py-6">
        {/* Reading card */}
        <div className={`relative rounded-md p-4 md:p-6 font-ptserif ${dark ? 'bg-readowl-purple-extradark' : 'bg-readowl-purple-extralight'}`}>
          {/* Top controls */}
          {/* Mobile: center (color mode) on first row, prev/next on same row below to stay aligned */}
          <div className="mx-auto max-w-4xl sm:hidden">
            <div className="flex justify-center">
              <button
                onClick={toggleTheme}
                aria-label={dark ? 'Modo claro' : 'Modo escuro'}
                className="rounded-full w-11 h-11 flex items-center justify-center border-2 border-readowl-purple shadow-md bg-readowl-purple-light text-white hover:bg-readowl-purple-hover"
              >
                {dark ? <SunMedium size={20} /> : <Moon size={20} />}
              </button>
            </div>
            {(prevHref || nextHref) ? (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex-1 flex justify-start">
                  {prevHref ? (
                    <ButtonWithIcon onClick={() => router.push(prevHref)} icon={<ArrowLeft size={20} />} variant="primary">Anterior</ButtonWithIcon>
                  ) : null}
                </div>
                <div className="flex-1 flex justify-end">
                  {nextHref ? (
                    <ButtonWithIcon onClick={() => router.push(nextHref)} icon={<ArrowRight size={20} />} variant="primary">Próximo</ButtonWithIcon>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Desktop and up: three columns keep center perfectly centered */}
          <div className="mx-auto max-w-4xl hidden sm:flex items-center justify-between gap-3">
            <div className="flex-1 flex justify-start">
              {prevHref ? (
                <ButtonWithIcon onClick={() => router.push(prevHref)} icon={<ArrowLeft size={20} />} variant="primary">Anterior</ButtonWithIcon>
              ) : null}
            </div>
            <div className="flex-none flex justify-center">
              <button
                onClick={toggleTheme}
                aria-label={dark ? 'Modo claro' : 'Modo escuro'}
                className="rounded-full w-11 h-11 flex items-center justify-center border-2 border-readowl-purple shadow-md bg-readowl-purple-light text-white hover:bg-readowl-purple-hover"
              >
                {dark ? <SunMedium size={20} /> : <Moon size={20} />}
              </button>
            </div>
            <div className="flex-1 flex justify-end">
              {nextHref ? (
                <ButtonWithIcon onClick={() => router.push(nextHref)} icon={<ArrowRight size={20} />} variant="primary">Próximo</ButtonWithIcon>
              ) : null}
            </div>
          </div>

          {/* Book title centered, then aligned info under with content width */}
          <header className="mt-6">
            <h2 className="text-center font-ptserif font-bold text-3xl md:text-4xl">
              <Link href={indexHref} className="hover:underline">
                {payload.book.title}
              </Link>
            </h2>
            {/* Author centered, smaller than title */}
            {payload.book.authorName ? (
              <div className="mt-1 text-center font-ptserif font-bold text-base md:text-lg">
                por {payload.book.authorName}
              </div>
            ) : null}
            <div className="mx-auto max-w-4xl">
              {payload.volumeTitle ? (
                <div className="mt-10 font-bold">
                  {payload.volumeTitle}
                </div>
              ) : null}
              <h1 className="mt-1 text-3xl md:text-4xl font-ptserif text-left">
                {payload.chapter.title}
              </h1>
              {canSeeViews && (
                <div className="mt-2 text-sm opacity-80">
                  <span className="inline-flex items-center gap-2">
                    <Eye size={18} className={dark ? 'text-white' : 'text-readowl-purple-extradark'} />
                    <span className={dark ? 'text-white' : 'text-readowl-purple-extradark'}>
                      {views !== null ? `${views.toLocaleString('pt-BR')} visualizações` : '0'}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Content */}
          <article className={`${containerClass} mt-6`} dangerouslySetInnerHTML={{ __html: payload.chapter.content }} />

          {/* Bottom controls: Prev / Índice / Next (keep index in middle, align with content width) */}
          {/* Bottom controls */}
          {/* Mobile: prev/next on the same row, index on its own row below */}
          <div className="mt-8 mx-auto max-w-4xl sm:hidden">
            {(payload.prevSlug || payload.nextSlug) ? (
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-start">
                  {payload.prevSlug ? (
                    <ButtonWithIcon onClick={() => router.push(`/library/books/${slug}/${payload.prevSlug}`)} iconUrl="/img/svg/generics/white/arrow-left.svg" variant="primary">Anterior</ButtonWithIcon>
                  ) : null}
                </div>
                <div className="flex-1 flex justify-end">
                  {payload.nextSlug ? (
                    <ButtonWithIcon onClick={() => router.push(`/library/books/${slug}/${payload.nextSlug}`)} iconUrl="/img/svg/generics/white/arrow-right.svg" variant="primary">Próximo</ButtonWithIcon>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex justify-center">
              <ButtonWithIcon onClick={() => router.push(indexHref)} icon={<BookText size={20} />} variant="primary">Índice</ButtonWithIcon>
            </div>
          </div>

          {/* Desktop and up: three columns keep center perfectly centered */}
          <div className="mt-8 mx-auto max-w-4xl hidden sm:flex items-center justify-between gap-3">
            <div className="flex-1 flex justify-start">
              {payload.prevSlug ? (
                <ButtonWithIcon onClick={() => router.push(`/library/books/${slug}/${payload.prevSlug}`)} iconUrl="/img/svg/generics/white/arrow-left.svg" variant="primary">Anterior</ButtonWithIcon>
              ) : null}
            </div>
            <div className="flex-none flex justify-center">
              <ButtonWithIcon onClick={() => router.push(indexHref)} icon={<BookText size={20} />} variant="primary">Índice</ButtonWithIcon>
            </div>
            <div className="flex-1 flex justify-end">
              {payload.nextSlug ? (
                <ButtonWithIcon onClick={() => router.push(`/library/books/${slug}/${payload.nextSlug}`)} iconUrl="/img/svg/generics/white/arrow-right.svg" variant="primary">Próximo</ButtonWithIcon>
              ) : null}
            </div>
          </div>
        </div>
        {/* Comments */}
        <div className="relative rounded-md p-4 md:p-6 font-ptserif mt-6">
      <label className={`block mb-2 font-semibold ${dark ? 'text-white' : 'text-readowl-purple-extradark'}`}>Deixe um comentário:</label>
      <CommentInput onSubmit={async (html) => { await fetch(`/api/books/${slug}/chapters/${chapterSlug}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: html }) }); await refetch(); }} />
          <div className="mt-4">
            <CommentsList
              comments={comments}
              total={count}
              likeApi={async (id, willLike) => { const res = await fetch(`/api/books/${slug}/comments/${id}/like`, { method: willLike ? 'POST' : 'DELETE' }); const data = await res.json().catch(() => ({})); return Number(data?.count || 0); }}
              // Edit: only comment owner (admins cannot edit others' comments)
              canEdit={(c) => !!session?.user?.id && session.user.id === c.user?.id}
              // Delete: comment owner/admin OR book owner (canManage prop coming from server page)
              canDelete={() => !!session?.user?.id && (session.user.role === 'ADMIN' || canManage)}
              // Back-compat: unused
              canEditDelete={() => false}
              onReply={async (parentId, html) => { await fetch(`/api/books/${slug}/chapters/${chapterSlug}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: html, parentId }) }); await refetch(); }}
              onEdit={async (id, html) => { await fetch(`/api/books/${slug}/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: html }) }); await refetch(); }}
              onDelete={async (id) => { await fetch(`/api/books/${slug}/comments/${id}`, { method: 'DELETE' }); await refetch(); }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
