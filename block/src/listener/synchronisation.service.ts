import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { AlchemyProvider, ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { ClientProxy } from '@nestjs/microservices';
import { LockedBlock } from './entities/lockedBlock.entity';

@Injectable()
export class SynchronisationService {
  private readonly logger = new Logger(SynchronisationService.name);
  provider: AlchemyProvider;
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
    this.provider = new ethers.AlchemyProvider(
      137,
      this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  async dbSynchronisation() {
    this.logger.log(
      'DB Synchonisation to get missing block after service restart',
    );
    const latestStoredBlock: Block[] = await this.em.find(
      Block,
      {},
      {
        orderBy: { number: -1 },
        limit: 1,
      },
    );

    //If it's the first launch of the application we don't launch sync on the blockchain from the blocknumber 0
    if (!latestStoredBlock || latestStoredBlock.length === 0) {
      this.logger.log('First start nothing to recover');
      return;
    }

    let { number: latestDbBlockNumber } = latestStoredBlock[0];

    const latestBcBlockNumber: number = (await this.provider.getBlock('latest'))
      .number;

    if (latestDbBlockNumber === latestBcBlockNumber) {
      this.logger.log('Already synchronised');
      return;
    }
    this.logger.log(
      `Recovering of ${
        latestBcBlockNumber - latestDbBlockNumber
      } missing block`,
    );
    this.logger.log(
      `Recovering from ${latestDbBlockNumber} to ${latestBcBlockNumber}`,
    );

    while (latestDbBlockNumber < latestBcBlockNumber) {
      latestDbBlockNumber++;
      this.logger.log('Recovery of : ', latestDbBlockNumber);
      try {
        //Get block data
        const blockOnChain = await this.provider.getBlock(latestDbBlockNumber);

        //Check if data isn't already processed by another instance
        if (
          !!(await this.em.findOne(LockedBlock, {
            hash: blockOnChain.hash,
          }))
        )
          return;

        //Lock block in process
        try {
          const lock = new LockedBlock({ hash: blockOnChain.hash });
          await this.em.persistAndFlush(lock);
        } catch {
          this.logger.log('Lock undetected but block already on process');
          return;
        }

        //New block creation and mapping
        const block = new Block({
          ...blockOnChain,
          baseFeePerGas: Number(blockOnChain.baseFeePerGas),
        });

        // Save in database
        await this.em.persistAndFlush(block);

        // Send transactions hashes to dedicated worker
        if (blockOnChain.transactions)
          this.client.emit(
            { cmd: 'transactions' },
            {
              blockHash: block.hash,
              blockNumber: block.number,
              transactionHashes: blockOnChain.transactions,
            },
          );
      } catch (error) {
        this.logger.log(error);
      }
    }
    return latestDbBlockNumber;
  }
}
