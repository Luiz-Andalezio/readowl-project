"use client";
import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { Volume } from '@/types/volume';

type Props = {
  volumes: Volume[];
  selectedId: string; // '' means no volume
  onSelect: (id: string) => void;
  onEdit: (id: string, newTitle: string) => Promise<void> | void;
  onDelete: (id: string) => void;
  // visual error state for parent-driven validation
  error?: boolean;
  // force the list open when parent requests attention (e.g., validation failure)
  forceOpen?: boolean;
  // apply shake animation on demand
  shake?: boolean;
};

const VolumeDropdown = forwardRef<HTMLDivElement, Props>(function VolumeDropdown(
  { volumes, selectedId, onSelect, onEdit, onDelete, error = false, forceOpen = false, shake = false }: Props,
  ref
) {
  const [open, setOpen] = useState(false);
  // Support multiple simultaneous edit operations keyed by volume id
  const [editing, setEditing] = useState<Record<string, string>>({});
  // Track if the user explicitly selected the "Sem volume" (No volume) option at least once
  const [emptyChosen, setEmptyChosen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Expose root element to parent for focus/scroll
  useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

  // Close on outside pointerdown / ESC. Using pointerdown avoids races with click inside icons/images.
  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      // Prefer composedPath to be robust across nested elements
      const path = (e.composedPath ? e.composedPath() : []) as Array<EventTarget>;
      const inside = (path.length ? path.includes(root) : root.contains(e.target as Node));
      // Ignore closings triggered from any modal/dialog confirmations
      const inDialog = path.some((el) => {
        if (!(el instanceof HTMLElement)) return false;
        const role = el.getAttribute('role');
        const ariaModal = el.getAttribute('aria-modal');
        const tag = el.tagName;
        const cls = el.className?.toString?.() || '';
        return (
          role === 'dialog' || ariaModal === 'true' ||
          tag === 'DIALOG' ||
          el.hasAttribute('data-dialog') || el.hasAttribute('data-modal') ||
          /\bmodal\b|\bdialog\b/i.test(cls)
        );
      });
      if (!inside && !inDialog) { setOpen(false); setEditing({}); }
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') { setOpen(false); setEditing({}); } }
    document.addEventListener('pointerdown', onDocPointerDown, { passive: true });
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('pointerdown', onDocPointerDown); document.removeEventListener('keydown', onEsc); };
  }, []);

  // When parent signals forceOpen or error, open the dropdown and focus the button
  useEffect(() => {
    if (forceOpen || error) {
      setOpen(true);
      const btn = rootRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]');
      btn?.focus();
    }
  }, [forceOpen, error]);

  const { headerLabel, isPlaceholder } = useMemo(() => {
    if (!selectedId) {
  // If user has explicitly selected "Sem volume", show it; otherwise show placeholder
      return { headerLabel: emptyChosen ? 'Sem volume' : 'Selecione um volume...', isPlaceholder: !emptyChosen };
    }
    const found = volumes.find(v => v.id === selectedId);
    return { headerLabel: found?.title ?? 'Selecione um volume...', isPlaceholder: !found };
  }, [selectedId, volumes, emptyChosen]);
  // Always show volumes sorted alphabetically (case-insensitive)
  const sortedVolumes = useMemo(() => {
    return [...volumes].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));
  }, [volumes]);

  const canSave = (id: string) => {
    const val = (editing[id] ?? '').trim();
    if (!val) return false;
    const original = volumes.find(v => v.id === id)?.title ?? '';
    return val !== original;
  };

  async function commitEdit(id: string) {
    const val = (editing[id] ?? '').trim();
    if (!val || !canSave(id)) return;
    await onEdit(id, val);
    setEditing(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  function cancelEdit(id: string) {
    setEditing(prev => { const next = { ...prev }; delete next[id]; return next; });
  }

  return (
    <div ref={rootRef} className="relative select-none">
      <button
        type="button"
        className={`w-full text-left bg-readowl-purple-extralight text-readowl-purple-extradark border-2 px-3 py-2 flex items-center justify-between ${error ? 'border-red-600' : 'border-readowl-purple'} ${shake ? 'animate-shake' : ''}`}
        onClick={() => setOpen(v => { const next = !v; if (!next) setEditing({}); return next; })}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
  <span className={isPlaceholder ? 'text-readowl-purple-extradark/60' : ''}>{headerLabel}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={`${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'} absolute left-0 right-0 mt-1 bg-readowl-purple-extralight border-2 ${error ? 'border-red-600' : 'border-readowl-purple'} shadow-lg origin-top transition-all duration-200 max-h-72 overflow-auto z-50`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* None option */}
        <div className={`px-3 py-2 cursor-pointer flex items-center justify-between ${selectedId === '' && emptyChosen ? 'bg-readowl-purple-extralight/60' : ''}`} onClick={() => { onSelect(''); setEmptyChosen(true); setOpen(false); }}>
          <span className="text-readowl-purple-extradark">Sem volume</span>
        </div>
        {/* Volumes list */}
        {sortedVolumes.map(v => (
          <div
            key={v.id}
            className={`px-3 py-2 border-t border-readowl-purple/15 flex items-center justify-between ${selectedId === v.id ? 'bg-readowl-purple-extralight/60' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex-1 min-w-0">
              {editing[v.id] !== undefined ? (
                <div className="relative">
                  <input
                    autoFocus
                    value={(editing[v.id] ?? '').slice(0, 200)}
                    maxLength={200}
                    onChange={(e) => setEditing(prev => ({ ...prev, [v.id]: e.target.value.slice(0, 200) }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(v.id); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark border-2 border-readowl-purple pl-2 pr-36 py-1"
                  />
                  <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 text-[10.5px] text-readowl-purple-extradark/60 mr-2" aria-live="polite">
                    {(editing[v.id] ?? '').length}/200
                  </div>
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); commitEdit(v.id); }}
                      disabled={!canSave(v.id)}
                      className={`p-1 ${canSave(v.id) ? '' : 'opacity-40 cursor-not-allowed'}`}
                      aria-label="Salvar"
                    >
                      <Image src="/img/svg/generics/purple/send.svg" alt="Salvar" width={18} height={18} />
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); cancelEdit(v.id); }}
                      aria-label="Cancelar"
                      className="p-1"
                    >
                      <Image src="/img/svg/generics/purple/cancel.svg" alt="Cancelar" width={18} height={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <button className="w-full text-left truncate" onClick={(e) => { e.stopPropagation(); onSelect(v.id); setEmptyChosen(false); setOpen(false); }}>{v.title}</button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {editing[v.id] !== undefined ? null : (
                <>
                  <button onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setOpen(true); setEditing(prev => ({ ...prev, [v.id]: v.title })); }} aria-label="Editar" className="p-1"><Image src="/img/svg/generics/purple/edit.svg" alt="Editar" width={18} height={18} /></button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      // If this row is being edited, clear only its edit state; keep dropdown open
                      setEditing(prev => { if (prev[v.id] === undefined) return prev; const next = { ...prev }; delete next[v.id]; return next; });
                      onDelete(v.id);
                    }}
                    aria-label="Excluir"
                    className="p-1"
                  >
                    <Image src="/img/svg/generics/purple/delete.svg" alt="Excluir" width={18} height={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default VolumeDropdown;
