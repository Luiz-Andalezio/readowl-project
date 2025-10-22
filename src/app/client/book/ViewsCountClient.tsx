"use client";
import React from 'react';

export default function ViewsCountClient({ slug, initialCount }: { slug: string; initialCount?: number }) {
  const [count, setCount] = React.useState<number | null>(typeof initialCount === 'number' ? initialCount : null);
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch(`/api/books/${slug}/views`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setCount(Number(data?.count || 0));
      } catch {}
    })();
    return () => { ignore = true; };
  }, [slug]);

  return <>{count !== null ? count.toLocaleString('pt-BR') : '0'}</>;
}
