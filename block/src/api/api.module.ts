import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Block } from 'src/listener/entities/block.entity';
import { ApiService } from './api.service';
import { ApiController } from './api.controller';

@Module({
  controllers: [ApiController],
  imports: [MikroOrmModule.forFeature({ entities: [Block] })],
  exports: [ApiService],
  providers: [ApiService],
})
export class ApiModule {}
