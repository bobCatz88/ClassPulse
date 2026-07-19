type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

/**
 * Had kadar proses tunggal untuk melindungi endpoint mahal sebelum Redis atau
 * platform rate limiting ditambah. Ia sengaja fail-open antara instance supaya
 * tidak menghalang guru apabila instance berubah, tetapi tetap menghadkan spam
 * dalam satu instance Netlify.
 */
export function checkRateLimit(
  key: string,
  rule: RateLimitRule,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size > 1_000) {
    for (const [bucketKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
