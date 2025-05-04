import { Provider } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ICacheService } from 'src/domain/cache/interfaces';

export const cacheProviders: Provider[] = [
  {
    provide: 'ICacheService',
    useFactory: (cache: Cache): ICacheService => ({
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
    }),
    inject: [CACHE_MANAGER],
  },
];
