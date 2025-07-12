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
        DB_PASSWORD: Joi.string().required(),
        DATABASE: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        CACHE_TTL_L1: Joi.number().required(),
        CACHE_TTL_L2: Joi.number().required(),
        NODE_ENV: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.number().required(),
        MAIL_SECURE: Joi.boolean().required(),
        MAIL_USER: Joi.string().optional().allow(''),
        MAIL_PASSWORD: Joi.string().optional().allow(''),
        MAIL_FROM: Joi.string().optional().allow(''),
      }),
    }),
  ],
  providers: [AppEnvConfigService, ConfigService],
  exports: [AppEnvConfigService, ConfigService],
})
export class AppConfigModule {}
