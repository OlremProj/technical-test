import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class LockedTxs {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'char', length: 66, unique: true })
  hash: string;

  @Property({ type: 'bigint' })
  timestamp: number;

  constructor({ hash }) {
    this.hash = hash;
    this.timestamp = Date.now();
  }
}
