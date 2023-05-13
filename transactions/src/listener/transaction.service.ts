import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { WebSocketProvider, ethers } from 'ethers';
import { TransactionsDTO } from './dto/transactions.dto';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionService {
  private readonly provider: WebSocketProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {
    this.provider = new ethers.WebSocketProvider(
      this.configService.get<string>('ALCHEMY_BASE_WS') +
        this.configService.get<string>('ALCHEMY_API_KEY'),
    );
  }

  async getTransaction(transactionHash: string, retry = 0) {
    try {
      const transactionOnChain = await this.provider.getTransaction(
        transactionHash,
      );
      return transactionOnChain;
    } catch (error) {
      if (retry < 5) return await this.getTransaction(transactionHash, retry++);
      return;
    }
  }

  async transactions({ blockHash, transactionHashes }: TransactionsDTO) {
    for (const transactionHash of transactionHashes) {
      const transactionOnChain = await this.getTransaction(transactionHash);
      const transaction = new Transaction({
        ...transactionOnChain,
        gasPrice: transactionOnChain.gasPrice
          ? Number(transactionOnChain.gasPrice)
          : null,
        gasLimit: transactionOnChain.gasLimit
          ? Number(transactionOnChain.gasLimit)
          : null,
        value: transactionOnChain.value
          ? Number(transactionOnChain.value)
          : null,
        blockHash,
      } as unknown as Transaction);

      try {
        await this.em.persistAndFlush(transaction);
      } catch (error) {
        /**
         * Need to be replace by real logger system like winston
         * I make the choice to log instead of throw because at this place
         * we need to set up a behavior to handle every error append to don't loose information
         */

        console.error(
          `error append : ${error}, on transaction : ${transaction.hash}`,
        );
      }
    }
  }
}
