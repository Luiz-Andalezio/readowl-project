"use client";
import Image from 'next/image';
import React from 'react';

type Props = { bookId: string };

function starSrc(score: number) {
    switch (score) {
        case 1: return '/img/svg/book/aval/star1.svg';
        case 2: return '/img/svg/book/aval/star2.svg';
        case 3: return '/img/svg/book/aval/star3.svg';
        case 4: return '/img/svg/book/aval/star4.svg';
        case 5: return '/img/svg/book/aval/star5.svg';
        default: return '/img/svg/book/aval/star.svg';
    }
}

export default function RatingBox({ bookId }: Props) {
    const [myScore, setMyScore] = React.useState<number>(0);
    const [hover, setHover] = React.useState<number>(0);
    const [avg, setAvg] = React.useState<number | null>(null);
    const [count, setCount] = React.useState<number>(0);

    // TODO: hook up to API later. For now, local-only mock average
    React.useEffect(() => {
        setAvg(4.6);
        setCount(16);
    }, []);

    const display = hover || myScore;

    return (
    <div className="relative bg-readowl-purple-light border-2 text-white border-readowl-purple shadow-md p-4 text-center" data-bookid={bookId}>
            <div className="mb-2 text-white font-bold text-4xl">AVALIE ESTA OBRA</div>
            <div className="inline-flex items-center gap-3 select-none">
                {Array.from({ length: 5 }).map((_, i) => {
                    const idx = i + 1;
                    // For our sprite approach, render starN (1..5) only once per state based on display
                    // and default 'star' for positions beyond display
                    const src = display >= idx ? starSrc(display) : starSrc(0);
                    return (
                        <button
                            key={idx}
                            aria-label={`Avaliar ${idx} ${idx === 1 ? 'estrela' : 'estrelas'}`}
                            onMouseEnter={() => setHover(idx)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setMyScore(idx)}
                            className="transition-transform duration-150 ease-out hover:scale-110 active:scale-95"
                        >
                            <Image src={src} alt={`${idx}`} width={90} height={90} className="transition-all duration-150 hover:brightness-110" />
                        </button>
                    );
                })}
            </div>
            <div className="mt-2 text-readowl-purple-extradark text-xl">
                {avg != null ? `${(avg * 20).toFixed(2)}% em ${count} avaliações` : '—'}
            </div>
        </div>
    );
}
