import { Store, TypeormDatabase } from '@subsquid/typeorm-store'
import { BlockData } from '@subsquid/evm-processor'

import { processor } from './processor'
import { ChainHourlySnapshot } from './model'
import { BIGINT_ZERO, CHAIN_ID, HOURLY_CHAIN_SNAPSHOT_TOPIC, MILLISECONDS_PER_HOUR } from './common'
import { producer, sendMessages } from './common/kafka-client'

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async ({ blocks, store }) => {
  for (let c of blocks) {
    const snapshot = await getOrCreateChainHourlySnapshot(c, store)

    const failedTxs = c.transactions.filter((t) => t.status !== 1).length

    snapshot.hourlyFailedTransactionCount += failedTxs
    snapshot.hourlyTransactionCount += c.transactions.length - failedTxs
    snapshot.hourlyGasConsumption += c.header.gasUsed
    snapshot.blockNumber = BigInt(c.header.height)
    snapshot.timestamp = BigInt(c.header.timestamp)

    await store.upsert(snapshot)

    await sendMessages([snapshot], HOURLY_CHAIN_SNAPSHOT_TOPIC)
  }
})

async function getOrCreateChainHourlySnapshot(block: BlockData, store: Store): Promise<ChainHourlySnapshot> {
  const snapshotId = CHAIN_ID + '-' + Math.floor(block.header.timestamp / MILLISECONDS_PER_HOUR).toString()
  const previousSnapshot = await store.get(ChainHourlySnapshot, snapshotId)

  if (previousSnapshot) {
    return previousSnapshot
  }

  const newSnapshot = new ChainHourlySnapshot({
    id: snapshotId,
    hourlyFailedTransactionCount: 0,
    hourlyGasConsumption: BIGINT_ZERO,
    hourlyTransactionCount: 0,
    blockNumber: BigInt(block.header.height),
    timestamp: BigInt(block.header.timestamp),
    chainId: CHAIN_ID,
  })

  return newSnapshot
}
