'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Modal from './Modal';
import ButtonWithIcon from './ButtonWithIcon';
import { createBookSchema, BOOK_TITLE_MAX, BOOK_SYNOPSIS_MAX, BOOK_FREQ_MAX, BOOK_GENRES_MASTER, BOOK_COVER_MIN_WIDTH, BOOK_COVER_MIN_HEIGHT, BOOK_COVER_RATIO, BOOK_COVER_RATIO_TOLERANCE } from '@/types/book';

interface CreateBookFormProps {
    availableGenres?: string[]; // optional preset list; can be empty to allow on-the-fly create
    redirectAfter?: string; // path to redirect after success
}


interface ValidationErrors {
    title?: string;
    synopsis?: string;
    coverUrl?: string;
    genres?: string;
    releaseFrequency?: string;
    submit?: string;
}

// Lista oficial de gêneros (origem centralizada em /types/book)
const defaultGenres = [...BOOK_GENRES_MASTER].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const aspectTolerance = BOOK_COVER_RATIO_TOLERANCE;
const expectedRatio = BOOK_COVER_RATIO; // 0.75

export default function CreateBookForm({ availableGenres, redirectAfter = '/library' }: CreateBookFormProps) {
    const [title, setTitle] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [releaseFrequency, setReleaseFrequency] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [coverValid, setCoverValid] = useState<boolean | null>(null); // null => untouched
    const [coverLoading, setCoverLoading] = useState(false);
    const [genreFilter, setGenreFilter] = useState('');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [errors, setErrors] = useState<ValidationErrors>({});
    // touched controls to avoid early error animation
    const [touchedTitle, setTouchedTitle] = useState(false);
    const [touchedSynopsis, setTouchedSynopsis] = useState(false);
    const [touchedFrequency, setTouchedFrequency] = useState(false);
    const [touchedCover, setTouchedCover] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const genres = useMemo(() => (availableGenres && availableGenres.length > 0 ? availableGenres : defaultGenres), [availableGenres]);

    const filteredGenres = useMemo(
        () => genres.filter(g => g.toLowerCase().includes(genreFilter.toLowerCase())),
        [genreFilter, genres]
    );

    const toggleGenre = (g: string) => {
        setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    };

    // Cover Preview Validation
    useEffect(() => {
        if (!coverUrl) { setCoverValid(null); return; }
        let cancelled = false;
        setCoverLoading(true);
        // Usa window.Image para evitar problemas de SSR e fornece tipagem ampla
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
    }, [coverUrl]);

    const validate = useCallback((): ValidationErrors => {
        const v: ValidationErrors = {};
        // Base schema validation (ignora cover ratio - tratamos manualmente)
        const parsed = createBookSchema.safeParse({
            title: title.trim(),
            synopsis: synopsis.trim(),
            releaseFrequency: releaseFrequency.trim() || undefined,
            coverUrl: coverUrl.trim() || undefined,
            genres: selectedGenres
        });
        if (!parsed.success) {
            const issues = parsed.error.issues;
            for (const issue of issues) {
                const path = issue.path[0];
                if (!path) continue;
                switch (path) {
                    case 'title': v.title = issue.message; break;
                    case 'synopsis': v.synopsis = issue.message; break;
                    case 'releaseFrequency': v.releaseFrequency = issue.message; break;
                    case 'coverUrl': v.coverUrl = issue.message; break;
                    case 'genres': v.genres = issue.message; break;
                }
            }
        }
        // Cover specific async dimension validation messages override generic ones
        if (!coverUrl.trim()) {
            v.coverUrl = 'É necessário uma URL da capa.';
        } else if (coverValid === false) {
            v.coverUrl = `A proporção ou tamanho é inválido (mínimo ${BOOK_COVER_MIN_WIDTH}x${BOOK_COVER_MIN_HEIGHT}, proporção 3:4).`;
        } else if (coverValid !== true) {
            v.coverUrl = 'Validando capa, aguarde...';
        }
        return v;
    }, [title, synopsis, releaseFrequency, coverUrl, coverValid, selectedGenres]);

    useEffect(() => {
        // Atualiza erros mas evita animação automática (shake) antes de interação
        setErrors(validate());
    }, [title, synopsis, releaseFrequency, coverUrl, coverValid, selectedGenres, validate]);

    const canSubmit = Object.keys(errors).length === 0 && !!title.trim() && !!synopsis.trim() && selectedGenres.length > 0 && coverValid === true;

    const handleSubmit = async () => {
        setAttemptedSubmit(true);
        setConfirmSaveOpen(false);
        const v = validate();
        setErrors(v);
        if (Object.keys(v).length) return;

        try {
            setSubmitting(true);
            const res = await fetch('/api/books/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    synopsis: synopsis.trim(),
                    releaseFrequency: releaseFrequency.trim() || undefined,
                    coverUrl: coverUrl || undefined,
                    genres: selectedGenres,
                })
            });
            if (!res.ok) throw new Error('Falha ao criar livro');
            setSuccessModal(true);
        } catch (e) {
            setErrors(prev => ({ ...prev, submit: (e as Error).message }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto bg-readowl-purple rounded-3xl p-8 shadow-2xl mt-10">
            <h1 className="text-3xl font-yusei text-center mb-8 text-white">Cadastrar Novo Livro</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Cover */}
                <div>
                    <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                        <Image src="/img/svg/library/book1.svg" alt="Capa" width={18} height={18} className="opacity-80" />
                        URL da Capa
                        <button type="button" aria-label="Ajuda capa" onClick={() => setHelpOpen(true)} className="w-5 h-5 rounded-full bg-readowl-purple-dark text-white text-xs flex items-center justify-center">?</button>
                    </label>
                    <div className={`relative w-full aspect-[2/3] rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden text-center text-readowl-purple-dark bg-white ${coverValid === false ? 'border-red-400' : 'border-none'}`}>
                        {coverUrl && coverValid !== null && !coverLoading ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={coverUrl} alt="Preview capa" className="object-cover w-full h-full" />
                        ) : (
                            <span className="text-xs opacity-70 select-none px-4">Insira a URL da imagem para ver a capa aqui (proporção 3:4, mín {BOOK_COVER_MIN_WIDTH}x{BOOK_COVER_MIN_HEIGHT})</span>
                        )}
                        {coverLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-readowl-purple font-semibold text-sm">Carregando...</div>}
                    </div>
                    <input
                        type="url"
                        placeholder="https://..."
                        value={coverUrl}
                        onChange={e => setCoverUrl(e.target.value.trim())}
                        onBlur={() => setTouchedCover(true)}
                        className="mt-2 w-full rounded-full bg-white focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50"
                    />
                    {errors.coverUrl && (touchedCover || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.coverUrl}</p>}
                </div>

                {/* Middle: Basic Fields */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Image src="/img/svg/book/titlecase.svg" alt="Título" width={18} height={18} className="opacity-80" />
                            Título
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={title}
                                maxLength={BOOK_TITLE_MAX}
                                onChange={e => setTitle(e.target.value)}
                                onBlur={() => setTouchedTitle(true)}
                                className={`w-full rounded-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.title && (touchedTitle || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
                                placeholder="Título da obra"
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-white/80">
                            {errors.title && (touchedTitle || attemptedSubmit) ? <span className="text-red-300">{errors.title}</span> : <span />}
                            <span>{title.length}/{BOOK_TITLE_MAX}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Image src="/img/svg/book/text.svg" alt="Sinopse" width={18} height={18} className="opacity-80" />
                            Sinopse
                        </label>
                        <div className="relative">
                            <textarea
                                value={synopsis}
                                maxLength={BOOK_SYNOPSIS_MAX}
                                onChange={e => setSynopsis(e.target.value)}
                                onBlur={() => setTouchedSynopsis(true)}
                                className={`w-full rounded-2xl bg-white border-2 pl-4 pr-4 py-3 h-80 resize-none focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 leading-relaxed transition ${errors.synopsis && (touchedSynopsis || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
                                placeholder="Descreva brevemente a história..."
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-white/80">
                            {errors.synopsis && (touchedSynopsis || attemptedSubmit) ? <span className="text-red-300">{errors.synopsis}</span> : <span />}
                            <span>{synopsis.length}/{BOOK_SYNOPSIS_MAX}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                            <Image src="/img/svg/book/date.svg" alt="Frequência" width={18} height={18} className="opacity-80" />
                            Frequência de Lançamento (opcional)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={releaseFrequency}
                                maxLength={BOOK_FREQ_MAX}
                                onChange={e => setReleaseFrequency(e.target.value)}
                                onBlur={() => setTouchedFrequency(true)}
                                className={`w-full rounded-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.releaseFrequency && (touchedFrequency || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
                                placeholder="Ex: 1 capítulo por semana."
                            />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-white/80">
                            {errors.releaseFrequency && (touchedFrequency || attemptedSubmit) ? <span className="text-red-300">{errors.releaseFrequency}</span> : <span />}
                            <span>{releaseFrequency.length}/{BOOK_FREQ_MAX}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Genres */}
            <div className="lg:col-span-3 w-full">
                <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                    <Image src="/img/svg/book/label.svg" alt="Gêneros" width={18} height={18} className="opacity-80" />
                    Gêneros
                </label>
                <div className="w-full bg-readowl-purple-extradark/70 rounded-xl border border-white/10 p-3 max-h-48 overflow-y-auto">
                    <div className="relative">
                        <input
                            type="text"
                            value={genreFilter}
                            onChange={e => setGenreFilter(e.target.value)}
                            placeholder="Buscar gênero..."
                            className="w-full rounded-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark pl-4 pr-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50 mb-3"
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {filteredGenres.map(g => {
                            const id = `genre-${g}`;
                            const checked = selectedGenres.includes(g);
                            return (
                                <label key={g} htmlFor={id} className={`flex items-center justify-center px-2 py-1 rounded-md cursor-pointer text-[11px] font-medium select-none transition border border-white/10 whitespace-pre-line text-center leading-tight min-h-[34px] ${checked ? 'bg-readowl-purple-extradark text-white ring-2 ring-white/30' : 'bg-readowl-purple-light text-white/90 hover:bg-readowl-purple-dark'}`}>
                                    <input
                                        id={id}
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleGenre(g)}
                                        className="hidden"
                                    />
                                    {g}
                                </label>
                            );
                        })}
                        {filteredGenres.length === 0 && (<span className="text-xs text-white/80 col-span-full">Nenhum gênero encontrado</span>)}
                    </div>
                </div>
                {errors.genres && <p className="text-xs text-red-300 mt-1">{errors.genres}</p>}
            </div>

            {errors.submit && <p className="text-sm text-red-300 mt-6 text-center">{errors.submit}</p>}

            <div className="mt-4 flex items-center justify-center gap-6">
                <ButtonWithIcon
                    variant="secondary"
                    onClick={() => setConfirmCancelOpen(true)}
                    iconUrl="/img/svg/generics/cancel2.svg"
                >Cancelar</ButtonWithIcon>
                <ButtonWithIcon
                    variant="primary"
                    disabled={!canSubmit || submitting}
                    onClick={() => setConfirmSaveOpen(true)}
                    iconUrl="/img/svg/book/checkbook.svg"
                >{submitting ? 'Salvando...' : 'Registrar'}</ButtonWithIcon>
            </div>

            {/* Help Modal */}
            <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Como adicionar a capa" widthClass="max-w-lg">
                <p>Para adicionar a capa, hospede sua imagem em um site como <strong>imgur.com</strong>, clique com o botão direito na imagem, selecione <em>Copiar endereço da imagem</em> e cole o link no campo. A imagem deve ter <strong>mínimo {BOOK_COVER_MIN_WIDTH}px de largura por {BOOK_COVER_MIN_HEIGHT}px de altura</strong> e proporção aproximada de 3:4.</p>
                <p>Dica: Use imagens em formato JPG ou PNG otimizadas.</p>
            </Modal>

            {/* Confirm Cancel */}
            <Modal open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} title="Cancelar criação do livro?" widthClass="max-w-sm" >
                <p>Você perderá todos os dados preenchidos.</p>
                <div className="flex gap-3 justify-end mt-6">
                    <button onClick={() => setConfirmCancelOpen(false)} className="px-4 py-2 rounded-full text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
                    <a href={redirectAfter} className="px-4 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600">Descartar</a>
                </div>
            </Modal>

            {/* Confirm Save */}
            <Modal open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} title="Confirmar registro" widthClass="max-w-sm" >
                <p>Deseja salvar este novo livro?</p>
                <div className="flex gap-3 justify-end mt-6">
                    <button onClick={() => setConfirmSaveOpen(false)} className="px-4 py-2 rounded-full text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
                    <button disabled={submitting} onClick={handleSubmit} className="px-4 py-2 rounded-full text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Salvando...' : 'Confirmar'}</button>
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal open={successModal} onClose={() => { setSuccessModal(false); window.location.href = redirectAfter; }} title="Livro criado!" widthClass="max-w-sm" >
                <p>Seu livro foi criado com sucesso.</p>
                <div className="flex justify-end mt-6">
                    <button onClick={() => { setSuccessModal(false); window.location.href = redirectAfter; }} className="px-4 py-2 rounded-full text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple">Ir para biblioteca</button>
                </div>
            </Modal>
        </div>
    );
}
