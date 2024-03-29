import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ListenerModule } from 'src/listener/listener.module';
import { AppService } from 'src/app.service';
import { parentPort } from 'worker_threads';
import { SynchronisationService } from 'src/listener/synchronisation.service';
import { Logger } from '@nestjs/common';

async function run() {
  const logger = new Logger();
  const app = await NestFactory.createApplicationContext(AppModule);
  const synchronisationService = app
    .select(ListenerModule)
    .get(SynchronisationService, { strict: true });

  const appService = app.select(AppModule).get(AppService, { strict: true });

  appService.checkMainThread();
  try {
    const blockNumber = await synchronisationService.dbSynchronisation();
    parentPort.postMessage(blockNumber);
  } catch (error) {
    logger.error(error);
  }
}

run();
