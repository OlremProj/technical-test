import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ListenerService } from './listener/listener.service';
import { ListenerModule } from './listener/listener.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: 'localhost',
        port: 6379,
      },
    },
  );

  const listenerService = app
    .select(ListenerModule)
    .get(ListenerService, { strict: true });

  listenerService.listen();
}
bootstrap();
