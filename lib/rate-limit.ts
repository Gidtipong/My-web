import { headers } from "next/headers";

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

// In-memory token bucket store with LRU pruning
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale records every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if ((record.blockedUntil || record.resetTime) < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extracts real client IP address from standard reverse-proxy headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    const realIp =
      headerList.get("x-real-ip") ||
      headerList.get("cf-connecting-ip") ||
      headerList.get("true-client-ip");
    if (realIp) return realIp.trim();
  } catch {
    // In environments where headers() is unavailable
  }
  return "127.0.0.1";
}

/**
 * Checks and records authentication rate limits (Anti-Brute Force)
 * Max 5 failed attempts per 15 minutes per IP.
 */
export async function checkAuthRateLimit(customIp?: string): Promise<{
  allowed: boolean;
  remaining: number;
  cooldownSeconds: number;
  error?: string;
}> {
  const ip = customIp || (await getClientIp());
  const key = `auth:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const record = rateLimitStore.get(key);

  // If currently blocked
  if (record?.blockedUntil && record.blockedUntil > now) {
    const cooldownSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    const minutes = Math.ceil(cooldownSeconds / 60);
    return {
      allowed: false,
      remaining: 0,
      cooldownSeconds,
      error: `ตรวจพบการพยายามเข้าสู่ระบบผิดพลาดเกินกำหนด ระบบได้ล็อค IP ของคุณชั่วคราวเพื่อความปลอดภัย กรุณารออีก ${minutes} นาที (${cooldownSeconds} วินาที)`,
    };
  }

  if (!record || record.resetTime < now) {
    return {
      allowed: true,
      remaining: maxAttempts,
      cooldownSeconds: 0,
    };
  }

  const remaining = Math.max(0, maxAttempts - record.count);
  return {
    allowed: record.count < maxAttempts,
    remaining,
    cooldownSeconds: 0,
  };
}

/**
 * Records a failed authentication attempt.
 * If 5 failed attempts are reached, blocks the IP for 15 minutes.
 */
export async function recordFailedAuthAttempt(customIp?: string): Promise<{
  blocked: boolean;
  remaining: number;
  cooldownSeconds: number;
}> {
  const ip = customIp || (await getClientIp());
  const key = `auth:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  let record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    };
  } else {
    record.count += 1;
  }

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + windowMs;
    rateLimitStore.set(key, record);
    return {
      blocked: true,
      remaining: 0,
      cooldownSeconds: Math.ceil(windowMs / 1000),
    };
  }

  rateLimitStore.set(key, record);
  return {
    blocked: false,
    remaining: Math.max(0, maxAttempts - record.count),
    cooldownSeconds: 0,
  };
}

/**
 * Resets authentication rate limit upon successful login
 */
export async function resetAuthRateLimit(customIp?: string): Promise<void> {
  const ip = customIp || (await getClientIp());
  rateLimitStore.delete(`auth:${ip}`);
}
