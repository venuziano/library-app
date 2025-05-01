import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

import { AuthorService } from '../../application/author/author.service';
import {
  AuthorGQL,
  PaginatedAuthorsGQL,
} from '../graphql-types/author/author.gql';
import { CreateAuthorInput } from '../graphql-types/author/create-author.input';
import { toPaginatedGQL } from '../graphql-types/shared/pagination.output.gql';
import { plainToClass } from 'class-transformer';
import { PaginationGQL } from '../graphql-types/shared/pagination.input.gql';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(private readonly authorService: AuthorService) {}

  @Query(() => PaginatedAuthorsGQL)
  async authors(
    @Args() pagination: PaginationGQL,
  ): Promise<PaginatedAuthorsGQL> {
    return toPaginatedGQL(
      await this.authorService.findAll(pagination),
      (author) => plainToClass(AuthorGQL, author),
    );
  }

  @Query(() => AuthorGQL, { name: 'author', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.authorService.findById(id);
  }

  @Mutation(() => AuthorGQL)
  createAuthor(@Args('input') input: CreateAuthorInput) {
    return this.authorService.create(input);
  }
}
