import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { Author } from './author.entity';

export interface AuthorRepository {
  findAll(properties: Pagination): Promise<PaginationResult<Author>>;
  findById(id: number): Promise<Author | null>;
  findByIds(ids: number[]): Promise<Author[] | []>;
  create(author: Author): Promise<Author>;
  update(author: Author): Promise<Author | null>;
  delete(author: Author): Promise<Author | null>;
  bookCountByAuthor(author: Author): Promise<number>;
}
