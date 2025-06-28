import { MultiLevelCacheService } from './multi-level-cache.service';

export interface CacheableOptions {
  ttl?: number;
  namespace?: string;
}

/**
 * Wraps the decorated method so that:
 *  - on entry it tries the L1/L2 cache
 *  - on miss it calls the real method, then stores the result
 */
export function Cacheable(options: CacheableOptions = {}): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value!;
    descriptor.value = async function (...args: any[]) {
      // assume your service has a `cache: MultiLevelCacheService` property
      const cache: MultiLevelCacheService = this.cache;
      const ns = options.namespace ?? String(propertyKey);
      const key = `${ns}:${JSON.stringify(args)}`;

      // 1) try cache
      const hit = await cache.get(key);
      if (hit !== undefined) {
        return hit;
      }

      // 2) call the real method
      const result = await original.apply(this, args);

      // 3) store in cache
      await cache.set(key, result, options.ttl);

      return result;
    };
  };
}
