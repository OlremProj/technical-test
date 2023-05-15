import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class TransactionError {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'char', length: 66, unique: true })
  hash: string;

  @Property({ type: 'text' })
  cause: string;

  constructor({ hash, cause }) {
    this.hash = hash;
    this.cause = cause;
  }
}
