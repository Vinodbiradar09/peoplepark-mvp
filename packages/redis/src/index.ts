// export { RedisCache } from "./cache";
// export { RedisPubSub } from "./pubsub";

import { RedisCache } from "./cache";
import { RedisPubSub } from "./pubsub";

export const cache = new RedisCache();
export const pubsub = new RedisPubSub();
