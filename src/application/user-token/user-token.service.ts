import { Injectable, Inject } from '@nestjs/common';
import { UserToken } from '../../domain/user-token/user-token.entity';
import { UserTokenRepository } from '../../domain/user-token/user-token.repository';
import { CreateUserTokenDto } from './dtos/create-user-token.dto';
import { UpdateUserTokenDto } from './dtos/update-user-token.dto';
import { PatchUserTokenDto } from './dtos/patch-user-token.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import {
  Pagination,
  PaginationResult,
} from '../../domain/pagination/pagination.entity';
import { TokenType } from '../../domain/user-token/token-type.enum';
import { EntityManager } from 'typeorm';

@Injectable()
export class UserTokenService {
  constructor(
    @Inject('UserTokenRepository')
    private readonly userTokenRepository: UserTokenRepository,
  ) {}

  async findAll(
    properties: PaginationDto,
  ): Promise<PaginationResult<UserToken>> {
    const { limit, page, sort, order, searchTerm } = properties;
    const pagination: Pagination = Pagination.of(
      limit,
      page,
      sort,
      order,
      searchTerm,
    );
    return this.userTokenRepository.findAll(pagination);
  }

  async findById(id: number): Promise<UserToken | null> {
    return this.userTokenRepository.findById(id);
  }

  async findByUserId(userId: number): Promise<UserToken[]> {
    return this.userTokenRepository.findByUserId(userId);
  }

  async findByCode(code: string): Promise<UserToken | null> {
    return this.userTokenRepository.findByCode(code);
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
    const existingToken = await this.userTokenRepository.findById(dto.id);
    if (!existingToken) {
      return null;
    }

    if (dto.userId !== undefined) existingToken.userId = dto.userId;
    if (dto.tokenType !== undefined) existingToken.tokenType = dto.tokenType;
    if (dto.code !== undefined) existingToken.code = dto.code;

    return this.userTokenRepository.update(existingToken);
  }

  async patch(dto: PatchUserTokenDto): Promise<UserToken | null> {
    const existingToken = await this.userTokenRepository.findById(dto.id);
    if (!existingToken) {
      return null;
    }

    if (dto.userId !== undefined) existingToken.userId = dto.userId;
    if (dto.tokenType !== undefined) existingToken.tokenType = dto.tokenType;
    if (dto.code !== undefined) existingToken.code = dto.code;

    return this.userTokenRepository.update(existingToken);
  }

  async delete(id: number): Promise<UserToken | null> {
    const existingToken = await this.userTokenRepository.findById(id);
    if (!existingToken) {
      return null;
    }
    return this.userTokenRepository.delete(existingToken);
  }
}
