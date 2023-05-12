import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { TransactionsDTO } from './dto/transactions.dto';
import { Transaction } from './entities/transaction.entity';
import { AlchemyWebSocketProvider } from '@ethersproject/providers';

@Injectable()
export class TransactionService {
  private readonly provider: AlchemyWebSocketProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {
    this.provider = new ethers.providers.AlchemyWebSocketProvider(
      Number(this.configService.get<number>('CHAIN_ID')),
      this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  async transactions({ blockHash, transactionHashes }: TransactionsDTO) {
    for (const transactionHash of transactionHashes) {
      const transactionOnChain = await this.provider.getTransaction(
        transactionHash,
      );

      const transaction = new Transaction({
        ...transactionOnChain,
        gasPrice: Number(transactionOnChain.gasPrice),
        gasLimit: Number(transactionOnChain.gasLimit),
        value: Number(transactionOnChain.value),
        blockHash,
      } as unknown as Transaction);

      await this.em.persistAndFlush(transaction);
    }
  }
}
