import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';

import { AuthorService } from '../../../application/author/author.service';
import { AuthorGQL, PaginatedAuthorsGQL } from './types/author.gql';
import { CreateAuthorInput } from './types/create-author.input';
import { toPaginatedGQL } from '../shared/pagination.output.gql';
import { PaginationGQL } from '../shared/pagination.input.gql';
import { UpdateAuthorInput } from './types/update-author.input';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(private readonly authorService: AuthorService) {}

  @Query(() => PaginatedAuthorsGQL, { name: 'authors' })
  async authors(
    @Args() pagination: PaginationGQL,
  ): Promise<PaginatedAuthorsGQL> {
    const authors = await this.authorService.findAll(pagination);
    return toPaginatedGQL(authors, (author) => plainToClass(AuthorGQL, author));
  }

  @Query(() => AuthorGQL, { name: 'author', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.authorService.findById(id);
  }

  @Mutation(() => AuthorGQL)
  createAuthor(@Args('input') input: CreateAuthorInput) {
    return this.authorService.create(input);
  }

  @Mutation(() => AuthorGQL)
  updateAuthor(@Args('input') input: UpdateAuthorInput) {
    return this.authorService.update(input);
  }
  //delete, softDelete
  //patch
}
