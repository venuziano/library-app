import { Injectable, Inject } from '@nestjs/common';
import { Author } from '../../domain/author/author.entity';
import { AuthorRepository } from '../../domain/author/author.repository';
import { CreateAuthorDto } from './dtos/create-author.dto';

@Injectable()
export class AuthorService {
  constructor(
    @Inject('AuthorRepository')
    private readonly repo: AuthorRepository,
  ) {}

  findAll(): Promise<Author[]> {
    return this.repo.findAll();
  }

  findById(id: number): Promise<Author | null> {
    return this.repo.findById(id);
  }

  async create(dto: CreateAuthorDto): Promise<Author> {
    const author = Author.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
    });
    return this.repo.create(author);
  }
}
