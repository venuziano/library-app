/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */

import {
  Cacheable,
  InvalidateCache,
} from '../../src/infrastructure/cache/cache.decorator';
import { MultiLevelCacheService } from '../../src/infrastructure/cache/multi-level-cache.service';

class DummyService {
  // Only mock the methods we call in the decorator
  public cache = {
    get: jest.fn(),
    set: jest.fn(),
  } as unknown as jest.Mocked<MultiLevelCacheService>;

  // No-options decorator: defaults to namespace = methodName, ttl = undefined
  @Cacheable()
  async noOptions(a: number): Promise<number> {
    // use negative `a` to force an original-method error
    if (a < 0) throw new Error('orig fail');
    return a * 2;
  }

  @Cacheable({ namespace: 'objTest' })
  async withObject(arg: { x: number; y: number }): Promise<string> {
    return `x=${arg.x},y=${arg.y}`;
  }
}

describe('@Cacheable decorator — additional scenarios', () => {
  let svc: DummyService;

  beforeEach(() => {
    svc = new DummyService();
    jest.clearAllMocks();
  });

  it('propagates error when original method throws', async () => {
    svc.cache.get.mockResolvedValue(undefined);

    await expect(svc.noOptions(-1)).rejects.toThrow('orig fail');
    expect(svc.cache.set).not.toHaveBeenCalled();
  });

  it('rejects when cache.set fails after a miss', async () => {
    svc.cache.get.mockResolvedValue(undefined);
    svc.cache.set.mockRejectedValue(new Error('set fail'));

    await expect(svc.noOptions(4)).rejects.toThrow('set fail');
  });

  it('uses method name as default namespace and undefined TTL', async () => {
    svc.cache.get.mockResolvedValue(undefined);

    const out = await svc.noOptions(3);
    expect(out).toBe(6);

    expect(svc.cache.get).toHaveBeenCalledWith('noOptions:[3]');
    expect(svc.cache.set).toHaveBeenCalledWith('noOptions:[3]', 6, undefined);
  });

  it('generates JSON keys (order matters!) for object arguments', async () => {
    svc.cache.get.mockResolvedValue(undefined);

    const o1 = { x: 1, y: 2 };
    const o2 = { y: 2, x: 1 };

    await svc.withObject(o1);
    await svc.withObject(o2);

    expect(svc.cache.get).toHaveBeenNthCalledWith(1, 'objTest:[{"x":1,"y":2}]');
    expect(svc.cache.get).toHaveBeenNthCalledWith(2, 'objTest:[{"y":2,"x":1}]');
  });

  it('bubbles errors from cache.get by default', async () => {
    svc.cache.get.mockRejectedValue(new Error('get fail'));

    await expect(svc.noOptions(2)).rejects.toThrow('get fail');
  });
});

class DummyServiceEvict {
  public cache = {
    invalidate: jest.fn(),
  } as unknown as jest.Mocked<MultiLevelCacheService>;

  @InvalidateCache()
  async deleteOne(id: number): Promise<string> {
    if (id < 0) throw new Error('orig fail');
    return `deleted ${id}`;
  }

  @InvalidateCache({ namespace: 'customNS' })
  async updateItem(arg: { id: string }): Promise<number> {
    return arg.id.length;
  }

  @InvalidateCache({ namespace: ['ns1', 'ns2'] })
  async clearBoth(flag: boolean): Promise<boolean> {
    return flag;
  }
}

describe('@InvalidateCache decorator — behavior and edge cases', () => {
  let svc: DummyServiceEvict;

  beforeEach(() => {
    svc = new DummyServiceEvict();
    jest.clearAllMocks();
  });

  it('evicts all keys in default namespace after successful method call', async () => {
    svc.cache.invalidate.mockResolvedValue(undefined);

    const result = await svc.deleteOne(5);
    expect(result).toBe('deleted 5');

    expect(svc.cache.invalidate).toHaveBeenCalledTimes(1);
    expect(svc.cache.invalidate).toHaveBeenCalledWith('deleteOne:*');
  });

  it('uses custom namespace for eviction when provided', async () => {
    svc.cache.invalidate.mockResolvedValue(undefined);

    const result = await svc.updateItem({ id: 'abc' });
    expect(result).toBe(3);
    expect(svc.cache.invalidate).toHaveBeenCalledWith('customNS:*');
  });

  it('evicts all keys in each of multiple namespaces', async () => {
    svc.cache.invalidate.mockResolvedValue(undefined);

    const result = await svc.clearBoth(true);
    expect(result).toBe(true);

    expect(svc.cache.invalidate).toHaveBeenCalledTimes(2);
    expect(svc.cache.invalidate).toHaveBeenCalledWith('ns1:*');
    expect(svc.cache.invalidate).toHaveBeenCalledWith('ns2:*');
  });

  it('does not call invalidate if the original method throws', async () => {
    svc.cache.invalidate.mockResolvedValue(undefined);

    await expect(svc.deleteOne(-1)).rejects.toThrow('orig fail');
    expect(svc.cache.invalidate).not.toHaveBeenCalled();
  });

  it('bubbles errors from cache.invalidate', async () => {
    svc.cache.invalidate.mockRejectedValue(new Error('invalidate fail'));

    await expect(svc.deleteOne(1)).rejects.toThrow('invalidate fail');

    expect(svc.cache.invalidate).toHaveBeenCalledTimes(1);
    expect(svc.cache.invalidate).toHaveBeenCalledWith('deleteOne:*');
  });
});
