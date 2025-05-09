import { ObjectType, Field, ID } from '@nestjs/graphql';

import { CommonDatesGQL } from '../../shared/common-dates.graphql-types';
import { Paginated } from '../../shared/pagination.output.gql';

@ObjectType()
export class AuthorGQL extends CommonDatesGQL {
  @Field(() => ID)
  id: string;

  @Field()
  firstname: string;

  @Field()
  lastname: string;
}

@ObjectType()
export class PaginatedAuthorsGQL extends Paginated(AuthorGQL) {}
