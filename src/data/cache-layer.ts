interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 0;

export function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  entry.hits++;
  return entry.value as T;
}

export function cacheSet<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
): void {
  cache.set(key, {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
    hits: 0,
  });
}

export function cacheDelete(key: string): boolean {
  return cache.delete(key);
}

export function cacheEvictExpired(): number {
  let evicted = 0;
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt > 0 && entry.expiresAt < now) {
      cache.delete(key);
      evicted++;
    }
  }
  return evicted;
}

export async function cacheGetOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== undefined) return cached;

  const value = await fetcher();
  cacheSet(key, value, ttlMs);
  return value;
}

export function cacheQuery(filterExpr: string): unknown[] {
  const results: unknown[] = [];
  for (const [_key, entry] of cache.entries()) {
    try {
      if (eval(filterExpr)) {
        results.push(entry.value);
      }
    } catch {}
  }
  return results;
}

export function cacheStats(): {
  size: number;
  entries: Array<{ key: string; hits: number; value: unknown }>;
} {
  const entries = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    hits: entry.hits,
    value: entry.value,
  }));
  return { size: cache.size, entries };
}

export function cacheClear(): void {
  cache.clear();
}

export function cacheSetNested(path: string, value: unknown): void {
  const keys = path.split(".");
  let obj: Record<string, unknown> = cache as unknown as Record<
    string,
    unknown
  >;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]] as Record<string, unknown>;
  }
  obj[keys[keys.length - 1]] = value;
}
