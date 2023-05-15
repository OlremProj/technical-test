import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Block } from 'src/listener/entities/block.entity';
import { BlockDTO } from './api.dto';

@Injectable()
export class ApiService {
  constructor(private readonly em: EntityManager) {}

  async getTransaction(): Promise<BlockDTO[]> {
    return await this.em.find(Block, { flag: 'FORKED' });
  }
}
