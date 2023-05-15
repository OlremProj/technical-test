import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Transaction } from './entities/transaction.entity';
import { LockedTransactions } from './entities/lockedTransactions.entity';
import { TransactionError } from './entities/transactionError.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [Transaction, LockedTransactions, TransactionError],
    }),
  ],
  controllers: [TransactionController],
  exports: [TransactionService],
  providers: [TransactionService],
})
export class TransactionModule {}
