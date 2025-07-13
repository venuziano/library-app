import { EntityManager } from 'typeorm';
import { Injectable, Inject } from '@nestjs/common';

import { User } from '../../domain/user/user.entity';
import {
  USER_REPOSITORY_TOKEN,
  UserRepository,
} from '../../domain/user/user.repository';
import { CreateUserDto } from './dtos/create-user.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import {
  Pagination,
  PaginationResult,
} from '../../domain/pagination/pagination.entity';
import {
  Cacheable,
  InvalidateCache,
} from 'src/infrastructure/cache/cache.decorator';
import { MultiLevelCacheService } from 'src/infrastructure/cache/multi-level-cache.service';
import { userByIdKey, userCacheKey } from 'src/infrastructure/cache/cache-keys';
import { UpdateUserDto } from './dtos/update-user.dto';
import { EntityChecker } from '../shared/entity-checker.service';
import {
  failedToDeleteUserException,
  userNotFoundException,
} from './user-exceptions';
import { PatchUserDto } from './dtos/patch-user.dto';
import { BcryptPasswordHasher } from 'src/domain/auth/auth.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepository,
    public readonly cache: MultiLevelCacheService,
    private readonly checker: EntityChecker,
    private readonly hasher: BcryptPasswordHasher,
  ) {}

  @Cacheable({ namespace: userCacheKey })
  findAll(properties: PaginationDto): Promise<PaginationResult<User>> {
    const { limit, page, sort, order, searchTerm } = properties;
    const pagination: Pagination = Pagination.of(
      limit,
      page,
      sort,
      order,
      searchTerm,
    );
    return this.userRepository.findAll(pagination);
  }

  @Cacheable({ namespace: userByIdKey })
  async findById(id: number): Promise<User> {
    return this.checker.ensureUserExists(id);
  }

  async findByEmail(email: string): Promise<User> {
    return this.checker.ensureExists(
      () => this.userRepository.findByEmail(email),
      userNotFoundException(),
    );
  }

  @InvalidateCache({ namespace: userCacheKey })
  async create(dto: CreateUserDto, manager?: EntityManager): Promise<User> {
    await this.checker.ensureUserEmailIsUnique(dto.email);
    await this.checker.ensureUsernameIsUnique(dto.username);
    const hashed: string = await this.hasher.hash(dto.password);
    const user: User = User.create({
      username: dto.username,
      password: hashed,
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
    });
    return this.userRepository.create(user, manager);
  }

  @InvalidateCache({
    namespace: [userCacheKey],
    keyGenerator: (dto: UpdateUserDto) => ({
      [userByIdKey]: dto.id.toString(),
    }),
  })
  async update(dto: UpdateUserDto): Promise<User | null> {
    const userToUpdate = await this.checker.ensureUserExists(dto.id);
    await this.checker.ensureUsernameIsUnique(dto.username);
    await this.checker.ensureUserEmailIsUnique(dto.email);
    if (dto.password) dto.password = await this.hasher.hash(dto.password);
    userToUpdate.update({
      username: dto.username,
      password: dto.password,
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
    });
    return this.userRepository.update(userToUpdate);
  }

  @InvalidateCache({
    namespace: [userCacheKey],
    keyGenerator: (dto: PatchUserDto) => ({
      [userByIdKey]: dto.id.toString(),
    }),
  })
  async patch(dto: PatchUserDto): Promise<User | null> {
    const user = await this.checker.ensureUserExists(dto.id);

    if (dto.email != null)
      await this.checker.ensureUserEmailIsUnique(dto.email);

    if (dto.username != null)
      await this.checker.ensureUsernameIsUnique(dto.username);

    if (dto.password) dto.password = await this.hasher.hash(dto.password);

    user.patch(dto);
    return this.userRepository.update(user);
  }

  @InvalidateCache({
    namespace: [userCacheKey],
    keyGenerator: (id: number) => ({
      [userByIdKey]: id.toString(),
    }),
  })
  async delete(id: number): Promise<User | null> {
    const user = await this.checker.ensureUserExists(id);
    user.delete();
    return this.checker.ensureExists(
      () => this.userRepository.delete(user),
      failedToDeleteUserException(),
    );
  }
}
