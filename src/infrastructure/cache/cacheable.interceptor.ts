import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CACHEABLE_KEY, CacheableOptions } from './cacheable.decorator';
import { MultiLevelCacheService } from './multi-level-cache.service';
import { GraphQLResolveInfo } from 'graphql';

@Injectable()
export class CacheableInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: MultiLevelCacheService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // read @Cacheable() metadata
    const options = this.reflector.get<CacheableOptions>(
      CACHEABLE_KEY,
      context.getHandler(),
    );
    if (!options) {
      // no @Cacheable → pass through
      return next.handle();
    }

    // build cache key
    // support GraphQL resolvers
    const gqlCtx = GqlExecutionContext.create(context);
    // info is the standard GraphQLResolveInfo
    const info: GraphQLResolveInfo = gqlCtx.getInfo();
    // args is whatever your resolver args shape is.
    // If you don’t know the exact shape, fall back to a generic Record:
    const args: Record<string, any> = gqlCtx.getArgs();

    const ns: string = options.namespace ?? info.fieldName;
    // keys are being genereated as authors:{\"limit\":50,\"page\":1,\"sort\":\"createdAt\",\"searchTerm\":\"\",\"order\":\"DESC\"}",
    // be aware of that if using clusters or memory used for that key length.
    const key: string = `${ns}:${JSON.stringify(args)}`;

    // attempt L1/L2 lookup
    return from(this.cache.get<any>(key)).pipe(
      switchMap((cached) => {
        if (cached !== undefined) {
          return of(cached);
        }
        // on miss, invoke handler, then store result
        return next.handle().pipe(
          tap((result) => {
            this.cache.set(key, result, options.ttl);
          }),
        );
      }),
    );
  }
}
