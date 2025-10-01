// Lightweight IP rate limiter (in-memory). Suitable for single-instance or dev.
// For production across multiple instances, replace the in-memory store with Redis.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIpFromHeaders(headers: Headers): string | null {
  const xfwd = headers.get("x-forwarded-for");
  if (xfwd) {
    const ip = xfwd.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return null;
}

export type RateLimitOptions = {
  windowSec: number; // window size in seconds
  limit: number; // max requests within window
  key?: string; // optional additional key segment (e.g. route name)
};

export function rateLimitKey(req: Request, key?: string) {
  const ip = getClientIpFromHeaders(req.headers) || "unknown";
  const k = key ? `${key}:${ip}` : ip;
  return k;
}

export function checkRateLimit(req: Request, opts: RateLimitOptions): { allowed: boolean; remaining: number; resetAt: number } {
  const key = rateLimitKey(req, opts.key);
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: opts.limit - 1, resetAt: bucket.resetAt };
  }

  if (existing.count < opts.limit) {
    existing.count += 1;
    return { allowed: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
  }

  return { allowed: false, remaining: 0, resetAt: existing.resetAt };
}

// Optionally expose headers to help client back off (not used by privacy-preserving endpoints)
export function buildRateLimitHeaders(info: { remaining: number; resetAt: number }) {
  const h = new Headers();
  h.set("X-RateLimit-Remaining", String(info.remaining));
  h.set("X-RateLimit-Reset", String(Math.floor(info.resetAt / 1000))); // epoch seconds
  return h;
}
