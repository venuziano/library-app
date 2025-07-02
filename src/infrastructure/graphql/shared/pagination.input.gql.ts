import { ArgsType, Field, Int } from '@nestjs/graphql';

import {
  defaultPaginationValue,
  defaultSortField,
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';

@ArgsType()
export class PaginationGQL {
  @Field(() => Int, { defaultValue: defaultPaginationValue })
  limit!: number;

  @Field(() => Int, { defaultValue: 0 })
  page!: number;

  @Field(() => String, { defaultValue: defaultSortField })
  sort!: string;

  @Field(() => String, { nullable: true })
  searchTerm?: string;

  @Field(() => SortOrder, { defaultValue: defaultSortOrder })
  order!: SortOrder;
}
