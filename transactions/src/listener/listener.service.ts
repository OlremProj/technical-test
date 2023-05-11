import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { Transaction } from './entities/transaction.entity';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';

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

  async listen() {
    // for (const transactionHash of transactionHashes) {
    //   const transactionOnChain = await this.provider.getTransaction(
    //     transactionHash,
    //   );
    //   const transaction = new Transaction({
    //     ...transactionOnChain,
    //     blockHash: block.hash,
    //     blockNumber: block.number,
    //   });
    //   await em.persistAndFlush(transaction);
    // }
  }
}
