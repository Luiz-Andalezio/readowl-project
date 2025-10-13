"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Node as PMNode } from '@tiptap/pm/model';
// Lightweight type to match the subset used from NodeViewProps
type ImageNodeViewProps = {
  node: { attrs: { src: string; alt?: string; width?: number; height?: number; href?: string } };
  updateAttributes: (attrs: Partial<{ src: string; alt?: string; width?: number; height?: number; href?: string }>) => void;
  selected: boolean;
  editor: Editor;
  getPos: () => number;
};

// Lightweight resizable node view for images with corner/edge handles
// Stores width/height back into the node attrs (in px)

export type ResizableImageProps = ImageNodeViewProps;

const HANDLE_SIZE = 8;

export default function ResizableImage({ node, updateAttributes, selected, editor, getPos }: ResizableImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<null | { startX: number; startY: number; startW: number; startH: number; edge: string }>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceUrl, setReplaceUrl] = useState('');
  const [replaceWidth, setReplaceWidth] = useState('');
  const [replaceHeight, setReplaceHeight] = useState('');

  const { src, alt = '', width, height, href } = node.attrs || {};

  const startDrag = (e: React.MouseEvent<HTMLSpanElement>, edge: string) => {
    e.preventDefault(); e.stopPropagation();
    const img = imgRef.current; if (!img) return;
    const w = width ? Number(width) : img.clientWidth;
    const h = height ? Number(height) : img.clientHeight;
    setDragging({ startX: e.clientX, startY: e.clientY, startW: w, startH: h, edge });
  };

  const onMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    let newW = dragging.startW;
    let newH = dragging.startH;
    // Edge handles: change single dimension. Make west/east behave intuitively with pointer movement.
    if (dragging.edge === 'e' || dragging.edge === 'w') {
      // Move right (dx>0) increases width; move left (dx<0) decreases width for both sides
      newW = Math.max(20, dragging.startW + dx);
    } else if (dragging.edge === 'n' || dragging.edge === 's') {
      newH = Math.max(20, dragging.startH + (dragging.edge === 's' ? dy : -dy));
    } else {
      // corner: scale proportionally by horizontal movement (dx) with same direction for E/W
      const scale = 1 + dx / Math.max(1, dragging.startW);
      newW = Math.max(20, Math.round(dragging.startW * scale));
      newH = Math.max(20, Math.round(dragging.startH * scale));
    }
    updateAttributes({ width: Math.min(newW, 5000), height: Math.min(newH, 5000) });
  }, [dragging, updateAttributes]);

  const endDrag = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', endDrag);
    };
  }, [dragging, onMove, endDrag]);

  // Helpers for toolbar actions
  const alignBlock = (align: 'left' | 'center' | 'right') => {
    try {
      const pos = getPos();
      const { state, view } = editor;
      const $pos = state.doc.resolve(pos);
      // climb to nearest block (paragraph/heading) and set its textAlign attribute directly
      for (let depth = $pos.depth; depth > 0; depth--) {
        const blockNode = $pos.node(depth);
        const typeName = blockNode.type.name;
        if (typeName === 'paragraph' || typeName === 'heading') {
          const blockPos = $pos.before(depth);
          const tr = state.tr.setNodeMarkup(blockPos, blockNode.type, { ...blockNode.attrs, textAlign: align }, blockNode.marks);
          view.dispatch(tr);
          editor.chain().focus().run();
          return;
        }
      }
    } catch { /* noop */ }
    // Fallback: rely on the extension command (works when selection is inside a text block)
    editor.chain().focus().setTextAlign(align).run();
  };

  // up/down move removed by request

  const insertCaption = () => {
    const pos = getPos();
    // Insert a caption paragraph right after the image node
    editor.chain().focus().insertContentAt(pos + (node as unknown as PMNode).nodeSize, { type: 'paragraph', content: [{ type: 'text', text: 'Legenda...', marks: [{ type: 'italic' }] }] }).run();
  };

  const openReplaceModal = () => {
    setReplaceUrl(src || '');
    setReplaceWidth(width ? String(width) : '');
    setReplaceHeight(height ? String(height) : '');
    setReplaceOpen(true);
  };
  const applyReplace = () => {
    try {
      const u = new URL(replaceUrl);
      if (!['http:', 'https:'].includes(u.protocol)) return;
      const attrs: Record<string, unknown> = { src: u.toString() };
      if (replaceWidth) attrs.width = parseInt(replaceWidth, 10);
      if (replaceHeight) attrs.height = parseInt(replaceHeight, 10);
      updateAttributes(attrs);
      setReplaceOpen(false);
    } catch { /* noop */ }
  };

  const openLinkModal = () => { setLinkUrl(href || ''); setLinkOpen(true); };
  const applyLink = () => {
    const u = linkUrl.trim();
    if (!u) { updateAttributes({ href: null as unknown as undefined }); setLinkOpen(false); return; }
    try {
      const url = new URL(u);
      if (!['http:', 'https:'].includes(url.protocol)) return;
      updateAttributes({ href: url.toString() });
      setLinkOpen(false);
    } catch { /* noop */ }
  };

  const deleteSelf = () => {
    const pos = getPos();
    const n = editor.state.doc.nodeAt(pos);
    if (!n) return;
    const tr = editor.state.tr.delete(pos, pos + n.nodeSize);
    editor.view.dispatch(tr);
  };

  return (
    <div className="relative inline-block group align-top leading-none text-[0]" data-node-view-wrapper>
      {/* image (wrap with anchor when href present to match renderHTML) */}
      {href ? (
        <a href={href} rel="nofollow noopener noreferrer" target="_blank" className="inline-block no-underline" style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={src} alt={alt} style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }} className="select-none block align-top" />
        </a>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element 
        <img ref={imgRef} src={src} alt={alt} style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }} className="select-none block align-top" />
      )}

      {/* bubble toolbar */}
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 bg-white text-readowl-purple-medium border border-readowl-purple/10 px-2 py-1 flex items-center gap-1.5 shadow-sm pointer-events-auto">
          <button title="Esquerda" onClick={() => alignBlock('left')} className="px-1 py-0.5 hover:bg-readowl-purple-extralight/40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h12" /><path d="M3 18h18" /></svg></button>
          <button title="Centro" onClick={() => alignBlock('center')} className="px-1 py-0.5 hover:bg-readowl-purple-extralight/40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M6 12h12" /><path d="M3 18h18" /></svg></button>
          <button title="Direita" onClick={() => alignBlock('right')} className="px-1 py-0.5 hover:bg-readowl-purple-extralight/40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M9 12h12" /><path d="M3 18h18" /></svg></button>
          <span className="mx-1 opacity-40">|</span>
          <button
            title="Link"
            onClick={openLinkModal}
            className="px-1 py-0.5 hover:bg-readowl-purple-extralight/40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 -960 960 960"
              fill="currentColor"
            >
              <path d="M700-160v-120H580v-60h120v-120h60v120h120v60H760v120h-60ZM450-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h170v60H280q-58.33 0-99.17 40.76-40.83 40.77-40.83 99Q140-422 180.83-381q40.84 41 99.17 41h170v60ZM325-450v-60h310v60H325Zm555-30h-60q0-58-40.83-99-40.84-41-99.17-41H510v-60h170q83 0 141.5 58.5T880-480Z" />
            </svg>
          </button>
          <button title="Legenda" onClick={insertCaption} className="px-1 py-0.5 hover:bg-readowl-purple-extralight/40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16" /><rect x="4" y="3" width="16" height="12" rx="2" ry="2" /></svg></button>
          <span className="mx-1 opacity-40">|</span>
          <button title="Substituir" onClick={openReplaceModal} className="px-1 py-0.5 hover:bg-readowl-purple-extralight/40"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" /><path d="M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg></button>
          <button title="Excluir" onClick={deleteSelf} className="px-1 py-0.5 hover:bg-red-100 text-red-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg></button>
        </div>
      )}

      {/* selection border */}
      {selected && (
        <div ref={wrapRef} className="pointer-events-none absolute inset-0 border-2 border-readowl-purple/60 z-10" />
      )}

      {/* handles (visible on selected) */}
      {selected && (
        <>
          {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(edge => (
            <span
              key={edge}
              onMouseDown={(e) => startDrag(e, edge)}
              className={`absolute bg-readowl-purple pointer-events-auto z-30`}
              style={{
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                borderRadius: HANDLE_SIZE,
                cursor: `${edge}-resize`,
                top: edge.includes('n') ? -HANDLE_SIZE / 2 : edge.includes('s') ? `calc(100% - ${HANDLE_SIZE / 2}px)` : 'calc(50% - 4px)',
                left: edge.includes('w') ? -HANDLE_SIZE / 2 : edge.includes('e') ? `calc(100% - ${HANDLE_SIZE / 2}px)` : 'calc(50% - 4px)'
              }}
            />
          ))}
        </>
      )}

      {/* Link modal (NodeView-scoped) */}
      {linkOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white text-readowl-purple text-base leading-normal border-2 border-readowl-purple/40 p-4 w-[90%] max-w-sm">
            <h3 className="font-semibold mb-2">Adicionar link</h3>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-readowl-purple/30 px-3 py-2 mb-3 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setLinkOpen(false)} className="px-3 py-1 border border-readowl-purple/30">
                Cancelar
              </button>
              <button onClick={applyLink} className="px-3 py-1 bg-readowl-purple-light text-white">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {replaceOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white text-readowl-purple text-base leading-normal border-2 border-readowl-purple/40 p-4 w-[90%] max-w-sm">
            <h3 className="font-semibold mb-2">Substituir imagem por URL</h3>
            <input
              value={replaceUrl}
              onChange={(e) => setReplaceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-readowl-purple/30 px-3 py-2 mb-3 outline-none"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-readowl-purple/80">Largura (px)</label>
                <input
                  value={replaceWidth}
                  onChange={(e) => setReplaceWidth(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Original"
                  inputMode="numeric"
                  className="w-full border border-readowl-purple/30 px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-readowl-purple/80">Altura (px)</label>
                <input
                  value={replaceHeight}
                  onChange={(e) => setReplaceHeight(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Original"
                  inputMode="numeric"
                  className="w-full border border-readowl-purple/30 px-3 py-2 outline-none"
                />
              </div>
            </div>
            <p className="text-sm mb-3">Apenas domínios permitidos (veja hosts em Configuração de imagens).</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setReplaceOpen(false)} className="px-3 py-1 border border-readowl-purple/30">Cancelar</button>
              <button onClick={applyReplace} className="px-3 py-1 bg-readowl-purple-light text-white">Substituir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
