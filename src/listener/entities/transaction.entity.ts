import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Signature } from './signature.entity';

@Entity()
export class Transaction {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'bigint' })
  blockNumber: number;

  @Property({ type: 'char', length: 66 })
  blockHash: string;

  @Property({ type: 'bigint', nullable: true })
  index: number | undefined;

  @Property({ type: 'char', length: 66 })
  hash: string;

  @Property({ type: 'bigint' })
  type: number;

  @Property({ type: 'char', length: 66 })
  to: string;

  @Property({ type: 'char', length: 66 })
  from: string;

  @Property({ type: 'bigint' })
  nonce: number;

  @Property({ type: 'bigint' })
  gasLimit: bigint;

  @Property({ type: 'bigint' })
  gasPrice: bigint;

  @Property({ type: 'bigint' })
  maxPriorityFeePerGas: number;

  @Property({ type: 'bigint' })
  maxFeePerGas: number;

  @Property({ type: 'longtext' })
  data: string;

  @Property({ type: 'bigint' })
  value: number;

  @Property({ type: 'bigint' })
  chainId: number;

  @Property({ type: 'array', nullable: true })
  accessList: any[];

  constructor({
    blockNumber,
    blockHash,
    index,
    hash,
    type,
    to,
    from,
    nonce,
    gasLimit,
    gasPrice,
    maxPriorityFeePerGas,
    maxFeePerGas,
    data,
    value,
    chainId,
    accessList,
  }) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.index = index;
    this.hash = hash;
    this.type = type;
    this.to = to;
    this.from = from;
    this.nonce = nonce;
    this.gasLimit = gasLimit;
    this.gasPrice = gasPrice;
    this.maxPriorityFeePerGas = maxPriorityFeePerGas;
    this.maxFeePerGas = maxFeePerGas;
    this.data = data;
    this.value = value;
    this.chainId = chainId;
    this.accessList = accessList;
  }
}
