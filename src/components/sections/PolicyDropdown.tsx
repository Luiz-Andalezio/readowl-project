"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PolicyDropdownProps = {
  className?: string;
  colorMode?: "header" | "footer";
};

export default function PolicyDropdown({ className = "", colorMode = "header" }: PolicyDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const isHeader = colorMode === "header";
  // Distinct color scheme for dropdown trigger and panel
  const triggerText = isHeader ? "text-white hover:text-readowl-purple-extralight" : "text-readowl-purple-extralight hover:text-white";
  const panelBg = "bg-readowl-purple-dark";
  const linkBase = "block px-4 py-2";
  const linkText = "text-readowl-purple-extralight hover:text-white hover:bg-readowl-purple";
  const linkCls = `${linkBase} ${linkText}`;

  return (
    <div ref={ref} className={`relative select-none ${className}`}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1 ${triggerText}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
          if (e.key === "ArrowDown") setOpen(true);
        }}
      >
        <span>Política</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transform transition-transform duration-300 ease-out" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Panel */}
      <div
        role="menu"
        aria-label="Menu de política"
        className={`${panelBg} absolute left-0 mt-2 w-52 shadow-lg z-50 origin-top transition-all duration-300 ease-out ` +
          (open ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none")}
      >
        <Link href="/landing/terms" className={linkCls} role="menuitem" onClick={() => setOpen(false)}>
          Termos
        </Link>
        <Link href="/landing/privacy" className={linkCls} role="menuitem" onClick={() => setOpen(false)}>
          Privacidade
        </Link>
        <Link href="/landing/licenses" className={linkCls} role="menuitem" onClick={() => setOpen(false)}>
          Licenças
        </Link>
      </div>
    </div>
  );
}
