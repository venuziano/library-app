import { Injectable } from '@nestjs/common';
import { EntityManager, FindManyOptions, ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UserTokenOrm } from './user-token.orm-entity';
import { UserTokenRepository } from 'src/domain/user-token/user-token.repository';
import { UserToken } from 'src/domain/user-token/user-token.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import { TokenType } from 'src/domain/user-token/token-type.enum';

@Injectable()
export class UserTokenRepositoryImpl implements UserTokenRepository {
  constructor(
    @InjectRepository(UserTokenOrm)
    private readonly userTokenRepository: Repository<UserTokenOrm>,
  ) {}

  private toDomain(userToken: UserTokenOrm): UserToken {
    return UserToken.reconstitute({
      id: userToken.id,
      userId: userToken.userId,
      tokenType: userToken.tokenType,
      code: userToken.code,
      expiresAt: userToken.expiresAt,
      verifiedAt: userToken.verifiedAt,
      consumedAt: userToken.consumedAt,
      createdAt: userToken.createdAt,
    });
  }

  async findAll(properties: Pagination): Promise<PaginationResult<UserToken>> {
    const { searchTerm } = properties;

    const query: FindManyOptions<UserTokenOrm> = {
      take: properties.limit,
      skip: properties.offset,
      order: { [properties.sortBy]: properties.order },
      select: [
        'id',
        'userId',
        'tokenType',
        'code',
        'expiresAt',
        'verifiedAt',
        'consumedAt',
        'createdAt',
      ],
      where: searchTerm ? [{ code: ILike(`%${searchTerm}%`) }] : undefined,
    };

    const [entities, totalItems] =
      await this.userTokenRepository.findAndCount(query);

    const items: UserToken[] = entities.map((entity) => this.toDomain(entity));

    return new PaginationResult(
      items,
      properties.page,
      properties.limit,
      totalItems,
    );
  }

  async findById(id: number): Promise<UserToken | null> {
    const foundToken: UserTokenOrm | null =
      await this.userTokenRepository.findOne({ where: { id } });
    return foundToken ? this.toDomain(foundToken) : null;
  }

  async findByUserId(userId: number): Promise<UserToken[]> {
    const foundTokens: UserTokenOrm[] = await this.userTokenRepository.find({
      where: { userId },
    });
    return foundTokens.map((token) => this.toDomain(token));
  }

  async findByCode(code: string): Promise<UserToken | null> {
    const foundToken: UserTokenOrm | null =
      await this.userTokenRepository.findOne({
        where: { code },
      });
    return foundToken ? this.toDomain(foundToken) : null;
  }

  async findByUserIdAndType(
    userId: number,
    tokenType: TokenType,
  ): Promise<UserToken[]> {
    const foundTokens: UserTokenOrm[] = await this.userTokenRepository.find({
      where: { userId, tokenType },
    });
    return foundTokens.map((token) => this.toDomain(token));
  }

  async create(
    userToken: UserToken,
    manager?: EntityManager,
  ): Promise<UserToken> {
    const repository: Repository<UserTokenOrm> = manager
      ? manager.getRepository(UserTokenOrm)
      : this.userTokenRepository;

    const newToken: UserTokenOrm = repository.create({
      userId: userToken.userId,
      tokenType: userToken.tokenType,
      code: userToken.code,
      expiresAt: userToken.expiresAt,
      // verifiedAt: userToken.verifiedAt,
      // consumedAt: userToken.consumedAt,
    });

    const createdToken: UserTokenOrm = await repository.save(newToken);

    return UserToken.reconstitute({
      id: createdToken.id,
      userId: createdToken.userId,
      tokenType: createdToken.tokenType,
      code: createdToken.code,
      expiresAt: createdToken.expiresAt,
      verifiedAt: createdToken.verifiedAt,
      consumedAt: createdToken.consumedAt,
      createdAt: createdToken.createdAt,
    });
  }

  async update(userToken: UserToken): Promise<UserToken | null> {
    const toUpdate: UserTokenOrm | undefined =
      await this.userTokenRepository.preload({
        id: userToken.id!,
        userId: userToken.userId,
        tokenType: userToken.tokenType,
        code: userToken.code,
        expiresAt: userToken.expiresAt,
        // verifiedAt: userToken.verifiedAt,
        // consumedAt: userToken.consumedAt,
      });

    if (!toUpdate) return null;

    const updatedOrm: UserTokenOrm =
      await this.userTokenRepository.save(toUpdate);

    return UserToken.reconstitute({
      id: updatedOrm.id,
      userId: updatedOrm.userId,
      tokenType: updatedOrm.tokenType,
      code: updatedOrm.code,
      expiresAt: updatedOrm.expiresAt,
      verifiedAt: updatedOrm.verifiedAt,
      consumedAt: updatedOrm.consumedAt,
      createdAt: updatedOrm.createdAt,
    });
  }

  async delete(userToken: UserToken): Promise<UserToken | null> {
    const existing: UserTokenOrm | null =
      await this.userTokenRepository.findOne({ where: { id: userToken.id } });
    if (!existing) return null;

    await this.userTokenRepository.remove(existing);

    return UserToken.reconstitute({
      id: userToken.id!,
      userId: userToken.userId,
      tokenType: userToken.tokenType,
      code: userToken.code,
      expiresAt: userToken.expiresAt,
      verifiedAt: userToken.verifiedAt,
      consumedAt: userToken.consumedAt,
      createdAt: userToken.createdAt!,
    });
  }
}
