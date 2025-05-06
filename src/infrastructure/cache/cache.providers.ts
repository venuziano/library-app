import { Logger, Provider } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RedisCheckService } from './redis-cache.service';
import { ICacheService } from 'src/domain/cache/interfaces';

export const cacheProviders: Provider[] = [
  {
    provide: 'ICacheService',
    inject: [CACHE_MANAGER, RedisCheckService],
    useFactory: (
      cache: Cache,
      redisCheckService: RedisCheckService,
    ): ICacheService => {
      const logger = new Logger('CacheInvalidator');

      return {
        get: async <T = unknown>(key: string): Promise<T | undefined> => {
          const value = await cache.get<T>(key);
          return value ?? undefined;
        },

        set: async (key: string, value: unknown, ttl?: number) => {
          if (ttl !== undefined) {
            await cache.set(key, value, ttl);
          } else {
            await cache.set(key, value);
          }
        },

        del: async (key: string) => {
          await cache.del(key);
        },

        invalidate: async (pattern: string) => {
          const client = redisCheckService.getClient();
          const pipeline = client.multi();
          let total = 0;

          // use scanIterator from redis@4.x
          for await (const key of client.scanIterator({
            MATCH: pattern,
            COUNT: 100,
          })) {
            pipeline.del(key);
            total++;
          }

          if (total > 0) {
            await pipeline.exec();
            // now this is a safe call on our local logger
            logger.log(`🗑️ Invalidated ${total} keys matching "${pattern}"`);
          } else {
            logger.warn(`⚠️ No keys matched "${pattern}"`);
          }
        },
      };
    },
  },
];
