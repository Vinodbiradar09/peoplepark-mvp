import { getRedisClient } from "./client";

export interface RateLimitOptions {
  max: number; // max requests
  window: number; // window in seconds
}

export class RateLimiter {
  constructor(private readonly redis = getRedisClient()) {}

  private key(action: string, identifier: string) {
    return `ratelimit:${action}:${identifier}`;
  }

  async check(
    action: string,
    identifier: string,
    options: RateLimitOptions,
  ): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
    const key = this.key(action, identifier);

    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.expire(key, options.window);
    }

    const ttl = await this.redis.ttl(key);
    const remaining = Math.max(0, options.max - attempts);
    const allowed = attempts <= options.max;

    return {
      allowed,
      remaining,
      retryAfter: allowed ? 0 : ttl,
    };
  }

  async reset(action: string, identifier: string) {
    await this.redis.del(this.key(action, identifier));
  }
}
