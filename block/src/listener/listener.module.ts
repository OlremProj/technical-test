import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ListenerService } from './listener.service';
import { Block } from 'src/listener/block.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BlockRepository } from './block.repository';

@Module({
  imports: [
    MikroOrmModule.forFeature({ entities: [Block] }),
    ClientsModule.register([
      {
        name: 'TRANSACTIONS_COMPUTATION',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
  ],
  exports: [ListenerService],
  providers: [ListenerService, BlockRepository],
})
export class ListenerModule {}
