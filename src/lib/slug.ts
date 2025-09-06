export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function deslugify(slug: string): string {
  // Best-effort reverse for display only
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
