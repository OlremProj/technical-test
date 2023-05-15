import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class LockedSynchronisationBlock {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'boolean', unique: true })
  isRunning: boolean;

  constructor({ isRunning }) {
    this.isRunning = isRunning;
  }
}