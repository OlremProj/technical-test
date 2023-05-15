import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ListenerService } from './listener/listener.service';
import { ListenerModule } from './listener/listener.module';
import { AppService } from './app.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const listenerService = app
    .select(ListenerModule)
    .get(ListenerService, { strict: true });
  const appService = app.select(AppModule).get(AppService, { strict: true });

  const configService = app.get(ConfigService);

  appService.runWorker();
  listenerService.listen();

  // Swagger documentation ❤️
  const swaggerOptions = new DocumentBuilder()
    .setTitle('Block API')
    .setVersion('1.0.0')
    .build();

  const swaggerDocumentation = SwaggerModule.createDocument(
    app,
    swaggerOptions,
  );

  SwaggerModule.setup('documentation', app, swaggerDocumentation);

  await app.listen(configService.get('API_PORT'));
}
bootstrap();
