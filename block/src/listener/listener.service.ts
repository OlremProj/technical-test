import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ListenerService {
  private readonly provider;

  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
    @Inject('TRANSACTIONS_COMPUTATION') private client: ClientProxy,
  ) {
    this.provider = new ethers.WebSocketProvider(
      this.configService.get('ALCHEMY_BASE_WS') +
        this.configService.get('ALCHEMY_API_KEY'),
    );
  }

  listen() {
    const fork = this.em.fork();
    return this.provider.on('block', async (blockNumber: number) =>
      this.onNewBlock(blockNumber, fork, this.client),
    );
  }

  async onNewBlock(
    blockNumber: number,
    em: EntityManager,
    client: ClientProxy,
  ) {
    const storedBlock = await em.findOne(Block, { number: blockNumber });
    if (storedBlock) return;
    const blockOnChain = await this.provider.getBlock(blockNumber);

    const transactionHashes = blockOnChain.transactions;

    const block = new Block(blockOnChain);
    await em.persistAndFlush(block);
    const data = {
      blockHash: block.hash,
      blockNumber: block.number,
      transactionHashes,
    };
    console.log('===================data');
    console.log(data);
    console.log('===================data');

    return client.send('transactions', data);
  }
}
