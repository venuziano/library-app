/* eslint-disable @typescript-eslint/unbound-method */
import { MultiLevelCacheService } from 'src/infrastructure/cache/multi-level-cache.service';
import { CreateBookDto } from './dtos/create-book.dto';
import { UpdateBookDto } from './dtos/update-book.dto';
import { PatchBookDto } from './dtos/patch-book.dto';
import { EntityChecker } from '../shared/entity-checker.service';
import { PaginationDto } from '../pagination/pagination.dto';
import { defaultSortOrder } from '../pagination/helpers';
import { BookRepository } from 'src/domain/book/book.repository';
import { BookService } from './book.service';
import { Book } from 'src/domain/book/book.entity';

describe('BookService', () => {
  let service: BookService;
  let mockRepo: jest.Mocked<BookRepository>;
  let cache: jest.Mocked<MultiLevelCacheService>;
  let mockChecker: jest.Mocked<EntityChecker>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    cache = {
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      invalidate: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;
    mockChecker = {
      ensureBookExists: jest.fn(),
      ensureCategoriesExist: jest.fn(),
      ensureAuthorsExist: jest.fn(),
      ensureExists: jest.fn(),
    } as any;
    service = new BookService(mockRepo, cache, mockChecker);
  });

  describe('findAll', () => {
    it('calls repository.findAll with a Pagination entity and returns its result', async () => {
      const dto: PaginationDto = {
        limit: 5,
        page: 2,
        sort: 'title',
        order: defaultSortOrder,
        searchTerm: 'foo',
      };
      const expected = {
        items: [],
        page: 2,
        limit: 5,
        totalItems: 0,
        totalPages: 0,
      } as any;
      mockRepo.findAll.mockResolvedValue(expected);

      const result = await service.findAll(dto);

      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: dto.limit,
          page: dto.page,
          order: dto.order,
          searchTerm: dto.searchTerm,
          sortBy: dto.sort,
        }),
      );
      expect(result).toBe(expected);
    });
  });

  describe('findById', () => {
    it('delegates to checker.ensureBookExists', async () => {
      const book = {} as Book;
      mockChecker.ensureBookExists.mockResolvedValue(book);

      const result = await service.findById(10);

      expect(mockChecker.ensureBookExists).toHaveBeenCalledWith(10);
      expect(result).toBe(book);
    });
  });

  describe('create', () => {
    it('validates IDs, creates a domain book and persists via repository', async () => {
      const dto: CreateBookDto = {
        title: 'New',
        publisher: 'Pub',
        publicationDate: new Date(),
        pageCount: 123,
        categoryIds: [1],
        authorIds: [2],
      };
      const created = {} as Book;
      mockChecker.ensureCategoriesExist.mockResolvedValue([{} as any]);
      mockChecker.ensureAuthorsExist.mockResolvedValue([{} as any]);
      mockRepo.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mockChecker.ensureCategoriesExist).toHaveBeenCalledWith(
        dto.categoryIds,
      );
      expect(mockChecker.ensureAuthorsExist).toHaveBeenCalledWith(
        dto.authorIds,
      );
      expect(mockRepo.create).toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('fetches existing book, validates IDs, applies update and saves', async () => {
      const dto: UpdateBookDto = {
        id: 5,
        title: 'Upd',
        publisher: 'Pub2',
        publicationDate: new Date(),
        pageCount: 200,
        categoryIds: [3],
        authorIds: [4],
      };
      const bookStub = { update: jest.fn() } as unknown as Book;
      const updated = {} as Book;
      mockChecker.ensureBookExists.mockResolvedValue(bookStub);
      mockChecker.ensureCategoriesExist.mockResolvedValue([] as any);
      mockChecker.ensureAuthorsExist.mockResolvedValue([] as any);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.update(dto);

      expect(mockChecker.ensureBookExists).toHaveBeenCalledWith(dto.id);
      expect(bookStub.update).toHaveBeenCalledWith({
        title: dto.title,
        publisher: dto.publisher,
        publicationDate: dto.publicationDate,
        pageCount: dto.pageCount,
        categoryIds: dto.categoryIds,
        authorIds: dto.authorIds,
      });
      expect(mockRepo.update).toHaveBeenCalledWith(bookStub);
      expect(result).toBe(updated);
    });
  });

  describe('patch', () => {
    it('fetches existing book, applies patch and saves', async () => {
      const dto: PatchBookDto = { id: 7 } as any;
      const bookStub = { patch: jest.fn() } as any;
      const patched = {} as Book;
      mockChecker.ensureBookExists.mockResolvedValue(bookStub);
      mockRepo.update.mockResolvedValue(patched);

      const result = await service.patch(dto);

      expect(mockChecker.ensureBookExists).toHaveBeenCalledWith(dto.id);
      expect(bookStub.patch).toHaveBeenCalledWith(dto);
      expect(mockRepo.update).toHaveBeenCalledWith(bookStub);
      expect(result).toBe(patched);
    });
  });

  describe('delete', () => {
    it('fetches existing book, calls delete and returns result', async () => {
      const id = 9;
      const bookStub = { delete: jest.fn() } as any;
      const deleted = {} as Book;
      mockChecker.ensureBookExists.mockResolvedValue(bookStub);
      mockRepo.delete.mockResolvedValue(deleted);
      mockChecker.ensureExists.mockImplementation((fn) => fn());

      const result = await service.delete(id);

      expect(mockChecker.ensureBookExists).toHaveBeenCalledWith(id);
      expect(bookStub.delete).toHaveBeenCalled();
      expect(mockRepo.delete).toHaveBeenCalledWith(bookStub);
      expect(result).toBe(deleted);
    });
  });
});
