import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Block {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'bigint' })
  number: number;

  @Property({ type: 'char', length: 66 })
  hash: string;

  @Property({ type: 'bigint' })
  timestamp: number;

  @Property({ type: 'char', length: 66 })
  parentHash: string;

  @Property({ type: 'char', length: 66 })
  nonce: string;

  @Property({ type: 'bigint' })
  difficulty: number;

  @Property({ type: 'bigint' })
  gasLimit: number;

  @Property({ type: 'bigint' })
  gasUsed: number;

  @Property({ type: 'char', length: 66 })
  miner: string;

  @Property({ type: 'longtext' })
  extraData: string;

  @Property({ type: 'bigint' })
  baseFeePerGas: number;

  @Property({ type: 'char', length: 6, nullable: true })
  flag: string;

  constructor({
    number,
    hash,
    timestamp,
    parentHash,
    nonce,
    difficulty,
    gasLimit,
    gasUsed,
    miner,
    extraData,
    baseFeePerGas,
  }) {
    this.number = number;
    this.hash = hash;
    this.timestamp = timestamp;
    this.parentHash = parentHash;
    this.nonce = nonce;
    this.difficulty = difficulty;
    this.gasLimit = gasLimit;
    this.gasUsed = gasUsed;
    this.miner = miner;
    this.extraData = extraData;
    this.baseFeePerGas = baseFeePerGas;
  }
}
