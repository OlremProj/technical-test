import { EntityRepository } from '@mikro-orm/postgresql';
import { LockedBlock } from '../listener/entities/lockedBlock.entity';
import { LockedSynchronisationBlock } from '../listener/entities/lockedSynchronisation.entity';

export async function aquiringLockBlock(
  em: EntityRepository<LockedBlock>,
  hash: string,
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
    this.logger.log('Lock undetected but block already on process');
    return false;
  }
}

export async function aquiringLockSynchro(
  em: EntityRepository<LockedSynchronisationBlock>,
): Promise<boolean> {
  //Check if synchro isn't already processed by another instance
  const synchroStatus = await em.find({});
  if (synchroStatus?.[0]?.isRunning) return false;

  //Lock
  try {
    await em.upsert({
      isRunning: true,
    });
    return true;
  } catch {
    this.logger.log('Lock undetected but block already on process');
    return false;
  }
}

export async function releasingLockSynchro(
  em: EntityRepository<LockedSynchronisationBlock>,
): Promise<void> {
  //Check if synchro isn't already processed by another instance
  await em.upsert({ isRunning: false });
}
