import { ObjectType, Field, ID, Int, HideField } from '@nestjs/graphql';
import { AuthorGQL } from 'src/infrastructure/features/author/graphql/types/author.gql';
import { CategoryGQL } from 'src/infrastructure/features/category/graphql/types/category.gql';

import { CommonDatesGQL } from 'src/infrastructure/graphql/shared/common-dates.graphql-types';
import { Paginated } from 'src/infrastructure/graphql/shared/pagination.output.gql';

@ObjectType()
export class BookGQL extends CommonDatesGQL {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  publisher?: string;

  @Field({ nullable: true })
  publicationDate?: Date;

  @Field(() => Int, { nullable: true })
  pageCount?: number;

  @Field(() => [CategoryGQL])
  categories: CategoryGQL;

  @Field(() => [AuthorGQL])
  authors: AuthorGQL[];

  // hidden from GraphQL, but available on `book` for your resolver/loaders
  @HideField()
  categoryIds: number[];

  @HideField()
  authorIds: number[];
}

@ObjectType()
export class PaginatedBooksGQL extends Paginated(BookGQL) {}
