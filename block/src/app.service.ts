import { Injectable, Logger } from '@nestjs/common';
import { Worker, isMainThread } from 'worker_threads';
import workerThreadFilePath from './sync-worker/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  checkMainThread() {
    this.logger.debug(isMainThread ? '' : 'DB Synchronisation');
  }

  runWorker(): string {
    this.checkMainThread();
    const worker = new Worker(workerThreadFilePath);
    worker.on('message', (message) =>
      this.logger.log('DB synchronised : ', message),
    );
    worker.on('error', (e) => this.logger.log('on error', e));
    worker.on('exit', (code) => this.logger.log('on exit', code));

    return 'Processing the db synchronisation';
  }
}
