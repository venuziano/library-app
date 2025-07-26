import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from 'src/infrastructure/config/app-config.module';
import { AppEnvConfigService } from 'src/infrastructure/config/environment-variables/app-env.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: AppEnvConfigService) => ({
        type: 'postgres',
        // type: config.pgDBType as any,
        host: config.dbHost,
        port: config.pgDBPort,
        username: config.dbUsername,
        password: config.dbPassword,
        database: config.dbName,
        autoLoadEntities: true,
        synchronize: false,
        ssl: config.nodeEnv === 'prod' ? { rejectUnauthorized: false } : false,
      }),
      inject: [AppEnvConfigService],
    }),
  ],
})
export class DatabaseModule {}
