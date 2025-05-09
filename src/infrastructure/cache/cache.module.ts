import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisCheckService } from './redis-cache.service';
import { MultiLevelCacheService } from './multi-level-cache.service';
import { AppConfigModule } from '../config/app-config.module';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';

@Global()
@Module({
  imports: [
    AppConfigModule,

    // L1: in-memory
    CacheModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppEnvConfigService],
      useFactory: (config: AppEnvConfigService) => ({
        store: 'memory',
        ttl: config.cacheTTLL1,
        max: 1000,
      }),
    }),

    // L2 is already imported in the RedisCheckService file
  ],
  providers: [
    RedisCheckService,
    {
      provide: 'ICacheService',
      useClass: MultiLevelCacheService,
    },
  ],
  exports: ['ICacheService'],
})
export class InfrastructureCacheModule {}
