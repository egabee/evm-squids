import { lookupArchive } from '@subsquid/archive-registry'
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from '@subsquid/evm-processor'
import { TypeormDatabase } from '@subsquid/typeorm-store'

export const processor = new EvmBatchProcessor()
  .setDataSource({
    // Change the Archive endpoints for run the squid
    // against the other EVM networks
    // For a full list of supported networks and config options
    // see https://docs.subsquid.io/evm-indexing/
    archive: lookupArchive('moonbeam', { type: 'EVM' }),

    // Must be set for RPC ingestion (https://docs.subsquid.io/evm-indexing/evm-processor/)
    // OR to enable contract state queries (https://docs.subsquid.io/evm-indexing/query-state/)
    chain: 'https://rpc.ankr.com/moonbeam/',
  })
  .setFinalityConfirmation(10)
  .setFields({
    block: {
      gasUsed: true,
    },
    transaction: {
      from: true,
      value: true,
      hash: true,
      contractAddress: true,
      status: true,
    },
  })
  .setBlockRange({
    from: 3_920_297,
  })
  .addTransaction({})

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>
