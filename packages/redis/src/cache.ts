import { getRedisClient } from "./client";

export interface CacheOptions {
    ttl? : number
}

export class RedisCache {
    constructor(private readonly redis = getRedisClient()){}

    private key( type : string , args : string[]){
        return `${type}:${args.join(":")}`;
    }

    async set( type : string , args : string[] , value : any , options?: CacheOptions){
        const key = this.key(type , args);
        const data : any = JSON.stringify(value);
        if(options?.ttl){
            await this.redis.set(key , data , "EX" , options.ttl)
        } else {
            await this.redis.set(key , data);
        }
    }

    async get(type : string , args : string[]){
        const key = this.key(type , args);
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }

    async del (type : string , args : string[]){
        await this.redis.del(this.key(type , args));
    }
}

