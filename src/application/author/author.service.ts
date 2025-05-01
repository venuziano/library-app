import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Author } from '../../domain/author/author.entity';
import { AuthorRepository } from '../../domain/author/author.repository';
import { CreateAuthorDto } from './dtos/create-author.dto';

@Injectable()
export class AuthorService {
  constructor(
    @Inject('AuthorRepository')
    private readonly authorRepository: AuthorRepository,
  ) {}

  findAll(): Promise<Author[]> {
    return this.authorRepository.findAll();
  }

  findById(id: number): Promise<Author | null> {
    return this.authorRepository.findById(id);
  }

  async create(dto: CreateAuthorDto): Promise<Author> {
    const existing: Author | null = await this.authorRepository.findByFirstname(
      dto.firstname,
    );
    if (existing) {
      throw new ConflictException('Author already exists');
    }

    const author = Author.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
    });
    return this.authorRepository.create(author);
  }
}
