"use client";
import React from 'react';
import Image from 'next/image';
import ChapterCard, { ChapterView } from './ChapterCard';

type Props = {
  title: string;
  volumeId: string;
  chapters: ChapterView[];
  canManage?: boolean;
  onRename?: (volumeId: string, newTitle: string) => Promise<void> | void;
  onDelete?: (volumeId: string) => void;
  onEditChapter?: (chapterId: string) => void;
  onDeleteChapter?: (chapterId: string) => void;
  slug: string; // book slug
};

export default function VolumeSection({ title, volumeId, chapters, canManage = false, onRename, onDelete, onEditChapter, onDeleteChapter, slug }: Props) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(title);
  const first = chapters.slice(0, 5);
  const rest = chapters.slice(5);
  const [showAll, setShowAll] = React.useState(false);

  const canSave = React.useMemo(() => {
    const trimmed = name.trim();
    return !!trimmed && trimmed !== title;
  }, [name, title]);

  return (
    <div className="border-2 border-readowl-purple rounded mb-3 bg-readowl-purple-light">
      {/* Header (use div role=button to avoid nested button issues) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => { const nv = !v; if (!nv) setShowAll(false); return nv; })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => { const nv = !v; if (!nv) setShowAll(false); return nv; });
          }
        }}
        className="w-full flex items-center justify-between px-3 py-2 text-white transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editing ? (
            <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
              <input
                value={name}
                maxLength={200}
                onChange={(e) => setName(e.target.value.slice(0, 200))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (canSave) {
                      onRename?.(volumeId, name.trim());
                    }
                    setEditing(false);
                  } else if (e.key === 'Escape') {
                    setName(title);
                    setEditing(false);
                  }
                }}
                className="w-full bg-white border border-readowl-purple px-2 py-1 pr-36"
              />
              <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 text-[10.5px] text-readowl-purple-extradark/60 mr-2" aria-live="polite">
                {name.length}/200
              </div>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); if (!canSave) { setEditing(false); return; } onRename?.(volumeId, name.trim()); setEditing(false); }}
                  disabled={!canSave}
                  aria-label="Salvar"
                  className={`p-1 ${canSave ? '' : 'opacity-40 cursor-not-allowed'}`}
                >
                  <Image src="/img/svg/generics/purple/send.svg" alt="Salvar" width={18} height={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setName(title); setEditing(false); }}
                  aria-label="Cancelar"
                  className="p-1"
                >
                  <Image src="/img/svg/generics/purple/cancel.svg" alt="Cancelar" width={18} height={18} />
                </button>
              </div>
            </div>
          ) : (
            <span className="font-semibold truncate">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canManage && !editing ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); setEditing(true); setName(title); }} aria-label="Editar" className="p-1 hover:bg-readowl-purple-hover/30 rounded">
                <Image src="/img/svg/generics/white/edit.svg" alt="Editar" width={18} height={18} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete?.(volumeId); }} aria-label="Excluir" className="p-1 hover:bg-readowl-purple-hover/30 rounded">
                <Image src="/img/svg/generics/white/delete.svg" alt="Excluir" width={18} height={18} />
              </button>
            </>
          ) : null}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className={`overflow-hidden transition-[max-height] duration-300 ${open ? 'max-h-[2000px]' : 'max-h-0'}`}>
        <div className="p-3 space-y-2">
          {chapters.length === 0 && (
            <div className="text-white/90 italic">Este volume ainda não possui capítulos.</div>
          )}
          {first.map((c) => (
            <ChapterCard key={c.id} slug={slug} chapter={c} canManage={canManage} onEditChapter={onEditChapter} onDeleteChapter={onDeleteChapter} />
          ))}
          {rest.length > 0 && !showAll && (
            <div className="pt-1">
              <button
                type="button"
                className="text-readowl-purple-extradark hover:underline"
                onClick={() => setShowAll(true)}
              >
                Mostrar mais {rest.length}
              </button>
            </div>
          )}
          {showAll && rest.length > 0 && (
            <div className="mt-2 space-y-2 animate-[fadeIn_.25s_ease]">
              {rest.map((c) => (
                <ChapterCard key={c.id} slug={slug} chapter={c} canManage={canManage} onEditChapter={onEditChapter} onDeleteChapter={onDeleteChapter} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
