"use client";
import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
// Access ReactNodeViewRenderer from the module in a way that works across minor versions
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNVR = (require('@tiptap/react') as { ReactNodeViewRenderer: (component: unknown, options?: unknown) => unknown }).ReactNodeViewRenderer;
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import NextImage from 'next/image';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import ResizableImage from './ResizableImage';
import { normalizeHtmlSpacing } from '@/lib/sanitize';

// Props contract
// - value: current HTML
// - onChange: callback with sanitized HTML
// - maxChars: hard character limit for plain text length
// - error/showError: optional error display
export type SynopsisEditorProps = {
  value: string;
  onChange: (html: string) => void;
  maxChars: number;
  error?: string;
  showError?: boolean;
};

function getTextLen(html: string) {
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, ' ').trim().length;
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || div.innerText || '').length;
}

export default function SynopsisEditor({ value, onChange, maxChars, error, showError }: SynopsisEditorProps) {
  const [charCount, setCharCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lastGoodHtmlRef = useRef<string>(value || '<p></p>');
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState<string>('');
  const [imageHeight, setImageHeight] = useState<string>('');

  // Ensure alignment works when selecting an image node by moving to a nearby text selection first
  const alignCurrentBlock = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    const { state, view } = editor;
    const sel = state.selection as unknown;
    if (sel instanceof NodeSelection) {
      try {
        const ns = sel as NodeSelection;
        const nearLeft = TextSelection.near(state.doc.resolve(ns.from), -1);
        view.dispatch(state.tr.setSelection(nearLeft));
      } catch {
        // ignore and attempt to align anyway
      }
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
          addNodeView() {
            return RNVR(ResizableImage);
          },
        }).configure({ inline: true, allowBase64: false }),
      ],
      content: value || '<p></p>',
      immediatelyRender: false,
      editorProps: {
        attributes: {
          // Style: editor text purple like other inputs; links darker; hr extra dark inside editor for visibility
          class:
            [
              'prose prose-sm max-w-none focus:outline-none',
              // base text color across elements
              'text-readowl-purple-dark',
              'prose-p:text-readowl-purple-dark',
              'prose-li:text-readowl-purple-dark',
              'prose-strong:text-readowl-purple-dark',
              'prose-code:text-readowl-purple-medium',
              'prose-h2:text-readowl-purple-extradark',
              'prose-h3:text-readowl-purple-extradark',
              // links should be a darker purple
              'prose-a:text-readowl-purple-extradark',
              // Inside the editor, hr should be Readowl purple medium
              'prose-hr:border-t prose-hr:border-readowl-purple-medium prose-hr:opacity-100'
            ].join(' '),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handlePaste(view: any, event: any) {
          const dt = event.clipboardData;
          const items = dt?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].kind === 'file') {
                event.preventDefault();
                return true;
              }
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
          const divToP = (h: string) => h
            .replace(/<div\b([^>]*)>/gi, '<p$1>')
            .replace(/<\/div>/gi, '</p>')
            .replace(/<p\b[^>]*>\s*<p\b/gi, '<p')
            .replace(/<\/p>\s*<\/p>/gi, '</p>');
          // Convert directly like ChapterEditor (fragment extraction may drop content in some cases)
          const incomingHtml = html ? divToP(html) : plainToHtml(plain);
          const normalized = normalizeHtmlSpacing(incomingHtml);
          // Enforce maxChars by truncating paste if needed (keep behavior close to ChapterEditor but user-friendly)
          const currentLen = editor?.getText().length ?? 0;
          const allowed = Math.max(0, maxChars - currentLen);
          if (allowed === 0) { return true; }
          const normalizedPlainLen = (() => {
            const d = document.createElement('div'); d.innerHTML = normalized; return (d.textContent || d.innerText || '').length;
          })();
          if (normalizedPlainLen > allowed) {
            const sourcePlain = plain || (() => { const d = document.createElement('div'); d.innerHTML = normalized; return d.textContent || d.innerText || ''; })();
            const truncated = sourcePlain.slice(0, allowed);
            const truncatedHtml = plainToHtml(truncated);
            editor?.chain().focus().insertContent(truncatedHtml).run();
          } else {
            editor?.chain().focus().insertContent(normalized).run();
          }
          return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handleDrop(view: any, event: any) {
          if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onUpdate({ editor }: any) {
        const html = editor.getHTML();
        const len = editor.getText().length;
        setCharCount(len);
        if (len > maxChars) {
          editor.commands.setContent(lastGoodHtmlRef.current || '<p></p>', false);
          return;
        }
        lastGoodHtmlRef.current = html;
        onChange(html);
      },
    },
    []
  );

  useEffect(() => {
    setMounted(true);
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', false);
      setCharCount(getTextLen(value || ''));
      lastGoodHtmlRef.current = value || '<p></p>';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const isLinkActive = !!editor?.isActive('link');

  // Close mobile menu with ESC
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  if (!mounted) {
    // Defer rendering until client mount to avoid hydration glitches
    return (
      <div className={`w-full bg-white rounded-none shadow-none overflow-hidden`}>
        <div className="flex flex-nowrap items-center gap-1 text-readowl-purple-medium bg-white px-2 py-1" />
        <div className="px-4 py-3 min-h-[18rem] max-h-[28rem] overflow-y-auto" />
        <div className="flex justify-between text-xs mt-1 text-white/80" />
      </div>
    );
  }

  return (
    <div>
      {/* Local style for recoloring raster/SVG icons in mobile toolbar to readowl purple medium */}
      <style jsx>{`
        /* Keep original SVG brand color (no filter) */
        .readowl-icon { filter: none; }
      `}</style>
      {/* Integrated white container: toolbar + editor */}
      <div
        className={`w-full bg-white rounded-none shadow-none overflow-hidden`}
        onClick={() => editor?.chain().focus().run()}
      >
        {/* Toolbar (desktop) */}
        <div className="hidden md:flex flex-nowrap items-center gap-1.5 whitespace-nowrap text-readowl-purple-medium bg-white px-2 py-1 border-b border-readowl-purple/10">
          <button
            type="button"
            title="Desfazer (Ctrl/Cmd+Z)"
            onClick={() => editor?.chain().focus().undo().run()}
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <NextImage src="/img/svg/tiptap/arrow-undo.svg" width={20} height={20} alt="Desfazer" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Refazer (Ctrl/Cmd+Shift+Z)"
            onClick={() => editor?.chain().focus().redo().run()}
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <NextImage src="/img/svg/tiptap/arrow-redo.svg" width={20} height={20} alt="Refazer" aria-hidden className="pointer-events-none select-none" />
          </button>
          <span className="mx-1 opacity-40">|</span>
          <div className="relative">
            <select
              title="Título"
              className="appearance-none pl-1.5 pr-5 py-0.5 pt-1 rounded border border-readowl-purple/30 text-readowl-purple-medium text-xs bg-white hover:bg-readowl-purple-extralight/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
          <span className="mx-1 opacity-40">|</span>
          <button
            type="button"
            title="Negrito (Ctrl/Cmd+B)"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('bold') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/bold.svg" width={20} height={20} alt="Negrito" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Itálico (Ctrl/Cmd+I)"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('italic') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/italic.svg" width={20} height={20} alt="Itálico" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Sublinhado (Ctrl/Cmd+U)"
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('underline') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/underlined.svg" width={20} height={20} alt="Sublinhado" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Tachado"
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('strike') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/strikethrough.svg" width={20} height={20} alt="Tachado" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Código (Ctrl/Cmd+E)"
            onClick={() => editor?.chain().focus().toggleCode().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('code') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/code.svg" width={20} height={20} alt="Código" aria-hidden className="pointer-events-none select-none" />
          </button>
          <span className="mx-1 opacity-40">|</span>
          <button
            type="button"
            title={isLinkActive ? 'Remover link' : 'Adicionar link'}
            onClick={() =>
              isLinkActive ? editor?.chain().focus().unsetLink().run() : (setLinkUrl(''), setLinkOpen(true))
            }
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <NextImage src="/img/svg/tiptap/add-link.svg" width={20} height={20} alt="Link" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Imagem"
            onClick={() => {
              setImageUrl('');
              setImageWidth('');
              setImageHeight('');
              setImageOpen(true);
            }}
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <NextImage src="/img/svg/tiptap/add-image.svg" width={20} height={20} alt="Imagem" aria-hidden className="pointer-events-none select-none" />
          </button>
          <span className="mx-1 opacity-40">|</span>
          <button
            type="button"
            title="Lista •"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('bulletList') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/bulleted-list.svg" width={20} height={20} alt="Lista" aria-hidden className="pointer-events-none select-none" />
          </button>
          <button
            type="button"
            title="Lista 1."
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('orderedList') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <NextImage src="/img/svg/tiptap/numbered-list.svg" width={20} height={20} alt="Lista numerada" aria-hidden className="pointer-events-none select-none" />
          </button>
          <span className="mx-1 opacity-40">|</span>
          <button
            type="button"
            title="Alinhar à esquerda"
            onClick={() => alignCurrentBlock('left')}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18" />
              <path d="M3 12h12" />
              <path d="M3 18h18" />
            </svg>
          </button>
          <button
            type="button"
            title="Centralizar"
            onClick={() => alignCurrentBlock('center')}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18" />
              <path d="M6 12h12" />
              <path d="M3 18h18" />
            </svg>
          </button>
          <button
            type="button"
            title="Alinhar à direita"
            onClick={() => alignCurrentBlock('right')}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6h18" />
              <path d="M9 12h12" />
              <path d="M3 18h18" />
            </svg>
          </button>
          <span className="mx-1 opacity-40">|</span>
          <button
            type="button"
            title="Citação"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30 ${editor?.isActive('blockquote') ? 'bg-readowl-purple-extralight/60' : ''
              }`}
          >
            <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M7 7h5v5H7zM12 12c0 3-2 5-5 5v-2c2 0 3-1 3-3H5V7h7v5zM19 7h-5v5h5zM14 12c0 3 2 5 5 5v-2c-2 0-3-1-3-3h5V7h-7v5z" />
            </svg>
          </button>
          <button
            type="button"
            title="Linha"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <span className="block w-[18px] h-[18px] text-[#836DBE]" aria-hidden>
              <span className="block w-full h-[2px] bg-current mt-[8px]" />
            </span>
          </button>
          <span className="mx-1 opacity-40">|</span>
          <button
            type="button"
            title="Corrigir espaçamento"
            onClick={() => {
              const current = editor?.getHTML() || '';
              const divToP = (h: string) => h
                .replace(/<div\b([^>]*)>/gi, '<p$1>')
                .replace(/<\/div>/gi, '</p>')
                .replace(/<p\b[^>]*>\s*<p\b/gi, '<p')
                .replace(/<\/p>\s*<\/p>/gi, '</p>');
              const normalized = normalizeHtmlSpacing(divToP(current));
              editor?.commands.setContent(normalized, false);
            }}
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <span className="block w-[18px] h-[18px] text-[#836DBE]" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 6 12 2 16 6" />
                <polyline points="8 18 12 22 16 18" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            </span>
          </button>
          <button
            type="button"
            title="Limpar formatação"
            onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
            className="px-1 py-0.5 rounded-none hover:bg-readowl-purple-extralight/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-readowl-purple/30"
          >
            <NextImage src="/img/svg/tiptap/format-clear.svg" width={20} height={20} alt="Limpar formatação" aria-hidden className="pointer-events-none select-none" />
          </button>
        </div>

        {/* Toolbar (mobile, compact) */}
        <div className="md:hidden flex items-center justify-between gap-1.5 text-readowl-purple-medium bg-white px-2 py-1 border-b border-readowl-purple/10">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              title="Desfazer"
              onClick={() => editor?.chain().focus().undo().run()}
              className="px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent"
            >
              <NextImage src="/img/svg/tiptap/arrow-undo.svg" width={20} height={20} alt="Desfazer" aria-hidden className="pointer-events-none select-none readowl-icon" />
            </button>
            <button
              type="button"
              title="Refazer"
              onClick={() => editor?.chain().focus().redo().run()}
              className="px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent"
            >
              <NextImage src="/img/svg/tiptap/arrow-redo.svg" width={20} height={20} alt="Refazer" aria-hidden className="pointer-events-none select-none readowl-icon" />
            </button>
            <span className="mx-1 opacity-40">|</span>
            <button
              type="button"
              title="Negrito"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent ${editor?.isActive('bold') ? 'bg-readowl-purple-extralight/60' : ''}`}
            >
              <NextImage src="/img/svg/tiptap/bold.svg" width={20} height={20} alt="Negrito" aria-hidden className="pointer-events-none select-none readowl-icon" />
            </button>
            <button
              type="button"
              title="Itálico"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent ${editor?.isActive('italic') ? 'bg-readowl-purple-extralight/60' : ''}`}
            >
              <NextImage src="/img/svg/tiptap/italic.svg" width={20} height={20} alt="Itálico" aria-hidden className="pointer-events-none select-none readowl-icon" />
            </button>
            <button
              type="button"
              title={isLinkActive ? 'Remover link' : 'Adicionar link'}
              onClick={() => isLinkActive ? editor?.chain().focus().unsetLink().run() : (setLinkUrl(''), setLinkOpen(true))}
              className="px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent"
            >
              <NextImage src="/img/svg/tiptap/add-link.svg" width={20} height={20} alt="Link" aria-hidden className="pointer-events-none select-none readowl-icon" />
            </button>
            <button
              type="button"
              title="Imagem"
              onClick={() => { setImageUrl(''); setImageWidth(''); setImageHeight(''); setImageOpen(true); }}
              className="px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent"
            >
              <NextImage src="/img/svg/tiptap/add-image.svg" width={20} height={20} alt="Imagem" aria-hidden className="pointer-events-none select-none readowl-icon" />
            </button>
          </div>
          <button
            type="button"
            title="Mais opções"
            onClick={() => setMoreOpen(true)}
            className="px-2 py-1 rounded-md hover:bg-readowl-purple-extralight/40 bg-transparent"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            {/* List icon */}
            <svg className="text-[#836DBE]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="1" />
              <circle cx="4" cy="12" r="1" />
              <circle cx="4" cy="18" r="1" />
            </svg>
          </button>
        </div>

        {/* Editor */}
        <div className="px-4 py-3 min-h-[18rem] max-h-[28rem] overflow-y-auto tiptap-editor">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Mobile bottom-sheet for more options */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-white text-readowl-purple rounded-t-xl shadow-xl border-t border-readowl-purple/10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-readowl-purple/10">
              <h3 className="font-medium">Ferramentas</h3>
              <button onClick={() => setMoreOpen(false)} className="px-2 py-1 hover:bg-readowl-purple-extralight/40 rounded">
                <span className="sr-only">Fechar</span>
                <svg className="text-[#836DBE]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-3 py-2 max-h-[50vh] overflow-y-auto">
              {/* Headings (segmented control) */}
              <div className="mb-3">
                <span className="block text-xs mb-1 text-readowl-purple/80">Título</span>
                <div className="inline-flex rounded border border-readowl-purple/20 overflow-hidden">
                  <button
                    type="button"
                    title="Parágrafo"
                    className={`px-4 py-2 text-base hover:bg-readowl-purple-extralight/40 ${editor?.isActive('paragraph') ? 'bg-readowl-purple-extralight/60' : 'bg-white'
                      }`}
                    aria-pressed={editor?.isActive('paragraph')}
                    onClick={() => { editor?.chain().focus().setParagraph().run(); setMoreOpen(false); }}
                  >
                    P
                  </button>
                  <button
                    type="button"
                    title="Título H2"
                    className={`px-4 py-2 text-base hover:bg-readowl-purple-extralight/40 border-l border-readowl-purple/20 ${editor?.isActive('heading', { level: 2 }) ? 'bg-readowl-purple-extralight/60' : 'bg-white'
                      }`}
                    aria-pressed={editor?.isActive('heading', { level: 2 })}
                    onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setMoreOpen(false); }}
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    title="Título H3"
                    className={`px-4 py-2 text-base hover:bg-readowl-purple-extralight/40 border-l border-readowl-purple/20 ${editor?.isActive('heading', { level: 3 }) ? 'bg-readowl-purple-extralight/60' : 'bg-white'
                      }`}
                    aria-pressed={editor?.isActive('heading', { level: 3 })}
                    onClick={() => { editor?.chain().focus().toggleHeading({ level: 3 }).run(); setMoreOpen(false); }}
                  >
                    H3
                  </button>
                </div>
              </div>

              {/* Marks */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <button aria-label="Sublinhar" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive('underline') ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { editor?.chain().focus().toggleUnderline().run(); setMoreOpen(false); }}>
                  <svg className="text-[#836DBE]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M7 4v7a5 5 0 0010 0V4" />
                    <line x1="5" y1="20" x2="19" y2="20" />
                  </svg>
                </button>
                <button aria-label="Tachado" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive('strike') ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { editor?.chain().focus().toggleStrike().run(); setMoreOpen(false); }}>
                  <NextImage src="/img/svg/tiptap/strikethrough.svg" width={20} height={20} alt="Tachado" aria-hidden className="pointer-events-none select-none readowl-icon" />
                </button>
                <button aria-label="Código" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive('code') ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { editor?.chain().focus().toggleCode().run(); setMoreOpen(false); }}>
                  <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </button>
                <button aria-label="Limpar formatação" className="p-2 border border-readowl-purple/20 rounded flex items-center justify-center hover:bg-readowl-purple-extralight/40" onClick={() => { editor?.chain().focus().clearNodes().unsetAllMarks().run(); setMoreOpen(false); }}>
                  <NextImage src="/img/svg/tiptap/format-clear.svg" width={20} height={20} alt="Limpar" aria-hidden className="pointer-events-none select-none readowl-icon" />
                </button>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button aria-label="Lista com marcadores" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive('bulletList') ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { editor?.chain().focus().toggleBulletList().run(); setMoreOpen(false); }}>
                  <NextImage src="/img/svg/tiptap/bulleted-list.svg" width={20} height={20} alt="Lista" aria-hidden className="pointer-events-none select-none readowl-icon" />
                </button>
                <button aria-label="Lista numerada" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive('orderedList') ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { editor?.chain().focus().toggleOrderedList().run(); setMoreOpen(false); }}>
                  <NextImage src="/img/svg/tiptap/numbered-list.svg" width={20} height={20} alt="Lista numerada" aria-hidden className="pointer-events-none select-none readowl-icon" />
                </button>
              </div>

              {/* Align */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button aria-label="Alinhar à esquerda" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'left' }) ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { alignCurrentBlock('left'); setMoreOpen(false); }}>
                  <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18" />
                    <path d="M3 12h12" />
                    <path d="M3 18h18" />
                  </svg>
                </button>
                <button aria-label="Centralizar" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'center' }) ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { alignCurrentBlock('center'); setMoreOpen(false); }}>
                  <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18" />
                    <path d="M6 12h12" />
                    <path d="M3 18h18" />
                  </svg>
                </button>
                <button aria-label="Alinhar à direita" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive({ textAlign: 'right' }) ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { alignCurrentBlock('right'); setMoreOpen(false); }}>
                  <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18" />
                    <path d="M9 12h12" />
                    <path d="M3 18h18" />
                  </svg>
                </button>
              </div>

              {/* Blocks */}
              <div className="grid grid-cols-2 gap-2">
                <button aria-label="Citação" className={`p-2 border border-readowl-purple/20 rounded flex items-center justify-center ${editor?.isActive('blockquote') ? 'bg-readowl-purple-extralight/60' : ''} hover:bg-readowl-purple-extralight/40`} onClick={() => { editor?.chain().focus().toggleBlockquote().run(); setMoreOpen(false); }}>
                  <svg className="text-[#836DBE]" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M7 7h5v5H7zM12 12c0 3-2 5-5 5v-2c2 0 3-1 3-3H5V7h7v5zM19 7h-5v5h5zM14 12c0 3 2 5 5 5v-2c-2 0-3-1-3-3h5V7h-7v5z" />
                  </svg>
                </button>
                <button aria-label="Linha horizontal" className="p-2 border border-readowl-purple/20 rounded flex items-center justify-center hover:bg-readowl-purple-extralight/40" onClick={() => { editor?.chain().focus().setHorizontalRule().run(); setMoreOpen(false); }}>
                  <span className="block w-[18px] h-[18px]" aria-hidden>
                    <span className="block w-full h-[2px] bg-[#836DBE] mt-[8px]" />
                  </span>
                </button>
                {/* Fix spacing (mobile sheet) */}
                <button aria-label="Corrigir espaçamento" className="p-2 border border-readowl-purple/20 rounded flex items-center justify-center hover:bg-readowl-purple-extralight/40" onClick={() => { const current = editor?.getHTML() || ''; const divToP = (h: string) => h.replace(/<div\b([^>]*)>/gi, '<p$1>').replace(/<\/div>/gi, '</p>').replace(/<p\b[^>]*>\s*<p\b/gi, '<p').replace(/<\/p>\s*<\/p>/gi, '</p>'); const normalized = normalizeHtmlSpacing(divToP(current)); editor?.commands.setContent(normalized, false); setMoreOpen(false); }}>
                  <span className="block w-[18px] h-[18px]" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="8 6 12 2 16 6" />
                      <polyline points="8 18 12 22 16 18" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                      <line x1="6" y1="12" x2="18" y2="12" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    editor?.chain()
                      .focus()
                      .setLink({ href: u.toString(), target: '_blank', rel: 'nofollow noopener noreferrer' })
                      .run();
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

      <div className="flex justify-between text-xs mt-1 text-white/80">
        {showError && error ? <span className="text-red-300">{error}</span> : <span />}
        <span>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  );
}
