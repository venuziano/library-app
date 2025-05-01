import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { Author } from './author.entity';

export interface AuthorRepository {
  findAll(properties: Pagination): Promise<PaginationResult<Author>>;
  findById(id: number): Promise<Author | null>;
  findByFirstname(firstname: string): Promise<Author | null>;
  create(author: Author): Promise<Author>;
}
