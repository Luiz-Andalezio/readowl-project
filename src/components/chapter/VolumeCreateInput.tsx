"use client";
import Image from 'next/image';
import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

export default function VolumeCreateInput({ value, onChange, onSubmit }: Props) {
  const MAX = 200;
  const safeVal = value.slice(0, MAX);
  const canSubmit = safeVal.trim().length > 0;
  return (
    <div className="relative w-full">
      <input
        placeholder="Criar novo volume..."
        value={safeVal}
        maxLength={MAX}
        onChange={(e) => onChange(e.target.value.slice(0, MAX))}
        onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) onSubmit(); }}
        className="w-full bg-readowl-purple-extralight text-readowl-purple-extradark border-2 border-readowl-purple rounded-none pl-3 pr-24 py-2 placeholder-readowl-purple-extradark/60"
      />
      <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-[10.5px] text-readowl-purple-extradark/60" aria-live="polite">
        {safeVal.length}/{MAX}
      </div>
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label="Criar volume"
        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded ${canSubmit ? '' : 'opacity-40 cursor-not-allowed'}`}
      >
        <Image src="/img/svg/generics/purple/send.svg" alt="Enviar" width={22} height={22} />
      </button>
    </div>
  );
}
