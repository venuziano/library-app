import { Injectable, Inject } from '@nestjs/common';

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
  categoryByIdKey,
  categoryCacheKey,
} from 'src/infrastructure/cache/cache-keys';
import { EntityChecker } from '../shared/entity-checker.service';
import { CategoryRepository } from 'src/domain/category/category.repository';
import { Category } from 'src/domain/category/category.entity';
import { failedToDeleteCategoryException } from './category-exceptions';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { PatchCategoryDto } from './dtos/patch-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @Inject('CategoryRepository')
    private readonly categoryRepository: CategoryRepository,
    public readonly cache: MultiLevelCacheService,
    private readonly checker: EntityChecker,
  ) {}

  @Cacheable({ namespace: categoryCacheKey })
  findAll(properties: PaginationDto): Promise<PaginationResult<Category>> {
    const { limit, page, sort, order, searchTerm } = properties;
    const pagination: Pagination = Pagination.of(
      limit,
      page,
      sort,
      order,
      searchTerm,
    );
    return this.categoryRepository.findAll(pagination);
  }

  @Cacheable({ namespace: categoryByIdKey })
  async findById(id: number): Promise<Category> {
    return this.checker.ensureCategoryExists(id);
  }

  async findByIds(ids: number[]): Promise<Category[]> {
    if (!ids || ids.length === 0) return [];
    return this.categoryRepository.findByIds(ids);
  }

  @InvalidateCache({ namespace: categoryCacheKey })
  async create(dto: CreateCategoryDto): Promise<Category> {
    const category: Category = Category.create({
      name: dto.name,
    });
    return this.categoryRepository.create(category);
  }

  @InvalidateCache({
    namespace: [categoryCacheKey],
    keyGenerator: (dto: UpdateCategoryDto) => ({
      [categoryByIdKey]: dto.id.toString(),
    }),
  })
  async update(dto: UpdateCategoryDto): Promise<Category | null> {
    const categoryToUpdate = await this.checker.ensureCategoryExists(dto.id);
    categoryToUpdate.update(dto.name);
    return this.categoryRepository.update(categoryToUpdate);
  }

  @InvalidateCache({
    namespace: [categoryCacheKey],
    keyGenerator: (dto: PatchCategoryDto) => ({
      [categoryByIdKey]: dto.id.toString(),
    }),
  })
  async patch(dto: PatchCategoryDto): Promise<Category | null> {
    const category = await this.checker.ensureCategoryExists(dto.id);
    category.patch(dto);
    return this.categoryRepository.update(category);
  }

  @InvalidateCache({
    namespace: [categoryCacheKey],
    keyGenerator: (id: number) => ({
      [categoryByIdKey]: id.toString(),
    }),
  })
  async delete(id: number): Promise<Category | null> {
    const category = await this.checker.ensureCategoryExists(id);
    const bookCount =
      await this.categoryRepository.bookCountByCategory(category);
    if (bookCount > 0) {
      throw new Error(
        `Cannot delete category ${id} — still bound to ${bookCount} book(s).`,
      );
    }
    category.delete();

    return this.checker.ensureExists(
      () => this.categoryRepository.delete(category),
      failedToDeleteCategoryException(),
    );
  }
}
