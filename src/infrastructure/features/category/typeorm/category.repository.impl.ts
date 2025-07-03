import { Injectable } from '@nestjs/common';
import { FindManyOptions, ILike, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CategoryOrm } from './category.orm-entity';
import {
  Pagination,
  PaginationResult,
} from 'src/domain/pagination/pagination.entity';
import { CategoryRepository } from 'src/domain/category/category.repository';
import { Category } from 'src/domain/category/category.entity';
import { BookOrm } from '../../book/typeorm/book.orm-entity';

@Injectable()
export class CategoryRepositoryImpl implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrm)
    private readonly categoryRepository: Repository<CategoryOrm>,
  ) {}

  private toDomain(category: CategoryOrm): Category {
    return Category.reconstitute({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      deletedAt: category.deletedAt,
    });
  }

  async findAll(properties: Pagination): Promise<PaginationResult<Category>> {
    const { searchTerm } = properties;

    const query: FindManyOptions<CategoryOrm> = {
      take: properties.limit,
      skip: properties.offset,
      order: { [properties.sortBy]: properties.order },
      select: ['id', 'name', 'createdAt', 'updatedAt'],
      where: searchTerm ? [{ name: ILike(`%${searchTerm}%`) }] : undefined,
    };

    const [entities, totalItems] =
      await this.categoryRepository.findAndCount(query);

    const items: Category[] = entities.map((entity) => this.toDomain(entity));

    return new PaginationResult(
      items,
      properties.page,
      properties.limit,
      totalItems,
    );
  }

  private async findOrmById(id: number): Promise<CategoryOrm | null> {
    return this.categoryRepository.findOne({ where: { id } });
  }

  async findById(id: number): Promise<Category | null> {
    const foundCategory: CategoryOrm | null = await this.findOrmById(id);
    return foundCategory ? this.toDomain(foundCategory) : null;
  }

  async findByIds(ids: number[]): Promise<Category[] | []> {
    if (!ids || ids.length === 0) return [];

    const foundOrms: CategoryOrm[] = await this.categoryRepository.find({
      where: { id: In(ids) },
    });

    return foundOrms.map((orm) => this.toDomain(orm));
  }

  async create(category: Category): Promise<Category> {
    const newCategory: CategoryOrm = this.categoryRepository.create({
      name: category.name,
    });

    const createdCategory: CategoryOrm =
      await this.categoryRepository.save(newCategory);

    return Category.reconstitute({
      id: createdCategory.id,
      name: createdCategory.name,
      createdAt: createdCategory.createdAt,
      updatedAt: createdCategory.updatedAt,
      deletedAt: createdCategory.deletedAt,
    });
  }

  async update(category: Category): Promise<Category | null> {
    const toUpdate: CategoryOrm | undefined =
      await this.categoryRepository.preload({
        id: category.id!,
        name: category.name,
      });

    if (!toUpdate) return null;

    const updatedOrm: CategoryOrm =
      await this.categoryRepository.save(toUpdate);

    return Category.reconstitute({
      id: updatedOrm.id,
      name: updatedOrm.name,
      createdAt: updatedOrm.createdAt,
      updatedAt: updatedOrm.updatedAt,
      deletedAt: updatedOrm.deletedAt,
    });
  }

  async bookCountByCategory(category: Category): Promise<number> {
    return this.categoryRepository.manager
      .createQueryBuilder(BookOrm, 'book')
      .innerJoin('book.categories', 'category', 'category.id = :id', {
        id: category.id,
      })
      .getCount();
  }

  async delete(category: Category): Promise<Category | null> {
    const existing: CategoryOrm | null = await this.findOrmById(
      category.id as number,
    );
    if (!existing) return null;

    const now = new Date();
    existing.deletedAt = now;
    existing.updatedAt = now;

    const deletedOrm = await this.categoryRepository.save(existing);

    return Category.reconstitute({
      id: deletedOrm.id,
      name: deletedOrm.name,
      createdAt: deletedOrm.createdAt,
      updatedAt: deletedOrm.updatedAt,
      deletedAt: deletedOrm.deletedAt,
    });
  }
}
