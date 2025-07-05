import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookOrm } from './typeorm/book.orm-entity';
import { BookService } from 'src/application/book/book.service';
import { BookRepositoryImpl } from './typeorm/book.repository.impl';
import { BookResolver } from './graphql/book.resolver';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { CategoryLoader } from 'src/infrastructure/graphql/loaders/category.loader';
import { AuthorLoader } from 'src/infrastructure/graphql/loaders/author.loader';
import { CategoryModule } from '../category/category.module';
import { AuthorModule } from '../author/author.module';
import { BOOK_REPOSITORY_TOKEN } from 'src/domain/book/book.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BookOrm]), CategoryModule, AuthorModule],
  providers: [
    BookService,
    { provide: BOOK_REPOSITORY_TOKEN, useClass: BookRepositoryImpl },
    BookResolver,
    EntityChecker,
    CategoryLoader,
    AuthorLoader,
  ],
})
export class BookModule {}
