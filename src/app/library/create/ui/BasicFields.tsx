"use client";
import React from 'react';
import Image from 'next/image';
import { BOOK_TITLE_MAX, BOOK_SYNOPSIS_MAX, BOOK_FREQ_MAX } from '@/types/book';
import SynopsisEditor from '@/components/ui/tiptap/SynopsisEditor';

export interface BasicFieldsProps {
  title: string; synopsis: string; releaseFrequency: string;
  errors: { title?: string; synopsis?: string; releaseFrequency?: string };
  touched: { title: boolean; synopsis: boolean; frequency: boolean }; attemptedSubmit: boolean;
  onTitle: (v: string) => void; onSynopsis: (v: string) => void; onFrequency: (v: string) => void;
  onBlurTitle: () => void; onBlurSynopsis: () => void; onBlurFrequency: () => void;
}

export const BasicFields: React.FC<BasicFieldsProps> = ({ title, synopsis, releaseFrequency, errors, touched, attemptedSubmit, onTitle, onSynopsis, onFrequency, onBlurTitle, onBlurSynopsis, onBlurFrequency }) => {
  return (
    <div className="lg:col-span-2">
      <div>
        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Image src="/img/svg/book/titlecase.svg" alt="Título" width={18} height={18} className="opacity-80" />
          Título
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            maxLength={BOOK_TITLE_MAX}
            onChange={e => onTitle(e.target.value)}
            onBlur={onBlurTitle}
            className={`w-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.title && (touched.title || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
            placeholder="Título da obra"
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-white/80">
          {errors.title && (touched.title || attemptedSubmit) ? <span className="text-red-300">{errors.title}</span> : <span />}
          <span>{title.length}/{BOOK_TITLE_MAX}</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Image src="/img/svg/book/text.svg" alt="Sinopse" width={18} height={18} className="opacity-80" />
          Sinopse
        </label>
        <div onBlur={onBlurSynopsis}>
        <SynopsisEditor
          value={synopsis}
          onChange={onSynopsis}
          maxChars={BOOK_SYNOPSIS_MAX}
          error={errors.synopsis}
          showError={touched.synopsis || attemptedSubmit}
        />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Image src="/img/svg/book/date.svg" alt="Frequência" width={18} height={18} className="opacity-80" />
          Frequência de Lançamento (opcional)
        </label>
        <div className="relative">
          <input
            type="text"
            value={releaseFrequency}
            maxLength={BOOK_FREQ_MAX}
            onChange={e => onFrequency(e.target.value)}
            onBlur={onBlurFrequency}
            className={`w-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.releaseFrequency && (touched.frequency || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
            placeholder="Ex: 1 capítulo por semana."
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-white/80">
          {errors.releaseFrequency && (touched.frequency || attemptedSubmit) ? <span className="text-red-300">{errors.releaseFrequency}</span> : <span />}
          <span>{releaseFrequency.length}/{BOOK_FREQ_MAX}</span>
        </div>
      </div>
    </div>
  );
};
