/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Resolver,
  Query,
  Mutation,
  Args,
  ObjectType,
  Field,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { MultiLevelCacheService } from '../../cache/multi-level-cache.service';

@ObjectType()
export class CacheEntry {
  @Field()
  key: string;

  @Field(() => String, { nullable: true })
  value: string | null;
}

@Resolver(() => CacheEntry)
export class CacheResolver {
  constructor(
    @Inject('ICacheService') private readonly cache: MultiLevelCacheService,
  ) {}

  @Query(() => [CacheEntry], { name: 'cacheKeys' })
  async debugCacheKeys(): Promise<[CacheEntry]> {
    const keys = this.cache.debugL1Entries();
    const test = await this.cache.get('test2');
    console.log('🔥 L1 cache keys:', keys);
    console.log('test:', test);
    return keys as any;
  }

  @Mutation(() => Boolean)
  async setCache(@Args('input') input: string) {
    await this.cache.set('test2', input);
    return true;
  }
}
