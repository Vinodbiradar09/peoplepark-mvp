import { RedisCache, RedisPubSub } from "@repo/redis";
export let cache : RedisCache;
export let pubsub : RedisPubSub;

export function Infra(){
    if(cache && pubsub){
        return;
    }
    cache = new RedisCache();
    pubsub = new RedisPubSub();
    console.log("infra success");
}
