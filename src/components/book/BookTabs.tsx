"use client";
import React from 'react';
import SelectableIconButton from '@/components/ui/SelectableIconButton';

type Tab = 'chapters' | 'comments';

export default function BookTabs() {
  const [tab, setTab] = React.useState<Tab>('chapters');
  return (
  <div className=" bg-readowl-purple-light border-2 text-white border-readowl-purple shadow-md p-3">
      <div className="flex gap-3 mb-3">
        <SelectableIconButton
          iconUrl="/img/svg/book/chapter-purple.svg"
          size="sm"
          fullWidth={false}
          selected={tab === 'chapters'}
          toggleOnClick={false}
          onClick={() => setTab('chapters')}
        >
          Capítulos
        </SelectableIconButton>
        <SelectableIconButton
          iconUrl="/img/svg/comment/comment.svg"
          size="sm"
          fullWidth={false}
          selected={tab === 'comments'}
          toggleOnClick={false}
          onClick={() => setTab('comments')}
        >
          Comentários
        </SelectableIconButton>
      </div>
  <div className="bg-readowl-purple-dark/40 p-4 min-h-[120px]">
        {tab === 'chapters' ? (
          <div>Lista de capítulos (em breve)</div>
        ) : (
          <div>Comentários (em breve)</div>
        )}
      </div>
    </div>
  );
}
