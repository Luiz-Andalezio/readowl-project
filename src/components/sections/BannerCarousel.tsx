"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, GalleryThumbnails, Pencil, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import ButtonWithIcon from "@/components/ui/button/ButtonWithIcon";

export type BannerItem = { name: string; imageUrl: string; linkUrl: string };

type Props = {
  initialBanners?: BannerItem[];
  isAdmin?: boolean; // controls visibility of the GalleryThumbnails button
  className?: string;
};

// Load an image and return its natural size
function getImageSize(url: string): Promise<{ width: number; height: number }>
{
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}

// Validate image: minimum 1050x450 and 7:3 aspect ratio (±2%)
async function validateBannerImage(url: string): Promise<string | null> {
  try {
    const { width, height } = await getImageSize(url);
    if (width < 1050 || height < 450) return `A imagem deve ter no mínimo 1050x450 (atual: ${width}x${height}).`;
    const ratio = width / height;
    const target = 7 / 3;
    const tolerance = 0.02 * target; // ±2%
    if (Math.abs(ratio - target) > tolerance) return `A imagem precisa seguir a proporção 7:3 (aprox. ${target.toFixed(2)}).`;
    return null;
  } catch {
    return "Não foi possível validar a imagem. Verifique a URL.";
  }
}

export default function BannerCarousel({ initialBanners = [], isAdmin = false, className = "" }: Props) {
  // Runtime env
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Public carousel state
  const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Admin modal state
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BannerItem[]>(initialBanners);
  const [editing, setEditing] = useState<Set<number>>(new Set());
  const [backups, setBackups] = useState<Record<number, BannerItem>>({});
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  // Keep draft in sync when opening modal
  useEffect(() => {
    if (!open) return;
  setDraft(banners);
    setEditing(new Set());
    setBackups({});
    setErrors({});
  }, [open, banners]);

  // Carousel autoplay
  useEffect(() => {
    if (prefersReducedMotion) return; // respect user setting
    if (banners.length <= 1) return;
    if (paused || open) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length, paused, open, prefersReducedMotion]);

  // Keyboard nav when focused
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + banners.length) % Math.max(banners.length, 1));
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % Math.max(banners.length, 1));
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [banners.length]);

  // Pointer drag to navigate
  useEffect(() => {
    const el = dragRef.current; if (!el) return;
    let isDown = false; let startX = 0; let startY = 0; let didDrag = false;
    const threshold = 40;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDown = true; didDrag = false; startX = e.clientX; startY = e.clientY;
      el.setPointerCapture(e.pointerId);
      setPaused(true);
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      if (!didDrag && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      didDrag = true;
      e.preventDefault();
    };
    const onUp = (e: PointerEvent) => {
      if (!isDown) return; isDown = false; el.releasePointerCapture(e.pointerId);
      const dx = e.clientX - startX;
      if (didDrag) {
        if (dx > threshold) setIndex((i) => (i - 1 + banners.length) % Math.max(banners.length, 1));
        else if (dx < -threshold) setIndex((i) => (i + 1) % Math.max(banners.length, 1));
      }
      setTimeout(() => setPaused(false), 300);
    };
    el.addEventListener('pointerdown', onDown, { passive: true });
    el.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [banners.length]);

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(banners), [draft, banners]);
  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  // Helpers for admin modal rows
  const startEdit = (i: number) => {
    setEditing((prev) => new Set(prev).add(i));
    setBackups((prev) => ({ ...prev, [i]: { ...draft[i] } }));
  };
  const cancelEdit = (i: number) => {
    const backup = backups[i];
    if (backup) setDraft((d) => d.map((it, idx) => (idx === i ? backup : it)));
    setEditing((prev) => {
      const nx = new Set(prev); nx.delete(i); return nx;
    });
    setErrors((e) => ({ ...e, [i]: null }));
  };
  const saveEdit = (i: number) => {
    setEditing((prev) => {
      const nx = new Set(prev); nx.delete(i); return nx;
    });
    setBackups((prev) => { const copy = { ...prev }; delete copy[i]; return copy; });
  };
  const removeRow = (i: number) => {
    setDraft((d) => d.filter((_, idx) => idx !== i));
    setEditing((prev) => {
      const nx = new Set<number>();
      [...prev].forEach((idx) => { if (idx < i) nx.add(idx); else if (idx > i) nx.add(idx - 1); });
      return nx;
    });
    setBackups((prev) => {
      const updated: Record<number, BannerItem> = {};
      Object.keys(prev).forEach((k) => {
        const idx = Number(k);
        if (idx < i) updated[idx] = prev[idx];
        else if (idx > i) updated[idx - 1] = prev[idx];
      });
      return updated;
    });
    setErrors((prev) => {
      const updated: Record<number, string | null> = {};
      Object.keys(prev).forEach((k) => {
        const idx = Number(k);
        if (idx < i) updated[idx] = prev[idx];
        else if (idx > i) updated[idx - 1] = prev[idx];
      });
      return updated;
    });
  };

  const addRow = () => {
    setDraft((d) => [...d, { name: "", imageUrl: "", linkUrl: "" }]);
    const newIndex = draft.length; // current length before update
    // schedule enabling edit for the newly added row on next tick
    setTimeout(() => {
      startEdit(newIndex);
    }, 0);
  };

  const onChangeField = (i: number, field: keyof BannerItem, value: string) => {
    setDraft((d) => d.map((it, idx) => (idx === i ? { ...it, [field]: value } as BannerItem : it)));
  };

  const validateRowImage = async (i: number) => {
    const url = draft[i]?.imageUrl?.trim();
    if (!url) { setErrors((e) => ({ ...e, [i]: "Informe a URL da imagem." })); return; }
    const err = await validateBannerImage(url);
    setErrors((e) => ({ ...e, [i]: err }));
  };

  // Save is handled inline in the button onClick to support async server calls

  // Render
  return (
    <section
      ref={containerRef}
      tabIndex={0}
      aria-roledescription="carousel"
      className={`relative w-full select-none outline-none ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Admin manage button centered above, outside banner */}
      {isAdmin && (
        <div className="w-full flex items-center justify-center mb-2">
          <button
            aria-label="Gerenciar banners"
            onClick={() => setOpen(true)}
            className="px-2 py-1 text-readowl-purple-extralight hover:text-white"
            title="Gerenciar banners"
          >
            <GalleryThumbnails size={18} />
          </button>
        </div>
      )}

      {/* Banner viewport (7:3 ratio box) */}
      <div className="w-full flex items-center gap-3">
        {banners.length > 1 && (
          <button
            aria-label="Anterior"
            onClick={() => setIndex((i) => (i - 1 + banners.length) % banners.length)}
            className="px-1 text-readowl-purple-dark hover:text-readowl-purple"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}
        <div ref={dragRef} className="relative w-full overflow-hidden bg-readowl-purple-extralight">
          <div className="relative w-full" style={{ paddingTop: `${(3 / 7) * 100}%` }}>
            {banners.length > 0 ? (
              <a href={banners[index].linkUrl || "#"} className="absolute inset-0 block focus:outline-none focus:ring-2 ring-readowl-purple-light">
                <Image
                  src={banners[index].imageUrl}
                  alt={banners[index].name || "Banner"}
                  fill
                  sizes="100vw"
                  unoptimized
                  className="object-cover"
                  priority
                />
                {/* Name overlay at bottom */}
                {(banners[index]?.name || '').trim() && (
                  <div className="absolute inset-x-0 bottom-0">
                    <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pt-8 pb-2">
                      <div className="font-ptserif text-sm sm:text-base text-white text-center drop-shadow" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {banners[index]?.name}
                      </div>
                    </div>
                  </div>
                )}
              </a>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-readowl-purple-medium">
                <span className="text-sm">Nenhum banner configurado.</span>
              </div>
            )}
          </div>
        </div>
        {banners.length > 1 && (
          <button
            aria-label="Próximo"
            onClick={() => setIndex((i) => (i + 1) % banners.length)}
            className="px-1 text-readowl-purple-dark hover:text-readowl-purple"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        )}
      </div>

      {/* Name now inside the banner with gradient overlay */}

      {/* Bullets below */}
      {banners.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir para banner ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${i === index ? "bg-readowl-purple w-5" : "bg-readowl-purple-extralight w-2.5 hover:bg-readowl-purple-medium/70"}`}
            />
          ))}
        </div>
      )}

      {/* Admin modal for managing banners */}
      <Modal open={open} onClose={() => setOpen(false)} title="Banners" widthClass="max-w-3xl">
        {/* Add new row */}
        <div className="mb-3">
          <ButtonWithIcon variant="primary" onClick={addRow} icon={<Plus size={16} />}>Adicionar banner</ButtonWithIcon>
        </div>

        {draft.length === 0 && (
          <p className="text-sm text-readowl-purple-extralight/90">Nenhum banner. Adicione um para começar.</p>
        )}

        <ul className="space-y-3">
          {draft.map((item, i) => {
            const isEditing = editing.has(i);
            const error = errors[i] || null;
            return (
              <li key={i} className="border border-readowl-purple-light/20 p-3 bg-readowl-purple-extradark/60">
                {!isEditing ? (
                  <div className="flex items-center gap-3 justify-between">
                    <div className="text-xs break-all">
                      <div><span className="opacity-70">Nome:</span> {item.name || <em className="opacity-70">(vazio)</em>}</div>
                      <div><span className="opacity-70">Imagem:</span> {item.imageUrl || <em className="opacity-70">(vazio)</em>}</div>
                      <div><span className="opacity-70">Link:</span> {item.linkUrl || <em className="opacity-70">(vazio)</em>}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(i)} className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20">Editar</button>
                      <button onClick={() => removeRow(i)} className="px-2 py-1 text-xs bg-red-500/80 hover:bg-red-500 text-white flex items-center gap-1"><Trash2 size={14} />Excluir</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs block mb-1">Nome do banner</label>
                        <input
                          value={item.name}
                          onChange={(e) => onChangeField(i, "name", e.target.value)}
                          placeholder="Ex: Promoção de Outubro"
                          className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark border-2 border-readowl-purple rounded-none px-2 py-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs block mb-1">URL da imagem (7:3, min 1050x450)</label>
                        <input
                          value={item.imageUrl}
                          onChange={(e) => onChangeField(i, "imageUrl", e.target.value)}
                          onBlur={() => validateRowImage(i)}
                          placeholder="https://..."
                          className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark border-2 border-readowl-purple rounded-none px-2 py-1 text-sm"
                        />
                        {error && <p className="text-[11px] text-red-300 mt-1">{error}</p>}
                      </div>
                      <div>
                        <label className="text-xs block mb-1">Link de destino (ao clicar)</label>
                        <input
                          value={item.linkUrl}
                          onChange={(e) => onChangeField(i, "linkUrl", e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark border-2 border-readowl-purple rounded-none px-2 py-1 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => cancelEdit(i)} className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 flex items-center gap-1"><X size={14} />Cancelar</button>
                      <button
                        onClick={async () => {
                          const url = draft[i]?.imageUrl?.trim() || "";
                          const err = url ? await validateBannerImage(url) : "Informe a URL da imagem.";
                          setErrors((e) => ({ ...e, [i]: err }));
                          const hasName = (draft[i]?.name || '').trim().length > 0;
                          if (!err && hasName) saveEdit(i);
                        }}
                        className={`px-3 py-1 text-xs flex items-center gap-1 ${(errors[i] || !(draft[i]?.name || '').trim()) ? "opacity-50 cursor-not-allowed bg-readowl-purple/40" : "bg-readowl-purple hover:bg-readowl-purple-medium"}`}
                        disabled={!!errors[i] || !(draft[i]?.name || '').trim()}
                      >
                        <Pencil size={14} />Salvar edição
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* Footer actions */}
        <div className="mt-5 flex justify-end gap-3">
          <ButtonWithIcon variant="secondary" onClick={() => setOpen(false)}>Cancelar</ButtonWithIcon>
          <ButtonWithIcon
            variant="primary"
            onClick={async () => {
              setSaveError(null);
              if (!hasChanges || hasErrors || draft.some((b) => !(b.name || '').trim() || !(b.imageUrl || '').trim())) return;
              // Optimistic update
              setSaving(true);
              setBanners(draft);
              try {
                // Persist server-side if admin; non-admin just close
                if (isAdmin) {
                  const res = await fetch('/api/banners', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ banners: draft.map((b, idx) => ({ name: b.name.trim(), imageUrl: b.imageUrl.trim(), linkUrl: (b.linkUrl || '').trim(), order: idx })) }),
                  });
                  if (!res.ok) {
                    const msg = await res.text();
                    throw new Error(msg || 'Falha ao salvar banners');
                  }
                }
                setOpen(false);
                setIndex((i) => (draft.length === 0 ? 0 : Math.min(i, draft.length - 1)));
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Erro ao salvar';
                setSaveError(msg);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || !hasChanges || hasErrors || draft.some((b) => !(b.name || '').trim() || !(b.imageUrl || '').trim())}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </ButtonWithIcon>
        </div>
        {saveError && <p className="mt-2 text-sm text-red-300">{saveError}</p>}
      </Modal>
    </section>
  );
}
