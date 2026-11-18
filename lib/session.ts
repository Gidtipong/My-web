export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days (604,800 seconds)
export const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;
export const SESSION_STARTED_COOKIE = "nt_session_started";

export const SUPABASE_COOKIE_OPTIONS = {
  maxAge: SESSION_DURATION_SECONDS,
  path: "/",
  sameSite: "lax" as const,
};

export function getSessionMarkerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

/**
 * Checks whether the absolute 7-day session window has elapsed.
 * Returns false if the marker cookie is absent (caller should initialize it).
 * Returns true if the timestamp is invalid, in the future, or >= 7 days old.
 */
export function isSessionExpired(
  startedAtRaw: string | undefined,
  now: number = Date.now()
): boolean {
  if (!startedAtRaw) return false;
  const startedAt = Number(startedAtRaw);
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now + 60_000) {
    return true;
  }
  return now - startedAt >= SESSION_DURATION_MS;
}
