import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ListenerService } from './listener.service';
import { Block } from 'src/listener/entities/block.entity';

@Module({
  imports: [MikroOrmModule.forFeature({ entities: [Block] })],
  exports: [ListenerService],
  providers: [ListenerService],
})
export class ListenerModule {}
