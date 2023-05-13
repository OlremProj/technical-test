import { EntityRepository } from '@mikro-orm/postgresql';
import { Block } from './block.entity';

export class BlockRepository extends EntityRepository<Block> {}
