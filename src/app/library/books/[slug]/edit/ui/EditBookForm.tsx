"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/modal/Modal';
import ButtonWithIcon from '@/components/ui/button/ButtonWithIcon';
import { BOOK_GENRES_MASTER, BOOK_COVER_RATIO, BOOK_COVER_RATIO_TOLERANCE, BOOK_STATUS, updateBookSchema, BOOK_COVER_MIN_WIDTH, BOOK_COVER_MIN_HEIGHT } from '@/types/book';
import { slugify } from '@/lib/slug';
import { signIn } from 'next-auth/react';
import CoverAndStatus from './CoverAndStatus';
import BasicFieldsEdit from './BasicFieldsEdit';
import GenreSelectorEdit from './GenreSelectorEdit';
import { BookText, X, Check, BookX } from 'lucide-react';

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
                body: JSON.stringify({ title: title.trim(), synopsis: synopsis, releaseFrequency: releaseFrequency.trim() || undefined, coverUrl: coverUrl.trim(), status, genres: selectedGenres }),
            });
            if (!res.ok) throw new Error('Falha ao atualizar livro');
            setConfirmSaveOpen(false);
            setSuccessOpen(true);
        } catch (e) {
            setErrors(prev => ({ ...prev, submit: (e as Error).message }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="w-full max-w-6xl mx-auto bg-readowl-purple-medium p-8 shadow-2xl">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <BookText className="w-10 h-10 text-white/90" />
                    <h1 className="text-3xl font-ptserif text-center font-semibold text-white">Editar obra: {book.title}</h1>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <CoverAndStatus
                        coverUrl={coverUrl}
                        coverValid={coverValid}
                        coverLoading={coverLoading}
                        errors={{ coverUrl: errors.coverUrl }}
                        touched={touched.cover}
                        attemptedSubmit={attemptedSubmit}
                        onChange={(v) => setCoverUrl(v)}
                        onBlur={() => setTouched(t => ({ ...t, cover: true }))}
                        onHelp={() => setHelpOpen(true)}
                        status={status}
                        onStatus={(s) => setStatus(s)}
                    />

                    <BasicFieldsEdit
                        title={title}
                        synopsis={synopsis}
                        releaseFrequency={releaseFrequency}
                        errors={{ title: errors.title, synopsis: errors.synopsis, releaseFrequency: errors.releaseFrequency }}
                        touched={{ title: touched.title, synopsis: touched.synopsis, frequency: touched.frequency }}
                        attemptedSubmit={attemptedSubmit}
                        onTitle={(v) => setTitle(v)}
                        onSynopsis={(v) => setSynopsis(v)}
                        onFrequency={(v) => setReleaseFrequency(v)}
                        onBlurTitle={() => setTouched(t => ({ ...t, title: true }))}
                        onBlurSynopsis={() => setTouched(t => ({ ...t, synopsis: true }))}
                        onBlurFrequency={() => setTouched(t => ({ ...t, frequency: true }))}
                    />
                </div>

                {/* Genres */}
                <GenreSelectorEdit
                    filteredGenres={filteredGenres}
                    genreFilter={genreFilter}
                    onFilter={(v) => setGenreFilter(v)}
                    selectedGenres={selectedGenres}
                    toggleGenre={toggleGenre}
                    error={errors.genres}
                />

                {errors.submit && <p className="text-sm text-red-300 mt-6 text-center">{errors.submit}</p>}

                <div className="mt-4 flex items-center justify-center gap-6">
                    <ButtonWithIcon
                        variant="secondary"
                        onClick={() => (changed ? setConfirmCancelOpen(true) : (window.location.href = `/library/books/${encodeURIComponent(slugify(baseline.title))}`))}
                        icon={<X className="w-5 h-5" />}
                    >
                        Cancelar
                    </ButtonWithIcon>
                    <ButtonWithIcon variant="primary" disabled={!canSubmit || submitting} onClick={() => setConfirmSaveOpen(true)} icon={<Check className="w-5 h-5" />}>{submitting ? 'Salvando...' : 'Salvar'}</ButtonWithIcon>
                </div>

                {/* Modals */}
                <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Como adicionar a capa" widthClass="max-w-lg">
                    <p>Para adicionar a capa, hospede sua imagem e cole a URL aqui. A imagem deve ter mínimo {BOOK_COVER_MIN_WIDTH}x{BOOK_COVER_MIN_HEIGHT} e proporção 3:4.</p>
                </Modal>

                <Modal open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} title="Descartar alterações?" widthClass="max-w-sm">
                    <p>Suas alterações serão perdidas.</p>
                    <div className="flex gap-3 justify-end mt-6">
                        <button onClick={() => setConfirmCancelOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
                        <a href={`/library/books/${encodeURIComponent(slug)}`} className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600">Descartar</a>
                    </div>
                </Modal>

                <Modal open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} title="Confirmar atualização" widthClass="max-w-sm">
                    <p>Deseja salvar as alterações?</p>
                    <div className="flex gap-3 justify-end mt-6">
                        <button onClick={() => setConfirmSaveOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
                        <button disabled={submitting} onClick={onSubmit} className="px-4 py-2 text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Salvando...' : 'Confirmar'}</button>
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
                            className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight"
                        >
                            Continuar editando
                        </button>
                        <button onClick={() => { setSuccessOpen(false); window.location.href = `/library/books/${encodeURIComponent(slugify(title))}`; }} className="px-4 py-2 text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple">Voltar ao índice</button>
                    </div>
                </Modal>
            </div>

            {/* Notifications removed for edit flow as requested */}

            {/* Danger zone - delete button below purple card */}
            <div className="w-full max-w-6xl mx-auto mt-4 flex justify-center">
                <ButtonWithIcon
                    className="!bg-red-700 !text-white !border-red-900 hover:!bg-red-600"
                    variant="secondary"
                    icon={<BookX className="w-5 h-5" />}
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
                            className="mt-1 w-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50"
                        />
                    </div>
                    {!isGoogleOnly ? (
                        <div>
                            <label className="text-xs text-white/80">Sua senha</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="mt-1 w-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50"
                            />
                        </div>
                    ) : (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => signIn('google', { callbackUrl: window.location.href, prompt: 'login' })}
                                className="w-full flex items-center justify-center gap-2 bg-white text-readowl-purple font-semibold py-2 px-4 border border-gray-300 hover:bg-gray-100 transition"
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
                    <button onClick={() => setConfirmDeleteOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Cancelar</button>
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
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                        disabled={submitting || deleteTitle !== book.title || (!isGoogleOnly && !deletePassword)}
                        className="px-4 py-2 text-sm bg-red-700 text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        Excluir
                    </button>
                </div>
            </Modal>
        </>
    );
}
