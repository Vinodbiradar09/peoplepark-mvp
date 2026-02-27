import { getRedisClient } from "./client";

export interface CacheOptions {
  ttl?: number; // in seconds for cache expirations
  lockTTL?: number; // in sec for lock expirations
  maxRetries?: number; // max retry attempt for the stampede
}

export class RedisCache {
  constructor(private readonly redis = getRedisClient()) {}

  private cacheKey(type: string, args: string[]) {
    return `cache:${type}:${args.join(":")}`;
  }

  private lockKey(type: string, args: string[]) {
    return `lock:${type}:${args.join(":")}`;
  }

  private serialize(value: any) {
    return JSON.stringify(value, (_, v) => {
      typeof v === "bigint" ? v.toString() : v;
    });
  }

  private deserialize<T>(value: string | null): T | null {
    return value ? JSON.parse(value) : null;
  }

  async set(type: string, args: string[], value: any, options?: CacheOptions) {
    const key = this.cacheKey(type, args);
    const data = this.serialize(value);
    if (options?.ttl) {
      await this.redis.set(key, data, "EX", options.ttl); // EX excpets sec
    } else {
      await this.redis.set(key, data);
    }
  }

  async get<T>(type: string, args: string[]) {
    const value = await this.redis.get(this.cacheKey(type, args));
    return this.deserialize<T>(value);
  }

  async del(type: string, args: string[]) {
    await this.redis.del(this.cacheKey(type, args));
  }

  async getOrSet<T>(
    type: string,
    args: string[],
    fetcher: () => Promise<T>,
    options: CacheOptions = { ttl: 60, lockTTL: 5, maxRetries: 5 },
  ): Promise<T> {
    const { ttl = 60, lockTTL = 5, maxRetries = 5 } = options;
    const key = this.cacheKey(type, args);
    const lockKey = this.lockKey(type, args);
    console.log("hey i am reaching here");
    // try to read cache first
    const cached = await this.get<T>(type, args);
    if (cached) return cached;

    // try to acquire lock
    let acquired = await this.redis.set(
      lockKey,
      "1",
      "PX",
      lockTTL * 1000,
      "NX",
    );
    if (!acquired) {
      // if lock not acquired, retry loop
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        await this.sleep(100); // wait 100ms
        const retry = await this.get<T>(type, args);
        if (retry) return retry;
        acquired = await this.redis.set(
          lockKey,
          "1",
          "PX",
          lockTTL * 1000,
          "NX",
        );
        if (acquired) break; // acquired lock, go to fetch
      }

      if (!acquired) {
        // failed after max retries, fetch directly without caching
        return fetcher();
      }
    }

    try {
      // Fetch from DB
      const data = await fetcher();
      await this.set(type, args, data, { ttl });
      return data;
    } catch (error) {
      console.error("Redis cache fetch error:", error);
      throw error;
    } finally {
      // never forget to release lock
      // Release lock
      await this.redis.del(lockKey);
    }
  }

  async delByPrefix(prefix: string) {
    const stream = this.redis.scanStream({
      match: `${prefix}`,
      count: 100,
    });

    const keys: string[] = [];
    for await (const chunk of stream) {
      keys.push(...chunk);
    }
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async unlock(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }

  async lock(key: string, ttlMs: number, retries = 3, retryDelayMs = 100): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const result = await this.redis.set(
      `lock:${key}`,
      "1",
      "PX",
      ttlMs,
      "NX"
    );
    if (result === "OK") return true;
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
  return false;
}
}
