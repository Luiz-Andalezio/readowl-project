"use client";
import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import ResizableImage from '@/components/ui/tiptap/ResizableImage';
import { normalizeHtmlSpacing } from '@/lib/sanitize';
import { Bold, Italic, Strikethrough, Link as LinkIcon, Image as ImageIcon, SendHorizontal, X } from 'lucide-react';

// Ensure ReactNodeViewRenderer import works across versions
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RNVR = (require('@tiptap/react') as { ReactNodeViewRenderer: (component: unknown, options?: unknown) => unknown }).ReactNodeViewRenderer;

export type CommentInputProps = {
  placeholder?: string;
  maxChars?: number;
  onSubmit: (html: string) => Promise<void> | void;
  className?: string;
  compact?: boolean; // used for replies (smaller, indented)
  onCancel?: () => void;
  initialHtml?: string;
};

export default function CommentInput({ maxChars = 1200, onSubmit, className, compact = false, onCancel, initialHtml }: CommentInputProps) {
  const [mounted, setMounted] = React.useState(false);
  // tick is used only to force React re-render when editor selection/marks change
  const [, setTick] = React.useState(0);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [imageOpen, setImageOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [imageWidth, setImageWidth] = React.useState('');
  const [imageHeight, setImageHeight] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const alignWorkaround = (ed: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = ed as any;
    const { state, view } = e;
    const sel = state.selection as unknown;
    if (sel instanceof NodeSelection) {
      try { const ns = sel as NodeSelection; const near = TextSelection.near(state.doc.resolve(ns.from), -1); view.dispatch(state.tr.setSelection(near)); } catch {}
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ dropcursor: { class: 'tiptap-dropcursor' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: 'nofollow noopener noreferrer', target: '_blank', class: 'no-underline underline-offset-2 hover:underline' },
      }),
      ImageExtension.extend({
        addAttributes() { const parent = (this.parent as unknown as (() => Record<string, unknown>) | undefined)?.(); return { ...(parent || {}), href: { default: null } }; },
        renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }): DOMOutputSpec {
          const { href, ...attrs } = HTMLAttributes as Record<string, string>;
          const img: DOMOutputSpec = ['img', attrs];
          return href ? ['a', { href, rel: 'nofollow noopener noreferrer', target: '_blank' }, img] : img;
        },
        addNodeView() { return RNVR(ResizableImage); },
      }).configure({ inline: true, allowBase64: false }),
    ],
    content: initialHtml && initialHtml.trim().length > 0 ? initialHtml : '<p></p>',
  immediatelyRender: false,
  editorProps: {
      attributes: {
        class: [
          'ProseMirror focus:outline-none',
          'prose prose-sm max-w-none',
          'text-white',
          'prose-p:text-white',
          'prose-strong:text-white',
          'prose-em:text-white',
          'prose-a:text-white',
        ].join(' '),
  },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handlePaste(_view: any, event: any) {
        const dt = event.clipboardData;
        const html = dt?.getData('text/html');
        const plain = dt?.getData('text/plain');
        if (!html && !plain) return false;
        event.preventDefault();
        const plainToHtml = (txt: string) => {
          const safe = (txt || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00A0/g, ' ');
          const blocks = safe.split(/\n{2,}/).map((b) => `<p>${b.replace(/\n/g, '<br>')}</p>`).join('');
          return blocks || '<p></p>';
        };
        const divToP = (h: string) => h.replace(/<div\b([^>]*)>/gi, '<p$1>').replace(/<\/div>/gi, '</p>')
          .replace(/<p\b[^>]*>\s*<p\b/gi, '<p').replace(/<\/p>\s*<\/p>/gi, '</p>');
        const incoming = html ? divToP(html) : plainToHtml(plain || '');
        const normalized = normalizeHtmlSpacing(incoming);
        const currentLen = editor?.getText().length ?? 0;
        const allowed = Math.max(0, maxChars - currentLen);
        if (allowed === 0) return true;
        const tmp = document.createElement('div'); tmp.innerHTML = normalized; const normalizedLen = (tmp.textContent || tmp.innerText || '').length;
        if (normalizedLen > allowed) {
          const truncated = (plain || (tmp.textContent || tmp.innerText || '')).slice(0, allowed);
          editor?.chain().focus().insertContent(plainToHtml(truncated)).run();
        } else { editor?.chain().focus().insertContent(normalized).run(); }
        return true;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleDrop(_v: any, event: any) { if (event.dataTransfer?.files?.length) { event.preventDefault(); return true; } return false; },
    },
  }, []);

  React.useEffect(() => setMounted(true), []);

  // Keep toolbar active states in sync with editor selection and mark changes
  React.useEffect(() => {
    if (!editor) return;
    const rerender = () => setTick((t) => (t + 1) % 1000);
    editor.on('selectionUpdate', rerender);
    editor.on('transaction', rerender);
    editor.on('update', rerender);
    return () => {
      editor.off('selectionUpdate', rerender);
      editor.off('transaction', rerender);
      editor.off('update', rerender);
    };
  }, [editor]);

  const send = async () => {
    if (!editor || sending) return;
    const html = editor.getHTML();
    const len = editor.getText().trim().length;
    if (len === 0) return;
    setSending(true);
    try { await onSubmit(html); editor.commands.setContent('<p></p>', false); } finally { setSending(false); }
  };

  if (!mounted) return <div className={`w-full bg-readowl-purple-extradark rounded-md min-h-[120px] ${className || ''}`} />;

  return (
    <div className={`relative rounded-md border-2 border-readowl-purple bg-readowl-purple-extradark p-3 ${compact ? 'ml-8' : ''} ${className || ''}`}>
      {/* toolbar */}
      <div className="flex items-center gap-2 text-white">
        <button type="button" aria-label="Negrito" onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1 rounded ${editor?.isActive('bold') ? 'bg-readowl-purple/30 text-white opacity-100' : 'opacity-50 hover:opacity-100 hover:text-white'}`}>
          <Bold size={18} strokeWidth={2.5} />
        </button>
        <button type="button" aria-label="Itálico" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1 rounded ${editor?.isActive('italic') ? 'bg-readowl-purple/30 text-white opacity-100' : 'opacity-50 hover:opacity-100 hover:text-white'}`}>
          <Italic size={18} strokeWidth={2.5} />
        </button>
        <button type="button" aria-label="Tachado" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`p-1 rounded ${editor?.isActive('strike') ? 'bg-readowl-purple/30 text-white opacity-100' : 'opacity-50 hover:opacity-100 hover:text-white'}`}>
          <Strikethrough size={18} strokeWidth={2.5} />
        </button>
        <button type="button" aria-label="Adicionar link" onClick={() => { setLinkUrl(''); setLinkOpen(true); }} className="p-1 rounded hover:text-white">
          <LinkIcon size={18} strokeWidth={2.5} />
        </button>
        <button type="button" aria-label="Adicionar imagem" onClick={() => { setImageUrl(''); setImageWidth(''); setImageHeight(''); setImageOpen(true); }} className="p-1 rounded hover:text-white">
          <ImageIcon size={18} strokeWidth={2.5} />
        </button>
        {onCancel && (
          <div className="ml-auto">
            <button type="button" aria-label="Cancelar" onClick={onCancel} className="p-1 rounded hover:text-white">
              <X size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="px-2 py-2 min-h-[100px] max-h-[280px] overflow-y-auto [&_.ProseMirror_p]:m-0 [&_.ProseMirror_p+_.ProseMirror_p]:mt-2 [&_.ProseMirror_a]:underline-offset-2">
          <EditorContent editor={editor} />
        </div>
      </div>
      <div className="absolute right-3 bottom-3">
        <button disabled={sending} onClick={send} aria-label="Enviar" className={`p-1 rounded ${sending ? 'opacity-50 cursor-not-allowed' : 'hover:text-white'} text-white`}>
          <SendHorizontal size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Link modal (reuses logic from synopsis) */}
      {linkOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setLinkOpen(false)} />
          <div className="relative bg-white text-readowl-purple p-4 w-[90%] max-w-sm border-2 border-readowl-purple">
            <h3 className="font-semibold mb-2">Adicionar link</h3>
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full border border-readowl-purple/30 px-3 py-2 mb-3 outline-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setLinkOpen(false)} className="px-3 py-1 border border-readowl-purple/30">Cancelar</button>
              <button onClick={() => { try { const u = new URL(linkUrl); if (!['http:', 'https:'].includes(u.protocol)) return; alignWorkaround(editor); editor?.chain().focus().setLink({ href: u.toString(), target: '_blank', rel: 'nofollow noopener noreferrer' }).run(); setLinkOpen(false); } catch {} }} className="px-3 py-1 bg-readowl-purple-light text-white">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Image modal (reuse) */}
      {imageOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setImageOpen(false)} />
          <div className="relative bg-white text-readowl-purple p-4 w-[90%] max-w-sm border-2 border-readowl-purple">
            <h3 className="font-semibold mb-2">Adicionar imagem por URL</h3>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." className="w-full border border-readowl-purple/30 px-3 py-2 mb-3 outline-none" />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-readowl-purple/80">Largura (px)</label>
                <input value={imageWidth} onChange={(e) => setImageWidth(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Original" inputMode="numeric" className="w-full border border-readowl-purple/30 px-3 py-2 outline-none" />
              </div>
              <div>
                <label className="text-xs text-readowl-purple/80">Altura (px)</label>
                <input value={imageHeight} onChange={(e) => setImageHeight(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Original" inputMode="numeric" className="w-full border border-readowl-purple/30 px-3 py-2 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setImageOpen(false)} className="px-3 py-1 border border-readowl-purple/30">Cancelar</button>
              <button onClick={() => { try { const u = new URL(imageUrl); if (!['http:', 'https:'].includes(u.protocol)) return; const attrs: Record<string, unknown> = { src: u.toString() }; if (imageWidth) attrs.width = parseInt(imageWidth, 10); if (imageHeight) attrs.height = parseInt(imageHeight, 10); editor?.chain().focus().setImage(attrs).run(); setImageOpen(false); } catch {} }} className="px-3 py-1 bg-readowl-purple-light text-white">Inserir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
