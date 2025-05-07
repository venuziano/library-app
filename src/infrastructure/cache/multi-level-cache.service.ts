/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as NodeCache from 'node-cache';
import { RedisCheckService } from './redis-cache.service';
import { randomUUID } from 'crypto';

import { ICacheService } from 'src/domain/cache/interfaces';
import { AppEnvConfigService } from '../config/environment-variables/app-env.config';
import { RedisClientType } from 'redis';

interface IDebugL1EntriesProperties {
  key: string;
  value: unknown;
}

@Injectable()
export class MultiLevelCacheService implements ICacheService, OnModuleInit {
  private readonly logger = new Logger(MultiLevelCacheService.name);
  private readonly defaultTTL: number;
  private readonly cacheTTLL2: number;
  private readonly l1Cache: NodeCache;
  private readonly instanceId = randomUUID();

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
        payload = JSON.parse(msg);
      } catch {
        this.logger.warn(`Invalid cache-invalidate message: ${msg}`);
        return;
      }

      // Ignore messages you yourself sent
      if (payload.origin === this.instanceId) {
        return;
      }

      // Invalidation logic on other instances
      const re = new RegExp('^' + payload.key.replace(/\*/g, '.*') + '$');
      for (const k of this.l1Cache.keys()) {
        if (re.test(k)) {
          this.l1Cache.del(k);
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

    await this.redisClient.configSet('notify-keyspace-events', 'Egx');
  }

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const memory = this.l1Cache.get<T>(key);
    if (memory != null) return memory;

    const raw = await this.redisClient.get(key);
    if (raw != null) {
      const val = JSON.parse(raw) as T;
      this.l1Cache.set(key, val, this.defaultTTL);
      return val;
    }

    return undefined;
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const effectiveTTL = ttl ?? this.defaultTTL;
    this.l1Cache.set(key, value, effectiveTTL);
    await this.redisClient.set(key, JSON.stringify(value), {
      EX: this.cacheTTLL2,
    });

    // Publish with origin so you don’t evict your own write
    await this.redisClient.publish(
      'cache-invalidate',
      JSON.stringify({ key, origin: this.instanceId }),
    );
  }

  async del(key: string): Promise<void> {
    this.l1Cache.del(key);
    await this.redisClient.del(key);
    await this.redisClient.publish('cache-invalidate', key);
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
      const result = await this.redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      for (const k of result.keys) {
        await this.redisClient.del(k);
      }

      cursor = result.cursor;
    } while (cursor !== 0);

    await this.redisClient.publish('cache-invalidate', pattern);
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
}
