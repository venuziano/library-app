import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { PaginationResult } from 'src/domain/pagination/pagination.entity';

type PlainPagination<T> = {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages?: number;
};

@ObjectType()
export class PageInfoGQL {
  @Field(() => Int) totalItems!: number;
  @Field(() => Int) totalPages!: number;
  @Field(() => Int) currentPage!: number;
}

export function Paginated<T>(TItemClass: new () => T) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [TItemClass], { name: 'items' })
    @Type(() => TItemClass)
    items!: T[];

    @Field(() => PageInfoGQL) pageInfo!: PageInfoGQL;
  }
  return PaginatedType;
}

/**
 * Accepts either a real PaginationResult<T> (with its getter)
 * or a plain object (e.g. from Redis) with an optional totalPages.
 */
export function toPaginatedGQL<T, GQL>(
  result: PaginationResult<T> | PlainPagination<T>,
  mapItem: (t: T) => GQL,
): { items: GQL[]; pageInfo: PageInfoGQL } {
  // map items
  const items = result.items.map(mapItem);
  // pull shared metadata
  const currentPage = result.page;
  const totalItems = result.totalItems;
  const limit = result.limit;

  // figure out totalPages without ever using 'any'
  let totalPages: number;
  if (result instanceof PaginationResult) {
    // real instance → use its getter
    totalPages = result.totalPages;
  } else {
    // plain shape → use what’s there or compute it
    totalPages = result.totalPages ?? Math.ceil(totalItems / limit);
  }

  return {
    items,
    pageInfo: {
      totalItems,
      totalPages,
      currentPage,
    },
  };
}
