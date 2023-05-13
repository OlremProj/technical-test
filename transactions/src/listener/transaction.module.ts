import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [Transaction] })],
  controllers: [TransactionController],
  exports: [TransactionService],
  providers: [TransactionService],
})
export class TransactionModule {}
