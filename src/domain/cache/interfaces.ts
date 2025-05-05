export interface ICacheService {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;

  // remove all keys matching a glob‐style pattern
  invalidate(pattern: string): Promise<void>;
}
