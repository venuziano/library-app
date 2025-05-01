import { Author } from './author.entity';

export interface AuthorRepository {
  findAll(): Promise<Author[]>;
  findById(id: number): Promise<Author | null>;
  findByFirstname(firstname: string): Promise<Author | null>;
  create(author: Author): Promise<Author>;
}
