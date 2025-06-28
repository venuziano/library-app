import { MultiLevelCacheService } from './multi-level-cache.service';

export interface CacheableOptions {
  namespace?: string;
  ttl?: number;
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

export interface InvalidateCacheOptions {
  /** Namespace to evict; defaults to the method name */
  namespace?: string | string[];
  /**
   * Optional function to compute specific keys to delete.
   * If omitted, the decorator will delete *all* keys in the namespace.
   */
  keyGenerator?: (...args: any[]) => string | string[];
}

export function InvalidateCache(
  options: InvalidateCacheOptions = {},
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    console.log('options', options);
    const original = descriptor.value!;
    descriptor.value = async function (...args: any[]) {
      // 1) run the mutation
      const result = await original.apply(this, args);

      // 2) perform cache eviction
      const cache: MultiLevelCacheService = this.cache;
      const rawNs = options.namespace ?? String(propertyKey);
      const namespaces = Array.isArray(rawNs) ? rawNs : [rawNs];

      await Promise.all(namespaces.map((ns) => cache.invalidate(`${ns}:*`)));

      // if (options.keyGenerator) {
      //   // delete only specific keys under each namespace
      //   const generated = options.keyGenerator(...args);
      //   console.log('generated', generated);
      //   const keys = Array.isArray(generated) ? generated : [generated];
      //   await Promise.all(
      //     namespaces.flatMap((ns) =>
      //       keys.map((key) => cache.invalidate(`${ns}:${key}`)),
      //     ),
      //   );
      // } else {
      //   // delete all keys matching each namespace prefix
      //   await Promise.all(namespaces.map((ns) => cache.invalidate(`${ns}:*`)));
      // }

      return result;
    };
  };
}
