import { EntityManager } from 'typeorm';

import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { User } from './user.entity';

export const USER_REPOSITORY_TOKEN = 'UserRepository';

export interface UserRepository {
  findAll(properties: Pagination): Promise<PaginationResult<User>>;
  findById(id: number): Promise<User | null>;
  create(user: User, manager?: EntityManager): Promise<User>;
  update(user: User): Promise<User | null>;
  delete(user: User): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}
