"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Modal from '@/components/ui/modal/Modal';
import ButtonWithIcon from '@/components/ui/button/ButtonWithIcon';
import ChapterEditor from '@/components/chapter/ChapterEditor';
import VolumeCreateInput from '@/components/chapter/VolumeCreateInput';
import VolumeDropdown, { type Volume } from '@/components/chapter/VolumeDropdown';
import { BreadcrumbAuto } from '@/components/ui/Breadcrumb';

export default function PostChapterPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  // volume inline editing handled inside VolumeDropdown
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [chapterTitle, setChapterTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // load volumes
        const res = await fetch(`/api/books/${slug}/volumes`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao carregar volumes');
        const data = await res.json();
        if (mounted) setVolumes(data.volumes || []);
        // load book title for header
        const rb = await fetch(`/api/books/${slug}`, { cache: 'no-store' });
        if (rb.ok) {
          const jb = await rb.json();
          if (mounted && jb?.book?.title) setBookTitle(jb.book.title);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
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

  // inline rename proxy used by dropdown component

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

  async function submitChapter() {
    setError(null);
    const title = chapterTitle.trim();
    const html = content.trim();
    if (!title) { setError('Informe um título para o capítulo.'); return; }
    if (!html) { setError('Escreva o conteúdo do capítulo.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/books/${slug}/chapters`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content: html, volumeId: selectedVolumeId || null }) });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('Você não tem permissão para publicar capítulos nesta obra.'); return; }
      if (!res.ok) throw new Error('Falha ao criar capítulo');
      // Success: go back to book page
      router.push(`/library/books/${slug}`);
    } catch (e) {
      console.error(e);
      setError('Ocorreu um erro ao criar o capítulo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="px-4 py-10 text-center text-white/70">Carregando…</div>;

  return (
    <>
      {/* Breadcrumb with top offset so content doesn't sit under the fixed navbar */}
      <div className="w-full flex justify-center mt-14 sm:mt-16">
        <BreadcrumbAuto anchor="static" base="/home" labelMap={{ library: 'Biblioteca', books: 'Livros', 'post-chapter': 'Adicionar capítulo' }} />
      </div>

      <div className="pb-6">
        <div className="max-w-4xl mx-auto">
        {/* Header text exactly as requested */}
        <h2 className="text-white text-center font-yusei text-xl mb-3">Adicionar capítulo em: “{bookTitle || decodeURIComponent(slug).replace(/-/g, ' ')}”</h2>
        <div className="bg-readowl-purple-extralight text-readowl-purple-extradark p-5 shadow-md font-ptserif">
          <h1 className="text-2xl font-bold text-center mb-4">{bookTitle || decodeURIComponent(slug).replace(/-/g, ' ')}</h1>

          {/* Volume create input with inline send */}
          <div className="mb-3">
            <VolumeCreateInput value={newVolumeTitle} onChange={setNewVolumeTitle} onSubmit={addVolume} />
          </div>

          {/* Volume dropdown styled as card list */}
          <div className="mb-4">
            <VolumeDropdown
              volumes={volumes}
              selectedId={selectedVolumeId}
              onSelect={(id) => setSelectedVolumeId(id)}
              onEdit={async (id, title) => { await saveVolumeEditProxy(id, title); }}
              onDelete={(id) => setConfirmDeleteId(id)}
            />
          </div>

          {/* Chapter title and editor with placeholders (no white areas) */}
          <div className="mb-3">
            <input
              placeholder="Título do capítulo..."
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark px-1 py-2 text-3xl font-bold placeholder-readowl-purple-extradark/40 focus:outline-none focus:ring-0 border-0"
            />
          </div>
          <div className="mb-4">
            <ChapterEditor value={content} onChange={setContent} />
          </div>

          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <div className="flex items-center justify-center gap-6">
            <ButtonWithIcon
              variant="secondary"
              onClick={() => setConfirmCancelOpen(true)}
              iconUrl="/img/svg/generics/cancel2.svg"
            >Cancelar</ButtonWithIcon>
            <ButtonWithIcon
              variant="primary"
              disabled={submitting}
              onClick={() => setConfirmSaveOpen(true)}
              iconUrl="/img/svg/book/checkbook.svg"
            >{submitting ? 'Salvando...' : 'Registrar'}</ButtonWithIcon>
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
        </div>
      </div>
    </>
  );
}
