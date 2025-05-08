import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientType } from 'redis';

import { MultiLevelCacheService } from '../src/infrastructure/cache/multi-level-cache.service';
import { RedisCheckService } from '../src/infrastructure/cache/redis-cache.service';
import { AppEnvConfigService } from '../src/infrastructure/config/environment-variables/app-env.config';

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
    expect(redisClient.publish).toHaveBeenCalledWith('cache-invalidate', 'D');
  });

  it('Pattern-based invalidate(): removes matching L1 keys and scans L2', async () => {
    // Preload two keys into L1
    await service.set('a1', 'v1');
    await service.set('b2', 'v2');

    // Stub scan to return two keys for pattern 'b*'
    redisClient.scan.mockResolvedValueOnce({ cursor: 0, keys: ['b2', 'b3'] });

    await service.invalidate('b*');

    // L1: 'b2' should be gone, 'a1' should remain
    expect(service.debugL1Keys()).toEqual(expect.arrayContaining(['a1']));
    expect(service.debugL1Keys()).not.toContain('b2');

    // L2: both keys should be deleted
    expect(redisClient.del).toHaveBeenCalledWith('b2');
    expect(redisClient.del).toHaveBeenCalledWith('b3');

    // And finally publish invalidation
    expect(redisClient.publish).toHaveBeenCalledWith('cache-invalidate', 'b*');
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
});
