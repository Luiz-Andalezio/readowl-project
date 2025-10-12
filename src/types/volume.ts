import { Volume as PrismaVolume } from '@prisma/client';

// Centralized limits for Volume
export const VOLUME_TITLE_MAX = 200;

// Public Volume type used across UI (safe shape)
export type Volume = Pick<PrismaVolume, 'id' | 'title' | 'order' | 'bookId'>;
