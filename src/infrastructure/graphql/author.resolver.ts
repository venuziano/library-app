import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { AuthorService } from '../../application/author/author.service';
import {
  AuthorGQL,
  PaginatedAuthorsGQL,
} from '../graphql-types/author/author.gql';
import { CreateAuthorInput } from '../graphql-types/author/create-author.input';
import { toPaginatedGQL } from '../graphql-types/shared/pagination.output.gql';
import { PaginationGQL } from '../graphql-types/shared/pagination.input.gql';
import { PaginationResult } from 'src/domain/pagination/pagination.entity';
import { Author } from 'src/domain/author/author.entity';
import { ICacheService } from 'src/domain/cache/interfaces';
import { authorCacheKey } from '../cache/cache-keys';

@Resolver(() => AuthorGQL)
export class AuthorResolver {
  constructor(
    private readonly authorService: AuthorService,
    @Inject('ICacheService') private readonly cache: ICacheService,
  ) {}

  @Query(() => PaginatedAuthorsGQL, { name: 'authors' })
  async authors(
    @Args() pagination: PaginationGQL,
  ): Promise<PaginatedAuthorsGQL> {
    const { limit, page, sort, order } = pagination;

    const cacheKey: string = `${authorCacheKey}:limit=${limit}:page=${page}:sort=${sort}:order=${order}`;

    const cached: PaginatedAuthorsGQL | undefined =
      await this.cache.get<PaginatedAuthorsGQL>(cacheKey);
    if (cached) return cached;

    const authors: PaginationResult<Author> =
      await this.authorService.findAll(pagination);

    const result = toPaginatedGQL(authors, (author) =>
      plainToClass(AuthorGQL, author),
    );

    await this.cache.set(cacheKey, result, 120_000);

    return result;
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
}
