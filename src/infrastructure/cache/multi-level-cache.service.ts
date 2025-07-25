import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import NodeCache from 'node-cache';
import { RedisCheckService } from './redis-cache.service';
import { randomUUID } from 'crypto';

import { ICacheService } from 'src/domain/interfaces/cache.interface';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';
import { RedisClientType } from 'redis';

interface IDebugL1EntriesProperties {
  key: string;
  value: unknown;
}

type InvalidatePayload = { key: string; origin: string };

@Injectable()
export class MultiLevelCacheService implements ICacheService, OnModuleInit {
  private readonly logger = new Logger(MultiLevelCacheService.name);
  private readonly defaultTTL: number;
  private readonly cacheTTLL2: number;
  private readonly l1Cache: NodeCache;
  private readonly instanceId: string = randomUUID();

  private redisClient: RedisClientType;
  private redisSubClient: RedisClientType;

  constructor(
    private readonly redisCheck: RedisCheckService,
    private readonly config: AppEnvConfigService,
  ) {
    this.defaultTTL = Number(this.config.cacheTTLL1) || 10;
    this.cacheTTLL2 = Number(this.config.cacheTTLL2) || 120;
    this.l1Cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: this.defaultTTL * 2,
    });
    this.redisClient = this.redisCheck.getClient();
  }

  async onModuleInit() {
    this.redisClient = this.redisCheck.getClient();

    if (!this.redisClient) {
      throw new Error('Redis client is not initialized in RedisCheckService');
    }

    this.redisSubClient = this.redisClient.duplicate();
    await this.redisSubClient.connect();

    // Subscribe to manual invalidation
    await this.redisSubClient.subscribe('cache-invalidate', (msg: string) => {
      let payload: { key: string; origin: string };
      try {
        payload = JSON.parse(msg) as InvalidatePayload;
      } catch {
        this.logger.warn(`Invalid cache-invalidate message: ${msg}`);
        return;
      }

      // Ignore messages you yourself sent
      if (payload.origin === this.instanceId) return;

      // Invalidation logic on other instances
      const foundKey = new RegExp('^' + payload.key.replace(/\*/g, '.*') + '$');
      for (const key of this.l1Cache.keys()) {
        if (foundKey.test(key)) {
          this.l1Cache.del(key);
        }
      }
      this.logger.log(`L1 invalidated for pattern "${payload.key}"`);
    });

    // Subscribe to Redis TTL-based expirations
    await this.redisSubClient.pSubscribe(
      '__keyevent@0__:expired',
      (expiredKey: string) => {
        if (this.l1Cache.has(expiredKey)) {
          this.l1Cache.del(expiredKey);
          this.logger.log(
            `L1 invalidated due to Redis TTL expiry: ${expiredKey}`,
          );
        }
      },
    );

    // enable keyspace notifications for local environment/docker
    if (this.config.nodeEnv !== 'prod') {
      try {
        await this.redisClient.configSet('notify-keyspace-events', 'Ex');
      } catch (err) {
        this.logger.warn('Skipping CONFIG SET on managed Redis, error:', err);
      }
    }
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const memory = this.l1Cache.get<T>(key);
    if (memory != null) {
      this.logger.debug(`L1 cache HIT for key "${key}"`);
      return memory;
    }
    this.logger.debug(`L1 cache MISS for key "${key}"`);

    let raw: string | null;
    try {
      raw = await this.redisClient.get(key);
    } catch (err) {
      this.logger.error(`Redis GET failed for "${key}": ${err}`);
      return undefined;
    }

    if (raw == null) return undefined;

    const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    try {
      // parse into unknown first
      const data: unknown = JSON.parse(raw, (_k, v) =>
        typeof v === 'string' && ISO_8601.test(v) ? new Date(v) : v,
      );
      // now assert to T
      const parsed = data as T;
      // prime L1
      this.l1Cache.set(key, parsed, this.defaultTTL);
      return parsed;
    } catch (err) {
      this.logger.error(`Failed to JSON.parse & revive for "${key}": ${err}`);
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const effectiveTTL: number = ttl ?? this.defaultTTL;
    this.l1Cache.set(key, value, effectiveTTL);

    try {
      const json = JSON.stringify(value);
      await this.redisClient.set(key, json, {
        EX: this.cacheTTLL2,
      });
      await this.redisClient.publish(
        'cache-invalidate',
        JSON.stringify({ key, origin: this.instanceId }),
      );
    } catch (err) {
      this.logger.error(`Redis SET/PUBLISH failed for "${key}": ${err}`);
    }
  }

  async del(key: string): Promise<void> {
    this.l1Cache.del(key);
    try {
      await this.redisClient.del(key);
      await this.redisClient.publish(
        'cache-invalidate',
        JSON.stringify({ key, origin: this.instanceId }),
      );
    } catch (err) {
      this.logger.error(`Redis DEL/PUBLISH failed for "${key}": ${err}`);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const key of this.l1Cache.keys()) {
      if (re.test(key)) {
        this.l1Cache.del(key);
      }
    }

    let cursor = 0;
    do {
      try {
        const { cursor: nextCursor, keys } = await this.redisClient.scan(
          cursor,
          {
            MATCH: pattern,
            COUNT: 100,
          },
        );
        for (const k of keys) {
          await this.redisClient.del(k);
        }
        cursor = nextCursor;
      } catch (err) {
        this.logger.error(
          `Redis SCAN/DEL failed in invalidate("${pattern}"): ${err}`,
        );
        break;
      }
    } while (cursor !== 0);

    try {
      await this.redisClient.publish(
        'cache-invalidate',
        JSON.stringify({ key: pattern, origin: this.instanceId }),
      );
    } catch (err) {
      this.logger.error(
        `Redis PUBLISH failed for invalidate("${pattern}"): ${err}`,
      );
    }
  }

  public debugL1Keys(): string[] {
    return this.l1Cache.keys();
  }

  public debugL1Entries(): IDebugL1EntriesProperties[] {
    return this.l1Cache.keys().map((key) => ({
      key,
      value: this.l1Cache.get(key),
    }));
  }

  /**
   * Try to get T from cache under `key`; if missing, call `fetchFn()`,
   * cache its result (with optional ttl), and return it.
   * TODO: missing unit test
   */
  // async wrap<T>(
  //   key: string,
  //   fetchFn: () => Promise<T>,
  //   ttl?: number,
  // ): Promise<T> {
  //   const cached = await this.get<T>(key);
  //   if (cached !== undefined) {
  //     this.logger.debug(`Cache HIT for "${key}"`);
  //     return cached;
  //   }
  //   this.logger.debug(`Cache MISS for "${key}"`);
  //   const data = await fetchFn();
  //   await this.set(key, data, ttl);
  //   return data;
  // }
}
