"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import VolumeCreateInput from '@/components/volume/VolumeCreateInput';
import VolumeDropdown from '@/components/volume/VolumeDropdown';
import ChapterEditor from '@/app/library/books/[slug]/[chapter]/edit-chapter/ui/ChapterEditor';
import { X, BookText, Trash2 } from 'lucide-react';
import ButtonWithIcon from '@/components/ui/button/ButtonWithIcon';
import Modal from '@/components/ui/modal/Modal';
import type { Volume } from '@/types/volume';
import { slugify } from '@/lib/slug';
import { getPlainTextLength } from '@/lib/sanitize';

type InitialChapter = { id: string; title: string; content: string; volumeId: string | null };

export default function EditChapterClient({ slug, bookTitle, initialChapter }: { slug: string; bookTitle: string; initialChapter: InitialChapter }) {
  const router = useRouter();

  // Volumes data for dropdown and modals
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [confirmDeleteVolumeId, setConfirmDeleteVolumeId] = useState<string | null>(null);

  // Prefilled fields
  const TITLE_MAX = 200;
  const [chapterTitle, setChapterTitle] = useState<string>(initialChapter.title || '');
  const [content, setContent] = useState<string>(initialChapter.content || '');
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>(initialChapter.volumeId || '');

  // Baseline (last saved) snapshot used to detect changes
  const [baselineTitle, setBaselineTitle] = useState<string>((initialChapter.title || '').trim());
  const [baselineContent, setBaselineContent] = useState<string>((initialChapter.content || '').trim());
  const [baselineVolumeId, setBaselineVolumeId] = useState<string>(initialChapter.volumeId || '');

  // Validation/show flags (same behavior as create)
  const [showValidation, setShowValidation] = useState(false);
  const [volumeTouched, setVolumeTouched] = useState(!!initialChapter.volumeId || initialChapter.volumeId === null);
  const [emptyExplicit, setEmptyExplicit] = useState(initialChapter.volumeId === null);
  const computedVolumeError = showValidation && (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit));
  const computedTitleError = showValidation && chapterTitle.trim() === '';
  const visibleLen = getPlainTextLength(content || '');
  const computedContentError = showValidation && visibleLen === 0;

  const [shakeVol, setShakeVol] = useState(false);
  const [shakeTitle, setShakeTitle] = useState(false);
  const [shakeContent, setShakeContent] = useState(false);

  const volRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteChapterOpen, setConfirmDeleteChapterOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // Load volumes list for the book
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/books/${slug}/volumes`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao carregar volumes');
        const data = await res.json();
        if (mounted) setVolumes(data.volumes || []);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug]);

  async function addVolume() {
    const title = newVolumeTitle.trim();
    if (!title) return;
    const prev = volumes;
    setNewVolumeTitle('');
    try {
      const res = await fetch(`/api/books/${slug}/volumes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
      if (!res.ok) throw new Error('Erro ao criar volume');
      const data = await res.json();
      setVolumes([...prev, data.volume]);
    } catch (e) {
      console.error(e);
      setVolumes(prev);
    }
  }

  async function saveVolumeEditProxy(id: string, title: string) {
    const res = await fetch(`/api/books/${slug}/volumes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    if (!res.ok) throw new Error('Erro ao renomear volume');
    const data = await res.json();
    setVolumes((vs) => vs.map((v) => (v.id === id ? data.volume : v)));
  }

  async function deleteVolume(id: string) {
    try {
      const res = await fetch(`/api/books/${slug}/volumes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir volume');
      setVolumes((vs) => vs.filter((v) => v.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmDeleteVolumeId(null);
    }
  }

  async function submitUpdate() {
    setError(null);
    setShowValidation(true);
    const title = chapterTitle.trim();
  const html = content.trim();
  const visibleLength = getPlainTextLength(html);
    const volInvalid = (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit));
    const titleInvalid = title === '';
  const contentInvalid = visibleLength === 0;

    if (volInvalid) { setShakeVol(true); setTimeout(() => setShakeVol(false), 350); }
    if (titleInvalid) { setShakeTitle(true); setTimeout(() => setShakeTitle(false), 350); }
    if (contentInvalid) { setShakeContent(true); setTimeout(() => setShakeContent(false), 350); }

    if (volInvalid) {
      setVolumeTouched(true);
      setTimeout(() => {
        volRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const btn = volRef.current?.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement | null;
        btn?.focus();
      }, 0);
      return;
    }
    if (titleInvalid) {
      setTimeout(() => { titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); titleRef.current?.focus(); }, 0);
      return;
    }
    if (contentInvalid) {
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const el = editorRef.current?.querySelector('[contenteditable="true"], textarea, input') as HTMLElement | null;
        el?.focus();
      }, 0);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/books/${slug}/chapters/${initialChapter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: html, volumeId: selectedVolumeId || null })
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('Você não tem permissão para editar capítulos nesta obra.'); return; }
      if (res.status === 409) { setError('Já existe um capítulo com este título nesta obra.'); return; }
  if (!res.ok) throw new Error('Falha ao atualizar capítulo');
  // Persist the new "baseline" (last saved snapshot) and show success modal
  setBaselineTitle(title);
  setBaselineContent(html);
  setBaselineVolumeId(selectedVolumeId || '');
  setSuccessOpen(true);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao salvar as alterações.');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteChapter() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/books/${slug}/chapters/${initialChapter.id}`, { method: 'DELETE' });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('Você não tem permissão para excluir este capítulo.'); return; }
      if (!res.ok) throw new Error('Falha ao excluir capítulo');
      router.push(`/library/books/${slug}`);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao excluir o capítulo.');
    } finally {
      setSubmitting(false);
      setConfirmDeleteChapterOpen(false);
    }
  }

  return (
    <>
      <div className="pb-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white text-center font-ptserif text-xl mb-3">Editar “{chapterTitle || initialChapter.title}” em “{bookTitle}”</h2>
          <div className="bg-readowl-purple-extralight text-readowl-purple-extradark p-5 shadow-md font-ptserif">
            <h1 className="text-2xl font-bold text-center mb-4">{bookTitle}</h1>

            {/* Create volume input */}
            <div className="mb-3">
              <VolumeCreateInput value={newVolumeTitle} onChange={setNewVolumeTitle} onSubmit={addVolume} />
            </div>
            {/* Volume selection */}
            <div className="mb-4" ref={volRef}>
              <VolumeDropdown
                ref={volRef as React.Ref<HTMLDivElement>}
                volumes={volumes}
                selectedId={selectedVolumeId}
                onSelect={(id) => { setSelectedVolumeId(id); setVolumeTouched(true); setEmptyExplicit(id === ''); }}
                onEdit={saveVolumeEditProxy}
                onDelete={(id) => setConfirmDeleteVolumeId(id)}
                error={computedVolumeError}
                forceOpen={computedVolumeError}
                shake={shakeVol}
              />
              {computedVolumeError && (
                <p className="mt-1 text-sm text-red-600">Escolha um volume (se desejar a não atribuição de um, escolha &quot;Sem volume&quot;).</p>
              )}
            </div>
            {/* Title input */}
            <div className="mb-3 relative">
              <input
                placeholder="Título do capítulo..."
                value={chapterTitle.slice(0, TITLE_MAX)}
                maxLength={TITLE_MAX}
                onChange={(e) => setChapterTitle(e.target.value.slice(0, TITLE_MAX))}
                ref={titleRef}
                className={`w-full bg-readowl-purple-extralight text-readowl-purple-extradark pl-1 pr-20 py-2 text-3xl font-bold placeholder-readowl-purple-extradark/60 focus:outline-none focus:ring-0 border-2 ${computedTitleError ? 'border-red-600' : 'border-transparent'} ${shakeTitle ? 'animate-shake' : ''}`}
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-readowl-purple-extradark/60" aria-live="polite">
                {chapterTitle.length}/{TITLE_MAX}
              </div>
              {computedTitleError && (
                <p className="mt-1 text-sm text-red-600">Informe o título do capítulo.</p>
              )}
            </div>
            {/* Chapter editor */}
            <div className="mb-4" ref={editorRef}>
              <div className={`border-2 ${computedContentError ? 'border-red-600' : 'border-transparent'} ${shakeContent ? 'animate-shake' : ''}`}>
                <ChapterEditor value={content} onChange={setContent} maxChars={50000} />
              </div>
              {computedContentError && (
                <p className="mt-1 text-sm text-red-600">Escreva o conteúdo do capítulo.</p>
              )}
            </div>

            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
            <div className="flex items-center justify-center gap-6">
              <ButtonWithIcon variant="secondary" onClick={() => {
                // Skip modal if user didn't change anything
                const dirty = (
                  chapterTitle.trim() !== baselineTitle ||
                  content.trim() !== baselineContent ||
                  (selectedVolumeId || '') !== baselineVolumeId
                );
                if (!dirty) {
                  router.push(`/library/books/${slug}`);
                } else {
                  setConfirmCancelOpen(true);
                }
              }} icon={<X className="w-5 h-5" />}>Cancelar</ButtonWithIcon>
              <ButtonWithIcon
                variant="primary"
                disabled={(() => {
                  if (submitting) return true;
                  const title = chapterTitle.trim();
                  const html = content.trim();
                  const invalid = (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit)) || title === '' || html === '';
                  if (invalid) return true;
                  const dirty = (
                    title !== baselineTitle ||
                    html !== baselineContent ||
                    (selectedVolumeId || '') !== baselineVolumeId
                  );
                  return !dirty;
                })()}
                onClick={() => {
                  setShowValidation(true);
                  const title = chapterTitle.trim();
                  const html = content.trim();
                  const volInvalid = (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit));
                  const titleInvalid = title === '';
                  const contentInvalid = html === '';
                  if (volInvalid) { setShakeVol(true); setTimeout(() => setShakeVol(false), 350); }
                  if (titleInvalid) { setShakeTitle(true); setTimeout(() => setShakeTitle(false), 350); }
                  if (contentInvalid) { setShakeContent(true); setTimeout(() => setShakeContent(false), 350); }
                  if (volInvalid || titleInvalid || contentInvalid) return;
                  // Disable save if nothing changed
                  const dirty = (
                    title !== baselineTitle ||
                    html !== baselineContent ||
                    (selectedVolumeId || '') !== baselineVolumeId
                  );
                  if (!dirty) return;
                  setConfirmSaveOpen(true);
                }}
                icon={<BookText className="w-5 h-5" />}
              >{submitting ? 'Salvando...' : 'Salvar alterações'}</ButtonWithIcon>
            </div>
          </div>
            {/* Delete chapter button (same style as Delete book) */}
            <div className="w-full max-w-6xl mx-auto mt-4 flex justify-center">
              <ButtonWithIcon
                className="!bg-red-700 !text-white !border-red-900 hover:!bg-red-600"
                variant="secondary"
                icon={<Trash2 className="w-5 h-5" />}
                iconAlt="Excluir capítulo"
                onClick={() => setConfirmDeleteChapterOpen(true)}
              >
                Excluir capítulo
              </ButtonWithIcon>
            </div>
          {/* Delete volume modal (same as in create flow) */}
          <Modal
            open={!!confirmDeleteVolumeId}
            onClose={() => setConfirmDeleteVolumeId(null)}
            title="Excluir volume"
            actions={
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteVolumeId(null)} className="px-3 py-1 border border-readowl-purple/30">Cancelar</button>
                <button onClick={() => confirmDeleteVolumeId && deleteVolume(confirmDeleteVolumeId)} className="px-3 py-1 bg-red-600 text-white border-2 border-red-700">Excluir</button>
              </div>
            }
          >
            <p>Ao excluir o volume, os capítulos dentro dele não serão apagados. Eles ficarão sem volume.</p>
            <p>Tem certeza que deseja continuar?</p>
          </Modal>
          {/* Confirm cancel editing */}
          <Modal open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} title="Cancelar edição do capítulo?" widthClass="max-w-sm" >
            <p>Você perderá alterações não salvas deste capítulo.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setConfirmCancelOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
              <a href={`/library/books/${slug}`} className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600">Descartar</a>
            </div>
          </Modal>
          {/* Confirm save */}
          <Modal open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} title="Confirmar alterações" widthClass="max-w-sm" >
            <p>Deseja salvar as alterações deste capítulo?</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setConfirmSaveOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
              <button disabled={submitting} onClick={() => { setConfirmSaveOpen(false); submitUpdate(); }} className="px-4 py-2 text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </Modal>
          {/* Post-save success */}
          <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Capítulo atualizado!" widthClass="max-w-sm">
            <p>As alterações foram salvas.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setSuccessOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Continuar editando</button>
              <a href={`/library/books/${slug}/${slugify(chapterTitle.trim() || baselineTitle)}`} className="px-4 py-2 text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple">Ir para o capítulo</a>
            </div>
          </Modal>
          {/* Confirm delete chapter */}
          <Modal open={confirmDeleteChapterOpen} onClose={() => setConfirmDeleteChapterOpen(false)} title="Excluir capítulo" widthClass="max-w-sm">
            <p>Tem certeza que deseja excluir este capítulo? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setConfirmDeleteChapterOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Cancelar</button>
              <button disabled={submitting} onClick={deleteChapter} className="px-4 py-2 text-sm bg-red-600 text-white border-2 border-red-700 disabled:opacity-60 disabled:cursor-not-allowed">Excluir</button>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}
