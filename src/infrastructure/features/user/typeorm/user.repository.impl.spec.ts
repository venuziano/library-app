/* eslint-disable @typescript-eslint/unbound-method */

import { Repository, FindOperator } from 'typeorm';
import { UserRepositoryImpl } from './user.repository.impl';
import { UserOrm } from './user.orm-entity';
import { User } from 'src/domain/user/user.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import {
  defaultSortOrder,
  SortOrder,
} from 'src/application/pagination/helpers';

describe('UserRepositoryImpl', () => {
  let ormRepo: jest.Mocked<Repository<UserOrm>>;
  let repository: UserRepositoryImpl;

  beforeEach(() => {
    ormRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      preload: jest.fn(),
      find: jest.fn(),
    } as any;
    repository = new UserRepositoryImpl(ormRepo);
  });

  describe('findAll', () => {
    it('should query without where when no searchTerm', async () => {
      const pagination = Pagination.of(
        10,
        1,
        'username',
        defaultSortOrder,
        undefined,
      );
      const now = new Date();
      const ormEntities: UserOrm[] = [
        {
          id: 1,
          username: 'A',
          firstname: 'A',
          lastname: 'B',
          email: 'a@example.com',
          stripeCustomerId: 'cus_1',
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
        order: { username: defaultSortOrder },
        select: [
          'id',
          'username',
          'firstname',
          'lastname',
          'email',
          'stripeCustomerId',
          'createdAt',
          'updatedAt',
        ],
        where: undefined,
      });
      expect(result).toBeInstanceOf(PaginationResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(User);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalItems).toBe(1);
    });

    it('should query with where when searchTerm provided', async () => {
      const pagination = Pagination.of(5, 2, 'email', SortOrder.ASC, 'foo');
      const now = new Date();
      const ormEntities: UserOrm[] = [
        {
          id: 2,
          username: 'Foo',
          firstname: 'Foo',
          lastname: 'Bar',
          email: 'foo@bar.com',
          stripeCustomerId: 'cus_2',
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
            { username: expect.any(Object) },
            { firstname: expect.any(Object) },
            { lastname: expect.any(Object) },
            { email: expect.any(Object) },
          ],
        }),
      );
      const whereClause = (ormRepo.findAndCount.mock.calls[0][0] as any).where;
      expect(whereClause[0].username).toBeInstanceOf(FindOperator);
      expect((whereClause[0].username as FindOperator<string>).value).toBe(
        '%foo%',
      );

      expect(result.items[0].username).toBe('Foo');
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
        username: 'X',
        firstname: 'X',
        lastname: 'Y',
        email: 'x@y.com',
        stripeCustomerId: 'cus_3',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.findOne.mockResolvedValue(orm);

      const result = await repository.findById(3);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(result).toBeInstanceOf(User);
      expect(result!.id).toBe(3);
    });

    it('should return null when not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const result = await repository.findById(99);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return the new user', async () => {
      const now = new Date();
      const domain = User.create({
        username: 'C',
        password: 'password',
        firstname: 'C',
        lastname: 'D',
        email: 'c@d.com',
        stripeCustomerId: 'cus_4',
      });
      const orm = {
        id: 4,
        username: 'C',
        password: 'password',
        firstname: 'C',
        lastname: 'D',
        email: 'c@d.com',
        stripeCustomerId: 'cus_4',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      ormRepo.create.mockReturnValue(orm);
      ormRepo.save.mockResolvedValue(orm);

      const result = await repository.create(domain);

      expect(ormRepo.create).toHaveBeenCalledWith({
        username: 'C',
        password: 'password',
        firstname: 'C',
        lastname: 'D',
        email: 'c@d.com',
        stripeCustomerId: 'cus_4',
      });
      expect(ormRepo.save).toHaveBeenCalledWith(orm);
      expect(result).toBeInstanceOf(User);
      expect(result.id).toBe(4);
    });
  });

  describe('update', () => {
    it('should return null when entity to update not found', async () => {
      ormRepo.preload.mockResolvedValue(undefined);
      const domain = User.reconstitute({
        id: 5,
        username: 'E',
        password: 'password',
        firstname: 'E',
        lastname: 'F',
        email: 'e@f.com',
        stripeCustomerId: 'cus_5',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.update(domain);
      expect(result).toBeNull();
    });

    it('should update and return domain entity when found', async () => {
      const now = new Date();
      const domain = User.reconstitute({
        id: 6,
        username: 'G',
        password: 'password',
        firstname: 'G',
        lastname: 'H',
        email: 'g@h.com',
        stripeCustomerId: 'cus_6',
        createdAt: now,
        updatedAt: now,
      });
      const ormPre = {
        id: 6,
        username: 'G',
        password: 'password',
        firstname: 'G',
        lastname: 'H',
        email: 'g@h.com',
        stripeCustomerId: 'cus_6',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      } as any;
      const ormSaved = {
        ...ormPre,
        username: 'G2',
        updatedAt: new Date(),
      };
      ormRepo.preload.mockResolvedValue(ormPre);
      ormRepo.save.mockResolvedValue(ormSaved);

      const result = await repository.update(domain);

      expect(ormRepo.preload).toHaveBeenCalledWith({
        id: 6,
        username: 'G',
        password: 'password',
        firstname: 'G',
        lastname: 'H',
        email: 'g@h.com',
        stripeCustomerId: 'cus_6',
      });
      expect(ormRepo.save).toHaveBeenCalledWith(ormPre);
      expect(result).toBeInstanceOf(User);
      expect(result!.username).toBe('G2');
    });
  });

  describe('delete', () => {
    it('should return null when entity not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const domain = User.reconstitute({
        id: 7,
        username: 'I',
        password: 'password',
        firstname: 'I',
        lastname: 'J',
        email: 'i@j.com',
        stripeCustomerId: 'cus_7',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const result = await repository.delete(domain);
      expect(result).toBeNull();
    });

    it('should mark deleted and return domain entity', async () => {
      const now = new Date();
      const domain = User.reconstitute({
        id: 8,
        username: 'K',
        password: 'password',
        firstname: 'K',
        lastname: 'L',
        email: 'k@l.com',
        stripeCustomerId: 'cus_8',
        createdAt: now,
        updatedAt: now,
      });
      const ormExisting: any = {
        id: 8,
        username: 'K',
        firstname: 'K',
        lastname: 'L',
        email: 'k@l.com',
        stripeCustomerId: 'cus_8',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      ormRepo.findOne.mockResolvedValue(ormExisting);
      ormRepo.save.mockResolvedValue(ormExisting as UserOrm);

      const result = await repository.delete(domain);

      expect(ormRepo.findOne).toHaveBeenCalledWith({ where: { id: 8 } });
      expect(ormExisting.deletedAt).toBeInstanceOf(Date);
      expect(ormExisting.updatedAt).toBeInstanceOf(Date);
      expect(result).toBeInstanceOf(User);
      expect(result!.deletedAt).toBeInstanceOf(Date);
    });
  });
});
