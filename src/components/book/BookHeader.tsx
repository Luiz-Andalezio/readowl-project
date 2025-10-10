import Image from 'next/image';
import { BookWithAuthorAndGenres, BookStatus } from '@/types/book';
import FollowersCountClient from './FollowersCountClient';
import RatingSummaryClient from './RatingSummaryClient';
import { slugify } from '@/lib/slug';

type Props = {
    book: BookWithAuthorAndGenres;
    mode?: 'title-genres' | 'meta';
    followersCount?: number;
    ratingAvg?: number | null;
    ratingCount?: number;
};

const ICON_SIZE = 18;

const icon = (src: string, alt: string) => (
    <Image
        src={src}
        alt={alt}
        width={ICON_SIZE}
        height={ICON_SIZE}
        className="inline-block mr-2 align-text-bottom shrink-0"
        priority
    />
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
                        <h1 className="font-yusei font-bold text-5xl md:text-5xl leading-normal break-words pb-1">
                            {/* <Image
                                src="/img/svg/book/book2.svg"
                                alt="Livro"
                                width={56}
                                height={56}
                                className="inline-block mr-1 align-text-bottom shrink-0 w-10 h-10 md:w-12 md:h-12 mt-2"
                                priority
                            /> */}
                            <span className="whitespace-normal break-words">{book.title}</span>
                        </h1>
                        <div className="mt-2 font-semibold flex md:text-xl text-white/90 flex-wrap">
                            {icon('/img/svg/book/label.svg', 'Gêneros')}
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
                            {icon('/img/svg/book/author.svg', 'Autor')}
                            <dt className="sr-only">Autor</dt>
                            <dd>{book.author?.name || 'Autor desconhecido'}</dd>
                        </div>
                        <div className="flex items-center">
                            {icon('/img/svg/book/view.svg', 'Views')}
                            <dt className="sr-only">Visualizações</dt>
                            <dd>{book.views.toLocaleString('pt-BR')}</dd>
                        </div>
                        <div className="flex items-center">
                            {icon('/img/svg/book/bookmark.svg', 'Salvos')}
                            <dt className="sr-only">Salvos</dt>
                                                        <dd>
                                                                {typeof followersCount === 'number'
                                                                    ? <FollowersCountClient slug={slug} initialCount={followersCount} />
                                                                    : '—'}
                                                        </dd>
                        </div>
                        <div className="flex items-center">
                            {icon('/img/svg/book/stars.svg', 'Média de Avaliações')}
                            <dt className="sr-only">Avaliações</dt>
                            <dd>
                                {typeof ratingCount === 'number'
                                  ? <RatingSummaryClient slug={slug} initialAvg={ratingAvg ?? null} initialCount={ratingCount} />
                                  : '—'}
                            </dd>
                        </div>
                        <div className="flex items-center">
                            {icon('/img/svg/book/date.svg', 'Frequência')}
                            <dt className="sr-only">Frequência</dt>
                            <dd>{book.releaseFrequency || '—'}</dd>
                        </div>
                        <div className="flex items-center">
                            {icon(
                                book.status === 'ONGOING' ? '/img/svg/book/status/active.svg'
                                : book.status === 'COMPLETED' ? '/img/svg/book/status/finished.svg'
                                : book.status === 'PAUSED' ? '/img/svg/book/status/paused.svg'
                                : '/img/svg/book/status/hiatus.svg',
                                'Status'
                            )}
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
