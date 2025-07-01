import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { plainToClass } from 'class-transformer';

import { CategoryGQL, PaginatedCategoriesGQL } from './types/category.gql';
import { PaginationGQL } from 'src/infrastructure/graphql/shared/pagination.input.gql';
import { toPaginatedGQL } from 'src/infrastructure/graphql/shared/pagination.output.gql';
import { CategoryService } from 'src/application/category/category.service';
import { CreateCategoryInput } from './types/create-category.input';
import { UpdateCategoryInput } from './types/update-category.input';
import { PatchCategoryInput } from './types/patch-category.input';

@Resolver(() => CategoryGQL)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => PaginatedCategoriesGQL, { name: 'getAllCategories' })
  async categories(
    @Args() pagination: PaginationGQL,
  ): Promise<PaginatedCategoriesGQL> {
    const categories = await this.categoryService.findAll(pagination);
    return toPaginatedGQL(categories, (Category) =>
      plainToClass(CategoryGQL, Category),
    );
  }

  @Query(() => CategoryGQL, { name: 'getCategoryById', nullable: true })
  getById(@Args('id', { type: () => ID }) id: number) {
    return this.categoryService.findById(id);
  }

  @Mutation(() => CategoryGQL, { name: 'createCategory' })
  createCategory(@Args('input') input: CreateCategoryInput) {
    return this.categoryService.create(input);
  }

  @Mutation(() => CategoryGQL, { name: 'updateCategory' })
  updateCategory(@Args('input') input: UpdateCategoryInput) {
    return this.categoryService.update(input);
  }

  @Mutation(() => CategoryGQL, { name: 'patchCategory' })
  patchCategory(@Args('input') input: PatchCategoryInput) {
    return this.categoryService.patch(input);
  }

  @Mutation(() => CategoryGQL, { name: 'deleteCategory' })
  deleteCategory(@Args('id', { type: () => Int }) id: number) {
    return this.categoryService.delete(id);
  }
}
