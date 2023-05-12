import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TransactionModule } from './listener/transaction.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          host: 'localhost',
          port: 5432,
          allowGlobalContext: true,
          entities: ['dist/**/*.entity.js'],
          entitiesTs: ['src/**/*.entity.ts'],
          dbName: configService.get('POSTGRES_DB'),
          user: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          type: 'postgresql',
        };
      },
      inject: [ConfigService],
    }),
    TransactionModule,
  ],
  providers: [],
})
export class AppModule {}
