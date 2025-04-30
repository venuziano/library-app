import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

import { AuthorService } from '../../application/author/author.service';
import { AuthorGQL } from '../graphql-types/author/author.gql';
import { CreateAuthorInput } from '../graphql-types/author/create-author.input';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(private readonly svc: AuthorService) {}

  @Query(() => [AuthorGQL], { name: 'authors' })
  getAll() {
    return this.svc.findAll();
  }

  @Query(() => AuthorGQL, { name: 'author', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.svc.findById(id);
  }

  @Mutation(() => AuthorGQL)
  createAuthor(@Args('input') input: CreateAuthorInput) {
    return this.svc.create(input);
  }
}
