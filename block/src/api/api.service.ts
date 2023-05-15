import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Block } from 'src/listener/entities/block.entity';

@Injectable()
export class ApiService {
  constructor(private readonly em: EntityManager) {}

  async getTransaction(): Promise<Block[]> {
    return await this.em.find(Block, { isForked: true });
  }
}
