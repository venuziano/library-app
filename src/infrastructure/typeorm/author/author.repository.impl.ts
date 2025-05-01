import { Injectable } from '@nestjs/common';
import { FindManyOptions, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { AuthorOrm } from './author.orm-entity';
import { AuthorRepository } from 'src/domain/author/author.repository';
import { Author } from 'src/domain/author/author.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';

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

  async findAll(properties: Pagination): Promise<PaginationResult<Author>> {
    const query: FindManyOptions<AuthorOrm> = {
      take: properties.limit,
      skip: properties.offset,
      order: { id: 'DESC' },
      select: ['id', 'firstname', 'lastname', 'createdAt', 'updatedAt'],
    };

    const [entities, totalItems] =
      await this.authorRepository.findAndCount(query);

    const items = entities.map((entity) => this.toDomain(entity));

    return new PaginationResult(
      items,
      properties.page,
      properties.limit,
      totalItems,
    );
  }

  async findById(id: number): Promise<Author | null> {
    const foundAuthor = await this.authorRepository.findOne({ where: { id } });
    return foundAuthor ? this.toDomain(foundAuthor) : null;
  }

  async findByFirstname(firstname: string): Promise<Author | null> {
    const foundAuthor = await this.authorRepository.findOne({
      where: { firstname },
    });
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
