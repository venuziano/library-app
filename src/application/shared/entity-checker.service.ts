import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Author } from 'src/domain/author/author.entity';
import {
  AUTHOR_REPOSITORY_TOKEN,
  AuthorRepository,
} from 'src/domain/author/author.repository';
import {
  CATEGORY_REPOSITORY_TOKEN,
  CategoryRepository,
} from 'src/domain/category/category.repository';
import { authorNotFoundException } from '../author/author-exceptions';
import { Category } from 'src/domain/category/category.entity';
import { categoryNotFoundException } from '../category/category-exceptions';
import {
  BOOK_REPOSITORY_TOKEN,
  BookRepository,
} from 'src/domain/book/book.repository';
import { bookNotFoundException } from '../book/book-exceptions';
import { Book } from 'src/domain/book/book.entity';
import { User } from 'src/domain/user/user.entity';
import {
  USER_REPOSITORY_TOKEN,
  UserRepository,
} from 'src/domain/user/user.repository';
import { userNotFoundException } from '../user/user-exceptions';
import { UserToken } from 'src/domain/user-token/user-token.entity';
import {
  USER_TOKEN_REPOSITORY_TOKEN,
  UserTokenRepository,
} from 'src/domain/user-token/user-token.repository';
import { userTokenNotFoundException } from '../user-token/user-token-exceptions';

/**
 * Helper to load an entity or throw a NotFoundException.
 */
@Injectable()
export class EntityChecker {
  constructor(
    @Inject(AUTHOR_REPOSITORY_TOKEN)
    private readonly authorRepository: AuthorRepository,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    private readonly categoryRepository: CategoryRepository,
    @Inject(BOOK_REPOSITORY_TOKEN)
    private readonly bookRepository: BookRepository,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
    @Inject(USER_TOKEN_REPOSITORY_TOKEN)
    private readonly userTokenRepository: UserTokenRepository,
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

  async ensureUserExists(id: number): Promise<User> {
    return this.ensureExists(
      () => this.userRepository.findById(id),
      userNotFoundException(),
    );
  }

  async ensureUserTokenExists(id: number): Promise<UserToken> {
    return this.ensureExists(
      () => this.userTokenRepository.findById(id),
      userTokenNotFoundException(),
    );
  }

  async ensureUserEmailIsUnique(email: string): Promise<void> {
    await this.ensureNotExists(
      () => this.userRepository.findByEmail(email),
      email,
    );
  }

  async ensureUsernameIsUnique(username: string): Promise<void> {
    await this.ensureNotExists(
      () => this.userRepository.findByUsername(username),
      username,
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

  public async ensureNotExists<T>(
    fn: () => Promise<T | null>,
    throwMessage: string,
  ): Promise<void> {
    const entity = await fn();
    if (entity) throw new ConflictException(throwMessage);
  }
}
