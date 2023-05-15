import { EntityRepository } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';
import { LockedBlock } from '../listener/entities/lockedBlock.entity';
import { LockedSynchronisationBlock } from '../listener/entities/lockedSynchronisation.entity';

/**
 * Acquires a lock on a `LockedBlock` entity with the specified `hash`.
 * @param {EntityRepository<LockedBlock>} em - An `EntityRepository` instance for the `LockedBlock` entity.
 * @param {string} hash - The hash of the data to be locked.
 * @returns {Promise<boolean>} A boolean indicating whether the lock was successfully acquired.
 */
export async function aquiringLockBlock(
  em: EntityRepository<LockedBlock>,
  hash: string,
  logger: Logger,
): Promise<boolean> {
  //Check if data isn't already processed by another instance
  if (
    !!(await em.findOne({
      hash,
    }))
  )
    return false;

  //Lock block in process
  try {
    const lock = new LockedBlock({ hash });
    await em.upsert(lock);
    return true;
  } catch {
    logger.log('Lock undetected but block already on process');
    return false;
  }
}

/**
 * Acquires a lock on a `LockedSynchronisationBlock` entity.
 * @param {EntityRepository<LockedSynchronisationBlock>} em - An `EntityRepository` instance for the `LockedSynchronisationBlock` entity.
 * @returns {Promise<boolean>} A boolean indicating whether the lock was successfully acquired.
 */
export async function aquiringLockSynchro(
  em: EntityRepository<LockedSynchronisationBlock>,
  logger: Logger,
): Promise<boolean> {
  //Check if synchro isn't already processed by another instance
  const synchroStatus = await em.find({});

  if (!!synchroStatus?.[0]?.isRunning) return false;

  //Lock
  try {
    await em.upsert({ id: 1, isRunning: true });
    return true;
  } catch {
    logger.log('Lock undetected but block already on process');
    return false;
  }
}

/**
 * Releases the lock on a `LockedSynchronisationBlock` entity.
 * @param {EntityRepository<LockedSynchronisationBlock>} em - An `EntityRepository` instance for the `LockedSynchronisationBlock` entity.
 * @returns {Promise<void>}
 */
export async function releasingLockSynchro(
  em: EntityRepository<LockedSynchronisationBlock>,
): Promise<void> {
  let lockedSynchronisationBlock = await em.findOne({ id: 1 });
  lockedSynchronisationBlock.isRunning = false;
  await em.getEntityManager().persistAndFlush(lockedSynchronisationBlock);
}
