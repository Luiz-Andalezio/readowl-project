
export type RateLimitInfo = { allowed: boolean; remaining: number; resetAt: number };

function parseRedisUrl(url: string) {
  // Supports: redis://:password@host:port, rediss://...
  const u = new URL(url);
  const host = u.hostname;
  const port = Number(u.port || (u.protocol === 'rediss:' ? 6380 : 6379));
  const password = u.password || undefined;
  const useTls = u.protocol === 'rediss:';
  return { host, port, password, useTls };
}

type RedisLike = { incr(key: string): Promise<number>; pttl(key: string): Promise<number>; pexpire(key: string, ms: number): Promise<unknown> };
let redisClient: RedisLike | null = null;
async function getRedis() {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL; // allow either
  if (!url) return null;
  if (redisClient) return redisClient;
  // Prefer ioredis if available
  try {
  const { default: IORedis } = await import('ioredis');
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      // Upstash REST: use fetch; fall back to ioredis if direct URL provided instead
      // Minimal REST client
      const base = process.env.UPSTASH_REDIS_REST_URL.replace(/\/$/, '');
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      redisClient = {
        async incr(key: string) {
          const res = await fetch(`${base}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
          const j = await res.json();
          return j.result as number;
        },
        async pttl(key: string) {
          const res = await fetch(`${base}/pttl/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${token}` } });
          const j = await res.json();
          return j.result as number; // -2 no key, -1 no expire, else ms
        },
        async pexpire(key: string, ms: number) {
          await fetch(`${base}/pexpire/${encodeURIComponent(key)}/${ms}`, { headers: { Authorization: `Bearer ${token}` } });
        },
      };
      return redisClient;
    }
    const conf = parseRedisUrl(url);
    redisClient = new IORedis({ host: conf.host, port: conf.port, password: conf.password, tls: conf.useTls ? {} : undefined });
    return redisClient;
  } catch {
  return null;
  }
}

function clientIp(headers: Headers): string {
  const xfwd = headers.get('x-forwarded-for');
  if (xfwd) return xfwd.split(',')[0]!.trim();
  const real = headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

export async function rateLimit(req: Request, key: string, windowSec: number, limit: number): Promise<RateLimitInfo> {
  const redis = await getRedis();
  const ip = clientIp(req.headers);
  const k = `rl:${key}:${ip}`;
  const now = Date.now();
  if (!redis) {
    // fallback to in-memory if needed
    const { checkRateLimit } = await import('./rateLimit');
    return checkRateLimit(req, { windowSec, limit, key });
  }
  // Redis: increment and set TTL if first
  const count = await redis!.incr(k);
  let pttl = await redis!.pttl(k); // ms
  if (pttl < 0) {
    await redis!.pexpire(k, windowSec * 1000);
    pttl = windowSec * 1000;
  }
  const remaining = Math.max(0, limit - count);
  const resetAt = now + pttl;
  return { allowed: count <= limit, remaining, resetAt };
}

export function rateLimitHeaders(info: RateLimitInfo) {
  const h = new Headers();
  h.set('X-RateLimit-Remaining', String(info.remaining));
  h.set('X-RateLimit-Reset', String(Math.floor(info.resetAt / 1000)));
  return h;
}
