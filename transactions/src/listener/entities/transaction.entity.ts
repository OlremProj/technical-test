import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Transaction {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'bigint', nullable: true })
  blockNumber: number;

  @Property({ type: 'char', length: 66 })
  blockHash: string;

  @Property({ type: 'bigint', nullable: true })
  transactionIndex: number | undefined;

  @Property({ type: 'char', length: 66 })
  hash: string;

  @Property({ type: 'bigint' })
  type: number;

  @Property({ type: 'char', length: 66, nullable: true })
  to: string;

  @Property({ type: 'char', length: 66 })
  from: string;

  @Property({ type: 'bigint' })
  nonce: number;

  @Property({ type: 'bigint', nullable: true })
  gasLimit: bigint;

  @Property({ type: 'bigint', nullable: true })
  gasPrice: bigint;

  @Property({ type: 'bigint', nullable: true })
  maxPriorityFeePerGas: number;

  @Property({ type: 'bigint', nullable: true })
  maxFeePerGas: number;

  @Property({ type: 'text' })
  data: string;

  @Property({ type: 'text', nullable: true })
  value: number;

  @Property({ type: 'bigint', nullable: true })
  chainId: number;

  @Property({ type: 'text', nullable: true })
  accessList: string;

  constructor({
    blockNumber,
    blockHash,
    transactionIndex,
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
    this.transactionIndex = transactionIndex;
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
    this.accessList = accessList ? accessList.toString() : null;
  }
}
