"use client";
import React, { useState } from "react";
import { signOut } from "next-auth/react";

export interface TopBarUserClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    description?: string | null;
    createdAt: string; // serialized ISO
    updatedAt: string; // serialized ISO
  };
}

const fieldLabels: Record<string, string> = {
  id: "ID",
  name: "Nome",
  email: "Email",
  role: "Papel",
  description: "Descrição",
  createdAt: "Criado em",
  updatedAt: "Atualizado em",
};

export default function TopBarUserClient({ user }: TopBarUserClientProps) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(user).filter(([k]) => k !== "image");

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-readowl-purple-light/60"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-readowl-purple-light text-white flex items-center justify-center font-semibold ring-2 ring-readowl-purple/50">
            {initials}
          </div>
        )}
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-semibold text-white leading-tight">{user.name}</span>
          <span className="text-xs text-readowl-purple-extralight/80 leading-tight">{user.email}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-readowl-purple-extralight text-readowl-purple uppercase tracking-wide">
          {user.role}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs bg-readowl-purple-extralight/20 hover:bg-readowl-purple-extralight/30 text-white rounded-full px-3 py-1 transition"
          aria-expanded={open}
          aria-label="Alternar detalhes do usuário"
        >
          {open ? "Fechar" : "Detalhes"}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs bg-red-500/80 hover:bg-red-500 text-white rounded-full px-3 py-1 transition"
        >
          Sair
        </button>
      </div>
      {open && (
        <div className="absolute top-full right-4 mt-2 w-[340px] sm:w-[420px] max-h-[70vh] overflow-auto rounded-xl bg-readowl-purple-dark/95 backdrop-blur-sm shadow-xl border border-readowl-purple-light/30 p-4 animate-fadeIn z-50">
          <h3 className="text-sm font-semibold text-white mb-3">Dados completos do usuário</h3>
          <dl className="space-y-3 text-xs">
            {entries.map(([key, value]) => {
              if (value === null || value === undefined || value === "") return null;
              let display = value as string;
              if (key === "createdAt" || key === "updatedAt") {
                try {
                  const d = new Date(value as string);
                  display = d.toLocaleString();
                } catch {}
              }
              return (
                <div key={key} className="flex flex-col bg-readowl-purple-medium/40 rounded-lg p-2 border border-readowl-purple-light/20">
                  <dt className="font-medium text-readowl-purple-extralight/80 uppercase tracking-wide">{fieldLabels[key] || key}</dt>
                  <dd className="text-white break-words">{display}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
    </div>
  );
}
