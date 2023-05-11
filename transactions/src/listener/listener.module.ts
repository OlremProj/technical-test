import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ListenerService } from './listener.service';
import { Transaction } from './entities/transaction.entity';
import { ListenerController } from './listener.controller';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [Transaction] })],
  controllers: [ListenerController],
  exports: [ListenerService],
  providers: [ListenerService],
})
export class ListenerModule {}
