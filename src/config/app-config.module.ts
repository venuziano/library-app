import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

import { AppEnvConfigService } from './environment-variables/app-env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true, // no need to import ConfigModule elsewhere
      cache: true, // cache values for faster reads
      validationSchema: Joi.object({
        API_PORT: Joi.number().required(),
        PG_TYPE: Joi.string().required(),
        HOST: Joi.string().required(),
        PG_PORT: Joi.number().required(),
        USERNAME: Joi.string().required(),
        PASSWORD: Joi.string().required(),
        DATABASE: Joi.string().required(),
      }),
    }),
  ],
  providers: [AppEnvConfigService, ConfigService],
  exports: [AppEnvConfigService, ConfigService],
})
export class AppConfigModule {}
