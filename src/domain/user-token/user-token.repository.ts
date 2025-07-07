import { UserToken } from './user-token.entity';
import { TokenType } from './token-type.enum';
import { EntityManager } from 'typeorm';

export const USER_TOKEN_REPOSITORY_TOKEN = 'UserTokenRepository';

export interface UserTokenRepository {
  // findAll(properties: Pagination): Promise<PaginationResult<UserToken>>;
  findById(id: number): Promise<UserToken | null>;
  // findByUserId(userId: number): Promise<UserToken[]>;
  findByCode(code: string): Promise<UserToken | null>;
  findByUserIdAndType(
    userId: number,
    tokenType: TokenType,
  ): Promise<UserToken[]>;
  create(userToken: UserToken, manager?: EntityManager): Promise<UserToken>;
  update(userToken: UserToken): Promise<UserToken | null>;
  delete(userToken: UserToken): Promise<UserToken | null>;
}
