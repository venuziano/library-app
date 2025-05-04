import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

import { RedisCheckService } from './redis-cache.service';
import { cacheProviders } from './cache.providers';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';
import { AppConfigModule } from '../config/app-config.module';

@Global()
@Module({
  imports: [
    AppConfigModule,
    CacheModule.registerAsync({
      imports: [AppConfigModule],
      isGlobal: true,
      inject: [AppEnvConfigService],
      useFactory: (config: AppEnvConfigService) => {
        const redisUrl = config.redisURL;

        return {
          ttl: config.cacheTTL,
          stores: [createKeyv(redisUrl)],
          keyPrefix: '',
        };
      },
    }),
  ],
  providers: [RedisCheckService, ...cacheProviders],
  exports: [RedisCheckService, ...cacheProviders],
})
export class InfrastructureCacheModule {}
