import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable_options';

export interface CacheableOptions {
  /** TTL in seconds (overrides default in service) */
  ttl?: number;
  /** Optional namespace to group keys */
  namespace?: string;
}

/**
 * @Cacheable({ ttl?: number; namespace?: string })
 *
 * Marks a resolver (or controller method) as cacheable.
 */
export const Cacheable = (options: CacheableOptions = {}) =>
  SetMetadata(CACHEABLE_KEY, options);
