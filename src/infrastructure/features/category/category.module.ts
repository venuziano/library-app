import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryOrm } from './typeorm/category.orm-entity';
import { CategoryRepositoryImpl } from './typeorm/category.repository.impl';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { CategoryResolver } from './graphql/category.resolver';
import { CategoryService } from 'src/application/category/category.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryOrm])],
  providers: [
    CategoryService,
    { provide: 'CategoryRepository', useClass: CategoryRepositoryImpl },
    CategoryResolver,
    EntityChecker,
  ],
})
export class CategoryModule {}
