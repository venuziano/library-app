import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { Category } from './category.entity';

export interface CategoryRepository {
  findAll(properties: Pagination): Promise<PaginationResult<Category>>;
  findById(id: number): Promise<Category | null>;
  findByIds(ids: number[]): Promise<Category[] | []>;
  create(Category: Category): Promise<Category>;
  update(Category: Category): Promise<Category | null>;
  delete(Category: Category): Promise<Category | null>;
}
