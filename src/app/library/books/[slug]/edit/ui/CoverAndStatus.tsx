"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookImage, Activity, CheckCheck, PauseCircle, Hourglass } from 'lucide-react';
import { BOOK_COVER_MIN_HEIGHT, BOOK_COVER_MIN_WIDTH, BOOK_STATUS, BOOK_STATUS_LABEL } from '@/types/book';

export interface CoverAndStatusProps {
  coverUrl: string;
  coverValid: boolean | null;
  coverLoading: boolean;
  errors: { coverUrl?: string };
  touched: boolean;
  attemptedSubmit: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  onHelp: () => void;
  status: typeof BOOK_STATUS[number];
  onStatus: (s: typeof BOOK_STATUS[number]) => void;
}

export const CoverAndStatus: React.FC<CoverAndStatusProps> = ({
  coverUrl,
  coverValid,
  coverLoading,
  errors,
  touched,
  attemptedSubmit,
  onChange,
  onBlur,
  onHelp,
  status,
  onStatus,
}) => {
  return (
    <div>
      <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <BookImage className="w-4 h-4 opacity-80" aria-hidden />
        URL da Capa
  <button type="button" onClick={onHelp} className="w-5 h-5 bg-readowl-purple-dark text-white text-xs flex items-center justify-center">?</button>
      </label>

  <div className={`relative w-full aspect-[3/4] border-2 border-dashed flex items-center justify-center overflow-hidden text-center text-readowl-purple-dark bg-white ${coverValid === false ? 'border-red-400' : 'border-none'}`}>
        {coverUrl && coverValid !== null && !coverLoading ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="Preview capa" className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs opacity-70 select-none px-4">
            Insira a URL da imagem para ver a capa aqui <br />(proporção 3:4, mín {BOOK_COVER_MIN_WIDTH}x{BOOK_COVER_MIN_HEIGHT})
          </span>
        )}
        {coverLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-readowl-purple font-semibold text-sm">Carregando...</div>}
      </div>

      <input
        type="url"
        placeholder="https://..."
        value={coverUrl}
        onChange={e => onChange(e.target.value.trim())}
        onBlur={onBlur}
  className="mt-3.5 w-full bg-white focus:ring-readowl-purple-dark px-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50 border"
      />
      {errors.coverUrl && (touched || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.coverUrl}</p>}

      {/* Compact Status Dropdown with icons, below cover input, no label */}
      <div className="mt-3">
        <StatusDropdown status={status} onStatus={onStatus} />
      </div>
    </div>
  );
};

export default CoverAndStatus;

// --- Internal components ---
type StatusValue = typeof BOOK_STATUS[number];

const statusIconComp: Record<StatusValue, React.ComponentType<{ className?: string }>> = {
  ONGOING: Activity,
  COMPLETED: CheckCheck,
  PAUSED: PauseCircle,
  HIATUS: Hourglass,
};

const StatusDropdown: React.FC<{ status: StatusValue; onStatus: (s: StatusValue) => void }> = ({ status, onStatus }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(() => BOOK_STATUS.map((s) => ({
    value: s,
    label: BOOK_STATUS_LABEL[s],
    Icon: statusIconComp[s],
  })), []);

  const selectedIndex = useMemo(() => options.findIndex(o => o.value === status) ?? 0, [options, status]);

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!btnRef.current && !listRef.current) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || listRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onKeyDownBtn: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onKeyDownList: React.KeyboardEventHandler<HTMLUListElement> = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) {
        onStatus(opt.value);
        setOpen(false);
        btnRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        ref={btnRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDownBtn}
        className="pr-8 pl-10 py-1.5 text-sm bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple inline-flex items-center gap-2 min-w-[11rem]"
      >
        {/* Left icon of selected */}
        {(() => { const Icon = statusIconComp[status]; return <Icon className="absolute left-2 w-5 h-5 text-readowl-purple" />; })()}
        <span>{BOOK_STATUS_LABEL[status]}</span>
        {/* Animated caret */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`pointer-events-none absolute right-2 text-readowl-purple transform transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`status-opt-${activeIndex}`}
          onKeyDown={onKeyDownList}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-white py-1 text-sm shadow ring-1 ring-black/5 border border-white/60"
        >
          {options.map((opt, idx) => {
            const selected = opt.value === status;
            const active = idx === activeIndex;
            return (
              <li
                id={`status-opt-${idx}`}
                key={opt.value}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => { onStatus(opt.value); setOpen(false); btnRef.current?.focus(); }}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer ${active ? 'bg-readowl-purple-extralight/60' : ''} ${selected ? 'font-semibold' : ''}`}
              >
                <opt.Icon className="w-5 h-5 text-readowl-purple" />
                <span className="text-readowl-purple">{opt.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
