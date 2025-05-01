import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

import { AuthorService } from '../../application/author/author.service';
import { AuthorGQL } from '../graphql-types/author/author.gql';
import { CreateAuthorInput } from '../graphql-types/author/create-author.input';
import { PaginationGQL } from '../graphql-types/shared/pagination.graphql-types';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(private readonly authorService: AuthorService) {}

  @Query(() => [AuthorGQL], { name: 'authors' })
  getAll(@Args() pagination: PaginationGQL) {
    return this.authorService.findAll(pagination);
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
