import { getProducer } from "../producer";
import { Message, Producer, ProducerBatch, TopicMessages } from 'kafkajs'


// avoid send one by one 
// export async function messageProduce(payload: any) {
//   const producer = await getProducer();
//   producer.send({
//     topic: "chat-messages",
//     acks: -1,
//     messages: [
//       {
//         key: payload.roomId,
//         value: JSON.stringify(payload),
//       },
//     ],
//   });
// }

interface CustomMessages {
  roomId : string,
  content : string,
  senderId : string,
  createdAt : string,
}
export async function sendBatchMessages( messages : Array<CustomMessages> ) {
  const producer = await getProducer();
  const stringifiedMessages : Array<Message>  = messages.map(( msg )=>({
    key : msg.roomId,
    value : JSON.stringify(msg)
  }))

  const topicMessages : TopicMessages = {
    topic : "chat-messages",
    messages : stringifiedMessages,
  }

  const batch : ProducerBatch = {
    topicMessages : [topicMessages],
  }
  await producer.sendBatch(batch);
} 


