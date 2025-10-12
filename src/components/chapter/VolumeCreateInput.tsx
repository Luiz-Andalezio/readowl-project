"use client";
import Image from 'next/image';
import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

export default function VolumeCreateInput({ value, onChange, onSubmit }: Props) {
  const canSubmit = value.trim().length > 0;
  return (
    <div className="relative w-full">
      <input
        placeholder="Criar novo volume..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) onSubmit(); }}
        className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark border-2 border-readowl-purple rounded-none px-3 py-2 pr-10 placeholder-readowl-purple-extradark/60"
      />
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label="Criar volume"
        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded ${canSubmit ? '' : 'opacity-40 cursor-not-allowed'}`}
      >
        <Image src="/img/svg/generics/send.svg" alt="Enviar" width={22} height={22} />
      </button>
    </div>
  );
}
