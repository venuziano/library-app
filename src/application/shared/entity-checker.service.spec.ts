/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EntityChecker } from './entity-checker.service';
import { Author } from 'src/domain/author/author.entity';
import { Category } from 'src/domain/category/category.entity';
import { Book } from 'src/domain/book/book.entity';
import { authorNotFoundException } from '../author/author-exceptions';
import { categoryNotFoundException } from '../category/category-exceptions';
import { bookNotFoundException } from '../book/book-exceptions';
import { AuthorRepository } from 'src/domain/author/author.repository';
import { CategoryRepository } from 'src/domain/category/category.repository';
import { BookRepository } from 'src/domain/book/book.repository';
import { UserRepository } from 'src/domain/user/user.repository';
import { User } from 'src/domain/user/user.entity';
import { userNotFoundException } from '../user/user-exceptions';

describe('EntityChecker', () => {
  let checker: EntityChecker;
  let mockAuthorRepo: jest.Mocked<AuthorRepository>;
  let mockCategoryRepo: jest.Mocked<CategoryRepository>;
  let mockBookRepo: jest.Mocked<BookRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockAuthorRepo = { findById: jest.fn(), findByIds: jest.fn() } as any;
    mockCategoryRepo = { findById: jest.fn(), findByIds: jest.fn() } as any;
    mockBookRepo = { findById: jest.fn() } as any;
    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
    } as any;
    checker = new EntityChecker(
      mockAuthorRepo,
      mockCategoryRepo,
      mockBookRepo,
      mockUserRepo,
    );
  });

  describe('ensureExists', () => {
    it('returns the value when loader resolves to non-null', async () => {
      const payload = { id: 99 };
      const loader = jest.fn().mockResolvedValue(payload);
      const result = await checker.ensureExists(loader, 'Not found');
      expect(loader).toHaveBeenCalled();
      expect(result).toBe(payload);
    });

    it('throws NotFoundException with given message when loader returns null', async () => {
      const loader = jest.fn().mockResolvedValue(null);
      const message = 'Missing entity';
      await expect(checker.ensureExists(loader, message)).rejects.toThrowError(
        new NotFoundException(message),
      );
    });

    it('propagates loader errors', async () => {
      const error = new Error('Loader error');
      const loader = jest.fn().mockRejectedValue(error);
      await expect(checker.ensureExists(loader, 'Irrelevant')).rejects.toBe(
        error,
      );
    });
  });

  describe('ensureNotExists', () => {
    it('resolves when loader returns null', async () => {
      const loader = jest.fn().mockResolvedValue(null);
      await expect(
        checker.ensureNotExists(loader, 'dup'),
      ).resolves.toBeUndefined();
      expect(loader).toHaveBeenCalled();
    });

    it('throws ConflictException with given message when loader returns non-null', async () => {
      const entity = { id: 1 };
      const loader = jest.fn().mockResolvedValue(entity);
      const message = 'Already exists';
      await expect(checker.ensureNotExists(loader, message)).rejects.toThrow(
        new ConflictException(message),
      );
    });
  });

  describe('ensureBookExists', () => {
    it('returns the book when found', async () => {
      const dummyBook = { id: 1 } as Book;
      mockBookRepo.findById.mockResolvedValue(dummyBook);
      const result = await checker.ensureBookExists(1);
      expect(mockBookRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(dummyBook);
    });

    it('throws NotFoundException when book not found', async () => {
      mockBookRepo.findById.mockResolvedValue(null);
      await expect(checker.ensureBookExists(42)).rejects.toThrowError(
        bookNotFoundException(),
      );
    });
  });

  describe('ensureUserExists', () => {
    it('returns the user when found', async () => {
      const dummyUser = { id: 1 } as User;
      mockUserRepo.findById.mockResolvedValue(dummyUser);
      const result = await checker.ensureUserExists(1);
      expect(mockUserRepo.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(dummyUser);
    });

    it('throws NotFoundException when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(checker.ensureUserExists(42)).rejects.toThrowError(
        userNotFoundException(),
      );
    });
  });

  describe('ensureAuthorExists', () => {
    it('returns the author when found', async () => {
      const dummyAuthor = { id: 2 } as Author;
      mockAuthorRepo.findById.mockResolvedValue(dummyAuthor);
      const result = await checker.ensureAuthorExists(2);
      expect(mockAuthorRepo.findById).toHaveBeenCalledWith(2);
      expect(result).toBe(dummyAuthor);
    });

    it('throws NotFoundException when author not found', async () => {
      mockAuthorRepo.findById.mockResolvedValue(null);
      await expect(checker.ensureAuthorExists(100)).rejects.toThrowError(
        authorNotFoundException(),
      );
    });
  });

  describe('ensureCategoryExists', () => {
    it('returns the category when found', async () => {
      const dummyCategory = { id: 3 } as Category;
      mockCategoryRepo.findById.mockResolvedValue(dummyCategory);
      const result = await checker.ensureCategoryExists(3);
      expect(mockCategoryRepo.findById).toHaveBeenCalledWith(3);
      expect(result).toBe(dummyCategory);
    });

    it('throws NotFoundException when category not found', async () => {
      mockCategoryRepo.findById.mockResolvedValue(null);
      await expect(checker.ensureCategoryExists(200)).rejects.toThrowError(
        categoryNotFoundException(),
      );
    });
  });

  describe('ensureAuthorsExist', () => {
    it('returns all authors when all IDs exist', async () => {
      const ids = [1, 2];
      const authors = ids.map((id) => ({ id }) as Author);
      mockAuthorRepo.findByIds.mockResolvedValue(authors);
      const result = await checker.ensureAuthorsExist(ids);
      expect(mockAuthorRepo.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(authors);
    });

    it('throws BadRequestException when no IDs provided', async () => {
      await expect(checker.ensureAuthorsExist([])).rejects.toThrow(
        BadRequestException,
      );
      await expect(checker.ensureAuthorsExist(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException listing missing IDs', async () => {
      const ids = [1, 2, 3];
      const returned = [{ id: 1 } as Author];
      mockAuthorRepo.findByIds.mockResolvedValue(returned);
      await expect(checker.ensureAuthorsExist(ids)).rejects.toThrowError(
        'Authors not found for IDs: 2, 3',
      );
    });
  });

  describe('ensureCategoriesExist', () => {
    it('returns all categories when all IDs exist', async () => {
      const ids = [10, 20];
      const categories = ids.map((id) => ({ id }) as Category);
      mockCategoryRepo.findByIds.mockResolvedValue(categories);
      const result = await checker.ensureCategoriesExist(ids);
      expect(mockCategoryRepo.findByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual(categories);
    });

    it('throws BadRequestException when no IDs provided', async () => {
      await expect(checker.ensureCategoriesExist([])).rejects.toThrow(
        BadRequestException,
      );
      await expect(checker.ensureCategoriesExist(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException listing missing IDs', async () => {
      const ids = [5, 6, 7];
      const returned = [{ id: 5 } as Category];
      mockCategoryRepo.findByIds.mockResolvedValue(returned);
      await expect(checker.ensureCategoriesExist(ids)).rejects.toThrowError(
        'Categories not found for IDs: 6, 7',
      );
    });
  });

  describe('ensureUserEmailIsUnique', () => {
    it('resolves when no user found with email', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await expect(
        checker.ensureUserEmailIsUnique('test@example.com'),
      ).resolves.toBeUndefined();
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('throws ConflictException when email is already in use', async () => {
      const existingUser = { id: 1, email: 'test@example.com' } as User;
      mockUserRepo.findByEmail.mockResolvedValue(existingUser);
      await expect(
        checker.ensureUserEmailIsUnique('test@example.com'),
      ).rejects.toThrow(ConflictException);
      await expect(
        checker.ensureUserEmailIsUnique('test@example.com'),
      ).rejects.toThrow('test@example.com');
    });
  });

  describe('ensureUsernameIsUnique', () => {
    it('resolves when no user found with username', async () => {
      mockUserRepo.findByUsername.mockResolvedValue(null);
      await expect(
        checker.ensureUsernameIsUnique('test'),
      ).resolves.toBeUndefined();
      expect(mockUserRepo.findByUsername).toHaveBeenCalledWith('test');
    });

    it('throws ConflictException when username is already in use', async () => {
      const existingUser = { id: 1, email: 'test' } as User;
      mockUserRepo.findByUsername.mockResolvedValue(existingUser);
      await expect(checker.ensureUsernameIsUnique('test')).rejects.toThrow(
        ConflictException,
      );
      await expect(checker.ensureUsernameIsUnique('test')).rejects.toThrow(
        'test',
      );
    });
  });
});
