import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { AuthorRepository } from '../../../domain/author/author.repository';
import { Author } from '../../../domain/author/author.entity';
import { AuthorOrm } from './author.orm-entity';

@Injectable()
export class AuthorRepositoryImpl implements AuthorRepository {
  constructor(
    @InjectRepository(AuthorOrm)
    private readonly authorRepository: Repository<AuthorOrm>,
  ) {}

  private toDomain(author: AuthorOrm): Author {
    return Author.reconstitute({
      id: author.id,
      firstname: author.firstname,
      lastname: author.lastname,
      createdAt: author.createdAt,
      updatedAt: author.updatedAt,
      deletedAt: author.deletedAt,
    });
  }

  async findAll(): Promise<Author[]> {
    const authors = await this.authorRepository.find();
    return authors.map((author) => this.toDomain(author));
  }

  async findById(id: number): Promise<Author | null> {
    const foundAuthor = await this.authorRepository.findOne({ where: { id } });
    return foundAuthor ? this.toDomain(foundAuthor) : null;
  }

  async create(author: Author): Promise<Author> {
    const newAuthor = this.authorRepository.create({
      firstname: author.firstname,
      lastname: author.lastname,
    });
    const createdAuthor = await this.authorRepository.save(newAuthor);
    // return this.toDomain(createdAuthor);
    return Author.reconstitute({
      id: createdAuthor.id,
      firstname: createdAuthor.firstname,
      lastname: createdAuthor.lastname,
      createdAt: createdAuthor.createdAt,
      updatedAt: createdAuthor.updatedAt,
      deletedAt: createdAuthor.deletedAt,
    });
  }
}
