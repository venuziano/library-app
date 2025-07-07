import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthorRepositoryImpl } from '../author/typeorm/author.repository.impl';
import { AuthorOrm } from '../author/typeorm/author.orm-entity';
import { CategoryOrm } from '../category/typeorm/category.orm-entity';
import { CategoryRepositoryImpl } from '../category/typeorm/category.repository.impl';
import { EntityChecker } from 'src/application/shared/entity-checker.service';
import { BookOrm } from '../book/typeorm/book.orm-entity';
import { BookRepositoryImpl } from '../book/typeorm/book.repository.impl';
import { UserRepositoryImpl } from '../user/typeorm/user.repository.impl';
import { UserOrm } from '../user/typeorm/user.orm-entity';
import { UserTokenOrm } from '../user-token/typeorm/user-token.orm-entity';
import { UserTokenRepositoryImpl } from '../user-token/typeorm/user-token.repository.impl';
import { USER_REPOSITORY_TOKEN } from 'src/domain/user/user.repository';
import { BOOK_REPOSITORY_TOKEN } from 'src/domain/book/book.repository';
import { AUTHOR_REPOSITORY_TOKEN } from 'src/domain/author/author.repository';
import { CATEGORY_REPOSITORY_TOKEN } from 'src/domain/category/category.repository';
import { USER_TOKEN_REPOSITORY_TOKEN } from 'src/domain/user-token/user-token.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuthorOrm,
      CategoryOrm,
      BookOrm,
      UserOrm,
      UserTokenOrm,
    ]),
  ],
  providers: [
    { provide: AUTHOR_REPOSITORY_TOKEN, useClass: AuthorRepositoryImpl },
    { provide: CATEGORY_REPOSITORY_TOKEN, useClass: CategoryRepositoryImpl },
    { provide: BOOK_REPOSITORY_TOKEN, useClass: BookRepositoryImpl },
    { provide: USER_REPOSITORY_TOKEN, useClass: UserRepositoryImpl },
    { provide: USER_TOKEN_REPOSITORY_TOKEN, useClass: UserTokenRepositoryImpl },
    EntityChecker,
  ],
  exports: [
    AUTHOR_REPOSITORY_TOKEN,
    CATEGORY_REPOSITORY_TOKEN,
    BOOK_REPOSITORY_TOKEN,
    USER_REPOSITORY_TOKEN,
    USER_TOKEN_REPOSITORY_TOKEN,
    EntityChecker,
  ],
})
export class EntityCheckerModule {}
