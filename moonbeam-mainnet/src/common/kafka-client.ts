import { Kafka } from 'kafkajs'
import { toJson } from './utils'
import { ChainHourlySnapshot } from '../model'

const k = new Kafka({
  brokers: ['159.89.9.180:19092', '159.89.9.180:29092', '159.89.9.180:39092'],
  clientId: 'moonbeam-mainnet-producer-client',
})
export const producer = k.producer({ allowAutoTopicCreation: true })

type MessageType = ChainHourlySnapshot

/**
 * Send a batch of messages to kafka
 * @param messages
 * @param topic
 */
export async function sendMessages(messages: MessageType[], topic: string): Promise<void> {
  const msgs = messages.map((m) => ({ value: toJson(m) }))

  try {
    await producer.connect()
    await producer.send({ messages: msgs, topic })
  } catch (error) {
    console.log(`failed to send messages to kafka, topic: ${topic} message: ${msgs}`)
    console.error(error)
  }
}
