import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Signature {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'char', length: 66 })
  r: string;

  @Property({ type: 'char', length: 66 })
  s: string;

  @Property({ type: 'bigint' })
  yParity: number;

  @Property({ type: 'bigint' })
  networkV: number;
}
