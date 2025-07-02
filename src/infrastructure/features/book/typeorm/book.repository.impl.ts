import { Injectable } from '@nestjs/common';
import { ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BookOrm } from './book.orm-entity';
import { BookRepository } from 'src/domain/book/book.repository';
import { Book } from 'src/domain/book/book.entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import { CategoryOrm } from '../../category/typeorm/category.orm-entity';
import { AuthorOrm } from '../../author/typeorm/author.orm-entity';

@Injectable()
export class BookRepositoryImpl implements BookRepository {
  constructor(
    @InjectRepository(BookOrm)
    private readonly bookRepository: Repository<BookOrm>,
  ) {}

  private toDomain(book: BookOrm): Book {
    return Book.reconstitute({
      id: book.id,
      title: book.title,
      publisher: book.publisher,
      publicationDate: book.publicationDate,
      pageCount: book.pageCount,
      categoryIds: book.categoryIds,
      authorIds: book.authorIds,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      deletedAt: book.deletedAt,
    });
  }

  async findAll(properties: Pagination): Promise<PaginationResult<Book>> {
    const { limit, offset, sortBy, order, searchTerm, page } = properties;

    const [entities, totalItems] = await this.bookRepository.findAndCount({
      take: limit,
      skip: offset,
      order: { [sortBy]: order },
      where: searchTerm
        ? [
            { title: ILike(`%${searchTerm}%`) },
            { publisher: ILike(`%${searchTerm}%`) },
          ]
        : undefined,
      loadRelationIds: {
        relations: ['categories', 'authors'],
        disableMixedMap: true,
      },
    });

    const items: Book[] = entities.map((entity) => this.toDomain(entity));

    return new PaginationResult(items, page, limit, totalItems);
  }

  private async findOrmById(id: number): Promise<BookOrm | null> {
    return this.bookRepository.findOne({ where: { id } });
  }

  async findById(id: number): Promise<Book | null> {
    const foundBook: BookOrm | null = await this.findOrmById(id);
    return foundBook ? this.toDomain(foundBook) : null;
  }

  async findByIds(ids: number[]): Promise<Book[] | []> {
    if (!ids || ids.length === 0) return [];

    const foundOrms: BookOrm[] = await this.bookRepository.find({
      where: { id: In(ids) },
    });

    return foundOrms.map((orm) => this.toDomain(orm));
  }

  async create(book: Book): Promise<Book> {
    const newBook: BookOrm = this.bookRepository.create({
      title: book.title,
      publisher: book.publisher,
      publicationDate: book.publicationDate,
      pageCount: book.pageCount,
      categories: book.categoryIds.map((id) => ({ id }) as CategoryOrm),
      authors: book.authorIds.map((id) => ({ id }) as AuthorOrm),
    });

    const createdBook: BookOrm = await this.bookRepository.save(newBook);

    return Book.reconstitute({
      id: createdBook.id,
      title: createdBook.title,
      publisher: createdBook.publisher,
      publicationDate: createdBook.publicationDate,
      pageCount: createdBook.pageCount,
      categoryIds: createdBook.categoryIds,
      authorIds: createdBook.authorIds,
      createdAt: createdBook.createdAt,
      updatedAt: createdBook.updatedAt,
      deletedAt: createdBook.deletedAt,
    });
  }

  async update(book: Book): Promise<Book | null> {
    const toUpdate: BookOrm | undefined = await this.bookRepository.preload({
      id: book.id!,
      title: book.title,
      publisher: book.publisher,
      publicationDate: book.publicationDate,
      pageCount: book.pageCount,
      categories: book.categoryIds.map((id) => ({ id }) as CategoryOrm),
      authors: book.authorIds.map((id) => ({ id }) as AuthorOrm),
    });
    if (!toUpdate) return null;

    const updatedOrm: BookOrm = await this.bookRepository.save(toUpdate);

    return Book.reconstitute({
      id: updatedOrm.id,
      title: updatedOrm.title,
      publisher: updatedOrm.publisher,
      publicationDate: updatedOrm.publicationDate,
      pageCount: updatedOrm.pageCount,
      categoryIds: updatedOrm.categoryIds,
      authorIds: updatedOrm.authorIds,
      createdAt: updatedOrm.createdAt,
      updatedAt: updatedOrm.updatedAt,
      deletedAt: updatedOrm.deletedAt,
    });
  }

  async delete(book: Book): Promise<Book | null> {
    const existing: BookOrm | null = await this.findOrmById(book.id as number);
    if (!existing) return null;
    const now = new Date();
    existing.deletedAt = now;
    existing.updatedAt = now;
    const deletedOrm = await this.bookRepository.save(existing);
    return Book.reconstitute({
      id: deletedOrm.id,
      title: deletedOrm.title,
      publisher: deletedOrm.publisher,
      publicationDate: deletedOrm.publicationDate,
      pageCount: deletedOrm.pageCount,
      categoryIds: deletedOrm.categoryIds,
      authorIds: deletedOrm.authorIds,
      createdAt: deletedOrm.createdAt,
      updatedAt: deletedOrm.updatedAt,
      deletedAt: deletedOrm.deletedAt,
    });
  }
}
