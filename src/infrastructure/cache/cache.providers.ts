import { Provider } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { RedisCheckService } from './redis-cache.service';
import { ICacheService } from 'src/domain/cache/interfaces';

export const cacheProviders: Provider[] = [
  {
    provide: 'ICacheService',
    useFactory: (
      cache: Cache,
      redisCheckService: RedisCheckService,
    ): ICacheService => ({
      get: async <T = unknown>(key: string): Promise<T | undefined> => {
        const v = await cache.get<T>(key);
        return v ?? undefined;
      },

      set: async (key: string, value: unknown, ttl?: number): Promise<void> => {
        if (ttl !== undefined) {
          await cache.set(key, value, ttl);
        } else {
          await cache.set(key, value);
        }
      },

      del: async (key: string): Promise<void> => {
        await cache.del(key);
      },

      /**
       * Scan & delete all keys matching the glob pattern.
       * e.g. invalidate('authors:*')
       */
      invalidate: async (pattern: string): Promise<void> => {
        const client = redisCheckService.getClient();
        let cursor = '0';
        const pipeline = client.multi();
        let total = 0;

        do {
          // scan returns { cursor, keys[] }
          const { cursor: nextCursor, keys } = await client.scan(cursor, {
            MATCH: pattern,
            COUNT: 100, // number, not string
          });

          cursor = nextCursor;

          for (const key of keys) {
            pipeline.del(key);
            total++;
          }
        } while (cursor !== '0');

        if (total > 0) {
          await pipeline.exec();
          console.log(`🗑️ Invalidated ${total} keys matching "${pattern}"`);
        } else {
          console.log(`⚠️ No keys matched "${pattern}", nothing to delete`);
        }
      },
    }),
    inject: [CACHE_MANAGER, RedisCheckService],
  },
];
