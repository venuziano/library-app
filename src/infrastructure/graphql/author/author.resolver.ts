import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { AuthorService } from '../../../application/author/author.service';
import { AuthorGQL, PaginatedAuthorsGQL } from './types/author.gql';
import { CreateAuthorInput } from './types/create-author.input';
import { toPaginatedGQL } from '../shared/pagination.output.gql';
import { PaginationGQL } from '../shared/pagination.input.gql';
import { authorCacheKey } from '../../cache/cache-keys';
import { MultiLevelCacheService } from '../../cache/multi-level-cache.service';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(
    private readonly authorService: AuthorService,
    @Inject('ICacheService') private readonly cache: MultiLevelCacheService,
  ) {}

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
  async createAuthor(@Args('input') input: CreateAuthorInput) {
    const createdAuthor = await this.authorService.create(input);
    if (createdAuthor != null)
      await this.cache.invalidate(`${authorCacheKey}:*`);
    return createdAuthor;
  }

  //update
  //delete, softDelete
  //patch
}
