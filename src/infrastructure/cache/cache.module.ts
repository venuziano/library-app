import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisCheckService } from './redis-cache.service';
import { MultiLevelCacheService } from './multi-level-cache.service';
import { AppConfigModule } from '../config/app-config.module';

@Global()
@Module({
  imports: [
    AppConfigModule,

    // L1: in-memory
    CacheModule.register({
      store: 'memory',
      ttl: Number(process.env.CACHE_TTL_L1) || 30,
      max: 1000,
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
