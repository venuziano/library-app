import { Injectable, Inject, ConflictException } from '@nestjs/common';

import { Author } from '../../domain/author/author.entity';
import { AuthorRepository } from '../../domain/author/author.repository';
import { CreateAuthorDto } from './dtos/create-author.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';

@Injectable()
export class AuthorService {
  constructor(
    @Inject('AuthorRepository')
    private readonly authorRepository: AuthorRepository,
  ) {}

  findAll(properties: PaginationDto): Promise<PaginationResult<Author>> {
    const { limit, page, sort, order, searchTerm } = properties;
    const pagination: Pagination = Pagination.of(
      limit,
      page,
      sort,
      order,
      searchTerm,
    );
    return this.authorRepository.findAll(pagination);
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
