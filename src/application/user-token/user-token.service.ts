import { Injectable, Inject } from '@nestjs/common';
import { UserToken } from '../../domain/user-token/user-token.entity';
import {
  USER_TOKEN_REPOSITORY_TOKEN,
  UserTokenRepository,
} from '../../domain/user-token/user-token.repository';
import { CreateUserTokenDto } from './dtos/create-user-token.dto';
import { UpdateUserTokenDto } from './dtos/update-user-token.dto';
// import { PatchUserTokenDto } from './dtos/patch-user-token.dto';
// import { PaginationDto } from '../pagination/pagination.dto';
// import {
//   Pagination,
//   PaginationResult,
// } from '../../domain/pagination/pagination.entity';
import { TokenType } from '../../domain/user-token/token-type.enum';
import { EntityManager } from 'typeorm';
import { EntityChecker } from '../shared/entity-checker.service';
import { userTokenNotFoundException } from './user-token-exceptions';

@Injectable()
export class UserTokenService {
  constructor(
    @Inject(USER_TOKEN_REPOSITORY_TOKEN)
    private readonly userTokenRepository: UserTokenRepository,
    private readonly checker: EntityChecker,
  ) {}

  // async findAll(
  //   properties: PaginationDto,
  // ): Promise<PaginationResult<UserToken>> {
  //   const { limit, page, sort, order, searchTerm } = properties;
  //   const pagination: Pagination = Pagination.of(
  //     limit,
  //     page,
  //     sort,
  //     order,
  //     searchTerm,
  //   );
  //   return this.userTokenRepository.findAll(pagination);
  // }

  // async findById(id: number): Promise<UserToken | null> {
  //   return this.userTokenRepository.findById(id);
  // }

  // async findByUserId(userId: number): Promise<UserToken[]> {
  //   return this.userTokenRepository.findByUserId(userId);
  // }

  async findByCode(code: string): Promise<UserToken | null> {
    return this.checker.ensureExists(
      () => this.userTokenRepository.findByCode(code),
      userTokenNotFoundException(),
    );
  }

  async findByUserIdAndType(
    userId: number,
    tokenType: TokenType,
  ): Promise<UserToken[]> {
    return this.userTokenRepository.findByUserIdAndType(userId, tokenType);
  }

  async create(
    dto: CreateUserTokenDto,
    manager?: EntityManager,
  ): Promise<UserToken> {
    const userToken: UserToken = UserToken.create({
      userId: dto.userId,
      tokenType: dto.tokenType,
      code: dto.code,
    });
    return this.userTokenRepository.create(userToken, manager);
  }

  async update(dto: UpdateUserTokenDto): Promise<UserToken | null> {
    const existingToken: UserToken = await this.checker.ensureUserTokenExists(
      dto.id,
    );
    if (dto.userId !== undefined) existingToken.userId = dto.userId;
    if (dto.tokenType !== undefined) existingToken.tokenType = dto.tokenType;
    if (dto.code !== undefined) existingToken.code = dto.code;
    if (dto.consumedAt !== undefined) existingToken.consumedAt = dto.consumedAt;

    return this.userTokenRepository.update(existingToken);
  }

  // async patch(dto: PatchUserTokenDto): Promise<UserToken | null> {
  //   const existingToken = await this.userTokenRepository.findById(dto.id);
  //   if (!existingToken) {
  //     return null;
  //   }

  //   if (dto.userId !== undefined) existingToken.userId = dto.userId;
  //   if (dto.tokenType !== undefined) existingToken.tokenType = dto.tokenType;
  //   if (dto.code !== undefined) existingToken.code = dto.code;

  //   return this.userTokenRepository.update(existingToken);
  // }

  async delete(id: number): Promise<UserToken | null> {
    const existingToken: UserToken =
      await this.checker.ensureUserTokenExists(id);
    return this.userTokenRepository.delete(existingToken);
  }
}
