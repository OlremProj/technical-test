import { Injectable } from '@nestjs/common';
import { Block } from '@/listener/entities/block.entity';
import { EntityRepository } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Transaction } from '@/listener/entities/transaction.entity';
import { TransactionError } from '@/listener/entities/transactionError.entity';

@Injectable()
export class ApiService {
  constructor(
    @InjectRepository(TransactionError)
    private readonly transactionErrorRepository: EntityRepository<TransactionError>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: EntityRepository<Transaction>,
    @InjectRepository(Block)
    private readonly blockRepository: EntityRepository<Block>,
  ) {}

  async getForkedBlocks(): Promise<Block[]> {
    return await this.blockRepository.find({ isForked: true });
  }

  async getBlockCount(): Promise<number> {
    return await this.blockRepository.count();
  }

  async getTransactionCount(): Promise<number> {
    return await this.transactionRepository.count();
  }

  async getTransactionsError(): Promise<TransactionError[]> {
    return await this.transactionErrorRepository.find({});
  }
}
