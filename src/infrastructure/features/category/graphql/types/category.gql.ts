import { ObjectType, Field, ID } from '@nestjs/graphql';

import { CommonDatesGQL } from 'src/infrastructure/graphql/shared/common-dates.graphql-types';
import { Paginated } from 'src/infrastructure/graphql/shared/pagination.output.gql';

@ObjectType()
export class CategoryGQL extends CommonDatesGQL {
  @Field(() => ID)
  id: number;

  @Field()
  name: string;
}

@ObjectType()
export class PaginatedCategoriesGQL extends Paginated(CategoryGQL) {}
