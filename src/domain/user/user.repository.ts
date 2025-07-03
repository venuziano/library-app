import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { User } from './user.entity';


export interface UserRepository {
  findAll(properties: Pagination): Promise<PaginationResult<User>>;
  findById(id: number): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User | null>;
  delete(user: User): Promise<User | null>;
}
