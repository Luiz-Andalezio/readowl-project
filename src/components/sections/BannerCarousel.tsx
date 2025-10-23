"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, GalleryThumbnails, Pencil, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/ui/modal/Modal";
import ButtonWithIcon from "@/components/ui/button/ButtonWithIcon";

export type BannerItem = { name: string; imageUrl: string; linkUrl: string };

type Props = {
  initialBanners?: BannerItem[];
  isAdmin?: boolean;
  className?: string;
};

function getImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = url;
  });
}

async function validateBannerImage(url: string): Promise<string | null> {
  try {
    const { width, height } = await getImageSize(url);
    if (width < 1050 || height < 450) return `A imagem deve ter no mínimo 1050x450 (atual: ${width}x${height}).`;
    const ratio = width / height;
    const target = 7 / 3;
    const tolerance = 0.02 * target;
    if (Math.abs(ratio - target) > tolerance) return `A imagem precisa seguir a proporção 7:3 (aprox. ${target.toFixed(2)}).`;
    return null;
  } catch {
    return "Não foi possível validar a imagem. Verifique a URL.";
  }
}

export default function BannerCarousel({ initialBanners = [], isAdmin = false, className = "" }: Props) {
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Data state
  const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Carousel state using virtual index (with ghosts)
  // virtualIndex range when n>1: 0..n+1 (0=ghost-last, 1..n=real, n+1=ghost-first). When n<=1: 0
  const [virtualIndex, setVirtualIndex] = useState<number>(() => (initialBanners.length > 1 ? 1 : 0));
  const activeIndex = useMemo(() => {
    const n = banners.length;
    if (n <= 1) return 0;
    return ((virtualIndex - 1 + n) % n);
  }, [virtualIndex, banners.length]);
  const [paused, setPaused] = useState(false);

  // Drag state
  const dragRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [dragDX, setDragDX] = useState(0);
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, width: 0 });
  const justDraggedRef = useRef(false);
  const [instantJump, setInstantJump] = useState(false); // disable transition for a tick when normalizing

  // Admin modal state
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BannerItem[]>(initialBanners);
  const [editing, setEditing] = useState<Set<number>>(new Set());
  const [backups, setBackups] = useState<Record<number, BannerItem>>({});
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  // Keep modal draft in sync on open
  useEffect(() => {
    if (!open) return;
    setDraft(banners);
    setEditing(new Set());
    setBackups({});
    setErrors({});
  }, [open, banners]);

  // Always start at the first banner whenever list changes (and on mount)
  useEffect(() => {
    const n = banners.length;
    setVirtualIndex(n > 1 ? 1 : 0);
  }, [banners.length]);

  // Autoplay
  useEffect(() => {
    const n = banners.length;
    if (prefersReducedMotion) return;
    if (n <= 1) return;
    if (paused || open) return;
    const id = setInterval(() => {
      // advance one step; if at last real (vi===n), move to ghost-first (n+1) to animate forward correctly
      setVirtualIndex((vi) => {
        if (n <= 1) return 0;
        return vi === n ? n + 1 : Math.min(n + 1, vi + 1);
      });
    }, 5000);
    return () => clearInterval(id);
  }, [banners.length, paused, open, prefersReducedMotion]);

  // Keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const n = banners.length;
      if (n <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setVirtualIndex((vi) => (vi === 1 ? 0 : Math.max(0, vi - 1)));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setVirtualIndex((vi) => (vi === n ? n + 1 : Math.min(n + 1, vi + 1)));
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [banners.length]);

  // Pointer drag-to-swipe with smooth snap and click suppression
  useEffect(() => {
    const el = dragRef.current; if (!el) return;
    const thresholdPx = 40;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      didDragRef.current = false;
      justDraggedRef.current = false;
      const w = viewportRef.current?.clientWidth || el.clientWidth;
      startPosRef.current = { x: e.clientX, y: e.clientY, width: w };
      setPaused(true);
      try { el.setPointerCapture(e.pointerId); } catch {}
    };
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startPosRef.current.x;
      const dy = e.clientY - startPosRef.current.y;
      if (!didDragRef.current && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (!didDragRef.current) didDragRef.current = true;
      e.preventDefault();
      const w = Math.max(1, startPosRef.current.width);
      const clamped = Math.max(-w, Math.min(w, dx)); // keep within 1 slide preview either side
      setDragDX(banners.length <= 1 ? 0 : clamped);
    };
    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      try { el.releasePointerCapture((e as PointerEvent).pointerId); } catch {}
      const dx = e.clientX - startPosRef.current.x;
      const width = Math.max(1, startPosRef.current.width);
      const movedEnough = Math.abs(dx) > Math.max(thresholdPx, width * 0.18);
      if (didDragRef.current) {
        if (movedEnough) {
          // Slide changed, suppress the subsequent click
          justDraggedRef.current = true;
          setVirtualIndex((vi) => {
            const n = banners.length; if (n <= 1) return 0;
            if (dx < 0) {
              // swipe left -> next; if at last, go to ghost-first
              return vi === n ? n + 1 : Math.min(n + 1, vi + 1);
            } else {
              // swipe right -> prev; if at first, go to ghost-last
              return vi === 1 ? 0 : Math.max(0, vi - 1);
            }
          });
        } else {
          // Small drag only: treat as a tap and trigger the anchor click under pointer
          const node = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
          const anchor = node?.closest('a');
          const within = (viewportRef.current && anchor) ? viewportRef.current.contains(anchor) : false;
          if (within) (anchor as HTMLAnchorElement).click();
        }
      } else {
        // Not a drag at all: trigger the anchor click under the pointer like BookCarousel
        const node = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
        const anchor = node?.closest('a');
        const within = (viewportRef.current && anchor) ? viewportRef.current.contains(anchor) : false;
        if (within) (anchor as HTMLAnchorElement).click();
      }
      setDragDX(0);
      setTimeout(() => { setPaused(false); justDraggedRef.current = false; }, 250);
    };
    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [banners.length]);

  // Normalize from ghost slides on transition end
  const onTrackTransitionEnd = () => {
    const n = banners.length;
    if (n <= 1) return;
    if (isDraggingRef.current) return;
    setVirtualIndex((vi) => {
      if (vi === 0) {
        // moved to ghost-last, jump to real last
        setInstantJump(true);
        const target = n;
        requestAnimationFrame(() => setInstantJump(false));
        return target;
      }
      if (vi === n + 1) {
        // moved to ghost-first, jump to real first
        setInstantJump(true);
        const target = 1;
        requestAnimationFrame(() => setInstantJump(false));
        return target;
      }
      return vi;
    });
  };

  // Defensive normalization in case transitionend doesn't fire under rapid interactions
  useEffect(() => {
    const n = banners.length;
    if (n <= 1) return;
    if (virtualIndex === 0) {
      setInstantJump(true);
      setVirtualIndex(n);
      requestAnimationFrame(() => setInstantJump(false));
    } else if (virtualIndex === n + 1) {
      setInstantJump(true);
      setVirtualIndex(1);
      requestAnimationFrame(() => setInstantJump(false));
    }
  }, [virtualIndex, banners.length]);

  const hasChanges = useMemo(() => JSON.stringify(draft) !== JSON.stringify(banners), [draft, banners]);
  const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  // Admin helpers
  const startEdit = (i: number) => {
    setEditing((prev) => new Set(prev).add(i));
    setBackups((prev) => ({ ...prev, [i]: { ...draft[i] } }));
  };
  const cancelEdit = (i: number) => {
    const backup = backups[i];
    if (backup) setDraft((d) => d.map((it, idx) => (idx === i ? backup : it)));
    setEditing((prev) => { const nx = new Set(prev); nx.delete(i); return nx; });
    setErrors((e) => ({ ...e, [i]: null }));
  };
  const saveEdit = (i: number) => {
    setEditing((prev) => { const nx = new Set(prev); nx.delete(i); return nx; });
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
    const newIndex = draft.length;
    setTimeout(() => startEdit(newIndex), 0);
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

  // Actions
  const goPrev = () => {
    const n = banners.length; if (n <= 1) { setVirtualIndex(0); return; }
    setVirtualIndex((vi) => (vi === 1 ? 0 : Math.max(0, vi - 1)));
  };
  const goNext = () => {
    const n = banners.length; if (n <= 1) { setVirtualIndex(0); return; }
    setVirtualIndex((vi) => (vi === n ? n + 1 : Math.min(n + 1, vi + 1)));
  };

  // Save banners
  const handleSave = async () => {
    setSaveError(null);
    if (!hasChanges || hasErrors || draft.some((b) => !(b.name || '').trim() || !(b.imageUrl || '').trim())) return;
    setSaving(true);
    // optimistic update
    setBanners(draft);
    try {
      const res = await fetch("/api/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      if (!res.ok) {
        const msg = await res.text();
        setSaveError(msg || "Falha ao salvar.");
      } else {
        setOpen(false);
      }
    } catch (e: unknown) {
      let msg = 'Erro ao salvar banners.';
      if (e instanceof Error && e.message) msg = e.message;
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Render
  const n = banners.length;
  const hasLoop = n > 1;
  const trackTranslate = (() => {
    const width = Math.max(1, viewportRef.current?.clientWidth || dragRef.current?.clientWidth || 1);
    const viSafe = hasLoop ? Math.max(0, Math.min(n + 1, virtualIndex)) : 0; // clamp to avoid overshoot on very fast nav
    const base = -viSafe * width; // when n<=1, virtualIndex is 0
    return `translateX(${base + dragDX}px)`;
  })();
  const trackTransition = (isDraggingRef.current || prefersReducedMotion || instantJump) ? "none" : "transform 450ms ease";

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
      <div className="w-full flex items-center gap-4">
        {n > 1 && (
          <button aria-label="Anterior" onClick={goPrev} className="px-1 text-readowl-purple-medium hidden sm:block">
            <ChevronLeft className="w-12 h-12" />
          </button>
        )}
        <div ref={dragRef} className="relative w-full overflow-hidden">
          <div className="relative w-full" style={{ paddingTop: `${(3 / 7) * 100}%` }}>
            {n > 0 ? (
              <div ref={viewportRef} className="absolute inset-0 h-full w-full" style={{ touchAction: "pan-y" }}>
                <div
                  className="h-full flex"
                  style={{ transform: trackTranslate, transition: trackTransition, willChange: 'transform' }}
                  onTransitionEnd={onTrackTransitionEnd}
                >
                  {(() => {
                    const slides: { key: string; item: BannerItem; realIndex: number; ghost?: boolean }[] = [];
                    if (n > 0) {
                      if (hasLoop) slides.push({ key: "ghost-last", item: banners[n - 1], realIndex: n - 1, ghost: true });
                      for (let i = 0; i < n; i++) slides.push({ key: `real-${i}`, item: banners[i], realIndex: i });
                      if (hasLoop) slides.push({ key: "ghost-first", item: banners[0], realIndex: 0, ghost: true });
                    }
                    return slides.map(({ key, item, realIndex, ghost }) => (
                      <a
                        key={key}
                        href={item.linkUrl || "#"}
                        draggable={false}
                        onDragStart={(e) => { e.preventDefault(); }}
                        onClick={(e) => { if (justDraggedRef.current) { e.preventDefault(); e.stopPropagation(); } }}
                        className="relative block h-full w-full flex-shrink-0 min-w-full"
                        aria-label={item.name || "Banner"}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.name || "Banner"}
                          fill
                          sizes="100vw"
                          unoptimized
                          className="object-cover"
                          draggable={false}
                          priority={realIndex === 0 && !ghost}
                        />
                        {(item?.name || "").trim() && (
                          <div className="absolute inset-x-0 bottom-0">
                            <div className="bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pt-8 pb-2">
                              <div className="font-ptserif text-sm sm:text-base text-white text-center drop-shadow" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {item.name}
                              </div>
                            </div>
                          </div>
                        )}
                      </a>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-readowl-purple-medium">
                <span className="text-sm">Nenhum banner configurado.</span>
              </div>
            )}
          </div>
        </div>
        {n > 1 && (
          <button aria-label="Próximo" onClick={goNext} className="px-1 text-readowl-purple-medium hidden sm:block">
            <ChevronRight className="w-12 h-12" />
          </button>
        )}
      </div>

      {/* Bullets */}
      {n > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const n = banners.length; if (n <= 1) { setVirtualIndex(0); return; }
                const targetReal = i + 1; // 1..n
                const vi = virtualIndex; // current virtual
                if (vi === n && targetReal === 1) { setVirtualIndex(n + 1); return; } // go via ghost-first
                if (vi === 1 && targetReal === n) { setVirtualIndex(0); return; } // go via ghost-last
                setVirtualIndex(targetReal);
              }}
              aria-label={`Ir para banner ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${i === activeIndex ? "bg-readowl-purple w-5" : "bg-readowl-purple-extralight w-2.5 hover:bg-readowl-purple-medium/70"}`}
            />)
          )}
        </div>
      )}

      {/* Admin modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Banners" widthClass="max-w-3xl">
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

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-end gap-3">
          {saveError && <p className="text-xs text-red-300 flex-1">{saveError}</p>}
          <ButtonWithIcon variant="secondary" onClick={() => setOpen(false)}>Cancelar</ButtonWithIcon>
          <ButtonWithIcon variant="primary" onClick={handleSave} disabled={!hasChanges || hasErrors || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </ButtonWithIcon>
        </div>
      </Modal>
    </section>
  );
}
