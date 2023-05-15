import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { AlchemyProvider, ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { ClientProxy } from '@nestjs/microservices';
import {
  aquiringLockSynchro,
  releasingLockSynchro,
} from 'src/helpers/lock.helpers';
import { LockedSynchronisationBlock } from './entities/lockedSynchronisation.entity';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class SynchronisationService {
  private readonly logger = new Logger(SynchronisationService.name);
  provider: AlchemyProvider;

  /**
   * ListenerService constructor.
   *
   * @param configService - Configuration service.
   * @param lockRepository - Lock repository.
   * @param blockRepository - Block repository.
   * @param client - Microservice client.
   */
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Block)
    private readonly blockRepository: EntityRepository<Block>,
    @InjectRepository(LockedSynchronisationBlock)
    private readonly lockRepository: EntityRepository<LockedSynchronisationBlock>,
    @Inject('TRANSACTIONS_COMPUTATION') private client: ClientProxy,
  ) {
    this.provider = new ethers.AlchemyProvider(
      137,
      this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  /**
   * This function synchronizes the local database with the latest blocks on the blockchain.
   * It retrieves the latest block number stored in the database, and compares it to the latest block number on the blockchain.
   * If there are missing blocks between the latest block number in the database and the latest block number on the blockchain,
   * it retrieves them from the blockchain, saves them in the database, and sends their transaction hashes to a dedicated worker.
   * This function also acquires and releases a lock in order to prevent multiple instances of this function from running at the same time.
   * @returns {Promise<number>} The latest block number stored in the database after synchronization is complete.
   */
  async dbSynchronisation() {
    if (!(await aquiringLockSynchro(this.lockRepository, this.logger))) return;

    this.logger.log(
      'DB Synchonisation to get missing block after service restart',
    );
    const latestStoredBlock: Block[] = await this.blockRepository.find(
      {},
      {
        orderBy: { number: -1 },
        limit: 1,
      },
    );

    //If it's the first launch of the application we don't launch sync on the blockchain from the blocknumber 0
    if (!latestStoredBlock || latestStoredBlock.length === 0) {
      this.logger.log('First start nothing to recover');
      await releasingLockSynchro(this.lockRepository);
      return;
    }

    let { number: latestDbBlockNumber } = latestStoredBlock[0];

    const latestBcBlockNumber: number = (await this.provider.getBlock('latest'))
      .number;

    if (latestBcBlockNumber - latestDbBlockNumber <= 1) {
      this.logger.log('Already synchronised');
      await releasingLockSynchro(this.lockRepository);
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

        //New block creation and mapping
        const block = new Block({
          ...blockOnChain,
          baseFeePerGas: Number(blockOnChain.baseFeePerGas),
        });

        // Save in database
        await this.blockRepository.upsert(block);

        // Send transactions hashes to dedicated worker
        if (blockOnChain.transactions) {
          this.client.emit(
            { cmd: 'transactions' },
            {
              blockHash: block.hash,
              blockNumber: block.number,
              transactionHashes: blockOnChain.transactions,
            },
          );
        }
      } catch (error) {
        this.logger.log(error);
      }
    }

    await releasingLockSynchro(this.lockRepository);

    return latestDbBlockNumber;
  }
}
