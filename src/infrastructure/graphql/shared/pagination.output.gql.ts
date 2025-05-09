import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { PaginationResult } from 'src/domain/pagination/pagination.entity';

type ClassType<T> = new (...args: any[]) => T;

@ObjectType()
export class PageInfoGQL {
  @Field(() => Int) totalItems!: number;
  @Field(() => Int) totalPages!: number;
  @Field(() => Int) currentPage!: number;
}

export function Paginated<T>(TItemClass: ClassType<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [TItemClass], { name: 'items' })
    @Type(() => TItemClass)
    items!: T[];

    @Field(() => PageInfoGQL) pageInfo!: PageInfoGQL;
  }
  return PaginatedType;
}

export function toPaginatedGQL<T, GQL>(
  result: PaginationResult<T>,
  mapItem: (t: T) => GQL,
) {
  return {
    items: result.items.map(mapItem),
    pageInfo: {
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.page,
    },
  };
}
