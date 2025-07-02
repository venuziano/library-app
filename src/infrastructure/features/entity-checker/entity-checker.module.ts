import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorRepositoryImpl } from '../author/typeorm/author.repository.impl';
import { AuthorOrm } from '../author/typeorm/author.orm-entity';
import { CategoryOrm } from '../category/typeorm/category.orm-entity';
import { CategoryRepositoryImpl } from '../category/typeorm/category.repository.impl';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { BookOrm } from '../book/typeorm/book.orm-entity';
import { BookRepositoryImpl } from '../book/typeorm/book.repository.impl';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuthorOrm, CategoryOrm, BookOrm])],
  providers: [
    { provide: 'AuthorRepository', useClass: AuthorRepositoryImpl },
    { provide: 'CategoryRepository', useClass: CategoryRepositoryImpl },
    { provide: 'BookRepository', useClass: BookRepositoryImpl },
    EntityChecker,
  ],
  exports: [
    'AuthorRepository',
    'CategoryRepository',
    'BookRepository',
    EntityChecker,
  ],
})
export class SharedModule {}
