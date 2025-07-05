import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryOrm } from './typeorm/category.orm-entity';
import { CategoryRepositoryImpl } from './typeorm/category.repository.impl';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { CategoryResolver } from './graphql/category.resolver';
import { CategoryService } from 'src/application/category/category.service';
import { CATEGORY_REPOSITORY_TOKEN } from 'src/domain/category/category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrm])],
  providers: [
    CategoryService,
    { provide: CATEGORY_REPOSITORY_TOKEN, useClass: CategoryRepositoryImpl },
    CategoryResolver,
    EntityChecker,
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
