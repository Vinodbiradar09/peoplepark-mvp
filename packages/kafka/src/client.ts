import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId : "turbo",
    brokers : ["localhost:9092"]
})

export { kafka };

