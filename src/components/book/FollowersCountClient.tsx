"use client";
import React from 'react';
import clsx from 'clsx';

type Props = {
  slug: string;
  initialCount: number;
};

type EventDetail = { slug: string; count?: number; delta?: number };

export default function FollowersCountClient({ slug, initialCount }: Props) {
  const [count, setCount] = React.useState(initialCount);
  const [bump, setBump] = React.useState(false);

  React.useEffect(() => {
    function onUpdate(e: Event) {
      const ce = e as CustomEvent<EventDetail>;
      if (!ce.detail || ce.detail.slug !== slug) return;
      if (typeof ce.detail.count === 'number') {
        setCount(ce.detail.count);
      } else if (typeof ce.detail.delta === 'number') {
        setCount((c) => Math.max(0, c + ce.detail.delta!));
      }
      setBump(true);
      const t = setTimeout(() => setBump(false), 180);
      return () => clearTimeout(t);
    }
    window.addEventListener('book:followers:updated', onUpdate as EventListener);
    return () => window.removeEventListener('book:followers:updated', onUpdate as EventListener);
  }, [slug]);

  React.useEffect(() => {
    // if initial count changes due to navigation, sync state
    setCount(initialCount);
  }, [initialCount]);

  return (
    <span className={clsx('inline-block transition-transform duration-200 ease-out', bump && 'scale-110')}
    >{count.toLocaleString('pt-BR')}</span>
  );
}
