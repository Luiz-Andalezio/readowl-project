"use client";
import React from 'react';
import Image from 'next/image';

export interface GenreSelectorProps {
  filteredGenres: string[];
  genreFilter: string;
  onFilter: (v: string) => void;
  selectedGenres: string[];
  toggleGenre: (g: string) => void;
  error?: string;
}

export const GenreSelector: React.FC<GenreSelectorProps> = ({ filteredGenres, genreFilter, onFilter, selectedGenres, toggleGenre, error }) => {
  return (
    <div className="lg:col-span-3 w-full">
      <label className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
        <Image src="/img/svg/book/label.svg" alt="Gêneros" width={18} height={18} className="opacity-80" />
        Gêneros
      </label>
  <div className="w-full bg-readowl-purple-extradark/70 border border-white/10 p-3 max-h-48 overflow-y-auto">
        <div className="relative">
          <input
            type="text"
            value={genreFilter}
            onChange={e => onFilter(e.target.value)}
            placeholder="Buscar gênero..."
            className="w-full bg-white border-2 border-white/60 focus:ring-2 focus:ring-readowl-purple-dark pl-4 pr-4 py-2 text-sm text-readowl-purple placeholder-readowl-purple/50 mb-3"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredGenres.map(g => {
            const id = `genre-${g}`;
            const checked = selectedGenres.includes(g);
            return (
              <label key={g} htmlFor={id} className={`flex items-center justify-center px-2 py-1 cursor-pointer text-[11px] font-medium select-none transition border border-white/10 whitespace-pre-line text-center leading-tight min-h-[34px] ${checked ? 'bg-readowl-purple-extradark text-white ring-2 ring-white/30' : 'bg-readowl-purple-light text-white/90 hover:bg-readowl-purple-dark'}`}>
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGenre(g)}
                  className="hidden"
                />
                {g}
              </label>
            );
          })}
          {filteredGenres.length === 0 && (<span className="text-xs text-white/80 col-span-full">Nenhum gênero encontrado</span>)}
        </div>
      </div>
      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
    </div>
  );
};
