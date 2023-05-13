import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ListenerService } from './listener/listener.service';
import { ListenerModule } from './listener/listener.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const listenerService = app
    .select(ListenerModule)
    .get(ListenerService, { strict: true });

  listenerService.listen();
}
bootstrap();
