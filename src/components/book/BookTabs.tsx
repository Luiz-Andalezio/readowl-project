"use client";
import React from 'react';
import CommentInput from '@/components/comment/CommentInput';
import CommentsList, { type CommentDto } from '@/components/comment/CommentsList';
import SelectableIconButton from '@/components/ui/button/SelectableIconButton';
import VolumeSection from './VolumeSection';
import ChapterCard from './ChapterCard';
import Modal from '@/components/ui/modal/Modal';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { slugify } from '@/lib/slug';
import VolumeCreateInput from '@/components/chapter/VolumeCreateInput';

type Tab = 'chapters' | 'comments';

type VolumeDto = { id: string; title: string };
type ChapterDto = { id: string; title: string; content: string; createdAt: string; volumeId: string | null };

export default function BookTabs({ canManage: canManageProp }: { canManage?: boolean } = {}) {
  const { data: session } = useSession();
  const params = useParams<{ slug: string }>();
  const slug = (params?.slug as string) || '';
  const [tab, setTab] = React.useState<Tab>('chapters');
  const [loading, setLoading] = React.useState(true);
  const [volumes, setVolumes] = React.useState<VolumeDto[]>([]);
  const [chapters, setChapters] = React.useState<ChapterDto[]>([]);
  const [newVolumeTitle, setNewVolumeTitle] = React.useState('');
  const [comments, setComments] = React.useState<CommentDto[]>([]);
  const [commentsCount, setCommentsCount] = React.useState(0);
  const canManage = typeof canManageProp === 'boolean' ? canManageProp : (!!session?.user && session.user.role === 'ADMIN');
  const router = useRouter();

  // Modals state for destructive actions
  const [volumeToDelete, setVolumeToDelete] = React.useState<VolumeDto | null>(null);
  const [chapterToDelete, setChapterToDelete] = React.useState<ChapterDto | null>(null);

  React.useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const [v, c, co] = await Promise.all([
          fetch(`/api/books/${slug}/volumes`).then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch(`/api/books/${slug}/chapters`).then(r => r.ok ? r.json() : Promise.reject(r)),
          fetch(`/api/books/${slug}/comments`).then(r => r.ok ? r.json() : Promise.reject(r)),
        ]);
        if (ignore) return;
        setVolumes((v.volumes || []).sort((a: VolumeDto, b: VolumeDto) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })));
        setChapters((c.chapters || []).sort((a: ChapterDto, b: ChapterDto) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })));
        setComments(co.comments || []);
        setCommentsCount((co.comments || []).length + (co.comments || []).reduce((acc: number, it: CommentDto) => acc + (it.replies?.length || 0), 0));
      } catch { }
      finally { if (!ignore) setLoading(false); }
    }
    if (slug) load();
    return () => { ignore = true; };
  }, [slug]);

  async function refetchAll() {
    setLoading(true);
    try {
      const [v, c, co] = await Promise.all([
        fetch(`/api/books/${slug}/volumes`).then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch(`/api/books/${slug}/chapters`).then(r => r.ok ? r.json() : Promise.reject(r)),
        fetch(`/api/books/${slug}/comments`).then(r => r.ok ? r.json() : Promise.reject(r)),
      ]);
      setVolumes((v.volumes || []).sort((a: VolumeDto, b: VolumeDto) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })));
      setChapters((c.chapters || []).sort((a: ChapterDto, b: ChapterDto) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })));
      setComments(co.comments || []);
      setCommentsCount((co.comments || []).length + (co.comments || []).reduce((acc: number, it: CommentDto) => acc + (it.replies?.length || 0), 0));
    } finally {
      setLoading(false);
    }
  }
  async function createVolume() {
    const title = newVolumeTitle.trim();
    if (!title) return;
    try {
      const res = await fetch(`/api/books/${slug}/volumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        // Optionally, show a toast; for now, just return
        return;
      }
      const data = await res.json().catch(() => null);
      const vol: VolumeDto | null = data?.volume ? { id: data.volume.id, title: data.volume.title } : null;
      if (vol) {
        setVolumes((prev) => [...prev, vol].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })));
        setNewVolumeTitle('');
      } else {
        await refetchAll();
        setNewVolumeTitle('');
      }
    } catch {
      // fallback: refetch
      await refetchAll();
    }
  }
  return (
    <div className=" bg-readowl-purple-dark/10 border-2 text-white border-readowl-purple shadow-md p-3">
      <div className="flex justify-center gap-3">
        <SelectableIconButton
          iconUrl="/img/svg/book/chapter-purple.svg"
          size="sm"
          fullWidth={false}
          selected={tab === 'chapters'}
          toggleOnClick={false}
          onClick={() => setTab('chapters')}
        >
          Capítulos
        </SelectableIconButton>
        <SelectableIconButton
          iconUrl="/img/svg/comment/comment.svg"
          size="sm"
          fullWidth={false}
          selected={tab === 'comments'}
          toggleOnClick={false}
          onClick={() => setTab('comments')}
        >
          Comentários
        </SelectableIconButton>
      </div>
      <div className="p-4 min-h-[120px]">
        {tab === 'chapters' ? (
          loading ? (
            <div className="text-white/80">Carregando…</div>
          ) : (
            <div>
              {/* Counters */}
              <div className="flex items-center justify-between text-white/90 mb-2">
                <div className="text-sm">{volumes.length} volume{volumes.length === 1 ? '' : 's'} · {chapters.length} capítulo{chapters.length === 1 ? '' : 's'}</div>
                <div className="text-sm">
                  {chapters.reduce((sum, c) => { const t = c.content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); return sum + (t ? t.split(/\s+/).length : 0); }, 0).toLocaleString('pt-BR')} palavras
                </div>
              </div>
              {/* Create volume (owner/admin) */}
              {canManage && (
                <div className="mb-3">
                  <VolumeCreateInput value={newVolumeTitle} onChange={setNewVolumeTitle} onSubmit={createVolume} />
                </div>
              )}
              {/* Volume sections */}
              <div className="space-y-3">
                {volumes.map(v => (
                  <VolumeSection
                    key={v.id}
                    title={v.title}
                    volumeId={v.id}
                    chapters={chapters.filter(c => c.volumeId === v.id)}
                    slug={slug}
                    canManage={canManage}
                    onRename={async (id, newTitle) => {
                      await fetch(`/api/books/${slug}/volumes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
                      setVolumes(prev => prev.map(x => x.id === id ? { ...x, title: newTitle } : x).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })));
                    }}
                    onDelete={(id) => {
                      const v = volumes.find(x => x.id === id) || null;
                      setVolumeToDelete(v);
                    }}
                    onEditChapter={(chapterId) => {
                      const ch = chapters.find(c => c.id === chapterId);
                      if (!ch) return;
                      const chapSlug = slugify(ch.title);
                      router.push(`/library/books/${slug}/${chapSlug}/edit-chapter`);
                    }}
                    onDeleteChapter={(chapterId) => {
                      const ch = chapters.find(c => c.id === chapterId) || null;
                      setChapterToDelete(ch);
                    }}
                  />
                ))}
                {/* Chapters without volume */}
                {chapters.filter(c => !c.volumeId).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {chapters.filter(c => !c.volumeId).map(c => (
                      <ChapterCard
                        key={c.id}
                        slug={slug}
                        chapter={c}
                        standalone
                        canManage={canManage}
                        onEditChapter={(id) => { const ch = chapters.find(x => x.id === id); if (!ch) return; router.push(`/library/books/${slug}/${slugify(ch.title)}/edit-chapter`); }}
                        onDeleteChapter={(id) => { const ch = chapters.find(x => x.id === id) || null; setChapterToDelete(ch); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div>
            <CommentInput onSubmit={async (html) => {
              await fetch(`/api/books/${slug}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: html }) });
              await refetchAll();
            }} />
            <div className="mt-4">
              <CommentsList
                comments={comments}
                total={commentsCount}
                likeApi={async (id, willLike) => {
                  const res = await fetch(`/api/books/${slug}/comments/${id}/like`, { method: willLike ? 'POST' : 'DELETE' });
                  const data = await res.json().catch(() => ({}));
                  return Number(data?.count || 0);
                }}
                // Edit: only comment owner (admins cannot edit others' comments)
                canEdit={(c: CommentDto) => !!session?.user?.id && session.user.id === c.user?.id}
                // Delete: comment owner or admin, OR book owner (canManage)
                canDelete={() => !!session?.user?.id && (session.user.role === 'ADMIN' || canManage)}
                // Back-compat: not used when canEdit/canDelete provided
                canEditDelete={() => false}
                onReply={async (parentId, html) => {
                  await fetch(`/api/books/${slug}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: html, parentId }) });
                  await refetchAll();
                }}
                onEdit={async (id, html) => {
                  await fetch(`/api/books/${slug}/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: html }) });
                  await refetchAll();
                }}
                onDelete={async (id) => {
                  await fetch(`/api/books/${slug}/comments/${id}`, { method: 'DELETE' });
                  await refetchAll();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm delete volume */}
      <Modal
        open={!!volumeToDelete}
        onClose={() => setVolumeToDelete(null)}
        title="Excluir volume?"
        widthClass="max-w-md"
      >
        <p>Os capítulos dentro deste volume serão movidos para &quot;Sem volume&quot;. Deseja continuar?</p>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setVolumeToDelete(null)} className="px-3 py-1 border border-readowl-purple/30 text-white/90">Cancelar</button>
          <button
            className="px-3 py-1 bg-red-700 text-white"
            onClick={async () => {
              if (!volumeToDelete) return;
              await fetch(`/api/books/${slug}/volumes/${volumeToDelete.id}`, { method: 'DELETE' });
              setVolumeToDelete(null);
              await refetchAll();
            }}
          >
            Excluir
          </button>
        </div>
      </Modal>

      {/* Confirm delete chapter */}
      <Modal
        open={!!chapterToDelete}
        onClose={() => setChapterToDelete(null)}
        title="Excluir capítulo?"
        widthClass="max-w-md"
      >
        <p>Tem certeza que deseja excluir este capítulo?</p>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setChapterToDelete(null)} className="px-3 py-1 border border-readowl-purple/30 text-white/90">Cancelar</button>
          <button
            className="px-3 py-1 bg-red-700 text-white"
            onClick={async () => {
              if (!chapterToDelete) return;
              await fetch(`/api/books/${slug}/chapters/${chapterToDelete.id}`, { method: 'DELETE' });
              setChapterToDelete(null);
              await refetchAll();
            }}
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
