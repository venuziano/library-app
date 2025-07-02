/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Repository, FindOperator } from 'typeorm';
import { BookRepositoryImpl } from './book.repository.impl';
import { BookOrm } from './book.orm-entity';
import { Book } from 'src/domain/book/book.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';

describe('BookRepositoryImpl', () => {
  let ormRepo: jest.Mocked<Repository<BookOrm>>;
  let repository: BookRepositoryImpl;

  beforeEach(() => {
    ormRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      preload: jest.fn(),
    } as any;
    repository = new BookRepositoryImpl(ormRepo);
  });

  describe('findAll', () => {
    it('should query without where when no searchTerm', async () => {
      const pagination = Pagination.of(
        10,
        1,
        'title',
        defaultSortOrder,
        undefined,
      );
      const now = new Date();
      const ormEntities: BookOrm[] = [
        {
          id: 1,
          title: 'Book1',
          publisher: 'Pub1',
          publicationDate: now,
          pageCount: 123,
          categories: [],
          authors: [],
          categoryIds: [2],
          authorIds: [1, 2],
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
        order: { title: defaultSortOrder },
        loadRelationIds: {
          relations: ['categories', 'authors'],
          disableMixedMap: true,
        },
        where: undefined,
      });
      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(Book);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalItems).toBe(1);
    });

    it('should query with where when searchTerm provided', async () => {
      const pagination = Pagination.of(5, 2, 'publisher', SortOrder.ASC, 'foo');
      const now = new Date();
      const ormEntities: BookOrm[] = [
        {
          id: 2,
          title: 'Foo Book',
          publisher: 'Bar Pub',
          publicationDate: now,
          pageCount: 321,
          categories: [],
          authors: [],
          categoryIds: [3],
          authorIds: [3],
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        } as any,
      ];
      ormRepo.findAndCount.mockResolvedValue([ormEntities, 1]);

      const result = await repository.findAll(pagination);

      expect(ormRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { title: expect.any(Object) },
            { publisher: expect.any(Object) },
          ],
        }),
      );
      const whereClause = (ormRepo.findAndCount.mock.calls[0][0] as any).where;
      expect(whereClause[0].title).toBeInstanceOf(FindOperator);
      expect((whereClause[0].title as FindOperator<string>).value).toBe(
        '%foo%',
      );

      expect(result.items[0].title).toBe('Foo Book');
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
        title: 'BookX',
        publisher: 'PubX',
        publicationDate: now,
        pageCount: 111,
        categories: [],
        authors: [],
        categoryIds: [4],
        authorIds: [5],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.findOne.mockResolvedValue(orm);

      const result = await repository.findById(3);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(result).toBeInstanceOf(Book);
      expect(result!.id).toBe(3);
    });

    it('should return null when not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById(99);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return the new book', async () => {
      const now = new Date();
      const domain = Book.create({
        title: 'BookC',
        publisher: 'PubC',
        publicationDate: now,
        pageCount: 222,
        categoryIds: [6],
        authorIds: [7, 8],
      });
      const orm = {
        id: 4,
        title: 'BookC',
        publisher: 'PubC',
        publicationDate: now,
        pageCount: 222,
        categories: [],
        authors: [],
        categoryIds: [6],
        authorIds: [7, 8],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.create.mockReturnValue(orm);
      ormRepo.save.mockResolvedValue(orm);

      const result = await repository.create(domain);

      expect(ormRepo.create).toHaveBeenCalledWith({
        title: 'BookC',
        publisher: 'PubC',
        publicationDate: now,
        pageCount: 222,
        categories: [{ id: 6 }],
        authors: [{ id: 7 }, { id: 8 }],
      });
      expect(ormRepo.save).toHaveBeenCalledWith(orm);
      expect(result).toBeInstanceOf(Book);
      expect(result.id).toBe(4);
    });
  });

  describe('update', () => {
    it('should return null when entity to update not found', async () => {
      ormRepo.preload.mockResolvedValue(undefined);
      const domain = Book.reconstitute({
        id: 5,
        title: 'BookE',
        publisher: 'PubE',
        publicationDate: new Date(),
        pageCount: 333,
        categoryIds: [9],
        authorIds: [10],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.update(domain);
      expect(result).toBeNull();
    });

    it('should update and return domain entity when found', async () => {
      const now = new Date();
      const domain = Book.reconstitute({
        id: 6,
        title: 'BookG',
        publisher: 'PubG',
        publicationDate: now,
        pageCount: 444,
        categoryIds: [11],
        authorIds: [12],
        createdAt: now,
        updatedAt: now,
      });
      const ormPre = {
        id: 6,
        title: 'BookG',
        publisher: 'PubG',
        publicationDate: now,
        pageCount: 444,
        categories: [],
        authors: [],
        categoryIds: [11],
        authorIds: [12],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      const ormSaved = {
        ...ormPre,
        title: 'BookG2',
        updatedAt: new Date(),
      };
      ormRepo.preload.mockResolvedValue(ormPre);
      ormRepo.save.mockResolvedValue(ormSaved);

      const result = await repository.update(domain);
      expect(result).toBeInstanceOf(Book);
      expect(result!.title).toBe('BookG2');
    });
  });

  describe('delete', () => {
    it('should return null if not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const domain = Book.reconstitute({
        id: 7,
        title: 'BookDel',
        publisher: 'PubDel',
        publicationDate: new Date(),
        pageCount: 555,
        categoryIds: [13],
        authorIds: [14],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.delete(domain);
      expect(result).toBeNull();
    });

    it('should set deletedAt and updatedAt and return domain entity', async () => {
      const now = new Date();
      const domain = Book.reconstitute({
        id: 8,
        title: 'BookGone',
        publisher: 'PubGone',
        publicationDate: now,
        pageCount: 666,
        categoryIds: [15],
        authorIds: [16],
        createdAt: now,
        updatedAt: now,
      });
      const orm = {
        id: 8,
        title: 'BookGone',
        publisher: 'PubGone',
        publicationDate: now,
        pageCount: 666,
        categories: [],
        authors: [],
        categoryIds: [15],
        authorIds: [16],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.findOne.mockResolvedValue(orm);
      ormRepo.save.mockImplementation(async (entity) => ({
        ...orm,
        ...entity,
      }));

      const result = await repository.delete(domain);
      expect(result).toBeInstanceOf(Book);
      expect(result!.deletedAt).toBeInstanceOf(Date);
      expect(result!.updatedAt).toBeInstanceOf(Date);
    });
  });
});
