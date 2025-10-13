import { Chapter as PrismaChapter } from '@prisma/client';

// Centralized limits for Chapter
export const CHAPTER_TITLE_MAX = 200;
export const CHAPTER_CONTENT_MAX = 50000; // plain text char limit used by editors

// Public Chapter type used across UI (safe shape)
export type Chapter = Pick<PrismaChapter, 'id' | 'title' | 'order' | 'bookId' | 'volumeId' | 'content'>;
