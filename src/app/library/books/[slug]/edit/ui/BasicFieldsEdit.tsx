"use client";
import React from 'react';
import Image from 'next/image';

export interface BasicFieldsEditProps {
  title: string;
  synopsis: string;
  releaseFrequency: string;
  errors: { title?: string; synopsis?: string; releaseFrequency?: string };
  touched: { title: boolean; synopsis: boolean; frequency: boolean };
  attemptedSubmit: boolean;
  onTitle: (v: string) => void;
  onSynopsis: (v: string) => void;
  onFrequency: (v: string) => void;
  onBlurTitle: () => void;
  onBlurSynopsis: () => void;
  onBlurFrequency: () => void;
}

export const BasicFieldsEdit: React.FC<BasicFieldsEditProps> = ({
  title,
  synopsis,
  releaseFrequency,
  errors,
  touched,
  attemptedSubmit,
  onTitle,
  onSynopsis,
  onFrequency,
  onBlurTitle,
  onBlurSynopsis,
  onBlurFrequency,
}) => {
  return (
    <div className="lg:col-span-2">
      <div>
        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Image src="/img/svg/book/titlecase.svg" alt="Título" width={18} height={18} className="opacity-80" />
          Título
        </label>
        <input
          type="text"
          value={title}
          onChange={e => onTitle(e.target.value)}
          onBlur={onBlurTitle}
          className={`w-full rounded-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.title && (touched.title || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
          placeholder="Título da obra"
        />
        {errors.title && (touched.title || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Image src="/img/svg/book/text.svg" alt="Sinopse" width={18} height={18} className="opacity-80" />
          Sinopse
        </label>
        <textarea
          value={synopsis}
          onChange={e => onSynopsis(e.target.value)}
          onBlur={onBlurSynopsis}
          className={`w-full rounded-2xl bg-white border-2 pl-4 pr-4 py-3 h-80 resize-none focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 leading-relaxed transition ${errors.synopsis && (touched.synopsis || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
          placeholder="Descreva brevemente a história..."
        />
        {errors.synopsis && (touched.synopsis || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.synopsis}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Image src="/img/svg/book/date.svg" alt="Frequência" width={18} height={18} className="opacity-80" />
          Frequência de Lançamento (opcional)
        </label>
        <input
          type="text"
          value={releaseFrequency}
          onChange={e => onFrequency(e.target.value)}
          onBlur={onBlurFrequency}
          className={`w-full rounded-full bg-white border-2 pl-4 pr-4 py-2 focus:ring-2 focus:ring-readowl-purple-dark text-readowl-purple placeholder-readowl-purple/50 transition ${errors.releaseFrequency && (touched.frequency || attemptedSubmit) ? 'border-red-400' : 'border-white/60'}`}
          placeholder="Ex: 1 capítulo por semana."
        />
        {errors.releaseFrequency && (touched.frequency || attemptedSubmit) && <p className="text-xs text-red-300 mt-1">{errors.releaseFrequency}</p>}
      </div>
    </div>
  );
};

export default BasicFieldsEdit;
