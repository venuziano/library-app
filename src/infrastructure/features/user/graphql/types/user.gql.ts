import { ObjectType, Field, ID } from '@nestjs/graphql';

import { CommonDatesGQL } from 'src/infrastructure/graphql/shared/common-dates.graphql-types';
import { Paginated } from 'src/infrastructure/graphql/shared/pagination.output.gql';

@ObjectType()
export class UserGQL extends CommonDatesGQL {
  @Field(() => ID)
  id: number;

  @Field()
  username: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  firstname?: string;

  @Field({ nullable: true })
  lastname?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  stripeCustomerId?: string;
}

@ObjectType()
export class PaginatedUsersGQL extends Paginated(UserGQL) {}
