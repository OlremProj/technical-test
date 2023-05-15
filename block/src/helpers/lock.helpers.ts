import { EntityManager } from '@mikro-orm/postgresql';
import { LockedBlock } from 'src/listener/entities/lockedBlock.entity';
import { LockedlockedSynchronisationBlock } from 'src/listener/entities/lockedSynchronisation.entity';

export async function aquiringLockBlock(
  em: EntityManager,
  hash: string,
): Promise<boolean> {
  //Check if data isn't already processed by another instance
  if (
    !!(await em.findOne(LockedBlock, {
      hash,
    }))
  )
    return false;

  //Lock block in process
  try {
    const lock = new LockedBlock({ hash });
    await em.persistAndFlush(lock);
    return true;
  } catch {
    this.logger.log('Lock undetected but block already on process');
    return false;
  }
}

export async function aquiringLockSynchro(em: EntityManager): Promise<boolean> {
  //Check if synchro isn't already processed by another instance
  const synchroStatus = await em.findOne(LockedlockedSynchronisationBlock, {});
  if (synchroStatus?.isRunning) return false;

  //Lock
  try {
    await em.upsert(LockedlockedSynchronisationBlock, {
      isRunning: true,
    });
    return true;
  } catch {
    this.logger.log('Lock undetected but block already on process');
    return false;
  }
}

export async function releasingLockSynchro(em: EntityManager): Promise<void> {
  //Check if synchro isn't already processed by another instance
  await em.upsert(LockedlockedSynchronisationBlock, { isRunning: false });
}
