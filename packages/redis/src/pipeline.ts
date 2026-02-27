import { getRedisClient } from "./client";

export class Pipeline {
  constructor(private readonly redis = getRedisClient()) {}

  pipeline() {
    return this.redis.pipeline();
  }
}
