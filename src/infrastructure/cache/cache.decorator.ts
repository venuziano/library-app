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

      // normalize every arg to a string
      const keyArgs = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
        )
        .join('|');

      const cacheKey = `${ns}:${keyArgs}`;

      // 1) try cache
      const hit = await cache.get(cacheKey);
      if (hit !== undefined) {
        return hit;
      }

      // 2) call the real method
      const result = await original.apply(this, args);

      // 3) store in cache
      await cache.set(cacheKey, result, options.ttl);

      return result;
    };
  };
}

export interface InvalidateCacheOptions {
  /**
   * One or more namespaces to invalidate (wildcard)
   */
  namespace?: string | string[];
  /**
   * Return either:
   * - a string or array of strings: keys to invalidate across all namespaces
   * - a record mapping a namespace to a string or array of strings
   */
  keyGenerator?: (
    ...args: any[]
  ) => string | string[] | Record<string, string | string[]>;
}

export function InvalidateCache(
  options: InvalidateCacheOptions = {},
): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      // 1) execute original
      const result = await originalMethod.apply(this, args);

      // 2) prepare namespaces
      const rawNs = options.namespace ?? String(propertyKey);
      const allNamespaces = Array.isArray(rawNs) ? rawNs : [rawNs];

      // 3) process keyGenerator output
      const specificMap: Record<string, string[]> = {};
      if (options.keyGenerator) {
        const gen = options.keyGenerator(...args);

        if (gen && typeof gen === 'object' && !Array.isArray(gen)) {
          // record form: { ns: key | [keys] }
          for (const [ns, v] of Object.entries(gen)) {
            specificMap[ns] = Array.isArray(v) ? v : [v];
          }
        } else {
          // single or array apply to all namespaces
          const keys = Array.isArray(gen) ? gen : [String(gen)];
          for (const ns of allNamespaces) {
            specificMap[ns] = keys;
          }
        }
      }

      const cache: MultiLevelCacheService = this.cache;
      const tasks: Promise<any>[] = [];

      // 4) invalidate specific keys
      for (const [ns, keys] of Object.entries(specificMap)) {
        for (const key of keys) {
          tasks.push(cache.invalidate(`${ns}:${key}`));
        }
      }

      // 5) invalidate wildcard on every namespace
      for (const ns of allNamespaces) {
        tasks.push(cache.invalidate(`${ns}:*`));
      }

      await Promise.all(tasks);
      return result;
    };

    return descriptor;
  };
}
