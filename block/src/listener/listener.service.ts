import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { WebSocketProvider, ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { ClientProxy } from '@nestjs/microservices';
import { LockedBlock } from './entities/lockedBlock.entity';
import { Observable } from 'rxjs';

@Injectable()
export class ListenerService {
  private readonly logger = new Logger(ListenerService.name);
  provider: WebSocketProvider;
  /**
   * ListenerService constructor.
   *
   * @param configService - Configuration service.
   * @param em - Entity manager.
   * @param blockRepository - Block repository.
   * @param client - Microservice client.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
    @Inject('TRANSACTIONS_COMPUTATION') private client: ClientProxy,
  ) {
    this.provider = new ethers.WebSocketProvider(
      this.configService.get<string>('ALCHEMY_BASE_WS') +
        this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  /**
   * Flags a forked block and its previous blocks in the database.
   *
   * @param parentHash - the parent hash of the forked block.
   * @param blockNumber - the block number of the forked block.
   */
  async flagForkBlock({
    parentHash,
    blockNumber,
  }: {
    parentHash: string;
    blockNumber: number;
  }): Promise<void> {
    const block = await this.em.findOne(Block, { number: blockNumber });

    //boolean isForked
    await this.em.upsert(Block, { ...block, flag: 'FORKED' });

    if (
      (
        await this.em.findOne(Block, {
          number: blockNumber - 1,
        })
      ).hash !== parentHash
    ) {
      return await this.flagForkBlock({
        parentHash,
        blockNumber: blockNumber - 1,
      });
    }

    return;
  }

  /**
   * Listens for new blocks and processes them when received.
   */
  async listen(): Promise<void> {
    try {
      this.provider.on('block', async (blockNumber) => {
        this.logger.log('Realtime listen : ', blockNumber);
        await this.onNewBlock(blockNumber, this.em, this.client);
      });
    } catch (error) {
      this.logger.error(`Failed to listen for new blocks: ${error.message}`);
    }
  }

  /**
   * Processes a new block by saving it in the database and emitting its transaction hashes to a worker.
   *
   * @param number - the block number of the new block.
   * @param parentHash - the parent hash of the new block.
   * @param hash - the hash of the new block.
   * @param em - the entity manager to use for database operations.
   * @param client - the client proxy to use for emitting transaction hashes.
   */
  async onNewBlock(
    blockNumber: number,
    em = this.em,
    client = this.client,
  ): Promise<void | Observable<any>> {
    //Get block data
    const blockOnChain = await this.provider.getBlock(blockNumber);

    //Check if data isn't already processed by another instance
    if (
      !!(await em.findOne(LockedBlock, {
        hash: blockOnChain.hash,
      }))
    )
      return;

    //Lock block in process
    try {
      const lock = new LockedBlock({ hash: blockOnChain.hash });
      await em.persistAndFlush(lock);
    } catch {
      this.logger.log('Lock undetected but block already on process');
      return;
    }

    const storedBlock = await em.findOne(Block, {
      number: blockNumber,
    });
    console.log('=====================storedBlock');
    console.log(storedBlock);
    console.log('=====================storedBlock');
    //Escape work if block already saved
    if (storedBlock) {
      if (storedBlock.hash == blockOnChain.hash) return;
      this.flagForkBlock({ parentHash: blockOnChain.parentHash, blockNumber });
    }

    //New block creation and mapping
    const block = new Block({
      ...blockOnChain,
      baseFeePerGas: Number(blockOnChain.baseFeePerGas),
    });

    // Save in database
    await em.persistAndFlush(block);

    // Send transactions hashes to dedicated worker
    if (blockOnChain.transactions)
      return client.emit(
        { cmd: 'transactions' },
        {
          blockHash: block.hash,
          blockNumber: block.number,
          transactionHashes: blockOnChain.transactions,
        },
      );

    return;
  }
}
