import { Redis } from "ioredis";

let commandClient : Redis | null = null;
let pubClient : Redis | null = null;
let subClient : Redis | null = null;

export function getRedisClient(){
    if(!commandClient){
        commandClient = new Redis(process.env.REDIS_URL!, {
            maxRetriesPerRequest : null,
        });
    }
    return commandClient;
}

export function getPubClient(){
    if(!pubClient){
        pubClient = new Redis(process.env.REDIS_URL!)
    }
    return pubClient;
}

export function getSubClient(){
    if(!subClient){
        subClient = new Redis(process.env.REDIS_URL!)
    }
    return subClient;
}

