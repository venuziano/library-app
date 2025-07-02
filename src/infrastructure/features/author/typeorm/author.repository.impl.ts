import { Injectable } from '@nestjs/common';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
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
    const { searchTerm } = properties;

    const query: FindManyOptions<AuthorOrm> = {
      take: properties.limit,
      skip: properties.offset,
      order: { [properties.sortBy]: properties.order },
      select: ['id', 'firstname', 'lastname', 'createdAt', 'updatedAt'],
      where: searchTerm
        ? [
            { firstname: ILike(`%${searchTerm}%`) },
            { lastname: ILike(`%${searchTerm}%`) },
          ]
        : undefined,
    };

    const [entities, totalItems] =
      await this.authorRepository.findAndCount(query);

    const items: Author[] = entities.map((entity) => this.toDomain(entity));

    return new PaginationResult(
      items,
      properties.page,
      properties.limit,
      totalItems,
    );
  }

  private async findOrmById(id: number): Promise<AuthorOrm | null> {
    return this.authorRepository.findOne({ where: { id } });
  }

  async findById(id: number): Promise<Author | null> {
    const foundAuthor: AuthorOrm | null = await this.findOrmById(id);
    return foundAuthor ? this.toDomain(foundAuthor) : null;
  }

  async findByIds(ids: number[]): Promise<Author[] | []> {
    if (!ids || ids.length === 0) return [];

    const foundOrms: AuthorOrm[] = await this.authorRepository.find({
      where: { id: In(ids) },
    });

    return foundOrms.map((orm) => this.toDomain(orm));
  }

  async create(author: Author): Promise<Author> {
    const newAuthor: AuthorOrm = this.authorRepository.create({
      firstname: author.firstname,
      lastname: author.lastname,
    });

    const createdAuthor: AuthorOrm =
      await this.authorRepository.save(newAuthor);

    return Author.reconstitute({
      id: createdAuthor.id,
      firstname: createdAuthor.firstname,
      lastname: createdAuthor.lastname,
      createdAt: createdAuthor.createdAt,
      updatedAt: createdAuthor.updatedAt,
      deletedAt: createdAuthor.deletedAt,
    });
  }

  async update(author: Author): Promise<Author | null> {
    const toUpdate: AuthorOrm | undefined = await this.authorRepository.preload(
      {
        id: author.id!,
        firstname: author.firstname,
        lastname: author.lastname,
      },
    );

    if (!toUpdate) return null;

    const updatedOrm: AuthorOrm = await this.authorRepository.save(toUpdate);

    return Author.reconstitute({
      id: updatedOrm.id,
      firstname: updatedOrm.firstname,
      lastname: updatedOrm.lastname,
      createdAt: updatedOrm.createdAt,
      updatedAt: updatedOrm.updatedAt,
      deletedAt: updatedOrm.deletedAt,
    });
  }

  async delete(author: Author): Promise<Author | null> {
    const existing: AuthorOrm | null = await this.findOrmById(
      author.id as number,
    );
    if (!existing) return null;

    const now = new Date();
    existing.deletedAt = now;
    existing.updatedAt = now;

    const deletedOrm = await this.authorRepository.save(existing);

    return Author.reconstitute({
      id: deletedOrm.id,
      firstname: deletedOrm.firstname,
      lastname: deletedOrm.lastname,
      createdAt: deletedOrm.createdAt,
      updatedAt: deletedOrm.updatedAt,
      deletedAt: deletedOrm.deletedAt,
    });
  }
}
