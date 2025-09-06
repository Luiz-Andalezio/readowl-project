"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import ButtonWithIcon from '@/components/ui/ButtonWithIcon';
import { BOOK_GENRES_MASTER, BOOK_COVER_MIN_WIDTH, BOOK_COVER_MIN_HEIGHT, BOOK_COVER_RATIO, BOOK_COVER_RATIO_TOLERANCE, BOOK_STATUS, BOOK_STATUS_LABEL, updateBookSchema } from '@/types/book';
import { slugify } from '@/lib/slug';
import MagicNotification from '@/components/ui/MagicNotification';
import { signIn } from 'next-auth/react';

type Genre = { id: string; name: string };
type Author = { id: string; name: string | null; image: string | null; role: string };

interface BookInput {
    id: string;
    title: string;
    synopsis: string;
    releaseFrequency: string | null;
    coverUrl: string | null;
    status: typeof BOOK_STATUS[number];
    authorId: string;
    author: Author;
    genres: Genre[];
}

interface Props { book: BookInput; slug: string; hasLocalPassword: boolean }

export default function EditBookForm({ book, slug, hasLocalPassword }: Props) {
    const [title, setTitle] = useState(book.title);
    const [synopsis, setSynopsis] = useState(book.synopsis);
    const [releaseFrequency, setReleaseFrequency] = useState(book.releaseFrequency || '');
    const [coverUrl, setCoverUrl] = useState(book.coverUrl || '');
    const [status, setStatus] = useState<typeof BOOK_STATUS[number]>(book.status);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(book.genres.map(g => g.name));

    // Baseline (last saved) snapshot. Used to detect changes after a successful save.
    const [baseline, setBaseline] = useState(() => ({
        title: book.title,
        synopsis: book.synopsis,
        releaseFrequency: book.releaseFrequency || '',
        coverUrl: book.coverUrl || '',
        status: book.status as typeof BOOK_STATUS[number],
        genres: book.genres.map(g => g.name).sort(),
    }));

    const [coverValid, setCoverValid] = useState<boolean | null>(null);
    const [coverLoading, setCoverLoading] = useState(false);
    const [genreFilter, setGenreFilter] = useState('');
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [touched, setTouched] = useState({ title: false, synopsis: false, frequency: false, cover: false });
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTitle, setDeleteTitle] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    // If user has no local password, we require Google step-up instead
    const isGoogleOnly = !hasLocalPassword;
    const [helpOpen, setHelpOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successOpen, setSuccessOpen] = useState(false);
    const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

    const genres = useMemo(() => [...BOOK_GENRES_MASTER], []);
    const filteredGenres = useMemo(() => genres.filter(g => g.toLowerCase().includes(genreFilter.toLowerCase())), [genreFilter, genres]);
    const toggleGenre = (g: string) => setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

    // Cover validation
    const expectedRatio = BOOK_COVER_RATIO;
    const aspectTolerance = BOOK_COVER_RATIO_TOLERANCE;
    useEffect(() => {
        if (!coverUrl) { setCoverValid(null); return; }
        let cancelled = false;
        setCoverLoading(true);
        const ImgCtor = (typeof window !== 'undefined' ? (window as unknown as { Image: { new(): HTMLImageElement } }).Image : null);
        if (!ImgCtor) { setCoverValid(null); setCoverLoading(false); return; }
        const img = new ImgCtor();
        img.onload = () => {
            if (cancelled) return;
            const ratio = img.width / img.height;
            const ok = Math.abs(ratio - expectedRatio) < aspectTolerance && img.width >= BOOK_COVER_MIN_WIDTH && img.height >= BOOK_COVER_MIN_HEIGHT;
            setCoverValid(ok);
            setCoverLoading(false);
        };
        img.onerror = () => { if (!cancelled) { setCoverValid(false); setCoverLoading(false); } };
        img.src = coverUrl;
        return () => { cancelled = true; };
    }, [coverUrl, expectedRatio, aspectTolerance]);

    const validate = useCallback(() => {
        const v: Record<string, string | undefined> = {};
        const parsed = updateBookSchema.safeParse({
            title: title.trim(),
            synopsis: synopsis.trim(),
            releaseFrequency: releaseFrequency.trim() || undefined,
            coverUrl: coverUrl.trim() || undefined,
            status,
            genres: selectedGenres,
        });
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const path = issue.path[0] as string | undefined;
                if (path) v[path] = issue.message;
            }
        }
        if (!coverUrl.trim()) v.coverUrl = 'É necessário uma URL da capa.';
        else if (coverValid === false) v.coverUrl = `A proporção ou tamanho é inválido (mínimo ${BOOK_COVER_MIN_WIDTH}x${BOOK_COVER_MIN_HEIGHT}, proporção 3:4).`;
        else if (coverValid !== true) v.coverUrl = 'Validando capa, aguarde...';
        return v;
    }, [title, synopsis, releaseFrequency, coverUrl, coverValid, status, selectedGenres]);

    useEffect(() => { setErrors(validate()); }, [validate]);
    const changed = useMemo(() => {
        const now = {
            title: title,
            synopsis: synopsis,
            releaseFrequency: releaseFrequency,
            coverUrl: coverUrl,
            status: status,
            genres: [...selectedGenres].sort(),
        };
        return JSON.stringify(now) !== JSON.stringify(baseline);
    }, [title, synopsis, releaseFrequency, coverUrl, status, selectedGenres, baseline]);

    const canSubmit = changed && Object.keys(errors).length === 0 && selectedGenres.length > 0 && coverValid === true;

    const onSubmit = async () => {
        setAttemptedSubmit(true);
        const v = validate();
        setErrors(v);
        if (Object.keys(v).length) return;
        try {
            setSubmitting(true);
            const res = await fetch(`/api/books/${encodeURIComponent(slug)}/edit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim(), synopsis: synopsis.trim(), releaseFrequency: releaseFrequency.trim() || undefined, coverUrl: coverUrl.trim(), status, genres: selectedGenres }),
            });
            if (!res.ok) throw new Error('Falha ao atualizar livro');
            setConfirmSaveOpen(false);
            setSuccessOpen(true);
        } catch (e) {
            setErrors(prev => ({ ...prev, submit: (e as Error).message }));
            const id = Math.random().toString(36).slice(2);
            setToasts((t) => [...t, { id, message: (e as Error).message }]);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="w-full max-w-6xl mx-auto bg-readowl-purple-medium rounded-3xl p-8 shadow-2xl mt-10">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <Image src="/img/svg/book/checkbook.svg" alt="Livro" width={50} height={50} className="w-10 h-10 mt-0.4" />
                    <h1 className="text-3xl font-yusei text-center font-semibold text-white">Editar obra: {book.title}</h1>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Cover */}
                    <div>
                        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Image src="/img/svg/book/book2.svg" alt="Capa" width={18} height={18} className="opacity-80" />
                            URL da Capa
                            <button type="button" onClick={() => setHelpOpen(true)} className="w-5 h-5 rounded-full bg-readowl-purple-dark text-white text-xs flex items-center justify-center">?</button>
                        </label>
                        <div className={`relative w-full aspect-[3/4] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden text-center text-readowl-purple-dark bg-white ${coverValid === false ? 'border-red-400' : 'border-none'}`}>
                            {coverUrl && coverValid !== null && !coverLoading ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={coverUrl} alt="Preview capa" className="object-cover w-full h-full" />
                            ) : (
                                <span className="text-xs opacity-70 select-none px-4">Insira a URL da imagem para ver a capa aqui <br />(proporção 3:4, mín {BOOK_COVER_MIN_WIDTH}x{BOOK_COVER_MIN_HEIGHT})</span>
                            )}
                            {coverLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-readowl-purple font-semibold text-sm">Carregando...</div>}
                        </div>
                        <input type="url" placeholder="https://..." value={coverUrl} onChange={e => setCoverUrl(e.target.value.trim())} onBlur={() => setTouched(t => ({ ...t, cover: true }))} className="mt-2.5 w-full rounded-full bg-white focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50" />
                        {errors.coverUrl && (touched.cover || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.coverUrl}</p>}

                        {/* Compact Status Dropdown with icons, below cover input, no label */}
                        <div className="mt-3">
                            <div className="relative inline-block">
                                <select value={status} onChange={(e) => setStatus(e.target.value as typeof BOOK_STATUS[number])} className="appearance-none pr-8 pl-10 py-1.5 text-sm rounded-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple">
                                    {BOOK_STATUS.map(s => (
                                        <option key={s} value={s}>{BOOK_STATUS_LABEL[s]}</option>
                                    ))}
                                </select>
                                {/* Left icon changes with status */}
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={
                                        status === 'ONGOING' ? '/img/svg/book/status/active.svg'
                                            : status === 'COMPLETED' ? '/img/svg/book/status/finished.svg'
                                                : status === 'PAUSED' ? '/img/svg/book/status/paused.svg'
                                                    : '/img/svg/book/status/hiatus.svg'
                                    } alt="Status" className="w-5 h-5" />
                                </span>
                                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-readowl-purple">▼</span>
                            </div>
                        </div>
                    </div>

                    {/* Basic fields */}
                    <div className="lg:col-span-2">
                        <div>
                            <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                <Image src="/img/svg/book/titlecase.svg" alt="Título" width={18} height={18} className="opacity-80" />
                                Título
                            </label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} onBlur={() => setTouched(t => ({ ...t, title: true }))} className={`w-full rounded-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.title && (touched.title || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`} placeholder="Título da obra" />
                            {errors.title && (touched.title || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                <Image src="/img/svg/book/text.svg" alt="Sinopse" width={18} height={18} className="opacity-80" />
                                Sinopse
                            </label>
                            <textarea value={synopsis} onChange={e => setSynopsis(e.target.value)} onBlur={() => setTouched(t => ({ ...t, synopsis: true }))} className={`w-full rounded-2xl bg-white border-2 pl-4 pr-4 py-3 h-80 resize-none focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 leading-relaxed transition ${errors.synopsis && (touched.synopsis || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`} placeholder="Descreva brevemente a história..." />
                            {errors.synopsis && (touched.synopsis || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.synopsis}</p>}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                                <Image src="/img/svg/book/date.svg" alt="Frequência" width={18} height={18} className="opacity-80" />
                                Frequência de Lançamento (opcional)
                            </label>
                            <input type="text" value={releaseFrequency} onChange={e => setReleaseFrequency(e.target.value)} onBlur={() => setTouched(t => ({ ...t, frequency: true }))} className={`w-full rounded-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.releaseFrequency && (touched.frequency || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`} placeholder="Ex: 1 capítulo por semana." />
                            {errors.releaseFrequency && (touched.frequency || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.releaseFrequency}</p>}
                        </div>

                        {/* Status moved under cover; no extra block here */}
                    </div>
                </div>

                {/* Genres */}
                <div className="lg:col-span-3 w-full mt-4">
                    <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                        <Image src="/img/svg/book/label.svg" alt="Gêneros" width={18} height={18} className="opacity-80" />
                        Gêneros
                    </label>
                    <div className="w-full bg-readowl-purple-extradark/70 rounded-xl border border-white/10 p-3 max-h-48 overflow-y-auto">
                        <div className="relative">
                            <input type="text" value={genreFilter} onChange={e => setGenreFilter(e.target.value)} placeholder="Buscar gênero..." className="w-full rounded-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark pl-4 pr-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50 mb-3" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {filteredGenres.map(g => {
                                const checked = selectedGenres.includes(g);
                                return (
                                    <label key={g} className={`flex items-center justify-center px-2 py-1 rounded-md cursor-pointer text-[11px] font-medium select-none transition border border-white/10 whitespace-pre-line text-center leading-tight min-h-[34px] ${checked ? 'bg-readowl-purple-extradark text-white ring-2 ring-white/30' : 'bg-readowl-purple-light text-white/90 hover:bg-readowl-purple-dark'}`}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleGenre(g)} className="hidden" />
                                        {g}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    {errors.genres && <p className="text-xs text-red-300 mt-1">{errors.genres}</p>}
                </div>

                {errors.submit && <p className="text-sm text-red-300 mt-6 text-center">{errors.submit}</p>}

                <div className="mt-4 flex items-center justify-center gap-6">
                    <ButtonWithIcon
                        variant="secondary"
                        onClick={() => (changed ? setConfirmCancelOpen(true) : (window.location.href = `/library/books/${encodeURIComponent(slugify(baseline.title))}`))}
                        iconUrl="/img/svg/generics/cancel2.svg"
                    >
                        Cancelar
                    </ButtonWithIcon>
                    <ButtonWithIcon variant="primary" disabled={!canSubmit || submitting} onClick={() => setConfirmSaveOpen(true)} iconUrl="/img/svg/book/checkbook.svg">{submitting ? 'Salvando...' : 'Salvar'}</ButtonWithIcon>
                </div>

                {/* Modals */}
                <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Como adicionar a capa" widthClass="max-w-lg">
                    <p>Para adicionar a capa, hospede sua imagem e cole a URL aqui. A imagem deve ter mínimo {BOOK_COVER_MIN_WIDTH}x{BOOK_COVER_MIN_HEIGHT} e proporção 3:4.</p>
                </Modal>

                <Modal open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} title="Descartar alterações?" widthClass="max-w-sm">
                    <p>Suas alterações serão perdidas.</p>
                    <div className="flex gap-3 justify-end mt-6">
                        <button onClick={() => setConfirmCancelOpen(false)} className="px-4 py-2 rounded-full text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
                        <a href={`/library/books/${encodeURIComponent(slug)}`} className="px-4 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600">Descartar</a>
                    </div>
                </Modal>

                <Modal open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} title="Confirmar atualização" widthClass="max-w-sm">
                    <p>Deseja salvar as alterações?</p>
                    <div className="flex gap-3 justify-end mt-6">
                        <button onClick={() => setConfirmSaveOpen(false)} className="px-4 py-2 rounded-full text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
                        <button disabled={submitting} onClick={onSubmit} className="px-4 py-2 rounded-full text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Salvando...' : 'Confirmar'}</button>
                    </div>
                </Modal>

                <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Livro atualizado!" widthClass="max-w-sm">
                    <p>As alterações foram salvas.</p>
                    <div className="flex justify-end mt-6 gap-3">
                        <button
                            onClick={() => {
                                // Update baseline to current values so form returns to "unchanged" state
                                setBaseline({
                                    title,
                                    synopsis,
                                    releaseFrequency,
                                    coverUrl,
                                    status,
                                    genres: [...selectedGenres].sort(),
                                });
                                setSuccessOpen(false);
                            }}
                            className="px-4 py-2 rounded-full text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight"
                        >
                            Continuar editando
                        </button>
                        <button onClick={() => { setSuccessOpen(false); window.location.href = `/library/books/${encodeURIComponent(slugify(title))}`; }} className="px-4 py-2 rounded-full text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple">Voltar para o livro</button>
                    </div>
                </Modal>
            </div>

            {/* Notifications */}
            <div className="fixed top-4 right-4 space-y-2 z-50">
                {toasts.map(t => (
                    <MagicNotification key={t.id} id={t.id} message={t.message} onClose={(id) => setToasts((x) => x.filter(n => n.id !== id))} />
                ))}
            </div>

            {/* Danger zone - delete button below purple card */}
            <div className="w-full max-w-6xl mx-auto mt-4 flex justify-end">
                <ButtonWithIcon
                    className="!bg-red-600 !text-white !border-red-700 hover:!bg-red-700"
                    variant="secondary"
                    iconUrl="/img/svg/book/book-delete.svg"
                    iconAlt="Excluir"
                    onClick={() => setConfirmDeleteOpen(true)}
                >
                    Excluir obra
                </ButtonWithIcon>
            </div>

            {/* Confirm Delete */}
            <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="Excluir esta obra?" widthClass="max-w-md">
                <div className="space-y-3">
                    <p>Essa ação não pode ser desfeita.</p>
                    <p className="text-sm text-white/90">Para confirmar, digite exatamente o nome da obra abaixo{isGoogleOnly ? ' e reautentique com o Google.' : ' e sua senha.'}</p>
                    <div>
                        <label className="text-xs text-white/80">Nome exato da obra</label>
                        <input
                            type="text"
                            value={deleteTitle}
                            onChange={(e) => setDeleteTitle(e.target.value)}
                            placeholder={book.title}
                            className="mt-1 w-full rounded-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50"
                        />
                    </div>
                    {!isGoogleOnly ? (
                        <div>
                            <label className="text-xs text-white/80">Sua senha</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="mt-1 w-full rounded-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50"
                            />
                        </div>
                    ) : (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => signIn('google', { callbackUrl: window.location.href, prompt: 'login' })}
                                className="w-full flex items-center justify-center gap-2 bg-white text-readowl-purple font-semibold py-2 px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition"
                            >
                                <svg width="20" height="20" viewBox="0 0 48 48">
                                    <g>
                                        <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.4 0 4.7.7 6.6 2l6.2-6.2C34.1 5.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.2-.1-3.5z" />
                                        <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 16.1 18.8 13 24 13c2.4 0 4.7.7 6.6 2l6.2-6.2C34.1 5.5 29.3 4 24 4c-7.1 0-13.2 3.7-16.7 9.3z" />
                                        <path fill="#FBBC05" d="M24 44c5.3 0 10.1-1.7 13.8-4.7l-6.4-5.2c-2 1.4-4.6 2.2-7.4 2.2-5.6 0-10.3-3.7-12-8.7l-6.6 5.1C7.9 40.3 15.4 44 24 44z" />
                                        <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-3.6 5.2-6.6 6.2l6.4 5.2C39.7 37.3 44 32.2 44 24c0-1.3-.1-2.2-.4-3.5z" />
                                    </g>
                                </svg>
                                Reautenticar com Google
                            </button>
                            <p className="text-[11px] text-white/70 mt-1">Após reautenticar, tente excluir novamente em até 5 minutos.</p>
                        </div>
                    )}
                    {(deleteTitle && deleteTitle !== book.title) && (
                        <p className="text-xs text-red-300">O nome não confere. Deve ser exatamente: &quot;{book.title}&quot;</p>
                    )}
                </div>
                <div className="flex gap-3 justify-end mt-6">
                    <button onClick={() => setConfirmDeleteOpen(false)} className="px-4 py-2 rounded-full text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Cancelar</button>
                    <button
                        onClick={async () => {
                            try {
                                if (deleteTitle !== book.title) { throw new Error('O nome não confere.'); }
                                if (!isGoogleOnly && !deletePassword) { throw new Error('Informe sua senha.'); }
                                setSubmitting(true);
                                const res = await fetch(`/api/books/${encodeURIComponent(slug)}`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ titleConfirm: deleteTitle, password: isGoogleOnly ? undefined : deletePassword }),
                                });
                                if (!res.ok) {
                                    const data = await res.json().catch(() => null);
                                    if (data?.code === 'STEP_UP_REQUIRED') {
                                        throw new Error('Reautentique-se com o Google e tente novamente.');
                                    }
                                    throw new Error(data?.error || 'Falha ao excluir');
                                }
                                window.location.href = '/library';
                            } catch (e) {
                                const msg = (e as Error).message;
                                setErrors(prev => ({ ...prev, submit: msg }));
                                const id = Math.random().toString(36).slice(2);
                                setToasts((t) => [...t, { id, message: msg }]);
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                        disabled={submitting || deleteTitle !== book.title || (!isGoogleOnly && !deletePassword)}
                        className="px-4 py-2 rounded-full text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Excluir
                    </button>
                </div>
            </Modal>
        </>
    );
}
