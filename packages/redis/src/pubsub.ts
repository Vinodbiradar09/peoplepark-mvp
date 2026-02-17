import { getPubClient , getSubClient } from "./client";
type MessageHandler = ( message : string) => void;

export class RedisPubSub {
    private pub = getPubClient();
    private sub = getSubClient();

    async publish( channel : string , message : any){
        await this.pub.publish(channel , JSON.stringify(message))
    }

    async subscribe(channel : string, handler : MessageHandler){
        await this.sub.subscribe(channel);
        this.sub.on("message" , ( ch , message)=>{
            if(ch === channel){
                handler(message);
            }
        })
    }
}
