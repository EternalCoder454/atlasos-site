import "server-only";
import { isIPv6 } from "node:net";

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

/* Who a limit applies to. An IPv6 home or server gets a whole /64, so one
   address per key would give each of them 2^64 keys; the /64 is the
   subscriber. (The download server keys on the full address: the site has
   no AAAA record, so no IPv6 client reaches it. Add one, and its limits
   need the same grouping.) */
export function limitKey(ip: string): string {
  if (!isIPv6(ip)) return ip;
  /* ::ffff:1.2.3.4 is an IPv4 client. */
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1];
  const full = ip.includes("::")
    ? (() => {
        const [head, tail] = ip.split("::");
        const h = head ? head.split(":") : [];
        const t = tail ? tail.split(":") : [];
        return [...h, ...Array(8 - h.length - t.length).fill("0"), ...t];
      })()
    : ip.split(":");
  return `${full.slice(0, 4).map((g) => parseInt(g || "0", 16).toString(16)).join(":")}::/64`;
}

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
