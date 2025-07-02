/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Repository, FindOperator } from 'typeorm';
import { CategoryRepositoryImpl } from './category.repository.impl';
import { CategoryOrm } from './category.orm-entity';
import { Category } from 'src/domain/category/category.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';

describe('CategoryRepositoryImpl', () => {
  let ormRepo: jest.Mocked<Repository<CategoryOrm>>;
  let repository: CategoryRepositoryImpl;

  beforeEach(() => {
    ormRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      preload: jest.fn(),
    } as any;
    repository = new CategoryRepositoryImpl(ormRepo);
  });

  describe('findAll', () => {
    it('should query without where when no searchTerm', async () => {
      const pagination = Pagination.of(
        10,
        1,
        'name',
        defaultSortOrder,
        undefined,
      );
      const now = new Date();
      const ormEntities: CategoryOrm[] = [
        {
          id: 1,
          name: 'Fiction',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        } as any,
      ];
      ormRepo.findAndCount.mockResolvedValue([ormEntities, 1]);

      const result = await repository.findAll(pagination);

      expect(ormRepo.findAndCount).toHaveBeenCalledWith({
        take: 10,
        skip: pagination.offset,
        order: { name: defaultSortOrder },
        select: ['id', 'name', 'createdAt', 'updatedAt'],
        where: undefined,
      });
      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(Category);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalItems).toBe(1);
    });

    it('should query with where when searchTerm provided', async () => {
      const pagination = Pagination.of(5, 2, 'name', SortOrder.ASC, 'fiction');
      const now = new Date();
      const ormEntities: CategoryOrm[] = [
        {
          id: 2,
          name: 'Science Fiction',
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        } as any,
      ];
      ormRepo.findAndCount.mockResolvedValue([ormEntities, 1]);

      const result = await repository.findAll(pagination);

      expect(ormRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ name: expect.any(Object) }],
        }),
      );
      const whereClause = (ormRepo.findAndCount.mock.calls[0][0] as any).where;
      expect(whereClause[0].name).toBeInstanceOf(FindOperator);
      expect((whereClause[0].name as FindOperator<string>).value).toBe(
        '%fiction%',
      );

      expect(result.items[0].name).toBe('Science Fiction');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return domain entity when found', async () => {
      const now = new Date();
      const orm = {
        id: 3,
        name: 'Mystery',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.findOne.mockResolvedValue(orm);

      const result = await repository.findById(3);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(result).toBeInstanceOf(Category);
      expect(result!.id).toBe(3);
    });

    it('should return null when not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById(99);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return the new category', async () => {
      const now = new Date();
      const domain = Category.create({ name: 'Romance' });
      const orm = {
        id: 4,
        name: 'Romance',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.create.mockReturnValue(orm);
      ormRepo.save.mockResolvedValue(orm);

      const result = await repository.create(domain);

      expect(ormRepo.create).toHaveBeenCalledWith({
        name: 'Romance',
      });
      expect(ormRepo.save).toHaveBeenCalledWith(orm);
      expect(result).toBeInstanceOf(Category);
      expect(result.id).toBe(4);
    });
  });

  describe('update', () => {
    it('should return null when entity to update not found', async () => {
      ormRepo.preload.mockResolvedValue(undefined);
      const domain = Category.reconstitute({
        id: 5,
        name: 'Thriller',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.update(domain);
      expect(result).toBeNull();
    });

    it('should update and return domain entity when found', async () => {
      const now = new Date();
      const domain = Category.reconstitute({
        id: 6,
        name: 'Horror',
        createdAt: now,
        updatedAt: now,
      });
      const ormPre = {
        id: 6,
        name: 'Horror',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      const ormSaved = {
        ...ormPre,
        name: 'Psychological Horror',
        updatedAt: new Date(),
      };
      ormRepo.preload.mockResolvedValue(ormPre);
      ormRepo.save.mockResolvedValue(ormSaved);

      const result = await repository.update(domain);

      expect(ormRepo.preload).toHaveBeenCalledWith({
        id: 6,
        name: 'Horror',
      });
      expect(ormRepo.save).toHaveBeenCalledWith(ormPre);
      expect(result).toBeInstanceOf(Category);
      expect(result!.name).toBe('Psychological Horror');
    });
  });

  describe('delete', () => {
    it('should return null when entity not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const domain = Category.reconstitute({
        id: 7,
        name: 'Adventure',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.delete(domain);
      expect(result).toBeNull();
    });

    it('should mark deleted and return domain entity', async () => {
      const now = new Date();
      const domain = Category.reconstitute({
        id: 8,
        name: 'Fantasy',
        createdAt: now,
        updatedAt: now,
      });
      const ormExisting: any = {
        id: 8,
        name: 'Fantasy',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      ormRepo.findOne.mockResolvedValue(ormExisting);
      ormRepo.save.mockResolvedValue(ormExisting as CategoryOrm);

      const result = await repository.delete(domain);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 8 } });
      expect(ormExisting.deletedAt).toBeInstanceOf(Date);
      expect(ormExisting.updatedAt).toBeInstanceOf(Date);
      expect(result).toBeInstanceOf(Category);
      expect(result!.deletedAt).toBeInstanceOf(Date);
    });
  });
}); 