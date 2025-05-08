import { Module } from '@nestjs/common';

import { CacheResolver } from 'src/infrastructure/graphql/cache/cache.resolver';

@Module({
  providers: [CacheResolver],
})
export class CacheModule {}
