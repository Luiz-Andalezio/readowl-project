type RedisLike = { set(key: string, value: string, mode: string, px: number, nx: string): Promise<'OK' | null> };
let redis: RedisLike | null = null;

async function getRedis(): Promise<RedisLike | null> {
  if (redis) return redis;
  try {
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    if (!url) return null;
    // Prefer ioredis when REDIS_URL provided
    if (process.env.REDIS_URL) {
      const { default: IORedis } = await import('ioredis');
      const client = new IORedis(process.env.REDIS_URL as string);
      redis = {
        async set(key: string, value: string, mode: string, px: number, nx: string) {
          // @ts-expect-error ioredis supports SET with modifiers
          const res = await client.set(key, value, mode, px, nx);
          return res as 'OK' | null;
        },
      };
      return redis;
    }
    // Upstash REST
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      redis = {
        async set(key: string, value: string, _mode: string, px: number, _nx?: string) {
          void _mode; // mark unused param as intentionally ignored
          void _nx;   // mark unused param as intentionally ignored
          const res = await fetch(`${base}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?px=${px}&nx=true`, { headers: { Authorization: `Bearer ${token}` } });
          const j = await res.json().catch(() => ({}));
          return j.result === 'OK' ? 'OK' : null;
        },
      };
      return redis;
    }
    return null;
  } catch {
    return null;
  }
}

const memory = new Set<string>();

export async function acquireOnce(key: string, ttlMs: number): Promise<boolean> {
  const r = await getRedis();
  if (r) {
    const res = await r.set(key, '1', 'PX', ttlMs, 'NX');
    return res === 'OK';
  }
  if (memory.has(key)) return false;
  memory.add(key);
  setTimeout(() => memory.delete(key), ttlMs).unref?.();
  return true;
}
