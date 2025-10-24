"use client";
import React from 'react';

type Props = {
  slug: string;
  initialAvg: number | null;
  initialCount: number;
};

type EventDetail = { slug: string; avg?: number | null; count?: number };

export default function RatingSummaryClient({ slug, initialAvg, initialCount }: Props) {
  const [avg, setAvg] = React.useState<number | null>(initialAvg);
  const [count, setCount] = React.useState<number>(initialCount);
  const [bump, setBump] = React.useState(false);

  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<EventDetail>;
      if (!ce.detail || ce.detail.slug !== slug) return;
      if (typeof ce.detail.avg !== 'undefined') setAvg(ce.detail.avg ?? null);
      if (typeof ce.detail.count === 'number') setCount(ce.detail.count);
      setBump(true);
      const t = setTimeout(() => setBump(false), 180);
      return () => clearTimeout(t);
    }
    window.addEventListener('book:rating:updated', onUpdate as EventListener);
    return () => window.removeEventListener('book:rating:updated', onUpdate as EventListener);
  }, [slug]);

  React.useEffect(() => {
    setAvg(initialAvg);
    setCount(initialCount);
  }, [initialAvg, initialCount]);

  const label = avg != null ? `${(avg * 20).toFixed(2)}% em ${count} avaliações` : `—`;
  return <span className={bump ? 'inline-block transition-transform duration-200 ease-out scale-105' : undefined}>{label}</span>;
}
