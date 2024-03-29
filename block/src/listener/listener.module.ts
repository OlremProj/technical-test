import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ListenerService } from './listener.service';
import { Block } from 'src/listener/entities/block.entity';
import { LockedBlock } from 'src/listener/entities/lockedBlock.entity';
import { SynchronisationService } from './synchronisation.service';
import { LockedSynchronisationBlock } from './entities/lockedSynchronisation.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature({
      entities: [Block, LockedBlock, LockedSynchronisationBlock],
    }),
    ClientsModule.registerAsync([
      {
        name: 'TRANSACTIONS_COMPUTATION',
        useFactory: async (configService: ConfigService) => {
          return {
            name: 'TRANSACTIONS_COMPUTATION',
            transport: Transport.REDIS,
            options: {
              host: configService.get('REDIS_ENDPOINT'),
              port: Number(configService.get('REDIS_PORT')),
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ListenerService, SynchronisationService],
  providers: [ListenerService, SynchronisationService],
})
export class ListenerModule {}
