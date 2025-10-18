"use client";
import React from 'react';
import { ThumbsUp, MessageSquareReply, Pencil, Trash2, ShieldUser } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Modal from '@/components/ui/modal/Modal';
import CommentInput from './CommentInput';

export type CommentDto = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string | null; image: string | null; role: 'USER' | 'ADMIN' };
  _count: { likes: number; replies: number };
  parentId?: string | null;
  replies?: CommentDto[]; // kept for backward compatibility; not used now
  likedByMe?: boolean;
};

type Props = {
  comments: CommentDto[];
  total: number;
  likeApi: (commentId: string, willLike: boolean) => Promise<number>; // returns new count
  // Who can edit a comment (content). Typically comment owner or admin.
  canEditDelete: (c: CommentDto) => boolean; // deprecated: kept for backward compatibility; used for edit and delete when granular props are not provided
  // Optional granular permissions (override delete or edit separately)
  canEdit?: (c: CommentDto) => boolean;
  canDelete?: (c: CommentDto) => boolean;
  onReply: (parentId: string, html: string) => Promise<void>;
  onEdit: (id: string, html: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export default function CommentsList({ comments, total, likeApi, canEditDelete, canEdit, canDelete, onReply, onEdit, onDelete }: Props) {
  useSession();
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<CommentDto[]>(comments);

  React.useEffect(() => setItems(comments), [comments]);

  const toggleLike = async (id: string) => {
    // determine current liked state (search in items and nested replies)
    const find = (arr: CommentDto[]): CommentDto | null => {
      for (const c of arr) { if (c.id === id) return c; if (c.replies) { const f = find(c.replies); if (f) return f; } }
      return null;
    };
    const node = find(items);
    const willLike = !node?.likedByMe;
    const count = await likeApi(id, willLike);
    const update = (arr: CommentDto[]): CommentDto[] => arr.map((c) => {
      if (c.id === id) return { ...c, _count: { ...c._count, likes: count }, likedByMe: willLike };
      return { ...c, replies: c.replies ? update(c.replies) : c.replies };
    });
    setItems(update);
  };

  const handleReply = async (pid: string, html: string) => {
    await onReply(pid, html);
    setReplyTo(null);
  };

  const renderItem = (c: CommentDto, depth = 0, parentAuthor?: string, parentText?: string): React.ReactNode => {
  const canEditEval = typeof canEdit === 'function' ? canEdit(c) : canEditDelete(c);
  const canDeleteEval = typeof canDelete === 'function' ? canDelete(c) : canEditDelete(c);
    const when = new Date(c.createdAt);
    const date = when.toLocaleDateString('pt-BR');
    const time = when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const container = (
      <div key={c.id} className={`rounded-md bg-readowl-purple-extradark/90 p-3 mb-3 ${depth > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-start gap-3">
          {/* avatar */}
          <div className="flex-0">
            {c.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-readowl-purple text-white flex items-center justify-center">{(c.user.name || '?').charAt(0)}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-white">
              <span className="font-semibold truncate">{c.user.name || 'Usuário'}</span>
              {c.user.role === 'ADMIN' && (
                <span className="inline-flex items-center justify-center rounded-full bg-readowl-purple-medium text-white w-5 h-5" title="Administrador">
                  <ShieldUser size={14} />
                </span>
              )}
              {parentAuthor && (
                <span className="text-sm opacity-80">
                  - em resposta à {parentAuthor}{parentText ? `: "${parentText}"` : ''}
                </span>
              )}
              <span className="ml-auto text-xs text-white/70">{date} às {time}</span>
            </div>
            {/* content or edit */}
            {editingId === c.id ? (
              <div className="mt-2">
                <CommentInput
                  className="border border-readowl-purple/40"
                  onSubmit={async (html) => { await onEdit(c.id, html); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                  initialHtml={c.content}
                />
              </div>
            ) : (
              <div className="mt-2 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: c.content }} />
            )}
          </div>
          {(canEditEval || canDeleteEval) && (
            <div className="flex items-start gap-2 ml-2">
              {canEditEval ? (
                <button onClick={() => setEditingId(c.id)} aria-label="Editar" className="text-white/80 hover:text-white"><Pencil size={18} /></button>
              ) : null}
              {canDeleteEval ? (
                <button onClick={() => setConfirmDelete(c.id)} aria-label="Excluir" className="text-white/80 hover:text-white"><Trash2 size={18} /></button>
              ) : null}
            </div>
          )}
        </div>
        {/* actions */}
        <div className="mt-2 flex items-center gap-4 text-white">
          <button id={`like-${c.id}`} onClick={() => toggleLike(c.id)} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-white hover:bg-white/10 ${c.likedByMe ? 'bg-white/10' : ''}`}>
            <ThumbsUp size={18} strokeWidth={2.5} /> <span>{c._count.likes}</span>
          </button>
          <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-white hover:bg-white/10">
            <MessageSquareReply size={18} strokeWidth={2.5} /> <span>Responder{c._count.replies ? ` (${c._count.replies})` : ''}</span>
          </button>
        </div>
        {replyTo === c.id && (
          <div className="mt-2">
            <CommentInput compact onSubmit={(html) => handleReply(c.id, html)} onCancel={() => setReplyTo(null)} />
          </div>
        )}
      </div>
    );
    return container;
  };

  return (
    <div>
      <div className="mb-2 text-white">{total} comentário{total === 1 ? '' : 's'}.</div>
      <div>
        {(() => {
          // Group flat list by parentId and render: parents first, then all descendants directly below (one-level indent), preserving order.
          const byParent = new Map<string | null, CommentDto[]>();
          for (const c of items) {
            const pid = (c.parentId ?? null) as string | null;
            if (!byParent.has(pid)) byParent.set(pid, []);
            byParent.get(pid)!.push(c);
          }
          const roots = byParent.get(null) || [];
          const toTime = (d: string | Date) => (d instanceof Date ? d.getTime() : new Date(d).getTime());
          // helper to extract plain text and truncate to 50 chars
          const extractText = (html: string): string => {
            if (!html) return '';
            const div = typeof window !== 'undefined' ? document.createElement('div') : null;
            if (div) {
              div.innerHTML = html;
              const t = (div.textContent || div.innerText || '').trim();
              return t.length > 50 ? t.slice(0, 50) + '...' : t;
            }
            // SSR fallback: rough strip tags
            const t = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
            return t.length > 50 ? t.slice(0, 50) + '...' : t;
          };

          const renderChain = (parent: CommentDto) => {
            const out: React.ReactNode[] = [];
            out.push(renderItem(parent, 0));
            const emitReplies = (p: CommentDto) => {
              const kids = (byParent.get(p.id) || []).sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
              const ptext = extractText(p.content || '');
              for (const child of kids) {
                out.push(renderItem(child, 1, p.user.name || 'Usuário', ptext));
                // recursively emit deeper levels, still at visual depth 1
                emitReplies(child);
              }
            };
            emitReplies(parent);
            return out;
          };
          const result: React.ReactNode[] = [];
          for (const root of roots) result.push(...renderChain(root));
          return result;
        })()}
      </div>
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir comentário?" widthClass="max-w-md">
        <p>Essa ação não poderá ser desfeita.</p>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => setConfirmDelete(null)} className="px-3 py-1 border border-white/30 text-white">Cancelar</button>
          <button onClick={async () => { if (confirmDelete) { await onDelete(confirmDelete); setConfirmDelete(null); } }} className="px-3 py-1 bg-red-600 text-white">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
