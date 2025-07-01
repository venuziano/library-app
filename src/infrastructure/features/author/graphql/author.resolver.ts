import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';

import { AuthorService } from '../../../../application/author/author.service';
import { AuthorGQL, PaginatedAuthorsGQL } from './types/author.gql';
import { CreateAuthorInput } from './types/create-author.input';
import { UpdateAuthorInput } from './types/update-author.input';
import { PatchAuthorInput } from './types/patch-author.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';
import { toPaginatedGQL } from 'src/infrastructure/graphql/shared/pagination.output.gql';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(private readonly authorService: AuthorService) {}

  @Query(() => PaginatedAuthorsGQL, { name: 'getAllAuthors' })
  async authors(
    @Args() pagination: PaginationGQL,
  ): Promise<PaginatedAuthorsGQL> {
    const authors = await this.authorService.findAll(pagination);
    return toPaginatedGQL(authors, (author) => plainToClass(AuthorGQL, author));
  }

  @Query(() => AuthorGQL, { name: 'getAuthorById', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.authorService.findById(id);
  }

  @Mutation(() => AuthorGQL, { name: 'createAuthor' })
  createAuthor(@Args('input') input: CreateAuthorInput) {
    return this.authorService.create(input);
  }

  @Mutation(() => AuthorGQL, { name: 'updateAuthor' })
  updateAuthor(@Args('input') input: UpdateAuthorInput) {
    return this.authorService.update(input);
  }

  @Mutation(() => AuthorGQL, { name: 'patchAuthor' })
  patchAuthor(@Args('input') input: PatchAuthorInput) {
    return this.authorService.patch(input);
  }

  @Mutation(() => AuthorGQL, { name: 'deleteAuthor' })
  deleteAuthor(@Args('id', { type: () => Int }) id: number) {
    return this.authorService.delete(id);
  }
}
