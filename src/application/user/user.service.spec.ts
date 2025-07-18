/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/only-throw-error */
/* eslint-disable @typescript-eslint/unbound-method */

import { UserService } from './user.service';
import { User } from '../../domain/user/user.entity';
import { UserRepository } from '../../domain/user/user.repository';
import { MultiLevelCacheService } from '../../infrastructure/cache/multi-level-cache.service';
import { EntityChecker } from '../shared/entity-checker.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PatchUserDto } from './dtos/patch-user.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import { defaultSortOrder } from '../pagination/helpers';
import { PaginationResult } from '../../domain/pagination/pagination.entity';
import {
  userNotFoundException,
  failedToDeleteUserException,
} from './user-exceptions';
import { ConflictException } from '@nestjs/common';
import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';
import { UserTokenService } from '../user-token/user-token.service';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { EventBus } from '@nestjs/cqrs';
import { UserRegistered } from 'src/domain/events/user/user-registered.event';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<UserRepository>;
  let cache: jest.Mocked<MultiLevelCacheService>;
  let checker: jest.Mocked<EntityChecker>;
  let hasher: jest.Mocked<BcryptPasswordHasher>;
  let userTokenService: jest.Mocked<UserTokenService>;
  let jwtService: jest.Mocked<JwtService>;
  let dataSource: jest.Mocked<DataSource>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByEmail: jest.fn(),
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
      ensureUserExists: jest.fn(),
      ensureExists: jest.fn(),
      ensureUserEmailIsUnique: jest.fn(),
      ensureUsernameIsUnique: jest.fn(),
    } as any;
    hasher = {
      hash: jest.fn(),
    } as any;
    userTokenService = {
      createToken: jest.fn(),
    } as any;
    jwtService = {
      sign: jest.fn(),
    } as any;
    dataSource = {
      transaction: jest.fn(),
    } as any;
    eventBus = {
      publish: jest.fn(),
    } as any;

    service = new UserService(
      repo,
      cache,
      checker,
      hasher,
      userTokenService,
      jwtService,
      dataSource,
      eventBus,
    );
  });

  describe('findAll', () => {
    it('builds pagination and returns repository result', async () => {
      const dto: PaginationDto = {
        limit: 10,
        page: 2,
        sort: 'username',
        order: defaultSortOrder,
        searchTerm: 'foo',
      };
      const fakeResult: PaginationResult<User> = {
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
          sortBy: 'username',
          order: defaultSortOrder,
          searchTerm: 'foo',
        }),
      );
      expect(result).toBe(fakeResult);
    });
  });

  describe('findById', () => {
    it('calls checker.ensureUserExists and returns the user', async () => {
      const user = User.reconstitute({
        id: 1,
        username: 'user1',
        password: 'password',
        firstname: 'A',
        lastname: 'B',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureUserExists.mockResolvedValue(user);

      const result = await service.findById(1);

      expect(checker.ensureUserExists).toHaveBeenCalledWith(1);
      expect(result).toBe(user);
    });

    it('throws if not found', async () => {
      const exception = userNotFoundException();
      checker.ensureUserExists.mockImplementation(() => {
        throw exception;
      });

      await expect(service.findById(42)).rejects.toBe(exception);
    });
  });

  describe('findByEmail', () => {
    it('calls checker.ensureUserExists and returns the user', async () => {
      const user = User.reconstitute({
        id: 1,
        username: 'user1',
        password: 'password',
        firstname: 'A',
        lastname: 'B',
        email: 'user1@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureExists.mockResolvedValue(user);

      const result = await service.findByEmail('user1@example.com');

      expect(checker.ensureExists).toHaveBeenCalledWith(
        expect.any(Function),
        userNotFoundException(),
      );
      expect(result).toBe(user);
    });

    it('throws if not found', async () => {
      const exception = userNotFoundException();
      checker.ensureExists.mockImplementation(() => {
        throw exception;
      });

      await expect(service.findByEmail('user1@example.com')).rejects.toBe(
        exception,
      );
    });
  });

  describe('create', () => {
    it('creates a new user and emits the registration event', async () => {
      const dto: CreateUserDto = {
        username: 'user2',
        password: 'plain-pw',
        firstname: 'X',
        lastname: 'Y',
        email: 'user2@example.com',
      };
      const hashed = 'hashed-pw';
      const savedUser = User.reconstitute({
        id: 42,
        username: dto.username,
        password: hashed,
        firstname: dto.firstname!,
        lastname: dto.lastname!,
        email: dto.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const code = 'verif-code';

      checker.ensureUserEmailIsUnique.mockResolvedValue(undefined);
      checker.ensureUsernameIsUnique.mockResolvedValue(undefined);
      hasher.hash.mockResolvedValue(hashed);
      repo.create.mockResolvedValue(savedUser);
      userTokenService.createToken.mockResolvedValue(code);
      jwtService.sign.mockReturnValue('jwt-token');

      // Cast to any so we can invoke the callback without TS errors
      (dataSource.transaction as any).mockImplementation(async (cb: any) => {
        return cb({} as any);
      });

      const result = await service.create(dto);

      expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: dto.username,
          password: hashed,
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email,
        }),
        expect.anything(),
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        new UserRegistered(42, dto.email, dto.username, code),
      );
      expect(result).toBe(savedUser);
    });
    // it('creates a new user after ensuring email is unique and returns it', async () => {
    //   const hashedPassword = 'hashed-password';
    //   const dto: CreateUserDto = {
    //     username: 'user2',
    //     password: hashedPassword,
    //     firstname: 'X',
    //     lastname: 'Y',
    //     email: 'user2@example.com',
    //   };
    //   const created = User.create(dto);
    //   checker.ensureUserEmailIsUnique.mockResolvedValueOnce(undefined);
    //   checker.ensureUsernameIsUnique.mockResolvedValueOnce(undefined);
    //   hasher.hash.mockResolvedValueOnce(hashedPassword);
    //   repo.create.mockResolvedValue(created);

    //   const result = await service.create(dto);

    //   expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email);
    //   expect(repo.create).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       username: 'user2',
    //       password: hashedPassword,
    //       firstname: 'X',
    //       lastname: 'Y',
    //       email: 'user2@example.com',
    //     }),
    //     undefined,
    //   );
    //   expect(result).toBe(created);
    // });

    it('throws ConflictException when email is already in use', async () => {
      const dto: CreateUserDto = {
        username: 'user2',
        password: 'password',
        firstname: 'X',
        lastname: 'Y',
        email: 'existing@example.com',
      };
      const conflictError = new ConflictException(dto.email);
      checker.ensureUserEmailIsUnique.mockRejectedValueOnce(conflictError);

      await expect(service.create(dto)).rejects.toBe(conflictError);
      expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email);
    });

    it('throws ConflictException when username is already in use', async () => {
      const dto: CreateUserDto = {
        username: 'user2',
        password: 'password',
        firstname: 'X',
        lastname: 'Y',
        email: 'existing@example.com',
      };
      const conflictError = new ConflictException(dto.username);
      checker.ensureUsernameIsUnique.mockRejectedValueOnce(conflictError);

      await expect(service.create(dto)).rejects.toBe(conflictError);
      expect(checker.ensureUsernameIsUnique).toHaveBeenCalledWith(dto.username);
    });
  });

  describe('update', () => {
    it('throws if user not found', async () => {
      const dto: UpdateUserDto = {
        id: 5,
        username: 'user3',
        password: 'password',
        firstname: 'F',
        lastname: 'L',
        email: 'user3@example.com',
      };
      const exception = userNotFoundException();
      checker.ensureUserExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.update(dto)).rejects.toBe(exception);
    });

    it('updates and returns the mutated user after ensuring username/email are unique and hashing the password', async () => {
      const hashedPassword = 'hashed-password';
      const dto: UpdateUserDto = {
        id: 5,
        password: hashedPassword,
        username: 'newuser',
        firstname: 'New',
        lastname: 'Name',
        email: 'newuser@example.com',
      };
      const original = User.reconstitute({
        id: 5,
        username: 'olduser',
        password: 'old-hash',
        firstname: 'Old',
        lastname: 'Name',
        email: 'olduser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      checker.ensureUserExists.mockResolvedValueOnce(original);
      checker.ensureUsernameIsUnique.mockResolvedValueOnce(undefined);
      checker.ensureUserEmailIsUnique.mockResolvedValueOnce(undefined);
      hasher.hash.mockResolvedValueOnce(hashedPassword);

      repo.update.mockImplementationOnce((user) => Promise.resolve(user));

      const result = await service.update(dto);

      expect(checker.ensureUserExists).toHaveBeenCalledWith(dto.id);
      expect(checker.ensureUsernameIsUnique).toHaveBeenCalledWith(dto.username);
      expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email);
      expect(hasher.hash).toHaveBeenCalledWith(dto.password);

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: dto.id,
          username: dto.username,
          firstname: dto.firstname,
          lastname: dto.lastname,
          email: dto.email,
        }),
      );

      expect(result).toBeInstanceOf(User);
      expect(result!.username).toBe(dto.username);
      expect(result!.firstname).toBe(dto.firstname);
      expect(result!.lastname).toBe(dto.lastname);
      expect(result!.email).toBe(dto.email);
      expect(result!.password).toBe('old-hash');
    });

    it('throws ConflictException when email is already in use during update', async () => {
      const dto: UpdateUserDto = {
        id: 5,
        username: 'newuser',
        password: 'password',
        firstname: 'New',
        lastname: 'Name',
        email: 'existing@example.com',
      };
      const original = User.reconstitute({
        id: 5,
        username: 'olduser',
        password: 'password',
        firstname: 'Old',
        lastname: 'Name',
        email: 'olduser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureUserExists.mockResolvedValueOnce(original);
      const conflictError = new ConflictException(dto.email);
      checker.ensureUserEmailIsUnique.mockRejectedValueOnce(conflictError);

      await expect(service.update(dto)).rejects.toBe(conflictError);
      expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email);
    });

    it('throws ConflictException when username is already in use during update', async () => {
      const dto: UpdateUserDto = {
        id: 5,
        username: 'newuser',
        password: 'password',
        firstname: 'New',
        lastname: 'Name',
        email: 'existing@example.com',
      };
      const original = User.reconstitute({
        id: 5,
        username: 'olduser',
        password: 'password',
        firstname: 'Old',
        lastname: 'Name',
        email: 'olduser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureUserExists.mockResolvedValueOnce(original);
      const conflictError = new ConflictException(dto.username);
      checker.ensureUsernameIsUnique.mockRejectedValueOnce(conflictError);

      await expect(service.update(dto)).rejects.toBe(conflictError);
      expect(checker.ensureUsernameIsUnique).toHaveBeenCalledWith(dto.username);
    });
  });

  describe('patch', () => {
    it('throws if user not found', async () => {
      const dto: PatchUserDto = { id: 3, username: 'patchuser' };
      const exception = userNotFoundException();
      checker.ensureUserExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.patch(dto)).rejects.toBe(exception);
    });

    it('patches fields and returns updated user after ensuring email is unique', async () => {
      const dto: PatchUserDto = { id: 3, email: 'patched@example.com' };
      const original = User.reconstitute({
        id: 3,
        username: 'patchuser',
        password: 'password',
        firstname: 'OldFirst',
        lastname: 'Last',
        email: 'old@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      checker.ensureUserExists.mockResolvedValueOnce(original);
      checker.ensureUserEmailIsUnique.mockResolvedValueOnce(undefined);
      repo.update.mockImplementationOnce((user) => Promise.resolve(user));

      const result = await service.patch(dto);

      expect(checker.ensureUserExists).toHaveBeenCalledWith(dto.id);
      expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email!);
      expect(checker.ensureUsernameIsUnique).not.toHaveBeenCalled();
      expect(hasher.hash).not.toHaveBeenCalled();

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: dto.id,
          username: original.username,
          password: original.password,
          firstname: original.firstname,
          lastname: original.lastname,
          email: dto.email,
        }),
      );

      expect(result).toBeInstanceOf(User);
      expect(result!.email).toBe(dto.email);
      expect(result!.password).toBe(original.password);
    });

    it('throws ConflictException when email is already in use during patch', async () => {
      const dto: PatchUserDto = { id: 3, email: 'existing@example.com' };
      const original = User.reconstitute({
        id: 3,
        username: 'patchuser',
        password: 'password',
        firstname: 'OldFirst',
        lastname: 'Last',
        email: 'old@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureUserExists.mockResolvedValueOnce(original);
      const conflictError = new ConflictException(dto.email!);
      checker.ensureUserEmailIsUnique.mockRejectedValueOnce(conflictError);

      await expect(service.patch(dto)).rejects.toBe(conflictError);
      expect(checker.ensureUserEmailIsUnique).toHaveBeenCalledWith(dto.email!);
    });

    it('throws ConflictException when username is already in use during patch', async () => {
      const dto: PatchUserDto = { id: 3, username: 'patchuser' };
      const original = User.reconstitute({
        id: 3,
        username: 'patchuser',
        password: 'password',
        firstname: 'OldFirst',
        lastname: 'Last',
        email: 'old@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureUserExists.mockResolvedValueOnce(original);
      const conflictError = new ConflictException(dto.username!);
      checker.ensureUsernameIsUnique.mockRejectedValueOnce(conflictError);

      await expect(service.patch(dto)).rejects.toBe(conflictError);
      expect(checker.ensureUsernameIsUnique).toHaveBeenCalledWith(
        dto.username!,
      );
    });
  });

  describe('delete', () => {
    it('throws if user not found', async () => {
      const exception = userNotFoundException();
      checker.ensureUserExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.delete(9)).rejects.toBe(exception);
    });

    it('deletes and returns entity', async () => {
      const user = User.reconstitute({
        id: 9,
        username: 'deluser',
        password: 'password',
        firstname: 'A',
        lastname: 'B',
        email: 'deluser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      checker.ensureUserExists.mockResolvedValueOnce(user);
      checker.ensureExists.mockImplementationOnce((fn) => fn());
      repo.delete.mockResolvedValueOnce(user);

      const result = (await service.delete(9))!;

      expect(result).toBe(user);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('throws if delete fails', async () => {
      const user = User.reconstitute({
        id: 9,
        username: 'deluser',
        password: 'password',
        firstname: 'A',
        lastname: 'B',
        email: 'deluser@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const exception = failedToDeleteUserException();
      checker.ensureUserExists.mockResolvedValueOnce(user);
      checker.ensureExists.mockImplementationOnce(() => {
        throw exception;
      });

      await expect(service.delete(9)).rejects.toBe(exception);
    });
  });
});
