"use client";
import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNVR = (require('@tiptap/react') as { ReactNodeViewRenderer: (component: unknown, options?: unknown) => unknown }).ReactNodeViewRenderer;
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Undo2, Redo2, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code as CodeIcon, Link as LinkIcon, Image as ImageIcon, List as ListIcon, ListOrdered, Eraser } from 'lucide-react';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import ResizableImage from '@/components/ui/tiptap/ResizableImage';
import { normalizeHtmlSpacing, getPlainTextLength } from '@/lib/sanitize';

export type ChapterEditorProps = {
  value: string;
  onChange: (html: string) => void;
  maxChars?: number;
};

export default function ChapterEditor({ value, onChange, maxChars = 50000 }: ChapterEditorProps) {
  const [mounted, setMounted] = useState(false);
  // Initialize emptiness from incoming value to avoid placeholder overlaying prefilled content
  const [isEmpty, setIsEmpty] = useState(() => getPlainTextLength(value || '') === 0);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const lastGoodHtmlRef = useRef<string>(value || '<p></p>');
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState<string>('');
  const [imageHeight, setImageHeight] = useState<string>('');

  const alignCurrentBlock = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    const { state, view } = editor;
    const sel = state.selection as unknown;
    if (sel instanceof NodeSelection) {
      try {
        const ns = sel as NodeSelection;
        const nearLeft = TextSelection.near(state.doc.resolve(ns.from), -1);
        view.dispatch(state.tr.setSelection(nearLeft));
      } catch { }
    }
    editor.chain().focus().setTextAlign(align).run();
  };

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ dropcursor: { class: 'tiptap-dropcursor' } }),
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: 'nofollow noopener noreferrer',
            target: '_blank',
            class: 'underline text-readowl-purple-extradark',
          },
        }),
        ImageExtension.extend({
          addAttributes() {
            const parent = (this.parent as unknown as (() => Record<string, unknown>) | undefined)?.();
            return {
              ...(parent || {}),
              href: { default: null },
            };
          },
          renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }): DOMOutputSpec {
            const { href, ...attrs } = HTMLAttributes as Record<string, string>;
            const imgSpec: DOMOutputSpec = ['img', attrs];
            const anchorSpec: DOMOutputSpec = ['a', { href, rel: 'nofollow noopener noreferrer', target: '_blank' }, imgSpec];
            return href ? anchorSpec : imgSpec;
          },
          addNodeView() { return RNVR(ResizableImage); },
        }).configure({ inline: true, allowBase64: false }),
      ],
      content: value || '<p></p>',
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: [
            'prose prose-sm max-w-none focus:outline-none',
            'text-readowl-purple-extradark',
            'prose-p:text-readowl-purple-extradark',
            'prose-li:text-readowl-purple-extradark',
            'prose-strong:text-readowl-purple-extradark',
            'prose-code:text-readowl-purple-medium',
            'prose-h2:text-readowl-purple-extradark',
            'prose-h3:text-readowl-purple-extradark',
            'prose-a:text-readowl-purple-extradark',
            'prose-hr:border-t prose-hr:border-readowl-purple-medium prose-hr:opacity-100',
          ].join(' '),
        },
        // prevent file drop/paste and normalize spacing on paste
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handlePaste(_view: any, event: any) {
          const dt = event.clipboardData;
          const items = dt?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].kind === 'file') { event.preventDefault(); return true; }
            }
          }
          if (!dt) return false;
          const html = dt.getData('text/html');
          const plain = dt.getData('text/plain');
          if (!html && !plain) return false;
          event.preventDefault();
          // Convert plain text to minimal HTML preserving paragraphs and line breaks
          const plainToHtml = (txt: string) => {
            const safe = (txt || '')
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\u00A0/g, ' ');
            const blocks = safe.split(/\n{2,}/).map(b => `<p>${b.replace(/\n/g, '<br>')}</p>`).join('');
            return blocks || '<p></p>';
          };
          // Convert <div> based HTML (Docs/Word) to paragraphs first
          const divToP = (h: string) => h
            .replace(/<div\b([^>]*)>/gi, '<p$1>')
            .replace(/<\/div>/gi, '</p>')
            // Avoid nested p by collapsing </p><p> duplicates created by conversion
            .replace(/<p\b[^>]*>\s*<p\b/gi, '<p')
            .replace(/<\/p>\s*<\/p>/gi, '</p>');
          const incomingHtml = html ? divToP(html) : plainToHtml(plain);
          const normalized = normalizeHtmlSpacing(incomingHtml);
          editor?.chain().focus().insertContent(normalized).run();
          return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(_view: any, event: any) { if (event.dataTransfer?.files?.length) { event.preventDefault(); return true; } return false; },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onUpdate({ editor }: any) {
        const text = editor.getText();
        if (typeof maxChars === 'number' && text.length > maxChars) {
          // revert to the last valid content
          editor.commands.setContent(lastGoodHtmlRef.current || '<p></p>', false);
          return;
        }
        const trimmed = text.trim();
        setIsEmpty(trimmed.length === 0);
        setCharCount(text.length);
        setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
        const html = editor.getHTML();
        lastGoodHtmlRef.current = html;
        onChange(html);
      },
    },
    []
  );

  useEffect(() => {
    setMounted(true);
    if (!editor) return;
    // Sync content only if it differs
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', false);
    }
    // Always recompute emptiness and counters from current editor state
    const textNow = editor.getText();
    const trimmed = textNow.trim();
    setIsEmpty(trimmed.length === 0);
    setCharCount(textNow.length);
    setWordCount(trimmed ? trimmed.split(/\s+/).length : 0);
    lastGoodHtmlRef.current = editor.getHTML();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!mounted) {
    return (
      <div className="w-full bg-readowl-purple-extralight px-2 py-3 min-h-[12rem]" />
    );
  }

  return (
    <div className="w-full font-ptserif">
      {/* Toolbar with extralight background and all controls */}
      <div className="flex flex-wrap items-center gap-2 text-readowl-purple-medium bg-readowl-purple-extralight px-2 py-1 border-b border-readowl-purple/10">
        {/* Undo/Redo */}
        <button title="Desfazer" onClick={() => editor?.chain().focus().undo().run()} className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40">
          <Undo2 size={18} />
        </button>
        <button title="Refazer" onClick={() => editor?.chain().focus().redo().run()} className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40">
          <Redo2 size={18} />
        </button>

        <span className="mx-1 opacity-40">|</span>

        {/* Paragraph / H2 / H3 */}
        <div className="relative">
          <select
            title="Título"
            className="appearance-none pl-1.5 pr-5 py-0.5 pt-1 rounded border border-readowl-purple/30 text-readowl-purple-medium text-xs bg-white hover:bg-readowl-purple-extralight/30 focus:outline-none"
            value={
              editor?.isActive('heading', { level: 2 })
                ? 'h2'
                : editor?.isActive('heading', { level: 3 })
                  ? 'h3'
                  : 'p'
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'h2') editor?.chain().focus().toggleHeading({ level: 2 }).run();
              else if (v === 'h3') editor?.chain().focus().toggleHeading({ level: 3 }).run();
              else editor?.chain().focus().setParagraph().run();
            }}
          >
            <option value="p">Parágrafo</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
          </select>
          <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-readowl-purple-medium opacity-80" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
          </span>
        </div>

        <span className="mx-1 opacity-40">|</span>

        {/* Bold/Italic/Underline/Strike/Code */}
        <button title="Negrito" onClick={() => editor?.chain().focus().toggleBold().run()} className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 ${editor?.isActive('bold') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <Bold size={18} />
        </button>
        <button title="Itálico" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 ${editor?.isActive('italic') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <Italic size={18} />
        </button>
        <button title="Sublinhado" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 ${editor?.isActive('underline') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <UnderlineIcon size={18} />
        </button>
        <button title="Tachado" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 ${editor?.isActive('strike') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <Strikethrough size={18} />
        </button>
        <button title="Código" onClick={() => editor?.chain().focus().toggleCode().run()} className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 ${editor?.isActive('code') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <CodeIcon size={18} />
        </button>

        <span className="mx-1 opacity-40">|</span>

        {/* Link & Image */}
        <button title="Link" onClick={() => { setLinkUrl(''); setLinkOpen(true); }} className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40">
          <LinkIcon size={18} />
        </button>
        <button title="Imagem" onClick={() => { setImageUrl(''); setImageWidth(''); setImageHeight(''); setImageOpen(true); }} className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40">
          <ImageIcon size={18} />
        </button>

        <span className="mx-1 opacity-40">|</span>

        {/* Lists */}
        <button title="Lista" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`px-1 py-0.5 hover:bg-readowl-purple-extralight/40 ${editor?.isActive('bulletList') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <ListIcon size={18} />
        </button>
        <button title="Num." onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`px-1 py-0.5 hover:bg-readowl-purple-extralight/40 ${editor?.isActive('orderedList') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <ListOrdered size={18} />
        </button>

        <span className="mx-1 opacity-40">|</span>

        {/* Align */}
        <button title="Esq." onClick={() => alignCurrentBlock('left')} className={`px-1 py-0.5 hover:bg-readowl-purple-extralight/40 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h12" /><path d="M3 18h18" /></svg>
        </button>
        <button title="Centro" onClick={() => alignCurrentBlock('center')} className={`px-1 py-0.5 hover:bg-readowl-purple-extralight/40 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M6 12h12" /><path d="M3 18h18" /></svg>
        </button>
        <button title="Dir." onClick={() => alignCurrentBlock('right')} className={`px-1 py-0.5 hover:bg-readowl-purple-extralight/40 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M9 12h12" /><path d="M3 18h18" /></svg>
        </button>

        <span className="mx-1 opacity-40">|</span>

        {/* Quote */}
        <button title="Citação" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 ${editor?.isActive('blockquote') ? 'bg-readowl-purple-extralight/60' : ''}`}>
          <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M7 7h5v5H7zM12 12c0 3-2 5-5 5v-2c2 0 3-1 3-3H5V7h7v5zM19 7h-5v5h5zM14 12c0 3 2 5 5 5v-2c-2 0-3-1-3-3h5V7h-7v5z" />
          </svg>
        </button>
        <button title="Linha" onClick={() => editor?.chain().focus().setHorizontalRule().run()} className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40">
          <span className="block w-[18px] h-[18px] text-[#836DBE]" aria-hidden>
            <span className="block w-full h-[2px] bg-current mt-[8px]" />
          </span>
        </button>

        <span className="mx-1 opacity-40">|</span>

        {/* Fix spacing */}
        <button
          title="Corrigir espaçamento"
          onClick={() => {
            const current = editor?.getHTML() || '';
            // Also normalize any legacy <div> blocks before spacing normalization
            const divToP = (h: string) => h
              .replace(/<div\b([^>]*)>/gi, '<p$1>')
              .replace(/<\/div>/gi, '</p>')
              .replace(/<p\b[^>]*>\s*<p\b/gi, '<p')
              .replace(/<\/p>\s*<\/p>/gi, '</p>');
            const normalized = normalizeHtmlSpacing(divToP(current));
            editor?.commands.setContent(normalized, false);
          }}
          className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40"
        >
          <span className="block w-[18px] h-[18px] text-[#836DBE]" aria-hidden>
            {/* icon: adjust spacing */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 6 12 2 16 6" />
              <polyline points="8 18 12 22 16 18" />
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
          </span>
        </button>
        <button title="Limpar formatação" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40">
          <Eraser size={18} />
        </button>
      </div>

      {/* Editor area on extralight */}
      <div className="relative bg-readowl-purple-extralight px-3 py-2 min-h-[16rem]">
        {isEmpty && (
          <div className="absolute top-2 left-3 text-readowl-purple-extradark/40 pointer-events-none select-none">Conteúdo...</div>
        )}
        <EditorContent editor={editor} />
        {/* Counter */}
        <div className="absolute right-2 bottom-1 text-[11px] text-readowl-purple-extradark/60 select-none" aria-live="polite">
          {charCount}/{maxChars} · {wordCount} palavra{wordCount === 1 ? '' : 's'}
        </div>
      </div>

      {/* Link modal */}
      {linkOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white text-readowl-purple border-2 border-readowl-purple/40 p-4 w-[90%] max-w-sm">
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
              <button
                onClick={() => {
                  try {
                    const u = new URL(linkUrl);
                    if (!['http:', 'https:'].includes(u.protocol)) return;
                    editor?.chain().focus().setLink({ href: u.toString() }).run();
                    setLinkOpen(false);
                  } catch { }
                }}
                className="px-3 py-1 bg-readowl-purple-light text-white"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image modal */}
      {imageOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white text-readowl-purple border-2 border-readowl-purple/40 p-4 w-[90%] max-w-sm">
            <h3 className="font-semibold mb-2">Adicionar imagem por URL</h3>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-readowl-purple/30 px-3 py-2 mb-3 outline-none"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-readowl-purple/80">Largura (px)</label>
                <input
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Original"
                  inputMode="numeric"
                  className="w-full border border-readowl-purple/30 px-3 py-2 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-readowl-purple/80">Altura (px)</label>
                <input
                  value={imageHeight}
                  onChange={(e) => setImageHeight(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Original"
                  inputMode="numeric"
                  className="w-full border border-readowl-purple/30 px-3 py-2 outline-none"
                />
              </div>
            </div>
            <p className="text-sm mb-3">Apenas domínios permitidos (veja hosts em Configuração de imagens).</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setImageOpen(false)} className="px-3 py-1 border border-readowl-purple/30">
                Cancelar
              </button>
              <button
                onClick={() => {
                  try {
                    const u = new URL(imageUrl);
                    if (!['http:', 'https:'].includes(u.protocol)) return;
                    const attrs: Record<string, unknown> = { src: u.toString() };
                    if (imageWidth) attrs.width = parseInt(imageWidth, 10);
                    if (imageHeight) attrs.height = parseInt(imageHeight, 10);
                    editor?.chain().focus().setImage(attrs).run();
                    setImageOpen(false);
                  } catch { }
                }}
                className="px-3 py-1 bg-readowl-purple-light text-white"
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
