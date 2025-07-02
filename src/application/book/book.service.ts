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
import { failedToDeleteBookException } from './book-exceptions';
import { PatchBookDto } from './dtos/patch-book.dto';

@Injectable()
export class BookService {
  constructor(
    @Inject('BookRepository')
    private readonly bookRepository: BookRepository,
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
    return this.checker.ensureBookExists(id);
  }

  @InvalidateCache({ namespace: bookCacheKey })
  async create(dto: CreateBookDto): Promise<Book> {
    const book: Book = Book.create({
      title: dto.title,
      publisher: dto.publisher,
      publicationDate: dto.publicationDate,
      pageCount: dto.pageCount,
      categoryIds: dto.categoryIds,
      authorIds: dto.authorIds,
    });

    await this.checker.ensureCategoriesExist(dto.categoryIds);
    await this.checker.ensureAuthorsExist(dto.authorIds);

    return this.bookRepository.create(book);
  }

  @InvalidateCache({
    namespace: [bookCacheKey],
    keyGenerator: (dto: UpdateBookDto) => ({
      [bookByIdKey]: dto.id.toString(),
    }),
  })
  async update(dto: UpdateBookDto): Promise<Book | null> {
    const bookToUpdate = await this.checker.ensureBookExists(dto.id);
    await this.checker.ensureCategoriesExist(dto.categoryIds);
    await this.checker.ensureAuthorsExist(dto.authorIds);

    bookToUpdate.update({
      title: dto.title,
      publisher: dto.publisher,
      publicationDate: dto.publicationDate,
      pageCount: dto.pageCount,
      categoryIds: dto.categoryIds,
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
    const book = await this.checker.ensureBookExists(dto.id);
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
    const book = await this.checker.ensureBookExists(id);
    book.delete();
    return this.checker.ensureExists(
      () => this.bookRepository.delete(book),
      failedToDeleteBookException(),
    );
  }
}
