import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId : "turbo",
    brokers : ["localhost:9092"],
    retry : {
        retries : 5
    }
})

export { kafka };

