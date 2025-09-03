import { Book, Genre } from '@prisma/client';
import { z } from 'zod';

// Centralized limits
export const BOOK_TITLE_MAX = 200;
export const BOOK_SYNOPSIS_MAX = 1000;
export const BOOK_FREQ_MAX = 50;

// Master genre list (single source of truth)
export const BOOK_GENRES_MASTER: readonly string[] = [
  'Ação', 'Adulto', 'Alta Fantasia', 'Aventura', 'Autoajuda', 'Baixa Fantasia', 'Biografia', 'Biopunk', 'Ciência', 'Comédia', 'Cyberpunk', 'Dieselpunk', 'Distopia', 'Documentário', 'Drama', 'Ecchi', 'Educativo', 'Espacial', 'Esportes', 'Fantasia', 'Fantasia Sombria', 'Fantasia Urbana', 'Fatos Reais', 'Ficção Científica', 'Ficção Histórica', 'Filosófico', 'Futurístico', 'GameLit', 'Gótico', 'Harém', 'Histórico', 'Horror', 'Isekai', 'LitRPG', 'Lírico', 'Mecha', 'Militar', 'Mistério', 'Não-Humano', 'Pós-Apocalíptico', 'Político', 'Psicológico', 'Romance', 'Sátira', 'Seinen', 'Shonen', 'Shoujo', 'Slice of Life', 'Sobrenatural', 'Steampunk', 'Suspense', 'Terror', 'Tragédia', 'Vida Escolar', 'Zumbi'
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

// Safe types (omit volatile fields or internals if needed)
export type SafeBook = Omit<Book, 'updatedAt'> & { genres: Pick<Genre, 'id' | 'name'>[] };

// Zod schema for create request (shared client/server)
export const createBookSchema = z.object({
  title: z.string().trim().min(1, 'É necessário um título').max(BOOK_TITLE_MAX),
  synopsis: z.string().trim().min(1, 'É necessário uma sinopse').max(BOOK_SYNOPSIS_MAX),
  releaseFrequency: z.string().trim().max(BOOK_FREQ_MAX).optional().or(z.literal('').transform(() => undefined)),
  coverUrl: z.string().pipe(z.url({ message: 'URL inválida' })),
  genres: z.array(z.string().min(1)).min(1, 'Selecione ao menos um gênero'),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

// Helper to normalize incoming payload before DB
export function normalizeCreateBookInput(data: CreateBookInput): CreateBookInput {
  return {
    ...data,
    title: data.title.trim(),
    synopsis: data.synopsis.trim(),
    releaseFrequency: data.releaseFrequency?.trim() || undefined,
    coverUrl: data.coverUrl.trim(),
    genres: Array.from(new Set(data.genres.map((g: string) => g.trim()))),
  };
}

export const BOOK_COVER_MIN_WIDTH = 600;
export const BOOK_COVER_MIN_HEIGHT = 800;
export const BOOK_COVER_RATIO = 600 / 800; // 0.75 expected
export const BOOK_COVER_RATIO_TOLERANCE = 0.02; // 2%
