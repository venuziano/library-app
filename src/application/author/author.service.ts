import { Injectable, Inject } from '@nestjs/common';

import { Author } from '../../domain/author/author.entity';
import { AuthorRepository } from '../../domain/author/author.repository';
import { CreateAuthorDto } from './dtos/create-author.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import {
  Cacheable,
  InvalidateCache,
} from 'src/infrastructure/cache/cache.decorator';
import { MultiLevelCacheService } from 'src/infrastructure/cache/multi-level-cache.service';
import {
  authorByIdKey,
  authorCacheKey,
} from 'src/infrastructure/cache/cache-keys';
import { UpdateAuthorDto } from './dtos/update-author.dto';
import { EntityChecker } from '../shared/entity-checker.service';
import {
  authorNotFoundException,
  failedToDeleteAuthorException,
} from './author-exceptions';

@Injectable()
export class AuthorService {
  constructor(
    @Inject('AuthorRepository')
    private readonly authorRepository: AuthorRepository,
    public readonly cache: MultiLevelCacheService,
    private readonly checker: EntityChecker,
  ) {}

  @Cacheable({ namespace: authorCacheKey })
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

  @Cacheable({ namespace: authorByIdKey })
  async findById(id: number): Promise<Author> {
    return this.checker.ensureExists(
      () => this.authorRepository.findById(id),
      authorNotFoundException(),
    );
  }

  @InvalidateCache({ namespace: authorCacheKey })
  async create(dto: CreateAuthorDto): Promise<Author> {
    const author: Author = Author.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
    });
    return this.authorRepository.create(author);
  }

  @InvalidateCache({
    namespace: [authorCacheKey],
    keyGenerator: (dto: UpdateAuthorDto) => ({
      // only invalidate the single-entity caches under authorByIdKey
      [authorByIdKey]: dto.id.toString(),
      // you could also target specific list caches by key, but here
      // we let the wildcard invalidator clear authorCacheKey:*
      // so no need to specify authorCacheKey here
    }),
  })
  async update(dto: UpdateAuthorDto): Promise<Author | null> {
    const authorToUpdate = await this.checker.ensureExists(
      () => this.authorRepository.findById(dto.id),
      authorNotFoundException(),
    );
    const existing = await this.authorRepository.create(authorToUpdate);
    existing.update(dto.firstname!, dto.lastname!);
    return this.authorRepository.update(existing);
  }

  @InvalidateCache({
    namespace: [authorCacheKey],
    keyGenerator: (id: number) => ({
      [authorByIdKey]: id.toString(),
    }),
  })
  async delete(id: number): Promise<Author | null> {
    const author = await this.checker.ensureExists(
      () => this.authorRepository.findById(id),
      authorNotFoundException(),
    );

    author.delete();

    return this.checker.ensureExists(
      () => this.authorRepository.delete(author),
      failedToDeleteAuthorException(),
    );
  }
}
