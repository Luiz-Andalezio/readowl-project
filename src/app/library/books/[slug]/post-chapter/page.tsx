"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Modal from '@/components/ui/modal/Modal';
import ButtonWithIcon from '@/components/ui/button/ButtonWithIcon';
import ChapterEditor from '@/app/library/books/[slug]/[chapter]/edit-chapter/ui/ChapterEditor';
import VolumeCreateInput from '@/components/volume/VolumeCreateInput';
import VolumeDropdown from '@/components/volume/VolumeDropdown';
import type { Volume } from '@/types/volume';
import { Breadcrumb } from '@/components/ui/navbar/Breadcrumb';
import { slugify } from '@/lib/slug';
import { getPlainTextLength } from '@/lib/sanitize';
import { X, BookText } from 'lucide-react';

export default function PostChapterPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const router = useRouter();

  // Local state
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  // volume inline editing handled inside VolumeDropdown
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [chapterTitle, setChapterTitle] = useState('');
  const TITLE_MAX = 200;
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
  // Load volumes
        const res = await fetch(`/api/books/${slug}/volumes`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao carregar volumes');
        const data = await res.json();
        if (mounted) setVolumes(data.volumes || []);
  // Load book title for header
        const rb = await fetch(`/api/books/${slug}`, { cache: 'no-store' });
        if (rb.ok) {
          const jb = await rb.json();
          if (mounted && jb?.book?.title) setBookTitle(jb.book.title);
        }
      } catch (e) {
        console.error(e);
      } finally {
        // no-op
      }
    }
    if (slug) load();
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

  // Inline rename proxy used by dropdown component

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
      setConfirmDeleteId(null);
    }
  }

  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  // Track if user explicitly chose a volume; required even for "Sem volume"
  const [volumeTouched, setVolumeTouched] = useState(false);
  // Maintain explicit selection state; default false until any selection occurs
  const [emptyExplicit, setEmptyExplicit] = useState(false);
  // Show validation styles only after user tries to submit
  const [showValidation, setShowValidation] = useState(false);
  // computed error flags
  const computedVolumeError = showValidation && ( !volumeTouched || (selectedVolumeId === '' && !emptyExplicit) );
  const computedTitleError = showValidation && chapterTitle.trim() === '';
  const visibleLen = getPlainTextLength(content || '');
  const computedContentError = showValidation && visibleLen === 0;

  // shake flags (one-time pulse when we validate)
  const [shakeVol, setShakeVol] = useState(false);
  const [shakeTitle, setShakeTitle] = useState(false);
  const [shakeContent, setShakeContent] = useState(false);

  // refs for focusing/scrolling invalid controls
  const volRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  const pristine = chapterTitle.trim() === '' && visibleLen === 0 && !volumeTouched;

  async function submitChapter() {
    setError(null);
    // enable validation UI
    setShowValidation(true);
    // compute current values
    const title = chapterTitle.trim();
  const html = content.trim();
  const visibleLength = getPlainTextLength(html);

    const volInvalid = (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit));
    const titleInvalid = title === '';
  const contentInvalid = visibleLength === 0;

    // trigger shakes when invalid
    if (volInvalid) { setShakeVol(true); setTimeout(() => setShakeVol(false), 350); }
    if (titleInvalid) { setShakeTitle(true); setTimeout(() => setShakeTitle(false), 350); }
    if (contentInvalid) { setShakeContent(true); setTimeout(() => setShakeContent(false), 350); }

    // focus first invalid
    if (volInvalid) {
      setVolumeTouched(true);
      setConfirmSaveOpen(false);
      setTimeout(() => {
        volRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const btn = volRef.current?.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement | null;
        btn?.focus();
      }, 0);
      return;
    }
    if (titleInvalid) {
      setTimeout(() => {
        titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleRef.current?.focus();
      }, 0);
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
      const res = await fetch(`/api/books/${slug}/chapters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content: html, volumeId: selectedVolumeId || null }) });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('Você não tem permissão para publicar capítulos nesta obra.'); return; }
      if (res.status === 409) { setError('Já existe um capítulo com este título nesta obra.'); return; }
      if (!res.ok) throw new Error('Falha ao criar capítulo');
      // Success: show success modal with next actions
      setSuccessOpen(true);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao criar o capítulo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Breadcrumb with top offset so content doesn't sit under the fixed navbar */}
      <div className="w-full flex justify-center mt-14 sm:mt-16">
        <Breadcrumb
          anchor="static"
          items={[
            { label: 'Início', href: '/home' },
            { label: 'Biblioteca', href: '/library' },
            { label: 'Livros', href: '/library' },
            { label: bookTitle || decodeURIComponent(slug).replace(/-/g, ' '), href: `/library/books/${slug}` },
            { label: 'Adicionar capítulo' }
          ]}
        />
      </div>

      <div className="pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Header text exactly as requested */}
          <h2 className="text-white text-center font-ptserif text-xl mb-3">Adicionar capítulo em: “{bookTitle || decodeURIComponent(slug).replace(/-/g, ' ')}”</h2>
          <div className="bg-readowl-purple-extralight text-readowl-purple-extradark p-5 shadow-md font-ptserif">
            <h1 className="text-2xl font-bold text-center mb-4">{bookTitle || decodeURIComponent(slug).replace(/-/g, ' ')}</h1>

            {/* Volume create input with inline send */}
            <div className="mb-3">
              <VolumeCreateInput value={newVolumeTitle} onChange={setNewVolumeTitle} onSubmit={addVolume} />
            </div>

            {/* Volume dropdown styled as card list with validation */}
            <div className="mb-4" ref={volRef}>
              <VolumeDropdown
                ref={volRef as React.Ref<HTMLDivElement>}
                volumes={volumes}
                selectedId={selectedVolumeId}
                onSelect={(id) => {
                  setSelectedVolumeId(id);
                  setVolumeTouched(true);
                  setEmptyExplicit(id === '');
                }}
                onEdit={async (id, title) => { await saveVolumeEditProxy(id, title); }}
                onDelete={(id) => setConfirmDeleteId(id)}
                error={computedVolumeError}
                forceOpen={computedVolumeError}
                shake={shakeVol}
              />
              {computedVolumeError && (
                <p className="mt-1 text-sm text-red-600">Escolha um volume (se desejar a não atribuição de um, escolha &quot;Sem volume&quot;).</p>
              )}
            </div>

            {/* Chapter title with counter inside the input (right-aligned) and validation */}
            <div className="mb-3 relative">
              <input
                placeholder="Título do capítulo..."
                value={chapterTitle.slice(0, TITLE_MAX)}
                maxLength={TITLE_MAX}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChapterTitle(e.target.value.slice(0, TITLE_MAX))}
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
              <ButtonWithIcon
                variant="secondary"
                onClick={() => {
                  // Skip modal if pristine (nothing entered)
                  if (pristine) {
                    router.push(`/library/books/${slug}`);
                  } else {
                    setConfirmCancelOpen(true);
                  }
                }}
                icon={<X className="w-5 h-5" />}
              >Cancelar</ButtonWithIcon>
              <ButtonWithIcon
                variant="primary"
                disabled={submitting || (chapterTitle.trim()==='' || content.trim()==='' || (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit)))}
                onClick={() => {
                  // only show validation on demand and open confirm if valid
                  setShowValidation(true);
                  const title = chapterTitle.trim();
                  const html = content.trim();
                  const volInvalid = (!volumeTouched || (selectedVolumeId === '' && !emptyExplicit));
                  const titleInvalid = title === '';
                  const contentInvalid = html === '';

                  if (volInvalid) { setShakeVol(true); setTimeout(() => setShakeVol(false), 350); }
                  if (titleInvalid) { setShakeTitle(true); setTimeout(() => setShakeTitle(false), 350); }
                  if (contentInvalid) { setShakeContent(true); setTimeout(() => setShakeContent(false), 350); }

                  if (volInvalid) {
                    setVolumeTouched(true);
                    setTimeout(() => {
                      volRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      const btn = volRef.current?.querySelector('button[aria-haspopup=\"listbox\"]') as HTMLButtonElement | null;
                      btn?.focus();
                    }, 0);
                    return;
                  }
                  if (titleInvalid) {
                    setTimeout(() => {
                      titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      titleRef.current?.focus();
                    }, 0);
                    return;
                  }
                  if (contentInvalid) {
                    setTimeout(() => {
                      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      const el = editorRef.current?.querySelector('[contenteditable=\"true\"], textarea, input') as HTMLElement | null;
                      el?.focus();
                    }, 0);
                    return;
                  }
                  setConfirmSaveOpen(true);
                }}
                icon={<BookText className="w-5 h-5" />}
              >{submitting ? 'Salvando...' : 'Criar'}</ButtonWithIcon>
            </div>
          </div>

          <Modal
            open={!!confirmDeleteId}
            onClose={() => setConfirmDeleteId(null)}
            title="Excluir volume"
            actions={
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 border border-readowl-purple/30">Cancelar</button>
                <button onClick={() => confirmDeleteId && deleteVolume(confirmDeleteId)} className="px-3 py-1 bg-red-600 text-white border-2 border-red-700">Excluir</button>
              </div>
            }
          >
            <p>Ao excluir o volume, os capítulos dentro dele não serão apagados. Eles ficarão sem volume.</p>
            <p>Tem certeza que deseja continuar?</p>
          </Modal>

          {/* Confirm Cancel */}
          <Modal open={confirmCancelOpen} onClose={() => setConfirmCancelOpen(false)} title="Cancelar criação do capítulo?" widthClass="max-w-sm" >
            <p>Você perderá os dados digitados deste capítulo.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setConfirmCancelOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
              <a href={`/library/books/${slug}`} className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600">Descartar</a>
            </div>
          </Modal>


          {/* Confirm Save */}
          <Modal open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)} title="Confirmar publicação" widthClass="max-w-sm" >
            <p>Deseja publicar este capítulo agora?</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setConfirmSaveOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Voltar</button>
        <button disabled={submitting} onClick={() => { setConfirmSaveOpen(false); submitChapter(); }} className="px-4 py-2 text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </Modal>

          {/* Success after create */}
          <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Capítulo atualizado!" widthClass="max-w-sm">
            <p>As alterações foram salvas.</p>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setSuccessOpen(false)} className="px-4 py-2 text-sm bg-white text-readowl-purple border border-readowl-purple/30 hover:bg-readowl-purple-extralight">Continuar editando</button>
              <a href={`/library/books/${slug}/${slugify(chapterTitle.trim() || 'capitulo')}`} className="px-4 py-2 text-sm bg-readowl-purple-light text-white hover:bg-readowl-purple">Ir para o capítulo</a>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}
