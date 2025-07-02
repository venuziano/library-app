import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Author } from 'src/domain/author/author.entity';
import { AuthorRepository } from 'src/domain/author/author.repository';
import { CategoryRepository } from 'src/domain/category/category.repository';
import { authorNotFoundException } from '../author/author-exceptions';
import { Category } from 'src/domain/category/category.entity';
import { categoryNotFoundException } from '../category/category-exceptions';

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
    // @Inject('BookRepository')
    // private readonly bookRepository: CategoryRepository,
  ) {}

  async ensureBookExists(id: number): Promise<Author> {
    return this.ensureExists(
      () => this.authorRepository.findById(id),
      authorNotFoundException(),
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

  public async ensureExists<T>(
    fn: () => Promise<T | null>,
    throwMessage: string,
  ): Promise<T> {
    const entity = await fn();
    if (!entity) throw new NotFoundException(throwMessage);
    return entity;
  }
}
