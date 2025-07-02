/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CategoryService } from './category.service';
import { Category } from '../../domain/category/category.entity';
import { CategoryRepository } from '../../domain/category/category.repository';
import { MultiLevelCacheService } from '../../infrastructure/cache/multi-level-cache.service';
import { EntityChecker } from '../shared/entity-checker.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { PatchCategoryDto } from './dtos/patch-category.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import { defaultSortOrder } from '../pagination/helpers';
import { PaginationResult } from '../../domain/pagination/pagination.entity';
import {
  categoryNotFoundException,
  failedToDeleteCategoryException,
} from './category-exceptions';

describe('CategoryService', () => {
  let service: CategoryService;
  let repo: jest.Mocked<CategoryRepository>;
  let cache: jest.Mocked<MultiLevelCacheService>;
  let checker: jest.Mocked<EntityChecker>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
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
    checker = {
      ensureCategoryExists: jest.fn(),
      ensureExists: jest.fn(),
    } as any;

    service = new CategoryService(repo, cache, checker);
  });

  describe('findAll', () => {
    it('should build pagination and return repository result', async () => {
      const dto: PaginationDto = {
        limit: 10,
        page: 2,
        sort: 'name',
        order: defaultSortOrder,
        searchTerm: 'fiction',
      };
      const fakeResult: PaginationResult<Category> = {
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
          searchTerm: 'fiction',
        }),
      );
      expect(result).toBe(fakeResult);
    });
  });

  describe('findById', () => {
    it('should call checker.ensureCategoryExists and return the category', async () => {
      const category = Category.reconstitute({
        id: 1,
        name: 'Fiction',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureCategoryExists.mockResolvedValue(category);

      const result = await service.findById(1);

      expect(checker.ensureCategoryExists).toHaveBeenCalledWith(1);
      expect(result).toBe(category);
    });

    it('should throw if not found', async () => {
      const exception = categoryNotFoundException();
      checker.ensureCategoryExists.mockImplementation(() => {
        throw exception;
      });

      await expect(service.findById(42)).rejects.toBe(exception);
    });
  });

  describe('create', () => {
    it('should create a new category and return it', async () => {
      const dto: CreateCategoryDto = { name: 'Science Fiction' };
      const created = Category.create(dto);
      repo.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Science Fiction',
        }),
      );
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('should throw if category not found', async () => {
      const dto: UpdateCategoryDto = { id: 5, name: 'Mystery' };
      const exception = categoryNotFoundException();
      checker.ensureCategoryExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.update(dto)).rejects.toBe(exception);
    });

    it('should update and return the mutated category', async () => {
      const dto: UpdateCategoryDto = {
        id: 5,
        name: 'New Category Name',
      };
      const original = Category.reconstitute({
        id: 5,
        name: 'Old Category Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureCategoryExists.mockResolvedValueOnce(original);
      repo.update.mockResolvedValueOnce(original);

      const result = (await service.update(dto))!;

      expect(result).toBeInstanceOf(Category);
      expect(result.name).toBe('New Category Name');
    });
  });

  describe('patch', () => {
    it('should throw if category not found', async () => {
      const dto: PatchCategoryDto = { id: 3, name: 'Romance' };
      const exception = categoryNotFoundException();
      checker.ensureCategoryExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.patch(dto)).rejects.toBe(exception);
    });

    it('should patch fields and return updated category', async () => {
      const dto: PatchCategoryDto = { id: 3, name: 'New Category Name' };
      const original = Category.reconstitute({
        id: 3,
        name: 'Old Category Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureCategoryExists.mockResolvedValueOnce(original);
      repo.update.mockResolvedValueOnce(original);

      const result = (await service.patch(dto))!;

      expect(result).toBeInstanceOf(Category);
      expect(result.name).toBe('New Category Name');
    });
  });

  describe('delete', () => {
    it('should throw if category not found', async () => {
      const exception = categoryNotFoundException();
      checker.ensureCategoryExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.delete(9)).rejects.toBe(exception);
    });

    it('should delete and return entity', async () => {
      const category = Category.reconstitute({
        id: 9,
        name: 'Thriller',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureCategoryExists.mockResolvedValueOnce(category);
      checker.ensureExists.mockImplementationOnce((cb) => cb());
      repo.delete.mockResolvedValueOnce(category);

      const result = (await service.delete(9))!;

      expect(result).toBe(category);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw if delete fails', async () => {
      const category = Category.reconstitute({
        id: 9,
        name: 'Horror',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const exception = failedToDeleteCategoryException();
      checker.ensureCategoryExists.mockResolvedValueOnce(category);
      checker.ensureExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.delete(9)).rejects.toBe(exception);
    });
  });
});
