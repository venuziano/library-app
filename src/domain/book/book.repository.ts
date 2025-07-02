import { Pagination, PaginationResult } from '../pagination/pagination.entity';
import { Book } from './book.entity';

export interface BookRepository {
  findAll(properties: Pagination): Promise<PaginationResult<Book>>;
  findById(id: number): Promise<Book | null>;
  create(book: Book): Promise<Book>;
  update(book: Book): Promise<Book | null>;
  delete(book: Book): Promise<Book | null>;
}
