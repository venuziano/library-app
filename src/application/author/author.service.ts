import { Injectable, Inject } from '@nestjs/common';

import { Author } from '../../domain/author/author.entity';
import {
  AUTHOR_REPOSITORY_TOKEN,
  AuthorRepository,
} from '../../domain/author/author.repository';
import { CreateAuthorDto } from './dtos/create-author.dto';
import { PaginationDto } from '../pagination/pagination.dto';
import {
  Pagination,
  PaginationResult,
} from '../../domain/pagination/pagination.entity';
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
import { failedToDeleteAuthorException } from './author-exceptions';
import { PatchAuthorDto } from './dtos/patch-author.dto';

@Injectable()
export class AuthorService {
  constructor(
    @Inject(AUTHOR_REPOSITORY_TOKEN)
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
    return this.checker.ensureAuthorExists(id);
  }

  async findByIds(ids: number[]): Promise<Author[]> {
    if (!ids || ids.length === 0) return [];
    return this.authorRepository.findByIds(ids);
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
    const authorToUpdate = await this.checker.ensureAuthorExists(dto.id);
    authorToUpdate.update(dto.firstname, dto.lastname);
    return this.authorRepository.update(authorToUpdate);
  }

  @InvalidateCache({
    namespace: [authorCacheKey],
    keyGenerator: (dto: PatchAuthorDto) => ({
      [authorByIdKey]: dto.id.toString(),
    }),
  })
  async patch(dto: PatchAuthorDto): Promise<Author | null> {
    const author = await this.checker.ensureAuthorExists(dto.id);
    author.patch(dto);
    return this.authorRepository.update(author);
  }

  @InvalidateCache({
    namespace: [authorCacheKey],
    keyGenerator: (id: number) => ({
      [authorByIdKey]: id.toString(),
    }),
  })
  async delete(id: number): Promise<Author | null> {
    const author = await this.checker.ensureAuthorExists(id);
    const bookCount = await this.authorRepository.bookCountByAuthor(author);
    if (bookCount > 0) {
      throw new Error(
        `Cannot delete author ${id} — still bound to ${bookCount} book(s).`,
      );
    }
    author.delete();
    return this.checker.ensureExists(
      () => this.authorRepository.delete(author),
      failedToDeleteAuthorException(),
    );
  }
}
