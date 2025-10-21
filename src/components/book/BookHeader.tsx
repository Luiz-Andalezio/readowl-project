import { BookWithAuthorAndGenres, BookStatus } from '@/types/book';
import FollowersCountClient from './FollowersCountClient';
import ViewsCountClient from './ViewsCountClient';
import RatingSummaryClient from './RatingSummaryClient';
import { slugify } from '@/lib/slug';
import { BookMarked, User2, Eye, Bookmark, Star, CalendarDays, Activity, CheckCircle2, PauseCircle, Hourglass } from 'lucide-react';

type Props = {
    book: BookWithAuthorAndGenres;
    mode?: 'title-genres' | 'meta';
    followersCount?: number;
    ratingAvg?: number | null;
    ratingCount?: number;
};

const ICON_SIZE = 18;
const IconWrap = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center justify-center mr-2 shrink-0" style={{ width: ICON_SIZE, height: ICON_SIZE }}>
        {children}
    </span>
);

const statusLabelMap: Record<BookStatus, string> = {
    ONGOING: 'Em andamento',
    COMPLETED: 'Concluído',
    HIATUS: 'Hiato',
    PAUSED: 'Pausado',
};

export default function BookHeader({ book, mode, followersCount, ratingAvg, ratingCount }: Props) {
    const isTitleGenres = !mode || mode === 'title-genres';
    const slug = slugify(book.title);

    return (
        <header className="text-white px-3">
            <div className="min-w-0">
                {isTitleGenres ? (
                    <>
                        <h1 className="font-ptserif font-bold text-5xl md:text-5xl leading-normal break-words pb-1">
                            <span className="whitespace-normal break-words">{book.title}</span>
                        </h1>
                        <div className="mt-2 font-semibold flex items-center md:text-xl text-white/90 flex-wrap">
                            <IconWrap><BookMarked size={ICON_SIZE} /></IconWrap>
                            <span className="whitespace-normal break-words leading-snug">
                                {book.genres
                                    .map(g => g.name)
                                    .sort((a, b) => a.localeCompare(b))
                                    .join(', ')}
                            </span>
                        </div>
                    </>
                ) : (
                    <dl className="grid grid-cols-1 gap-1 text-base md:text-lg text-white/90 mt-3">
                        <div className="flex items-center">
                            <IconWrap><User2 size={ICON_SIZE} /></IconWrap>
                            <dt className="sr-only">Autor</dt>
                            <dd>{book.author?.name || 'Autor desconhecido'}</dd>
                        </div>
                        <div className="flex items-center">
                            <IconWrap><Eye size={ICON_SIZE} /></IconWrap>
                            <dt className="sr-only">Visualizações</dt>
                            <dd><ViewsCountClient slug={slug} initialCount={undefined} /></dd>
                        </div>
                        <div className="flex items-center">
                            <IconWrap><Bookmark size={ICON_SIZE} /></IconWrap>
                            <dt className="sr-only">Salvos</dt>
                                                        <dd>
                                                                {typeof followersCount === 'number'
                                                                    ? <FollowersCountClient slug={slug} initialCount={followersCount} />
                                                                    : '0'}
                                                        </dd>
                        </div>
                        <div className="flex items-center">
                            <IconWrap><Star size={ICON_SIZE} /></IconWrap>
                            <dt className="sr-only">Avaliações</dt>
                            <dd>
                                {typeof ratingCount === 'number'
                                  ? <RatingSummaryClient slug={slug} initialAvg={ratingAvg ?? null} initialCount={ratingCount} />
                                  : '—'}
                            </dd>
                        </div>
                        <div className="flex items-center">
                            <IconWrap><CalendarDays size={ICON_SIZE} /></IconWrap>
                            <dt className="sr-only">Frequência</dt>
                            <dd>{book.releaseFrequency || '—'}</dd>
                        </div>
                        <div className="flex items-center">
                            <IconWrap>
                              {book.status === 'ONGOING' ? <Activity size={ICON_SIZE} />
                                : book.status === 'COMPLETED' ? <CheckCircle2 size={ICON_SIZE} />
                                : book.status === 'PAUSED' ? <PauseCircle size={ICON_SIZE} />
                                : <Hourglass size={ICON_SIZE} />}
                            </IconWrap>
                            <dt className="sr-only">Status</dt>
                            <dd>
                                {statusLabelMap[book.status] || statusLabelMap.ONGOING}
                            </dd>
                        </div>
                    </dl>
                )}
            </div>
        </header>
    );
}
