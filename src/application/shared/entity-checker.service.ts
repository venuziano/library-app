import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Author } from 'src/domain/author/author.entity';
import { AuthorRepository } from 'src/domain/author/author.repository';
import { CategoryRepository } from 'src/domain/category/category.repository';
import { authorNotFoundException } from '../author/author-exceptions';
import { Category } from 'src/domain/category/category.entity';
import { categoryNotFoundException } from '../category/category-exceptions';
import { BookRepository } from 'src/domain/book/book.repository';
import { bookNotFoundException } from '../book/book-exceptions';
import { Book } from 'src/domain/book/book.entity';

/**
 * Helper to load an entity or throw a NotFoundException.
 */
@Injectable()
export class EntityChecker {
  constructor(
    @Inject('AuthorRepository')
    private readonly authorRepository: AuthorRepository,
    @Inject('CategoryRepository')
    private readonly categoryRepository: CategoryRepository,
    @Inject('BookRepository')
    private readonly bookRepository: BookRepository,
  ) {}

  async ensureBookExists(id: number): Promise<Book> {
    return this.ensureExists(
      () => this.bookRepository.findById(id),
      bookNotFoundException(),
    );
  }

  async ensureAuthorExists(id: number): Promise<Author> {
    return this.ensureExists(
      () => this.authorRepository.findById(id),
      authorNotFoundException(),
    );
  }

  async ensureCategoryExists(id: number): Promise<Category> {
    return this.ensureExists(
      () => this.categoryRepository.findById(id),
      categoryNotFoundException(),
    );
  }

  async ensureAuthorsExist(ids: number[]): Promise<Author[]> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('At least one author ID must be provided');
    }
    const authors = await this.authorRepository.findByIds(ids);
    const missing = ids.filter(
      (id) => !authors.some((a: Author) => a.id === id),
    );
    if (missing.length) {
      throw new NotFoundException(
        `Authors not found for IDs: ${missing.join(', ')}`,
      );
    }
    return authors;
  }

  async ensureCategoriesExist(ids: number[]): Promise<Category[]> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException(
        'At least one category ID must be provided',
      );
    }
    const categories = await this.categoryRepository.findByIds(ids);
    const missing = ids.filter(
      (id) => !categories.some((c: Category) => c.id === id),
    );
    if (missing.length) {
      throw new NotFoundException(
        `Categories not found for IDs: ${missing.join(', ')}`,
      );
    }
    return categories;
  }

  public async ensureExists<T>(
    fn: () => Promise<T | null>,
    throwMessage: string,
  ): Promise<T> {
    const entity = await fn();
    if (!entity) throw new NotFoundException(throwMessage);
    return entity;
  }
}
