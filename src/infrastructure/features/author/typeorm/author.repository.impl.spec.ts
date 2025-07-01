/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Repository, FindOperator } from 'typeorm';
import { AuthorRepositoryImpl } from './author.repository.impl';
import { AuthorOrm } from './author.orm-entity';
import { Author } from 'src/domain/author/author.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';

describe('AuthorRepositoryImpl', () => {
  let ormRepo: jest.Mocked<Repository<AuthorOrm>>;
  let repository: AuthorRepositoryImpl;

  beforeEach(() => {
    ormRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      preload: jest.fn(),
    } as any;
    repository = new AuthorRepositoryImpl(ormRepo);
  });

  describe('findAll', () => {
    it('should query without where when no searchTerm', async () => {
      const pagination = Pagination.of(
        10,
        1,
        'firstname',
        defaultSortOrder,
        undefined,
      );
      const now = new Date();
      const ormEntities: AuthorOrm[] = [
        {
          id: 1,
          firstname: 'A',
          lastname: 'B',
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
        order: { firstname: defaultSortOrder },
        select: ['id', 'firstname', 'lastname', 'createdAt', 'updatedAt'],
        where: undefined,
      });
      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(Author);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalItems).toBe(1);
    });

    it('should query with where when searchTerm provided', async () => {
      const pagination = Pagination.of(5, 2, 'lastname', SortOrder.ASC, 'foo');
      const now = new Date();
      const ormEntities: AuthorOrm[] = [
        {
          id: 2,
          firstname: 'Foo',
          lastname: 'Bar',
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
            { firstname: expect.any(Object) },
            { lastname: expect.any(Object) },
          ],
        }),
      );
      const whereClause = (ormRepo.findAndCount.mock.calls[0][0] as any).where;
      expect(whereClause[0].firstname).toBeInstanceOf(FindOperator);
      expect((whereClause[0].firstname as FindOperator<string>).value).toBe(
        '%foo%',
      );

      expect(result.items[0].firstname).toBe('Foo');
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
        firstname: 'X',
        lastname: 'Y',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.findOne.mockResolvedValue(orm);

      const result = await repository.findById(3);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(result).toBeInstanceOf(Author);
      expect(result!.id).toBe(3);
    });

    it('should return null when not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById(99);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return the new author', async () => {
      const now = new Date();
      const domain = Author.create({ firstname: 'C', lastname: 'D' });
      const orm = {
        id: 4,
        firstname: 'C',
        lastname: 'D',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.create.mockReturnValue(orm);
      ormRepo.save.mockResolvedValue(orm);

      const result = await repository.create(domain);

      expect(ormRepo.create).toHaveBeenCalledWith({
        firstname: 'C',
        lastname: 'D',
      });
      expect(ormRepo.save).toHaveBeenCalledWith(orm);
      expect(result).toBeInstanceOf(Author);
      expect(result.id).toBe(4);
    });
  });

  describe('update', () => {
    it('should return null when entity to update not found', async () => {
      ormRepo.preload.mockResolvedValue(undefined);
      const domain = Author.reconstitute({
        id: 5,
        firstname: 'E',
        lastname: 'F',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.update(domain);
      expect(result).toBeNull();
    });

    it('should update and return domain entity when found', async () => {
      const now = new Date();
      const domain = Author.reconstitute({
        id: 6,
        firstname: 'G',
        lastname: 'H',
        createdAt: now,
        updatedAt: now,
      });
      const ormPre = {
        id: 6,
        firstname: 'G',
        lastname: 'H',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      const ormSaved = {
        ...ormPre,
        firstname: 'G2',
        updatedAt: new Date(),
      };
      ormRepo.preload.mockResolvedValue(ormPre);
      ormRepo.save.mockResolvedValue(ormSaved);

      const result = await repository.update(domain);

      expect(ormRepo.preload).toHaveBeenCalledWith({
        id: 6,
        firstname: 'G',
        lastname: 'H',
      });
      expect(ormRepo.save).toHaveBeenCalledWith(ormPre);
      expect(result).toBeInstanceOf(Author);
      expect(result!.firstname).toBe('G2');
    });
  });

  describe('delete', () => {
    it('should return null when entity not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const domain = Author.reconstitute({
        id: 7,
        firstname: 'I',
        lastname: 'J',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.delete(domain);
      expect(result).toBeNull();
    });

    it('should mark deleted and return domain entity', async () => {
      const now = new Date();
      const domain = Author.reconstitute({
        id: 8,
        firstname: 'K',
        lastname: 'L',
        createdAt: now,
        updatedAt: now,
      });
      const ormExisting: any = {
        id: 8,
        firstname: 'K',
        lastname: 'L',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      ormRepo.findOne.mockResolvedValue(ormExisting);
      ormRepo.save.mockResolvedValue(ormExisting as AuthorOrm);

      const result = await repository.delete(domain);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 8 } });
      expect(ormExisting.deletedAt).toBeInstanceOf(Date);
      expect(ormExisting.updatedAt).toBeInstanceOf(Date);
      expect(result).toBeInstanceOf(Author);
      expect(result!.deletedAt).toBeInstanceOf(Date);
    });
  });
});
