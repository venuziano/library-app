import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { Category } from './category.entity';

export const CATEGORY_REPOSITORY_TOKEN = 'CategoryRepository';

export interface CategoryRepository {
  findAll(properties: Pagination): Promise<PaginationResult<Category>>;
  findById(id: number): Promise<Category | null>;
  findByIds(ids: number[]): Promise<Category[] | []>;
  create(category: Category): Promise<Category>;
  update(category: Category): Promise<Category | null>;
  delete(category: Category): Promise<Category | null>;
  bookCountByCategory(category: Category): Promise<number>;
}
