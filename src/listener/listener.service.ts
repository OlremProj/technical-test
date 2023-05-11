import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class ListenerService {
  private readonly provider;

  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {
    this.provider = new ethers.WebSocketProvider(
      this.configService.get('ALCHEMY_BASE_WS') +
        this.configService.get('ALCHEMY_API_KEY'),
    );
  }

  listen() {
    const fork = this.em.fork();
    this.provider.on('block', async (blockNumber: number) =>
      this.onNewBlock(blockNumber, fork),
    );
  }

  async onNewBlock(blockNumber: number, em: EntityManager) {
    const storedBlock = await em.findOne(Block, { number: blockNumber });
    if (storedBlock) return;
    const blockOnChain = await this.provider.getBlock(blockNumber);

    const transactionHashes = blockOnChain.transactions;

    const block = new Block(blockOnChain);
    await em.persistAndFlush(block);

    for (const transactionHash of transactionHashes) {
      const transactionOnChain = await this.provider.getTransaction(
        transactionHash,
      );

      const transaction = new Transaction(transactionOnChain);
      await em.persistAndFlush(transaction);
    }
    return;
  }
}
