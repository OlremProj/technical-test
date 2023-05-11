import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { TransactionsDTO } from './dto/transactions.dto';
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

  async transactions({
    blockHash,
    blockNumber,
    transactionHashes,
  }: TransactionsDTO) {
    for (const transactionHash of transactionHashes) {
      const transactionOnChain = await this.provider.getTransaction(
        transactionHash,
      );
      const transaction = new Transaction({
        ...transactionOnChain,
        blockHash,
        blockNumber,
      });
      await this.em.fork().persistAndFlush(transaction);
    }
  }
}
