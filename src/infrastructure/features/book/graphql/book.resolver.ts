import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';

import { BookService } from '../../../../application/book/book.service';
import { BookGQL, PaginatedBooksGQL } from './types/book.gql';
import { CreateBookInput } from './types/create-book.input';
import { UpdateBookInput } from './types/update-book.input';
import { PatchBookInput } from './types/patch-book.input';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';
import { toPaginatedGQL } from 'src/infrastructure/graphql/shared/pagination.output.gql';
import { CategoryLoader } from 'src/infrastructure/graphql/loaders/category.loader';
import { AuthorLoader } from 'src/infrastructure/graphql/loaders/author.loader';
import { CategoryGQL } from '../../category/graphql/types/category.gql';
import { AuthorGQL } from '../../author/graphql/types/author.gql';

@Resolver(() => BookGQL)
export class BookResolver {
  constructor(
    private readonly bookService: BookService,
    private readonly categoryLoader: CategoryLoader,
    private readonly authorLoader: AuthorLoader,
  ) {}

  @Query(() => PaginatedBooksGQL, { name: 'getAllBooks' })
  async books(@Args() pagination: PaginationGQL): Promise<PaginatedBooksGQL> {
    const books = await this.bookService.findAll(pagination);
    return toPaginatedGQL(books, (book) => plainToClass(BookGQL, book));
  }

  @Query(() => BookGQL, { name: 'getBookById', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.bookService.findById(id);
  }

  @ResolveField(() => [CategoryGQL])
  async categories(@Parent() book: BookGQL) {
    const results = await this.categoryLoader.loadMany(book.categoryIds);
    return (results as Array<CategoryGQL | null>).filter((c) => c !== null);
  }

  @ResolveField(() => [AuthorGQL])
  async authors(@Parent() book: BookGQL) {
    const results = await this.authorLoader.loadMany(book.authorIds);
    return (results as Array<AuthorGQL | null>).filter((a) => a !== null);
  }

  @Mutation(() => BookGQL, { name: 'createBook' })
  createBook(@Args('input') input: CreateBookInput) {
    return this.bookService.create(input);
  }

  @Mutation(() => BookGQL, { name: 'updateBook' })
  updateBook(@Args('input') input: UpdateBookInput) {
    return this.bookService.update(input);
  }

  @Mutation(() => BookGQL, { name: 'patchBook' })
  patchBook(@Args('input') input: PatchBookInput) {
    return this.bookService.patch(input);
  }

  @Mutation(() => BookGQL, { name: 'deleteBook' })
  deleteBook(@Args('id', { type: () => Int }) id: number) {
    return this.bookService.delete(id);
  }
}
