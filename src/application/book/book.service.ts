import { Injectable, Inject } from '@nestjs/common';

import { Book } from '../../domain/book/book.entity';
import { BookRepository } from '../../domain/book/book.repository';
import { CreateBookDto } from './dtos/create-book.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import {
  Pagination,
  PaginationResult,
} from '../../domain/pagination/pagination.entity';
import {
  Cacheable,
  InvalidateCache,
} from 'src/infrastructure/cache/cache.decorator';
import { MultiLevelCacheService } from 'src/infrastructure/cache/multi-level-cache.service';
import { bookByIdKey, bookCacheKey } from 'src/infrastructure/cache/cache-keys';
import { UpdateBookDto } from './dtos/update-book.dto';
import { EntityChecker } from '../shared/entity-checker.service';
import {
  bookNotFoundException,
  failedToDeleteBookException,
  bookValidationException,
} from './book-exceptions';
import { PatchBookDto } from './dtos/patch-book.dto';
import { CategoryRepository } from 'src/domain/category/category.repository';
import { categoryNotFoundException } from '../category/category-exceptions';

@Injectable()
export class BookService {
  constructor(
    @Inject('BookRepository')
    private readonly bookRepository: BookRepository,
    private readonly categoryRepository: CategoryRepository,
    public readonly cache: MultiLevelCacheService,
    private readonly checker: EntityChecker,
  ) {}

  @Cacheable({ namespace: bookCacheKey })
  findAll(properties: PaginationDto): Promise<PaginationResult<Book>> {
    const { limit, page, sort, order, searchTerm } = properties;
    const pagination: Pagination = Pagination.of(
      limit,
      page,
      sort,
      order,
      searchTerm,
    );
    return this.bookRepository.findAll(pagination);
  }

  @Cacheable({ namespace: bookByIdKey })
  async findById(id: number): Promise<Book> {
    return this.checker.ensureExists(
      () => this.bookRepository.findById(id),
      bookNotFoundException(),
    );
  }

  @InvalidateCache({ namespace: bookCacheKey })
  async create(dto: CreateBookDto): Promise<Book> {
    // Validate business rules
    if (!dto.categoryId) {
      throw new Error(bookValidationException('Book must have a category'));
    }
    if (!dto.authorIds || dto.authorIds.length === 0) {
      throw new Error(
        bookValidationException('Book must have at least one author'),
      );
    }

    const book: Book = Book.create({
      title: dto.title,
      publisher: dto.publisher,
      publicationDate: dto.publicationDate,
      pageCount: dto.pageCount,
      categoryId: dto.categoryId,
      authorIds: dto.authorIds,
    });
    return this.bookRepository.create(book);
  }

  @InvalidateCache({
    namespace: [bookCacheKey],
    keyGenerator: (dto: UpdateBookDto) => ({
      [bookByIdKey]: dto.id.toString(),
    }),
  })
  async update(dto: UpdateBookDto): Promise<Book | null> {
    const bookToUpdate = await this.checker.ensureExists(
      () => this.bookRepository.findById(dto.id),
      bookNotFoundException(),
    );

    await this.checker.ensureExists(
      () => this.categoryRepository.findById(dto.categoryId),
      categoryNotFoundException(),
    );
    if (!dto.authorIds || dto.authorIds.length === 0) {
      throw new Error(
        bookValidationException('Book must have at least one author'),
      );
    }

    bookToUpdate.update({
      title: dto.title,
      publisher: dto.publisher,
      publicationDate: dto.publicationDate,
      pageCount: dto.pageCount,
      categoryId: dto.categoryId,
      authorIds: dto.authorIds,
    });
    return this.bookRepository.update(bookToUpdate);
  }

  @InvalidateCache({
    namespace: [bookCacheKey],
    keyGenerator: (dto: PatchBookDto) => ({
      [bookByIdKey]: dto.id.toString(),
    }),
  })
  async patch(dto: PatchBookDto): Promise<Book | null> {
    const book = await this.checker.ensureExists(
      () => this.bookRepository.findById(dto.id),
      bookNotFoundException(),
    );

    // Validate business rules if category or authors are being updated
    if (dto.categoryId !== undefined && !dto.categoryId) {
      throw new Error(bookValidationException('Book must have a category'));
    }
    if (
      dto.authorIds !== undefined &&
      (!dto.authorIds || dto.authorIds.length === 0)
    ) {
      throw new Error(
        bookValidationException('Book must have at least one author'),
      );
    }

    book.patch(dto);

    return this.bookRepository.update(book);
  }

  @InvalidateCache({
    namespace: [bookCacheKey],
    keyGenerator: (id: number) => ({
      [bookByIdKey]: id.toString(),
    }),
  })
  async delete(id: number): Promise<Book | null> {
    const book = await this.checker.ensureExists(
      () => this.bookRepository.findById(id),
      bookNotFoundException(),
    );

    book.delete();

    return this.checker.ensureExists(
      () => this.bookRepository.delete(book),
      failedToDeleteBookException(),
    );
  }
}
