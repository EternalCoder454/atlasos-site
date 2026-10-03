import "server-only";

/* How many download links one address gets per hour. A person needs one
   or two; a retry after a failed download is another. Anything past this
   is a script, and it gets told to wait.

   Kept in memory: there is one server process, and a restart forgetting
   the counts costs nothing worth a database. The map can't grow without
   bound either: past MAX_KEYS it is cleared, which only ever errs on the
   side of letting someone through. The download server's own per-address
   and total limits still hold. */
const LIMIT = 8;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_KEYS = 50_000;

const windows = new Map<string, { count: number; resetAt: number }>();

export function takeToken(key: string, now = Date.now()): { ok: boolean; retryAfter: number } {
  if (windows.size > MAX_KEYS) windows.clear();
  let w = windows.get(key);
  if (!w || w.resetAt <= now) {
    w = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, w);
  }
  if (w.count >= LIMIT) {
    return { ok: false, retryAfter: Math.ceil((w.resetAt - now) / 1000) };
  }
  w.count += 1;
  return { ok: true, retryAfter: 0 };
}

/* Expired windows, swept now and then rather than on every request. */
setInterval(() => {
  const now = Date.now();
  for (const [key, w] of windows) if (w.resetAt <= now) windows.delete(key);
}, 10 * 60 * 1000).unref();
