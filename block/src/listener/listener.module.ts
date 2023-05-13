import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ListenerService } from './listener.service';
import { Block } from 'src/listener/block.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BlockRepository } from './block.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MikroOrmModule.forFeature({ entities: [Block] }),
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
  exports: [ListenerService],
  providers: [ListenerService, BlockRepository],
})
export class ListenerModule {}
