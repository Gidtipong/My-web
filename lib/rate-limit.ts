/**
 * Simple in-memory sliding window rate limiter
 * Protects API routes against brute-force or excessive spam.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  limit?: number; // max requests within interval
  interval?: number; // window size in milliseconds
}

export function rateLimit(key: string, options: RateLimitOptions = {}) {
  const limit = options.limit ?? 30; // default 30 requests
  const interval = options.interval ?? 60 * 1000; // default 1 minute
  const now = Date.now();

  const record = cache.get(key);

  if (!record || now > record.resetAt) {
    cache.set(key, {
      count: 1,
      resetAt: now + interval,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + interval) / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetAt / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(record.resetAt / 1000),
  };
}

