import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Block } from '@/listener/entities/block.entity';
import { TransactionError } from '@/listener/entities/transactionError.entity';
import { Transaction } from '@/listener/entities/transaction.entity';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

@Module({
  controllers: [ApiController],
  imports: [
    MikroOrmModule.forFeature({
      entities: [Block, Transaction, TransactionError],
    }),
  ],
  exports: [ApiService],
  providers: [ApiService],
})
export class ApiModule {}
