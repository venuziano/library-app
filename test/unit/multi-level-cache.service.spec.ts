import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientType } from 'redis';

import { MultiLevelCacheService } from '../../src/infrastructure/cache/multi-level-cache.service';
import { RedisCheckService } from '../../src/infrastructure/cache/redis-cache.service';
import { AppEnvConfigService } from '../../src/infrastructure/config/environment-variables/app-env.config';

describe('MultiLevelCacheService (unit)', () => {
  let service: MultiLevelCacheService;
  let redisClient: jest.Mocked<RedisClientType>;
  let redisCheck: Partial<RedisCheckService>;
  let config: Partial<AppEnvConfigService>;

  beforeEach(async () => {
    // Create a fake Redis client with jest.fn()
    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      publish: jest.fn(),
      scan: jest.fn(),
      configSet: jest.fn(),
      duplicate: jest.fn().mockReturnValue({
        connect: jest.fn(),
        subscribe: jest.fn(),
        pSubscribe: jest.fn(),
      } as any),
    } as unknown as jest.Mocked<RedisClientType>;

    // Stub out RedisCheckService to return our fake client
    redisCheck = { getClient: () => redisClient };

    // Provide TTLs via config
    config = { cacheTTLL1: 2, cacheTTLL2: 60 };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiLevelCacheService,
        { provide: RedisCheckService, useValue: redisCheck },
        { provide: AppEnvConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<MultiLevelCacheService>(MultiLevelCacheService);
  });

  it('L1 get/set: should return from L1 without calling Redis', async () => {
    await service.set('foo', 'bar');
    const first = await service.get('foo');
    expect(first).toBe('bar');

    // L1 hit: Redis.get should NOT be called
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  it('L2 fallback: on L1 miss, fetch from Redis and repopulate L1', async () => {
    // Simulate L1 miss, Redis has the value
    redisClient.get.mockResolvedValueOnce(JSON.stringify('baz'));

    const val = await service.get<string>('miss');
    expect(val).toBe('baz');

    // Now that L1 is populated, a second get should skip Redis
    (redisClient.get as jest.Mock).mockClear();
    const val2 = await service.get<string>('miss');
    expect(val2).toBe('baz');
    expect(redisClient.get).not.toHaveBeenCalled();
  });

  it('L2 write-through + invalidation: set() writes to Redis and publishes', async () => {
    await service.set('k', 123);
    expect(redisClient.set).toHaveBeenCalledWith('k', JSON.stringify(123), {
      EX: 60,
    });
    expect(redisClient.publish).toHaveBeenCalledWith(
      'cache-invalidate',
      expect.stringContaining('"key":"k"'),
    );
  });

  it('del(): evicts L1, deletes from L2 and publishes', async () => {
    await service.set('D', 'X');
    await service.del('D');

    expect(service.debugL1Keys()).not.toContain('D');
    expect(redisClient.del).toHaveBeenCalledWith('D');
    expect(redisClient.publish).toHaveBeenLastCalledWith(
      'cache-invalidate',
      expect.stringContaining('"key":"D"'),
    );
  });

  it('Pattern-based invalidate(): removes matching L1 keys and scans L2', async () => {
    await service.set('a1', 'v1');
    await service.set('b2', 'v2');

    redisClient.scan.mockResolvedValueOnce({ cursor: 0, keys: ['b2', 'b3'] });
    await service.invalidate('b*');

    expect(service.debugL1Keys()).toEqual(expect.arrayContaining(['a1']));
    expect(service.debugL1Keys()).not.toContain('b2');
    expect(redisClient.del).toHaveBeenCalledWith('b2');
    expect(redisClient.del).toHaveBeenCalledWith('b3');
    expect(redisClient.publish).toHaveBeenLastCalledWith(
      'cache-invalidate',
      expect.stringContaining('"key":"b*"'),
    );
  });

  it('Expiry-based invalidation: L1 key expires after its TTL', async () => {
    // Set with 1s TTL
    await service.set('short', 'val');
    expect(service.debugL1Keys()).toContain('short');

    // Wait > 4s
    await new Promise((resolve) => setTimeout(resolve, 4100));

    // Assert expired
    expect(service.debugL1Keys()).not.toContain('short');
  });

  it('should return undefined and not populate L1 when Redis.get throws', async () => {
    redisClient.get.mockRejectedValueOnce(new Error('fail'));
    const val = await service.get('key1');
    expect(val).toBeUndefined();
    expect(service.debugL1Keys()).not.toContain('key1');
  });

  it('should return undefined and not populate L1 on invalid JSON from Redis', async () => {
    redisClient.get.mockResolvedValueOnce('not a json');
    const val = await service.get('key2');
    expect(val).toBeUndefined();
    expect(service.debugL1Keys()).not.toContain('key2');
  });

  it('should still populate L1 even if Redis.set fails', async () => {
    redisClient.set.mockRejectedValueOnce(new Error('fail'));
    await expect(service.set('k2', 'v2')).resolves.not.toThrow();
    expect(service.debugL1Keys()).toContain('k2');
  });

  it('should evict L1 even if Redis.del fails', async () => {
    await service.set('d1', 'x');
    redisClient.del.mockRejectedValueOnce(new Error('fail'));
    await expect(service.del('d1')).resolves.not.toThrow();
    expect(service.debugL1Keys()).not.toContain('d1');
  });

  it('should delete all keys across multiple cursors in invalidate()', async () => {
    redisClient.scan
      .mockResolvedValueOnce({ cursor: 5, keys: ['b1'] })
      .mockResolvedValueOnce({ cursor: 0, keys: ['b2'] });

    await service.invalidate('b*');

    expect(redisClient.del).toHaveBeenCalledWith('b1');
    expect(redisClient.del).toHaveBeenCalledWith('b2');
    expect(redisClient.publish).toHaveBeenLastCalledWith(
      'cache-invalidate',
      expect.stringContaining('"key":"b*"'),
    );
  });

  it('should handle scan errors gracefully in invalidate()', async () => {
    redisClient.scan.mockRejectedValueOnce(new Error('scan fail'));
    await expect(service.invalidate('x*')).resolves.not.toThrow();

    expect(redisClient.publish).toHaveBeenLastCalledWith(
      'cache-invalidate',
      expect.stringContaining('"key":"x*"'),
    );
  });

  it('should throw on onModuleInit if no redis client is provided', async () => {
    // stub RedisCheckService so getClient() returns null
    const stubRedisCheck = {
      getClient: () => null,
    } as unknown as RedisCheckService;
    // reuse the partial config, but cast through unknown to the full interface
    const stubConfig = config as unknown as AppEnvConfigService;

    const badService = new MultiLevelCacheService(stubRedisCheck, stubConfig);

    await expect(badService.onModuleInit()).rejects.toThrow(
      'Redis client is not initialized',
    );
  });

  it('should invalidate L1 when manual invalidate message is received', async () => {
    // Wire up subscriptions
    await service.onModuleInit();
    // Seed L1
    await service.set('foo', 'bar');

    // Pull out the stubbed redisSubClient from the service (cast through unknown)
    const subClient = (
      service as unknown as {
        redisSubClient: {
          subscribe: jest.MockedFunction<
            (channel: string, cb: (msg: string) => void) => Promise<void>
          >;
        };
      }
    ).redisSubClient;

    // Find the 'cache-invalidate' subscription call
    const [, manualCb] = subClient.subscribe.mock.calls.find(
      ([chan]) => chan === 'cache-invalidate',
    )!;

    // Simulate another instance invalidating “foo”
    manualCb(JSON.stringify({ key: 'foo', origin: 'other-instance' }));

    // Assert it’s gone
    expect(service.debugL1Keys()).not.toContain('foo');
  });

  it('debugL1Entries should reflect current cache entries', async () => {
    await service.set('foo', 'bar');
    await service.set('baz', 123);
    const entries = service.debugL1Entries();
    expect(entries).toEqual(
      expect.arrayContaining([
        { key: 'foo', value: 'bar' },
        { key: 'baz', value: 123 },
      ]),
    );
  });
});
