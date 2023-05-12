import { Inject, Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { ClientProxy } from '@nestjs/microservices';
import { AlchemyWebSocketProvider } from '@ethersproject/providers';
import { InjectRepository } from '@mikro-orm/nestjs';

@Injectable()
export class ListenerService {
  private readonly provider: AlchemyWebSocketProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
    @InjectRepository(Block)
    private readonly blockRepository: EntityRepository<Block>,
    @Inject('TRANSACTIONS_COMPUTATION') private client: ClientProxy,
  ) {
    this.provider = new ethers.providers.AlchemyWebSocketProvider(
      Number(this.configService.get<number>('CHAIN_ID')),
      this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  /**
   * listenOrphan function catch block logs to check removed flag and know if the block Is focked or not
   *
   *
   * @param number
   */
  async flagForkBlock({
    parentHash,
    blockNumber,
  }: {
    parentHash: string;
    blockNumber: number;
  }) {
    const block = await this.blockRepository.findOne({ number: blockNumber });
    await this.blockRepository.upsert({ ...block, flag: 'FORKED' });

    if (
      (
        await this.blockRepository.findOne({
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
   * listen function run new block number listning throw 'newHeads' event
   *
   * @returns Promise<void>
   */
  async listen() {
    this.provider._subscribe('block', ['newHeads'], async (blockHeader) => {
      await this.onNewBlock(blockHeader, this.em, this.client);
    });
  }

  /**
   * onNewBlock function get block data if the block aren't already catch save data in database
   * and send transactions hashes to dedicated nestjs microservices througth redis to traitement
   *
   * @param blockNumber :number
   * @param em :EntityManager
   * @param client:ClientProxy
   * @returns Promise<void>
   */
  async onNewBlock(blockHeader: any, em: EntityManager, client: ClientProxy) {
    const blockNumber = parseInt(blockHeader.number, 16);
    const storedBlock = await em.findOne(Block, {
      number: blockNumber,
    });

    //Escape work if block already saved
    if (storedBlock && storedBlock.hash == blockHeader.hash) {
      return;
    }

    //Get block data
    const blockOnChain = await this.provider.getBlock(blockNumber);

    //New block creation and mapping
    const block = new Block({
      ...blockOnChain,
      baseFeePerGas: Number(blockOnChain.baseFeePerGas),
    });

    // Save in database
    await em.persistAndFlush(block);

    // Send transactions hashes to dedicated worker
    if (blockOnChain.transactions)
      client.emit(
        { cmd: 'transactions' },
        {
          blockHash: block.hash,
          blockNumber: block.number,
          transactionHashes: blockOnChain.transactions,
        },
      );
  }
}
