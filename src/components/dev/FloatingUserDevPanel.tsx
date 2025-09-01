"use client";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface FloatingUserDevPanelProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Pequeno helper para pegar iniciais
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join("");
}

export default function FloatingUserDevPanel({ user }: FloatingUserDevPanelProps) {
  const [open, setOpen] = useState(false);
  const initials = getInitials(user.name);

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Link href="/home" className="hidden sm:inline-block text-xs font-semibold tracking-wide text-readowl-purple-extralight/80 hover:text-white transition px-2 py-1 rounded-md bg-readowl-purple-medium/30 border border-readowl-purple-light/20 shadow-sm backdrop-blur">
          Readowl
        </Link>
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-label="Abrir painel do usuário"
          className={`group relative h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg border border-readowl-purple-light/30 overflow-hidden transition-all ${open ? "ring-2 ring-readowl-purple-light/70" : "hover:ring-2 hover:ring-readowl-purple-light/40"} bg-readowl-purple-medium/80 backdrop-blur`}
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-white tracking-wide">{initials}</span>
          )}
          <span className="absolute -bottom-1 right-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-readowl-purple-extralight text-readowl-purple-dark font-semibold shadow-lg">
            {user.role}
          </span>
        </button>
      </div>
      {open && (
        <div className="w-[300px] sm:w-[360px] max-h-[70vh] overflow-auto rounded-xl bg-readowl-purple-dark/95 backdrop-blur-sm shadow-2xl border border-readowl-purple-light/30 p-4 animate-fadeIn text-xs">
          <div className="flex items-start gap-3 mb-3">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-readowl-purple-light/40" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-readowl-purple-medium flex items-center justify-center font-semibold text-white ring-2 ring-readowl-purple-light/40">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight truncate">{user.name}</p>
              <p className="text-[11px] text-readowl-purple-extralight/70 truncate">{user.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-readowl-purple-medium/60 border border-readowl-purple-light/20 rounded-full text-[10px] text-readowl-purple-extralight uppercase tracking-wide font-medium">{user.role}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-2 py-0.5 bg-red-600/80 hover:bg-red-600 text-[10px] text-white rounded-full font-semibold transition"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {([
              ["ID", user.id],
              ["Criado", new Date(user.createdAt).toLocaleString()],
              ["Atualizado", new Date(user.updatedAt).toLocaleString()],
              ["Descrição", user.description || "—"],
            ] as const).map(([label, val]) => (
              <div key={label} className="p-2 rounded-lg bg-readowl-purple-medium/40 border border-readowl-purple-light/20">
                <p className="font-medium text-readowl-purple-extralight/80 mb-0.5 uppercase tracking-wide">{label}</p>
                <p className="text-white break-words leading-snug">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
