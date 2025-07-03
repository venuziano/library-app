/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/unbound-method */

import { AuthorService } from './author.service';
import { Author } from '../../domain/author/author.entity';
import { AuthorRepository } from '../../domain/author/author.repository';
import { MultiLevelCacheService } from '../../infrastructure/cache/multi-level-cache.service';
import { EntityChecker } from '../shared/entity-checker.service';
import { CreateAuthorDto } from './dtos/create-author.dto';
import { UpdateAuthorDto } from './dtos/update-author.dto';
import { PatchAuthorDto } from './dtos/patch-author.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import { defaultSortOrder } from '../pagination/helpers';
import { PaginationResult } from '../../domain/pagination/pagination.entity';
import {
  authorNotFoundException,
  failedToDeleteAuthorException,
} from './author-exceptions';

describe('AuthorService', () => {
  let service: AuthorService;
  let repo: jest.Mocked<AuthorRepository>;
  let cache: jest.Mocked<MultiLevelCacheService>;
  let checker: jest.Mocked<EntityChecker>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bookCountByAuthor: jest.fn(),
    } as any;
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;
    checker = {
      ensureAuthorExists: jest.fn(),
      ensureExists: jest.fn(),
    } as any;

    service = new AuthorService(repo, cache, checker);
  });

  describe('findAll', () => {
    it('builds pagination and returns repository result', async () => {
      const dto: PaginationDto = {
        limit: 10,
        page: 2,
        sort: 'name',
        order: defaultSortOrder,
        searchTerm: 'foo',
      };
      const fakeResult: PaginationResult<Author> = {
        items: [],
        page: 2,
        limit: 10,
        totalItems: 10,
        totalPages: 2,
      };
      repo.findAll.mockResolvedValue(fakeResult);

      const result = await service.findAll(dto);

      expect(repo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          page: 2,
          sortBy: 'name',
          order: defaultSortOrder,
          searchTerm: 'foo',
        }),
      );
      expect(result).toBe(fakeResult);
    });
  });

  describe('findById', () => {
    it('calls checker.ensureAuthorExists and returns the author', async () => {
      const author = Author.reconstitute({
        id: 1,
        firstname: 'A',
        lastname: 'B',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureAuthorExists.mockResolvedValue(author);

      const result = await service.findById(1);

      expect(checker.ensureAuthorExists).toHaveBeenCalledWith(1);
      expect(result).toBe(author);
    });

    it('throws if not found', async () => {
      const exception = authorNotFoundException();
      checker.ensureAuthorExists.mockImplementation(() => {
        throw exception;
      });

      await expect(service.findById(42)).rejects.toBe(exception);
    });
  });

  describe('create', () => {
    it('creates a new author and returns it', async () => {
      const dto: CreateAuthorDto = { firstname: 'X', lastname: 'Y' };
      const created = Author.create(dto);
      repo.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstname: 'X', lastname: 'Y' }),
      );
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('throws if author not found', async () => {
      const dto: UpdateAuthorDto = { id: 5, firstname: 'F', lastname: 'L' };
      const exception = authorNotFoundException();
      checker.ensureAuthorExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.update(dto)).rejects.toBe(exception);
    });

    it('updates and returns the mutated author', async () => {
      const dto: UpdateAuthorDto = {
        id: 5,
        firstname: 'New',
        lastname: 'Name',
      };
      const original = Author.reconstitute({
        id: 5,
        firstname: 'Old',
        lastname: 'Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureAuthorExists.mockResolvedValueOnce(original);
      repo.update.mockResolvedValueOnce(original);

      const result = (await service.update(dto))!;

      expect(result).toBeInstanceOf(Author);
      expect(result.firstname).toBe('New');
      expect(result.lastname).toBe('Name');
    });
  });

  describe('patch', () => {
    it('throws if author not found', async () => {
      const dto: PatchAuthorDto = { id: 3, firstname: 'A', lastname: 'B' };
      const exception = authorNotFoundException();
      checker.ensureAuthorExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.patch(dto)).rejects.toBe(exception);
    });

    it('patches fields and returns updated author', async () => {
      const dto: PatchAuthorDto = { id: 3, firstname: 'NewFirst' };
      const original = Author.reconstitute({
        id: 3,
        firstname: 'OldFirst',
        lastname: 'Last',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureAuthorExists.mockResolvedValueOnce(original);
      repo.update.mockResolvedValueOnce(original);

      const result = (await service.patch(dto))!;

      expect(result).toBeInstanceOf(Author);
      expect(result.firstname).toBe('NewFirst');
      expect(result.lastname).toBe('Last');
    });
  });

  describe('delete', () => {
    it('throws if author not found', async () => {
      const exception = authorNotFoundException();
      checker.ensureAuthorExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.delete(9)).rejects.toBe(exception);
    });

    it('throws if author has bound books', async () => {
      const author = Author.reconstitute({
        id: 9,
        firstname: 'A',
        lastname: 'B',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureAuthorExists.mockResolvedValueOnce(author);
      repo.bookCountByAuthor.mockResolvedValueOnce(2);

      await expect(service.delete(9)).rejects.toThrow(
        `Cannot delete author 9 — still bound to 2 book(s).`,
      );
    });

    it('deletes and returns entity', async () => {
      const author = Author.reconstitute({
        id: 9,
        firstname: 'A',
        lastname: 'B',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureAuthorExists.mockResolvedValueOnce(author);
      checker.ensureExists.mockImplementationOnce((fn) => fn());
      repo.delete.mockResolvedValueOnce(author);

      const result = (await service.delete(9))!;

      expect(result).toBe(author);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws if delete fails', async () => {
      const author = Author.reconstitute({
        id: 9,
        firstname: 'A',
        lastname: 'B',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const exception = failedToDeleteAuthorException();
      checker.ensureAuthorExists.mockResolvedValueOnce(author);
      checker.ensureExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.delete(9)).rejects.toBe(exception);
    });
  });
});
