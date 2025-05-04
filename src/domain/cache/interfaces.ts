export interface ICacheService {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}
