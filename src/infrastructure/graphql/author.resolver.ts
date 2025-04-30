import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

import { AuthorService } from '../../application/author/author.service';
import { AuthorGQL } from '../graphql-types/author/author.gql';
import { CreateAuthorInput } from '../graphql-types/author/create-author.input';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(private readonly authorService: AuthorService) {}

  @Query(() => [AuthorGQL], { name: 'authors' })
  getAll() {
    return this.authorService.findAll();
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
