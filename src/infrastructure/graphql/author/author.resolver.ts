import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';
import { NotFoundException } from '@nestjs/common';

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
  async getById(@Args('id', { type: () => ID }) id: number) {
    const author = await this.authorService.findById(id);
    if (!author) {
      throw new NotFoundException(`Author not found`);
    }
    return author;
  }

  @Mutation(() => AuthorGQL)
  async createAuthor(@Args('input') input: CreateAuthorInput) {
    return await this.authorService.create(input);
  }

  @Mutation(() => AuthorGQL)
  async updateAuthor(@Args('input') input: UpdateAuthorInput) {
    const createdAuthor = await this.authorService.update(input);
    if (!createdAuthor) {
      throw new NotFoundException(`Author not found`);
    }
    return createdAuthor;
  }
  //update
  //delete, softDelete
  //patch
}
